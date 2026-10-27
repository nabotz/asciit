// shaders.js — semua GLSL untuk renderer ASCII lokal (WebGL2 / GLSL ES 3.00)
// Alur: source -> grid luma kecil -> instanced glyph quad.

// Penyesuaian warna bersama (pass grid & dither), urutan: auto-levels -> contrast ->
// brightness -> invert. Levels duluan supaya contrast/brightness tetap terasa (kalau
// levels dihitung belakangan, perubahan linear contrast/brightness ikut dinormalisasi balik).
// Invert hanya di sini (sekali); pass glyph/braille/hex memakai luma grid apa adanya.
const ADJUST = `
uniform vec2  uRange;      // luma min, max sumber (auto-levels, dari main.js)
uniform float uContrast;   // bawaan 20
uniform float uBright;     // -1..1
uniform float uInvert;     // 0/1
vec3 adjust(vec3 c) {
  c = (c - uRange.x) / max(uRange.y - uRange.x, 1e-5);
  float k = 259.0 * (uContrast + 255.0) / (255.0 * (259.0 - uContrast));
  c = clamp((c - 0.5) * k + 0.5 + uBright, 0.0, 1.0);
  if (uInvert > 0.5) c = 1.0 - c;
  return c;
}`;

export const VS_GRID = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
  // fullscreen triangle
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  vUV = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

export const FS_GRID = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform float uSourceAspect; // untuk cover-fit
uniform vec2  uOutAspect;    // ukuran FISIK area grid di output (px), bukan jumlah texel
${ADJUST}
out vec4 o;
void main() {
  // source cover-fit ke grid
  vec2 uv = vUV;
  float sAsp = uSourceAspect, oAsp = uOutAspect.x / uOutAspect.y;
  if (oAsp > sAsp) { uv.y = (uv.y - 0.5) * (sAsp / oAsp) + 0.5; }
  else { uv.x = (uv.x - 0.5) * (oAsp / sAsp) + 0.5; }
  // sumber di-upload dengan FLIP_Y (atas gambar = v 1), sedangkan pass glyph/hex
  // menggambar baris grid 0 di ATAS layar -> balik di sini supaya baris 0 = atas gambar
  uv.y = 1.0 - uv.y;
  o = vec4(adjust(texture(uSrc, clamp(uv, 0.0, 1.0)).rgb), 1.0);
}`;

// ---- pass glyph: satu instanced quad per cell, slot atlas dipilih di vertex shader
export const VS_GLYPH = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uGrid;
uniform sampler2D uAtlas;
uniform vec2 uGridSize;    // cols, rows
uniform vec2 uAtlasGrid;   // kolom, baris di atlas
uniform vec2 uCell;        // ukuran cell (px)
uniform vec2 uOut;         // resolusi output (px)
uniform float uSlots;      // jumlah glyph di ramp
uniform float uEdge;       // 0..1 edge boost
uniform int uMode;         // 0 = ramp glyph, 1 = braille 2x4
out vec2 vUV;
out vec4 vColor;

// grid sudah melewati levels/contrast/brightness/invert di pass grid
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  int cols = int(uGridSize.x);
  int id = gl_InstanceID;
  ivec2 cell = ivec2(id - (id / cols) * cols, id / cols);

  vec2 corner = aCorner;
  float slot = 0.0;
  vec3 color = vec3(0.0);
  float m = 0.0;

  if (uMode == 1) {
    // braille: 2x4 titik, tiap titik 1 texel (grid texture sudah cols*2 x rows*4)
    // ORDER[y*2+x] = bit Unicode: kiri 1,2,3,7 (bit 0,1,2,6) · kanan 4,5,6,8 (bit 3,4,5,7)
    const int ORDER[8] = int[8](0, 3, 1, 4, 2, 5, 6, 7);
    int bits = 0;
    vec3 acc = vec3(0.0);
    int cnt = 0;
    for (int y = 0; y < 4; y++) {
      for (int x = 0; x < 2; x++) {
        vec3 c = texelFetch(uGrid, ivec2(cell.x * 2 + x, cell.y * 4 + y), 0).rgb;
        acc += c; cnt++;
        if (luma(c) > 0.5) bits |= (1 << ORDER[y * 2 + x]);
      }
    }
    color = acc / float(cnt);
    slot = float(bits);           // atlas braille = 256 glyph (0x2800..0x28FF)
    vColor = vec4(color, 1.0);
  } else {
    vec3 c = texelFetch(uGrid, cell, 0).rgb;
    m = luma(c);
    // edge boost: sobel 4-tap pada grid (ridge map versi hemat)
    if (uEdge > 0.001) {
      ivec2 mx = ivec2(int(uGridSize.x) - 1, int(uGridSize.y) - 1);
      float l0 = luma(texelFetch(uGrid, clamp(cell + ivec2( 1, 0), ivec2(0), mx), 0).rgb);
      float l1 = luma(texelFetch(uGrid, clamp(cell + ivec2(-1, 0), ivec2(0), mx), 0).rgb);
      float l2 = luma(texelFetch(uGrid, clamp(cell + ivec2( 0, 1), ivec2(0), mx), 0).rgb);
      float l3 = luma(texelFetch(uGrid, clamp(cell + ivec2( 0,-1), ivec2(0), mx), 0).rgb);
      float g = sqrt((l0 - l1) * (l0 - l1) + (l2 - l3) * (l2 - l3));
      m = clamp(m + pow(clamp(g * 2.0, 0.0, 1.0), 0.4) * uEdge, 0.0, 1.0);
    }
    slot = clamp(floor((1.0 - m) * uSlots), 0.0, uSlots - 1.0);
    vColor = vec4(c, 1.0);
  }

  // posisi quad
  vec2 px = vec2(float(cell.x), float(cell.y)) * uCell + corner * uCell;
  gl_Position = vec4((px / uOut) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;

  // atlas: slot -> (kolom, baris); baris dibalik supaya glyph tidak mirror
  float ac = mod(slot, uAtlasGrid.x);
  float ar = floor(slot / uAtlasGrid.x);
  vec2 uv = (vec2(ac, ar) + corner) / uAtlasGrid;
  vUV = uv;
}`;

export const FS_GLYPH = `#version 300 es
precision highp float;
in vec2 vUV;
in vec4 vColor;
uniform sampler2D uAtlas;
out vec4 o;
void main() {
  float a = texture(uAtlas, vUV).a;
  if (a < 0.02) discard;
  o = vec4(vColor.rgb * a, a);   // premultiplied
}`;

// ---- pass dither: fullscreen, bayer 8x8 + palet
export const FS_DITHER = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uCellPx;
uniform float uStrength;
uniform float uThreshold;
uniform int uPaletteCount;
uniform vec3 uPalette[16];
uniform int uLumaRamp;  // 1 = palet bertingkat satu rona (urut gelap->terang): dither per kecerahan
uniform float uMode;   // 0 = bayer8, 1 = halftone (radial), 2 = lines
uniform float uSourceAspect;
uniform vec2 uOutAspect;
${ADJUST}
out vec4 o;

float bayer8(vec2 p) {
  const float m[64] = float[64](
     0.,32., 8.,40., 2.,34.,10.,42.,
    48.,16.,56.,24.,50.,18.,58.,26.,
    12.,44., 4.,36.,14.,46., 6.,38.,
    60.,28.,52.,20.,62.,30.,54.,22.,
     3.,35.,11.,43., 1.,33., 9.,41.,
    51.,19.,59.,27.,49.,17.,57.,25.,
    15.,47., 7.,39.,13.,45., 5.,37.,
    63.,31.,55.,23.,61.,29.,53.,21.);
  ivec2 i = ivec2(mod(p, 8.0));
  return (m[i.y * 8 + i.x] + 0.5) / 64.0;
}

// Dua warna palet terdekat (a = paling dekat, b = kedua). Ambang ordered dither
// (bayer/halftone/lines) lalu memilih a atau b sesuai posisi c di garis a->b, jadi
// palet >2 warna (grey4, gameboy, pico8) dapat gradasi tonal sungguhan.
void nearest2(vec3 c, out vec3 a, out vec3 b) {
  float da = 1e9, db = 1e9;
  a = uPalette[0]; b = uPalette[0];
  for (int i = 0; i < 16; i++) {
    if (i >= uPaletteCount) break;
    vec3 d = c - uPalette[i];
    float dd = dot(d, d);
    if (dd < da) { db = da; b = a; da = dd; a = uPalette[i]; }
    else if (dd < db) { db = dd; b = uPalette[i]; }
  }
}

void main() {
  vec2 uv = vUV;
  float sAsp = uSourceAspect, oAsp = uOutAspect.x / uOutAspect.y;
  if (oAsp > sAsp) { uv.y = (uv.y - 0.5) * (sAsp / oAsp) + 0.5; }
  else { uv.x = (uv.x - 0.5) * (oAsp / sAsp) + 0.5; }
  vec3 c = adjust(texture(uSrc, clamp(uv, 0.0, 1.0)).rgb);

  vec2 px = vUV * uRes;
  float th;
  if (uMode < 0.5) {
    th = bayer8(px / max(uCellPx, 0.5));
  } else if (uMode < 1.5) {
    vec2 cellP = mod(px, max(uCellPx, 1.0)) / max(uCellPx, 1.0) - 0.5;
    th = clamp(length(cellP) / 0.707, 0.0, 1.0);
  } else {
    th = mod(px.y, max(uCellPx, 1.0)) / max(uCellPx, 1.0);
  }
  th = (th - 0.5) * uStrength + 0.5 + uThreshold;
  if (uLumaRamp == 1) {
    // palet bertingkat (mono/grey4/gameboy): kecerahan 0..1 dipetakan rata ke indeks
    // palet, ambang memilih tingkat bawah/atas -> posterize + dither klasik
    float n = float(uPaletteCount - 1);
    float l = clamp(dot(c, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    int idx = int(clamp(floor(l * n + th), 0.0, n));
    o = vec4(uPalette[idx], 1.0);
  } else {
    // palet berwarna: pilih di antara dua warna RGB terdekat
    vec3 a, b;
    nearest2(c, a, b);
    vec3 ab = b - a;
    float t = clamp(dot(c - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    o = vec4((th < t) ? b : a, 1.0);
  }
}`;

// ---- pass Floyd–Steinberg: hasil error diffusion (dihitung di CPU, lihat js/dither.js)
// digambar sebagai kotak tajam selebar uCellPx. Tekstur baris 0 = atas gambar, jadi
// koordinat diukur dari kiri atas; kotak terakhir di kanan/bawah boleh terpotong.
export const FS_ED_BLIT = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uCellPx;
uniform float uOutH;     // tinggi output (px)
out vec4 o;
void main() {
  vec2 p = vec2(gl_FragCoord.x, uOutH - gl_FragCoord.y);
  ivec2 t = min(ivec2(floor(p / uCellPx)), textureSize(uTex, 0) - 1);
  o = vec4(texelFetch(uTex, t, 0).rgb, 1.0);
}`;

// ---- pass 3D hex (instanced polygon: 1 heksagon atas + 2 muka samping)
export const VS_HEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aLocal;   // koordinat lokal (unit hex)
layout(location=1) in float aFace;   // 0 atas, 1 kanan, 2 kiri
uniform sampler2D uGrid;
uniform vec2 uGridSize;
uniform vec2 uOut;
uniform float uT;        // jari-jari hex, pusat -> sudut (px); lebar hex = uT * sqrt(3)
uniform float uHover;    // spasi horizontal
uniform float uVspread;  // spasi vertikal
out vec3 vColor;
out float vFace;

void main() {
  int cols = int(uGridSize.x);
  int id = gl_InstanceID;
  ivec2 cell = ivec2(id - (id / cols) * cols, id / cols);

  // warna grid sudah di-level/contrast/invert di pass grid
  vColor = texelFetch(uGrid, cell, 0).rgb;

  float w = uT * 1.7320508 * uHover;   // lebar antar pusat
  float h = uT * 1.5 * uVspread;       // tinggi antar baris
  float rowOff = (mod(float(cell.y), 2.0) > 0.5) ? w * 0.5 : 0.0;
  vec2 center = vec2(float(cell.x) * w + rowOff + w * 0.5, float(cell.y) * h + uT);

  vec2 local = aLocal * uT;
  vec2 px = center + local;
  gl_Position = vec4((px / uOut) * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
  vFace = aFace;
}`;

export const FS_HEX = `#version 300 es
precision highp float;
in vec3 vColor;
in float vFace;
out vec4 o;
void main() {
  float shade = (vFace < 0.5) ? 1.35 : ((vFace < 1.5) ? 1.0 : 0.55);
  o = vec4(clamp(vColor * shade, 0.0, 1.0), 1.0);
}`;

// ---- post FX: chromatic + scanline + vignette + grain (satu pass)
export const FS_POST = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uChroma;    // px
uniform float uScanline;  // 0..1
uniform float uVignette;  // 0..1
uniform float uGrain;     // 0..1
out vec4 o;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 d = (vUV - 0.5) * (uChroma / uRes);
  vec3 c;
  c.r = texture(uTex, vUV + d).r;
  c.g = texture(uTex, vUV).g;
  c.b = texture(uTex, vUV - d).b;

  float sl = 0.5 + 0.5 * sin(vUV.y * uRes.y * 1.6);
  c *= 1.0 - uScanline * 0.35 * sl;

  float v = smoothstep(0.85, 0.25, length(vUV - 0.5));
  c *= mix(1.0, v, uVignette);

  c += (hash(vUV * uRes + uTime) - 0.5) * uGrain * 0.18;
  o = vec4(c, 1.0);
}`;

export const VS_QUAD = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vUV;
void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;