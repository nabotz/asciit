// gl.js — helper WebGL2 minimal (program, tekstur, FBO, atlas glyph, geometri hex)

export function createProgram(gl, vsSrc, fsSrc, label = 'program') {
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      throw new Error(`${label} ${type === gl.VERTEX_SHADER ? 'VS' : 'FS'}: ${log}`);
    }
    return sh;
  };
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`${label} link: ${gl.getProgramInfoLog(p)}`);
  }
  const uniforms = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    const name = info.name.replace(/\[0\]$/, '');
    uniforms[name] = gl.getUniformLocation(p, info.name);
  }
  return { program: p, u: uniforms };
}

export function makeTexture(gl, w, h, filter = gl.LINEAR) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function makeFBO(gl, w, h) {
  const tex = makeTexture(gl, w, h, gl.LINEAR);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!ok) throw new Error('FBO tidak lengkap');
  return { fbo, tex, w, h };
}

// Atlas glyph: satu canvas berisi semua karakter, lalu diunggah sebagai tekstur alpha.
export function buildAtlas(gl, chars, cellPx = 64, fontFamily = '"Courier New", Courier, monospace') {
  const n = chars.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cv = document.createElement('canvas');
  cv.width = cols * cellPx;
  cv.height = rows * cellPx;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontPx = Math.round(cellPx * 0.92);
  ctx.font = `${fontPx}px ${fontFamily}`;
  for (let i = 0; i < n; i++) {
    const cx = (i % cols) * cellPx + cellPx / 2;
    const cy = Math.floor(i / cols) * cellPx + cellPx / 2;
    ctx.fillText(chars[i], cx, cy);
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { tex, cols, rows, count: n, canvas: cv };
}

// Geometri hex: 3 quad (atas, kanan, kiri) = 18 vertex per heksagon.
export function hexGeometry() {
  const k = 0.8660254;
  const faces = [
    // [ [x,y] x4 , faceId ]
    [[[0, -1], [k, -0.5], [0, 0], [-k, -0.5]], 0],
    [[[k, -0.5], [k, 0.5], [0, 1], [0, 0]], 1],
    [[[-k, -0.5], [0, 0], [0, 1], [-k, 0.5]], 2],
  ];
  const local = [];
  const face = [];
  for (const [quad, id] of faces) {
    const tris = [[0, 1, 2], [0, 2, 3]];
    for (const t of tris) {
      for (const idx of t) {
        local.push(quad[idx][0], quad[idx][1]);
        face.push(id);
      }
    }
  }
  return { local: new Float32Array(local), face: new Float32Array(face), verts: face.length };
}
