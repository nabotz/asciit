// main.js — renderer ASCII lokal: image/video -> glyph GPU -> post FX -> ekspor
import { createProgram, makeTexture, makeFBO, buildAtlas, hexGeometry } from './gl.js';
import * as S from './shaders.js';
import { t as tr, initI18n, setLang, getLang, onLangChange } from './i18n.js';

const RAMP_PRESETS = {
  default: '@#S08Xx+=-;:. ',
  standard: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  minimal: '#=-. ',
  binary: '10 ',
  dots: '●◕◑◔∙ ',
};

const PALETTES = {
  mono: [[0, 0, 0], [255, 255, 255]],
  grey4: [[0, 0, 0], [85, 85, 85], [170, 170, 170], [255, 255, 255]],
  gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  pico8: [[0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81], [171, 82, 54],
          [95, 87, 79], [194, 195, 199], [255, 241, 232], [255, 0, 77], [255, 163, 0],
          [255, 236, 39], [0, 228, 54], [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170]],
  cga: [[0, 0, 0], [85, 255, 85], [255, 85, 85], [255, 255, 85]],
  cyberpunk: [[13, 2, 33], [255, 42, 109], [5, 217, 232], [209, 247, 255]],
};

// Palet bertingkat satu rona: dither berdasarkan kecerahan (gaya Game Boy camera).
// Palet lain dianggap palet berwarna: dither di antara dua warna RGB terdekat.
// Palet baru yang berupa tingkatan gelap->terang cukup ditambahkan namanya ke sini.
const LUMA_RAMP_PALETTES = new Set(['mono', 'grey4', 'gameboy']);
const lumaOf = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

const state = {
  mode: 'characters',      // characters | braille | dither | hex
  cols: 110,
  cell: 8,
  charset: RAMP_PRESETS.default,
  contrast: 20,
  bright: 0,
  invert: false,
  edge: 0,
  palette: 'gameboy',
  ditherAlgo: 0,           // 0 bayer8, 1 halftone, 2 lines
  ditherCell: 8,
  post: { chroma: 0, scan: 0, vignette: 0, grain: 0 },
};

let gl, canvas, prog;
let srcTex = null, atlas = null, gridFBO = null, sceneFBO = null;
let srcEl = null;           // HTMLImageElement / HTMLVideoElement
let srcIsVideo = false;
let quadVAO = null, glyphVAO = null, hexVAO = null;
let dirty = true;
let frames = 0, lastFps = performance.now(), fps = 0;
let levelCanvas = null, levelCtx = null, levelRange = [0, 1];

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- setup GL
function initGL() {
  canvas = $('out');
  gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: true });
  if (!gl) throw new Error(tr('st.noWebgl'));

  prog = {
    grid: createProgram(gl, S.VS_GRID, S.FS_GRID, 'grid'),
    glyph: createProgram(gl, S.VS_GLYPH, S.FS_GLYPH, 'glyph'),
    dither: createProgram(gl, S.VS_QUAD, S.FS_DITHER, 'dither'),
    hex: createProgram(gl, S.VS_HEX, S.FS_HEX, 'hex'),
    post: createProgram(gl, S.VS_QUAD, S.FS_POST, 'post'),
  };

  // quad fullscreen
  quadVAO = gl.createVertexArray();
  gl.bindVertexArray(quadVAO);
  const qb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // quad per instance (glyph)
  glyphVAO = gl.createVertexArray();
  gl.bindVertexArray(glyphVAO);
  const gb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // geometri hex (statis)
  const hg = hexGeometry();
  hexVAO = gl.createVertexArray();
  gl.bindVertexArray(hexVAO);
  const hb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, hb);
  gl.bufferData(gl.ARRAY_BUFFER, hg.local, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const fb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fb);
  gl.bufferData(gl.ARRAY_BUFFER, hg.face, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
  hexVAO.verts = hg.verts;

  levelCanvas = document.createElement('canvas');
  levelCanvas.width = 64; levelCanvas.height = 64;
  levelCtx = levelCanvas.getContext('2d', { willReadFrequently: true });
  gl.bindVertexArray(null);
}

function ensureAtlas() {
  const chars = state.mode === 'braille'
    ? Array.from({ length: 256 }, (_, i) => String.fromCharCode(0x2800 + i))
    : Array.from(new Set(state.charset.split(''))).join('');
  if (atlas && atlas.key === chars) return;
  if (atlas) gl.deleteTexture(atlas.tex);
  atlas = buildAtlas(gl, chars, 64);
  atlas.key = chars;
  dirty = true;
}

function uploadSource() {
  if (!srcEl) return;
  if (!srcTex) {
    srcTex = makeTexture(gl, 1, 1);
    // mipmap: tiap sel grid mengambil rata-rata area sumber, bukan 1 titik sampel
    // -> tidak aliasing/moire di gambar besar dan tidak berkedip di video
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }
  gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcEl);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
}

// auto-levels: min/max luma dari downsample kecil 64×64.
// Rentang minimum 0.2 (penguatan maks 5×) supaya gambar polos/datar tidak meledak jadi
// hitam-putih karena noise ikut diperkuat.
const MIN_LEVEL_RANGE = 0.2;
function updateLevels() {
  if (!srcEl) return;
  const w = srcEl.videoWidth || srcEl.naturalWidth || srcEl.width;
  const h = srcEl.videoHeight || srcEl.naturalHeight || srcEl.height;
  if (!w || !h) return;
  levelCtx.drawImage(srcEl, 0, 0, 64, 64);
  const d = levelCtx.getImageData(0, 0, 64, 64).data;
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (l < lo) lo = l;
    if (l > hi) hi = l;
  }
  lo /= 255; hi /= 255;
  if (hi - lo < MIN_LEVEL_RANGE) {
    const mid = (lo + hi) / 2;
    lo = Math.min(Math.max(mid - MIN_LEVEL_RANGE / 2, 0), 1 - MIN_LEVEL_RANGE);
    hi = lo + MIN_LEVEL_RANGE;
  }
  levelRange = [lo, hi];
}

function freeFBO(f) {
  if (!f) return;
  gl.deleteFramebuffer(f.fbo);
  gl.deleteTexture(f.tex);
}

// ---------------------------------------------------------------- render
function geometry() {
  const sw = srcEl ? (srcEl.videoWidth || srcEl.naturalWidth) : 1;
  const sh = srcEl ? (srcEl.videoHeight || srcEl.naturalHeight) : 1;
  const cellW = state.cell;
  const cellH = Math.max(1, Math.round(cellW / 0.6));

  if (state.mode === 'hex') {
    // Hex pointy-top: jarak antar pusat horizontal = lebar hex = cellW,
    // jarak antar baris = 1.5 × jari-jari. Baris ganjil bergeser setengah hex.
    const hexT = Math.max(1, cellW / Math.sqrt(3));
    const stepX = hexT * Math.sqrt(3);
    const stepY = hexT * 1.5;
    const rows = Math.max(1, Math.round(state.cols * (sh / sw) * (stepX / stepY)));
    return { cols: state.cols, rows, cellW, cellH, gw: state.cols, gh: rows, hexT,
             gridW: state.cols * stepX, gridH: rows * stepY,
             outW: Math.round(state.cols * stepX + stepX / 2),
             outH: Math.round((rows - 1) * stepY + 2 * hexT) };
  }

  const rows = Math.max(1, Math.round(state.cols * (sh / sw) * (cellW / cellH)));
  const gw = state.mode === 'braille' ? state.cols * 2 : state.cols;
  const gh = state.mode === 'braille' ? rows * 4 : rows;
  return { cols: state.cols, rows, cellW, cellH, gw, gh,
           gridW: state.cols * cellW, gridH: rows * cellH,
           outW: Math.round(state.cols * cellW), outH: Math.round(rows * cellH) };
}

// uniform fungsi adjust() di shaders.js (dipakai pass grid & dither)
function setAdjustUniforms(p) {
  gl.uniform2f(p.u.uRange, levelRange[0], levelRange[1]);
  gl.uniform1f(p.u.uContrast, state.contrast);
  gl.uniform1f(p.u.uBright, state.bright / 100);   // slider -100..100 -> shader -1..1
  gl.uniform1f(p.u.uInvert, state.invert ? 1 : 0);
}

function render() {
  if (!srcEl) return;
  window.__stage = 'start';
  const g = geometry();

  if (canvas.width !== g.outW || canvas.height !== g.outH) {
    canvas.width = g.outW;
    canvas.height = g.outH;
    dirty = true;
  }

  uploadSource();
  updateLevels();

  // (1) grid pass: source -> tekstur luma/color kecil
  if (!gridFBO || gridFBO.w !== g.gw || gridFBO.h !== g.gh) {
    freeFBO(gridFBO);
    gridFBO = makeFBO(gl, g.gw, g.gh);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, gridFBO.fbo);
  gl.viewport(0, 0, g.gw, g.gh);
  gl.disable(gl.BLEND);
  const pg = prog.grid;
  gl.useProgram(pg.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.uniform1i(pg.u.uSrc, 0);
  setAdjustUniforms(pg);
  gl.uniform1f(pg.u.uSourceAspect, (srcEl.videoWidth || srcEl.naturalWidth) /
                                   (srcEl.videoHeight || srcEl.naturalHeight));
  // aspek fisik area grid (bukan jumlah texel) supaya cover-fit tidak memotong/meregang
  gl.uniform2f(pg.u.uOutAspect, g.gridW, g.gridH);
  gl.bindVertexArray(quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.__stage = 'grid-done';
  // (2) scene pass
  if (!sceneFBO || sceneFBO.w !== g.outW || sceneFBO.h !== g.outH) {
    freeFBO(sceneFBO);
    sceneFBO = makeFBO(gl, g.outW, g.outH);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFBO.fbo);
  gl.viewport(0, 0, g.outW, g.outH);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (state.mode === 'dither') {
    gl.disable(gl.BLEND);
    const pd = prog.dither;
    gl.useProgram(pd.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(pd.u.uSrc, 0);
    gl.uniform2f(pd.u.uRes, g.outW, g.outH);
    gl.uniform1f(pd.u.uCellPx, state.ditherCell);
    setAdjustUniforms(pd);   // dither kini ikut levels, brightness & invert seperti mode lain
    gl.uniform1f(pd.u.uStrength, 1.0);
    gl.uniform1f(pd.u.uThreshold, 0.0);
    gl.uniform1f(pd.u.uMode, state.ditherAlgo);
    gl.uniform1f(pd.u.uSourceAspect, (srcEl.videoWidth || srcEl.naturalWidth) /
                                     (srcEl.videoHeight || srcEl.naturalHeight));
    gl.uniform2f(pd.u.uOutAspect, g.outW, g.outH);
    const ramp = LUMA_RAMP_PALETTES.has(state.palette);
    let pal = PALETTES[state.palette] || PALETTES.mono;
    if (ramp) pal = [...pal].sort((a, b) => lumaOf(a) - lumaOf(b));   // gelap -> terang
    const flat = new Float32Array(48);
    pal.forEach((c, i) => {
      flat[i * 3] = c[0] / 255; flat[i * 3 + 1] = c[1] / 255; flat[i * 3 + 2] = c[2] / 255;
    });
    gl.uniform1i(pd.u.uPaletteCount, pal.length);
    gl.uniform3fv(pd.u.uPalette, flat);
    gl.uniform1i(pd.u.uLumaRamp, ramp ? 1 : 0);
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else if (state.mode === 'hex') {
    gl.disable(gl.BLEND);
    const ph = prog.hex;
    gl.useProgram(ph.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gridFBO.tex);
    gl.uniform1i(ph.u.uGrid, 0);
    gl.uniform2f(ph.u.uGridSize, g.cols, g.rows);
    gl.uniform2f(ph.u.uOut, g.outW, g.outH);
    gl.uniform1f(ph.u.uT, g.hexT);
    gl.uniform1f(ph.u.uHover, 1.0);
    gl.uniform1f(ph.u.uVspread, 1.0);
    gl.bindVertexArray(hexVAO);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, hexVAO.verts, g.cols * g.rows);
  } else {
    window.__stage = 'glyph-branch';
    ensureAtlas();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const pg2 = prog.glyph;
    gl.useProgram(pg2.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gridFBO.tex);
    gl.uniform1i(pg2.u.uGrid, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlas.tex);
    gl.uniform1i(pg2.u.uAtlas, 1);
    gl.uniform2f(pg2.u.uGridSize, g.cols, g.rows);
    gl.uniform2f(pg2.u.uAtlasGrid, atlas.cols, atlas.rows);
    gl.uniform2f(pg2.u.uCell, g.cellW, g.cellH);
    gl.uniform2f(pg2.u.uOut, g.outW, g.outH);
    gl.uniform1f(pg2.u.uSlots, atlas.count);
    gl.uniform1f(pg2.u.uEdge, state.edge);
    gl.uniform1i(pg2.u.uMode, state.mode === 'braille' ? 1 : 0);
    gl.bindVertexArray(glyphVAO);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, g.cols * g.rows);
  }

  window.__stage = 'scene-done';
  // (3) post FX -> layar
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, g.outW, g.outH);
  gl.disable(gl.BLEND);
  const pp = prog.post;
  gl.useProgram(pp.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sceneFBO.tex);
  gl.uniform1i(pp.u.uTex, 0);
  gl.uniform2f(pp.u.uRes, g.outW, g.outH);
  gl.uniform1f(pp.u.uTime, performance.now() / 1000);
  gl.uniform1f(pp.u.uChroma, state.post.chroma);
  gl.uniform1f(pp.u.uScanline, state.post.scan);
  gl.uniform1f(pp.u.uVignette, state.post.vignette);
  gl.uniform1f(pp.u.uGrain, state.post.grain);
  gl.bindVertexArray(quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.__stage = 'post-done';
  frames++;
  const now = performance.now();
  if (now - lastFps > 400) {
    fps = Math.round((frames * 1000) / (now - lastFps));
    frames = 0; lastFps = now;
    $('fps').textContent = `${fps} fps · ${g.outW}×${g.outH} · ${g.cols}×${g.rows} cell`;
  }
  dirty = false;
}

// Render hanya kalau ada perubahan atau video sedang jalan (video yang di-pause tidak
// diunggah ulang tiap frame; seek/frame baru menandai dirty lewat event video).
function loop() {
  if (srcEl && (dirty || isPlaying())) render();
  if (srcIsVideo) tickPlayer();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- player video
let frameDur = 1 / 30;           // durasi 1 frame (perkiraan, lihat estimateFrameDur)
let shownMediaTime = null;       // timestamp (awal) frame yang sedang tampil, dari rVFC
let scrubbing = false, scrubWasPlaying = false;

// Perkiraan fps tanpa membaca kontainer:
//  1. selisih timestamp antar frame yang tampil selalu kelipatan bulat durasi frame, walau
//     browser melewatkan frame (PC lambat) -> fps umum mana yang cocok dengan semua selisih;
//  2. laju frame yang didekode (getVideoPlaybackQuality, termasuk yang dilewati) memilih
//     kandidat yang paling dekat (15 / 30 / 60 sama-sama cocok kalau frame selalu dilewati rata).
const COMMON_FPS = [8, 10, 12, 12.5, 15, 20, 23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60,
                    72, 90, 100, 119.88, 120];
let fdDeltas = [], fdLastT = null, fdBase = null, decodedFps = 0;

function estimateFrameDur() {
  if (fdDeltas.length < 4) return;
  const fits = COMMON_FPS.filter((fps) => fdDeltas.every((d) => {
    const n = d * fps;                                   // jumlah frame dalam selisih ini
    return n > 0.5 && Math.abs(n - Math.round(n)) / fps < 0.0025;   // toleransi 2.5 ms
  }));
  if (!fits.length) return;
  const ref = decodedFps || 30;
  let best = fits[0];
  for (const f of fits) if (Math.abs(Math.log(f / ref)) < Math.abs(Math.log(best / ref))) best = f;
  frameDur = 1 / best;
}

const isPlaying = () => srcIsVideo && !!srcEl && !srcEl.paused && !srcEl.ended;
const isFileVideo = () => srcIsVideo && !!srcEl && isFinite(srcEl.duration);

function fmtTime(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

function watchVideo(v) {
  frameDur = 1 / 30; shownMediaTime = null;
  fdDeltas = []; fdLastT = null; fdBase = null; decodedFps = 0;
  const sync = () => { if (v === srcEl) updatePlayerUI(); };
  for (const ev of ['play', 'pause', 'ratechange', 'volumechange', 'durationchange', 'loadedmetadata']) {
    v.addEventListener(ev, sync);
  }
  for (const ev of ['seeked', 'ended']) v.addEventListener(ev, () => { if (v === srcEl) dirty = true; });
  // seek memutus urutan frame: jangan hitung selisih yang melompat
  v.addEventListener('seeking', () => { fdLastT = null; fdBase = null; });
  if ('requestVideoFrameCallback' in v) {
    const onFrame = (now, md) => {
      if (v !== srcEl) return;            // sumber sudah diganti
      dirty = true;                        // frame baru siap (termasuk hasil seek saat pause)
      shownMediaTime = md.mediaTime;
      if (!v.paused && !v.seeking) {
        const t = md.mediaTime;
        if (fdLastT != null) {
          const d = t - fdLastT;
          if (d > 0 && d < 0.5) { fdDeltas.push(d); if (fdDeltas.length > 90) fdDeltas.shift(); }
        }
        fdLastT = t;
        const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
        if (q) {
          if (!fdBase || t < fdBase.t) fdBase = { t, n: q.totalVideoFrames };   // awal / loop
          else if (t - fdBase.t >= 1) decodedFps = (q.totalVideoFrames - fdBase.n) / (t - fdBase.t);
        }
        estimateFrameDur();
      }
      v.requestVideoFrameCallback(onFrame);
    };
    v.requestVideoFrameCallback(onFrame);
  }
}

function seekTo(t) {
  const v = srcEl;
  v.currentTime = Math.min(Math.max(t, 0), Math.max(v.duration - frameDur * 0.5, 0));
  dirty = true;
}

function togglePlay() {
  if (!srcIsVideo || !srcEl || recording) return false;
  if (srcEl.paused || srcEl.ended) srcEl.play(); else srcEl.pause();
  return true;
}

// ±1 frame: lompat ke TENGAH frame tujuan, dihitung dari awal frame yang sedang tampil,
// supaya tidak meleset karena pembulatan timestamp kontainer (mis. WebM per milidetik)
// dan tidak menumpuk galat di menit-menit akhir video.
function stepFrame(dir) {
  if (!isFileVideo() || recording) return false;
  const v = srcEl, t = v.currentTime;
  v.pause();
  const known = shownMediaTime != null && Math.abs(shownMediaTime - t) < frameDur * 1.5;
  seekTo(known ? shownMediaTime + (dir > 0 ? 1.5 : -0.5) * frameDur : t + dir * frameDur);
  return true;
}

function seekBy(sec) {
  if (!isFileVideo() || recording) return false;
  seekTo(srcEl.currentTime + sec);
  return true;
}

function updatePlayerUI() {
  const show = srcIsVideo && !!srcEl;
  $('player').hidden = !show;
  $('stage').classList.toggle('has-player', show);
  updateExportUI();
  if (!show) return;
  const v = srcEl;
  const paused = v.paused || v.ended;
  $('icoplay').style.display = paused ? '' : 'none';
  $('icopause').style.display = paused ? 'none' : '';
  $('pseek').max = isFinite(v.duration) ? v.duration : 0;
  $('prate').value = String(v.playbackRate);
  $('icomute').style.display = v.muted ? '' : 'none';
  $('icosound').style.display = v.muted ? 'none' : '';
  tickPlayer();
}

function tickPlayer() {
  if (!isFileVideo() || $('player').hidden) return;
  const v = srcEl;
  if (!scrubbing) $('pseek').value = v.currentTime;
  $('ptime').textContent = `${fmtTime(v.currentTime)} / ${fmtTime(v.duration)}`;
}

// ---------------------------------------------------------------- sumber
const isBlob = (u) => typeof u === 'string' && u.startsWith('blob:');

// Lepas sumber lama: hentikan decoder video, revoke blob URL.
function releaseSource(el) {
  if (!el) return;
  if (el.tagName === 'VIDEO') el.pause();
  if (isBlob(el.src)) URL.revokeObjectURL(el.src);
  if (el.tagName === 'VIDEO') { el.removeAttribute('src'); el.load(); }
}

// Pasang sumber baru (dipanggil setelah sumber baru siap, jadi yang lama tetap tampil
// selama yang baru masih dimuat).
function setSource(el, isVideo) {
  if (recording) stopVideoExport(true);
  const old = srcEl;
  srcEl = el; srcIsVideo = isVideo;
  if (srcTex) { gl.deleteTexture(srcTex); srcTex = null; }
  dirty = true;
  if (old && old !== el) releaseSource(old);
  scrubbing = false;
  if (isVideo) watchVideo(el);
  updatePlayerUI();
}

function useImage(url, name = 'gambar') {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    setSource(img, false);
    render();   // render langsung; rAF bisa ditahan browser saat tab tidak fokus
    $('srcname').textContent = `${name} · ${img.naturalWidth}×${img.naturalHeight}`;
  };
  img.onerror = () => {
    if (isBlob(url)) URL.revokeObjectURL(url);
    setStatus('st.imgFail', { name: isBlob(url) ? name : url });
  };
  img.src = url;
}

function useVideoFromFile(file) {
  const v = document.createElement('video');
  v.src = URL.createObjectURL(file);
  v.loop = true; v.muted = true; v.playsInline = true;
  v.onloadeddata = () => {
    setSource(v, true);
    v.play();
    render();
    $('srcname').textContent = `${file.name} · ${v.videoWidth}×${v.videoHeight}`;
  };
  v.onerror = () => {
    if (v !== srcEl) releaseSource(v);
    setStatus('st.vidUnreadable');
  };
}

// ?video=URL: unduh dulu jadi blob. Server statis Python (run.sh/run.bat) tidak mendukung
// HTTP Range, jadi video yang diputar langsung dari URL tidak bisa di-seek / frame step.
async function useVideoUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const blob = await res.blob();
    const name = decodeURIComponent(url.split(/[?#]/)[0].split('/').pop() || 'video');
    useVideoFromFile(new File([blob], name, { type: blob.type }));
  } catch (e) {
    setStatus('st.vidUrlFail', { url, err: e.message });
  }
}

function handleFile(file) {
  if (!file) return;
  if (file.type.startsWith('video')) useVideoFromFile(file);
  else useImage(URL.createObjectURL(file), file.name);
}

// ---------------------------------------------------------------- ekspor
// unduh blob lalu revoke URL-nya (diberi jeda supaya browser sempat mulai mengunduh)
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function exportPNG() {
  render();
  canvas.toBlob((blob) => {
    if (!blob) { setStatus('st.pngFail'); return; }
    downloadBlob(blob, `ascii-${state.mode}-${state.cols}col.png`);
    setStatus('st.pngSaved', { kb: Math.round(blob.size / 1024) });
  }, 'image/png');
}

// ---------------------------------------------------------------- ekspor teks ASCII
const BRAILLE_ORDER = [0, 3, 1, 4, 2, 5, 6, 7];   // sama dengan ORDER di VS_GLYPH

// Baca grid dari GPU lalu pilih karakter dengan rumus yang sama persis dengan shader glyph.
function asciiText() {
  if (!srcEl || (state.mode !== 'characters' && state.mode !== 'braille')) return null;
  render();
  const g = geometry(), f = gridFBO;
  const px = new Uint8Array(f.w * f.h * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
  gl.readPixels(0, 0, f.w, f.h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // baris 0 grid = atas gambar (lihat FS_GRID), jadi urutan readPixels sudah atas -> bawah
  const L = (x, y) => {
    const i = (y * f.w + x) * 4;
    return (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
  };
  const lines = [];
  if (state.mode === 'braille') {
    for (let r = 0; r < g.rows; r++) {
      let s = '';
      for (let c = 0; c < g.cols; c++) {
        let bits = 0;
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 2; x++) {
            if (L(c * 2 + x, r * 4 + y) > 0.5) bits |= 1 << BRAILLE_ORDER[y * 2 + x];
          }
        }
        s += String.fromCharCode(0x2800 + bits);
      }
      lines.push(s);
    }
  } else {
    const chars = Array.from(new Set(state.charset.split('')));   // urutan = atlas
    const n = chars.length, mx = g.cols - 1, my = g.rows - 1;
    const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
    for (let r = 0; r < g.rows; r++) {
      let s = '';
      for (let c = 0; c < g.cols; c++) {
        let m = L(c, r);
        if (state.edge > 0.001) {   // edge boost: sobel 4-tap, sama dengan shader
          const l0 = L(Math.min(c + 1, mx), r), l1 = L(Math.max(c - 1, 0), r);
          const l2 = L(c, Math.min(r + 1, my)), l3 = L(c, Math.max(r - 1, 0));
          const gr = Math.sqrt((l0 - l1) ** 2 + (l2 - l3) ** 2);
          m = clamp01(m + Math.pow(clamp01(gr * 2), 0.4) * state.edge);
        }
        s += chars[Math.min(Math.max(Math.floor((1 - m) * n), 0), n - 1)];
      }
      lines.push(s.replace(/ +$/, ''));
    }
  }
  return lines.join('\n') + '\n';
}

function exportTXT() {
  const text = asciiText();
  if (text == null) { setStatus('st.txtOnly'); return; }
  downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }),
               `ascii-${state.mode}-${state.cols}col.txt`);
  setStatus('st.txtSaved', { cols: state.cols, rows: text.split('\n').length - 1 });
}

async function copyTXT() {
  const text = asciiText();
  if (text == null) { setStatus('st.copyOnly'); return; }
  try {
    await navigator.clipboard.writeText(text);
    setStatus('st.copied', { cols: state.cols, rows: text.split('\n').length - 1 });
  } catch (e) {
    setStatus('st.copyFail', { err: e.message });
  }
}

// ---------------------------------------------------------------- ekspor video
// Format dicek ke browser (MediaRecorder.isTypeSupported); yang tidak didukung tidak muncul.
const VIDEO_FORMATS = [
  { id: 'mp4', label: 'MP4 (H.264)', ext: 'mp4',
    video: ['video/mp4;codecs=avc1', 'video/mp4'],
    av: ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4'] },
  { id: 'webm-vp9', label: 'WebM (VP9)', ext: 'webm',
    video: ['video/webm;codecs=vp9'], av: ['video/webm;codecs=vp9,opus'] },
  { id: 'webm-vp8', label: 'WebM (VP8)', ext: 'webm',
    video: ['video/webm;codecs=vp8', 'video/webm'], av: ['video/webm;codecs=vp8,opus', 'video/webm'] },
];
let videoFormats = [];
let recording = null;

const pickMime = (list) =>
  list.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || null;
const waitEvent = (el, ev) => new Promise((res) => el.addEventListener(ev, res, { once: true }));

function initVideoFormats() {
  videoFormats = VIDEO_FORMATS.filter((f) => pickMime(f.video));
  const sel = $('vfmt'), prev = sel.value;     // dipanggil ulang saat ganti bahasa
  sel.innerHTML = '';
  for (const f of videoFormats) sel.add(new Option(f.label, f.id));
  if (!videoFormats.length) sel.add(new Option(tr('fmt.none'), ''));
  if (prev && videoFormats.some((f) => f.id === prev)) sel.value = prev;
}

function updateExportUI() {
  const busy = !!recording;
  const txtOk = state.mode === 'characters' || state.mode === 'braille';
  $('txt').disabled = $('copytxt').disabled = !txtOk || !srcEl;
  $('txtnote').hidden = txtOk;
  const vid = srcIsVideo && !!srcEl;
  $('vrec').disabled = !vid || busy || !videoFormats.length;
  $('vfmt').disabled = busy || !videoFormats.length;
  $('vdur').disabled = busy;
  $('vsecs').disabled = busy || $('vdur').value !== 'custom';
  $('vaudio').disabled = busy;
  // selama merekam: kunci kontrol yang mengubah ukuran canvas, sumber, atau posisi video
  for (const id of ['mode', 'cols', 'cell', 'file', 'pick', 'pplay', 'pback', 'pfwd', 'pseek', 'prate']) {
    $(id).disabled = busy;
  }
}

async function startVideoExport() {
  if (recording || !srcIsVideo || !srcEl) return;
  const fmt = videoFormats.find((f) => f.id === $('vfmt').value) || videoFormats[0];
  if (!fmt) { setStatus('st.noRecorder'); return; }
  const v = srcEl;
  const full = $('vdur').value === 'loop' && isFinite(v.duration);
  const secs = Math.min(Math.max(parseFloat($('vsecs').value) || 10, 1), 600);
  const r = recording = {
    v, full, total: full ? v.duration : secs, ext: fmt.ext, chunks: [], extra: [],
    prev: { loop: v.loop, rate: v.playbackRate, time: v.currentTime, paused: v.paused || v.ended },
    cancelled: false, finished: false, timer: 0, raf: 0,
  };
  updateExportUI();
  $('vprog').hidden = false; $('vbar').value = 0; $('vtext').textContent = tr('rec.preparing');

  try {
    v.pause();
    v.playbackRate = 1;
    v.loop = !full;                       // putaran penuh berhenti di akhir; kustom diulang
    if (v.currentTime !== 0) { const s = waitEvent(v, 'seeked'); v.currentTime = 0; await s; }
    if (recording !== r) return;          // dibatalkan saat persiapan
    render();

    const stream = canvas.captureStream(30);
    let mime = pickMime(fmt.video);
    if ($('vaudio').checked) {
      const cap = v.captureStream ? v.captureStream() : (v.mozCaptureStream ? v.mozCaptureStream() : null);
      if (cap) r.extra.push(cap);
      const tracks = cap ? cap.getAudioTracks() : [];
      const amime = pickMime(fmt.av);
      if (!tracks.length) r.noAudio = 'rec.reasonSilent';
      else if (!amime) r.noAudio = 'rec.reasonFormat';
      else { tracks.forEach((t) => stream.addTrack(t)); mime = amime; r.audio = true; }
    }
    r.stream = stream; r.mime = mime;
    const rec = r.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    rec.ondataavailable = (e) => { if (e.data && e.data.size) r.chunks.push(e.data); };
    rec.onerror = (e) => { r.error = (e.error && e.error.message) || 'MediaRecorder error'; };
    rec.onstop = () => finishVideoExport(r);
    rec.start(1000);
    r.t0 = performance.now();
    await v.play();
    if (recording !== r) return;
    if (full) {
      r.onEnded = () => setTimeout(() => stopVideoExport(false), 150);   // sertakan frame terakhir
      v.addEventListener('ended', r.onEnded, { once: true });
    } else {
      r.timer = setTimeout(() => stopVideoExport(false), r.total * 1000);
    }
    const tick = () => {
      if (recording !== r) return;
      const done = Math.min(full ? v.currentTime : (performance.now() - r.t0) / 1000, r.total);
      $('vbar').value = done / r.total;
      $('vtext').textContent = tr('rec.progress', { done: fmtTime(done), total: fmtTime(r.total) });
      r.raf = requestAnimationFrame(tick);
    };
    tick();
  } catch (err) {
    r.error = err.message || String(err);
    stopVideoExport(false);
  }
}

function stopVideoExport(cancel) {
  const r = recording;
  if (!r) return;
  if (cancel) r.cancelled = true;
  clearTimeout(r.timer);
  if (r.onEnded) r.v.removeEventListener('ended', r.onEnded);
  if (r.rec && r.rec.state !== 'inactive') r.rec.stop();   // -> onstop -> finishVideoExport
  else finishVideoExport(r);
}

function finishVideoExport(r) {
  if (!r || r.finished) return;
  r.finished = true;
  cancelAnimationFrame(r.raf);
  clearTimeout(r.timer);
  if (r.stream) r.stream.getTracks().forEach((t) => t.stop());
  r.extra.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  const v = r.v;
  if (v === srcEl) {                     // kembalikan keadaan player seperti sebelum merekam
    v.loop = r.prev.loop;
    v.playbackRate = r.prev.rate;
    v.currentTime = r.prev.time;
    if (r.prev.paused) v.pause(); else v.play();
  }
  if (recording === r) recording = null;
  $('vprog').hidden = true;
  updatePlayerUI();
  if (r.error) { setStatus('st.recFail', { err: r.error }); return; }
  if (r.cancelled) { setStatus('st.recCancelled'); return; }
  const blob = new Blob(r.chunks, { type: r.mime.split(';')[0] });
  downloadBlob(blob, `ascii-${state.mode}-${state.cols}col.${r.ext}`);
  const note = r.noAudio ? { key: 'rec.noAudio', vars: { reason: { key: r.noAudio } } }
             : (r.audio ? { key: 'rec.withAudio' } : '');
  setStatus('st.recSaved', { dur: fmtTime(r.total), mb: (blob.size / 1e6).toFixed(1), note });
}

// ---------------------------------------------------------------- UI
// Pesan status disimpan sebagai kunci + variabel, jadi ikut diterjemahkan ulang saat ganti bahasa.
let lastStatus = null;
function setStatus(key, vars) {
  lastStatus = { key, vars };
  $('status').textContent = tr(key, vars);
}

function markLang() {
  for (const b of document.querySelectorAll('[data-lang]')) {
    const on = b.dataset.lang === getLang();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }
}

function bindUI() {
  const bindRange = (id, key, fmt = (v) => v) => {
    const el = $(id);
    el.value = state[key];
    el.oninput = () => {
      state[key] = parseFloat(el.value);
      $(id + 'v').textContent = fmt(state[key]);
      dirty = true;
    };
    $(id + 'v').textContent = fmt(state[key]);
  };

  $('mode').onchange = (e) => { state.mode = e.target.value; dirty = true; updateExportUI(); };
  bindRange('cols', 'cols');
  bindRange('cell', 'cell');
  bindRange('contrast', 'contrast');
  bindRange('bright', 'bright', (v) => (v / 100).toFixed(2));
  bindRange('edge', 'edge', (v) => v.toFixed(2));

  $('preset').onchange = (e) => {
    state.charset = RAMP_PRESETS[e.target.value] || RAMP_PRESETS.default;
    $('charset').value = state.charset;
    dirty = true;
  };
  $('charset').value = state.charset;
  $('charset').oninput = (e) => {
    state.charset = e.target.value || ' ';
    dirty = true;
  };

  $('invert').onchange = (e) => { state.invert = e.target.checked; dirty = true; };
  $('palette').onchange = (e) => { state.palette = e.target.value; dirty = true; };
  $('dalgo').onchange = (e) => { state.ditherAlgo = parseInt(e.target.value, 10); dirty = true; };
  bindRange('dithercell', 'ditherCell');

  for (const [id, key] of [['fchroma', 'chroma'], ['fscan', 'scan'],
                           ['fvign', 'vignette'], ['fgrain', 'grain']]) {
    const el = $(id);
    el.value = state.post[key];
    el.oninput = () => {
      state.post[key] = parseFloat(el.value);
      $(id + 'v').textContent = state.post[key].toFixed(2);
      dirty = true;
    };
    $(id + 'v').textContent = state.post[key].toFixed(2);
  }

  $('file').onchange = (e) => { handleFile(e.target.files[0]); e.target.value = ''; };
  $('pick').onclick = () => $('file').click();   // tombol sendiri: teks input file bawaan tidak bisa diterjemahkan
  for (const b of document.querySelectorAll('[data-lang]')) b.onclick = () => setLang(b.dataset.lang);
  $('png').onclick = exportPNG;
  $('txt').onclick = exportTXT;
  $('copytxt').onclick = copyTXT;

  // ekspor video
  $('vdur').onchange = updateExportUI;
  $('vrec').onclick = startVideoExport;
  $('vcancel').onclick = () => stopVideoExport(true);

  // player
  $('pplay').onclick = togglePlay;
  $('pback').onclick = () => stepFrame(-1);
  $('pfwd').onclick = () => stepFrame(1);
  $('prate').onchange = (e) => { if (srcIsVideo && srcEl) srcEl.playbackRate = parseFloat(e.target.value); };
  $('pmute').onclick = () => { if (srcIsVideo && srcEl) srcEl.muted = !srcEl.muted; };
  const seek = $('pseek');
  seek.addEventListener('input', () => {
    if (!isFileVideo() || recording) return;
    if (!scrubbing) { scrubbing = true; scrubWasPlaying = !srcEl.paused; srcEl.pause(); }
    seekTo(parseFloat(seek.value));
  });
  seek.addEventListener('change', () => {
    if (!scrubbing) return;
    scrubbing = false;
    if (scrubWasPlaying && srcEl) srcEl.play();
  });

  // drag & drop file di mana saja di jendela; area gambar diberi sorotan
  const drop = $('drop');
  let dragDepth = 0;
  const hasFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  window.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth++; drop.classList.add('over');
  });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('dragleave', (e) => {
    if (!hasFiles(e)) return;
    if (--dragDepth <= 0) { dragDepth = 0; drop.classList.remove('over'); }
  });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; drop.classList.remove('over');
    if (recording) { setStatus('st.waitRec'); return; }
    handleFile(e.dataTransfer.files[0]);
  });

  document.addEventListener('keydown', (e) => {
    const t = e.target, tag = t.tagName, type = (t.type || '').toLowerCase();
    // jangan ganggu saat mengetik (charset, angka durasi, dropdown)
    if (tag === 'TEXTAREA' || tag === 'SELECT' ||
        (tag === 'INPUT' && !['range', 'checkbox', 'button'].includes(type))) return;
    if (e.ctrlKey || e.metaKey || e.altKey || recording) return;
    const key = e.key;
    const modes = ['characters', 'braille', 'dither', 'hex'];
    if (key >= '1' && key <= '4') {
      state.mode = modes[+key - 1];
      $('mode').value = state.mode;
      dirty = true;
      updateExportUI();
    } else if (key === ' ') {
      if (tag === 'BUTTON' || type === 'checkbox') return;   // biarkan aksi bawaan tombol
      if (togglePlay()) e.preventDefault();
    } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (type === 'range' && t.id !== 'pseek') return;      // slider lain: panah bawaan
      const dir = key === 'ArrowRight' ? 1 : -1;
      if (e.shiftKey ? seekBy(dir) : stepFrame(dir)) e.preventDefault();
    } else if (key.toLowerCase() === 'e') {
      exportPNG();
    } else if (key.toLowerCase() === 't') {
      exportTXT();
    }
  });
}

// ---------------------------------------------------------------- boot
async function boot() {
  initI18n();
  markLang();
  onLangChange(() => {
    markLang();
    initVideoFormats();
    if (lastStatus) setStatus(lastStatus.key, lastStatus.vars);
  });
  initGL();
  bindUI();
  initVideoFormats();
  updatePlayerUI();
  loop();
  const params = new URLSearchParams(location.search);
  if (params.get('video')) useVideoUrl(params.get('video'));
  else if (params.get('src')) useImage(params.get('src'), 'URL');
  else if (params.get('demo') !== '0') useImage('assets/demo.jpg', 'demo');
  setStatus('st.ready');
}

// debug hook (berguna untuk console & otomatisasi)
window.__ASCIIT = {
  get gl() { return gl; }, state, render, geometry,
  get atlas() { return atlas; }, get gridFBO() { return gridFBO; },
  get sceneFBO() { return sceneFBO; }, get srcTex() { return srcTex; },
  get srcEl() { return srcEl; },
  get levelRange() { return levelRange; },
  get frameDur() { return frameDur; }, get recording() { return recording; },
  get videoFormats() { return videoFormats.map((f) => f.id); },
  asciiText,
};

boot().catch((err) => {
  console.error(err);
  setStatus('st.error', { err: err.message });
});