// dither.js — Floyd–Steinberg (error diffusion) di CPU.
//
// Error diffusion berurutan: tiap piksel butuh sisa error dari piksel di kirinya dan tiga
// piksel di baris atasnya, jadi tidak bisa dijalankan paralel di fragment shader WebGL2
// (versi GPU yang ada memakai compute shader + sinkronisasi antar-thread). Ukurannya kecil
// (resolusi output dibagi "Ukuran titik"), jadi cukup cepat di JS.
//
// Input  : RGBA 8-bit dari pass grid (baris 0 = atas gambar), sudah lewat cover-fit,
//          levels, contrast, brightness, dan invert seperti algoritma dither lain.
// Output : RGBA 8-bit yang isinya hanya warna palet.
//
// Pemindaian serpentine (arah bolak-balik tiap baris) supaya tidak muncul pola miring.
// Bobot standar ke tetangga yang belum diproses, relatif ke arah pindai:
//            *    7/16
//   3/16   5/16   1/16

const W_NEXT = 7 / 16, W_BACK = 3 / 16, W_DOWN = 5 / 16, W_DIAG = 1 / 16;

let work = new Float32Array(0);   // buffer kerja, dipakai ulang antar frame (tanpa GC)

function ensureWork(n) {
  if (work.length < n) work = new Float32Array(n);
  return work;
}

// palette: array [r,g,b] 0..255. lumaRamp = true untuk palet bertingkat satu rona
// (mono/grey4/gameboy), yang harus sudah urut gelap -> terang: kecerahan dibulatkan ke
// tingkat terdekat (tingkat dianggap merata 0..1, sama seperti dither bayer untuk palet
// ini) dan error kecerahan yang disebar. Palet lain: warna RGB terdekat, error per kanal.
export function floydSteinberg(src, w, h, palette, lumaRamp, dst) {
  const n = w * h;
  if (lumaRamp) {
    const buf = ensureWork(n);
    for (let i = 0; i < n; i++) {
      const p = i * 4;
      buf[i] = (0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2]) / 255;
    }
    const steps = palette.length - 1;
    for (let y = 0; y < h; y++) {
      const ltr = (y & 1) === 0;
      const dir = ltr ? 1 : -1;
      const row = y * w, below = y + 1 < h;
      for (let k = 0; k < w; k++) {
        const x = ltr ? k : w - 1 - k;
        const i = row + x;
        let v = buf[i];
        v = v < 0 ? 0 : v > 1 ? 1 : v;   // batasi supaya error tidak menumpuk tanpa batas
        const idx = Math.floor(v * steps + 0.5);
        const e = v - idx / steps;
        const c = palette[idx], o = i * 4;
        dst[o] = c[0]; dst[o + 1] = c[1]; dst[o + 2] = c[2]; dst[o + 3] = 255;
        const xn = x + dir, xb = x - dir;
        if (xn >= 0 && xn < w) buf[i + dir] += e * W_NEXT;
        if (below) {
          const j = i + w;
          if (xb >= 0 && xb < w) buf[j - dir] += e * W_BACK;
          buf[j] += e * W_DOWN;
          if (xn >= 0 && xn < w) buf[j + dir] += e * W_DIAG;
        }
      }
    }
    return dst;
  }

  // palet berwarna
  const buf = ensureWork(n * 3);
  for (let i = 0; i < n; i++) {
    const p = i * 4, q = i * 3;
    buf[q] = src[p] / 255; buf[q + 1] = src[p + 1] / 255; buf[q + 2] = src[p + 2] / 255;
  }
  const m = palette.length;
  const pr = new Float64Array(m), pg = new Float64Array(m), pb = new Float64Array(m);
  for (let k = 0; k < m; k++) {
    pr[k] = palette[k][0] / 255; pg[k] = palette[k][1] / 255; pb[k] = palette[k][2] / 255;
  }
  for (let y = 0; y < h; y++) {
    const ltr = (y & 1) === 0;
    const dir = ltr ? 1 : -1, d3 = dir * 3;
    const row = y * w, below = y + 1 < h;
    for (let k = 0; k < w; k++) {
      const x = ltr ? k : w - 1 - k;
      const i = row + x, q = i * 3;
      let r = buf[q], g = buf[q + 1], b = buf[q + 2];
      r = r < 0 ? 0 : r > 1 ? 1 : r;
      g = g < 0 ? 0 : g > 1 ? 1 : g;
      b = b < 0 ? 0 : b > 1 ? 1 : b;
      // warna palet terdekat (jarak RGB kuadrat; seri -> warna pertama, sama seperti shader)
      let best = 0, bd = Infinity;
      for (let c = 0; c < m; c++) {
        const dr = r - pr[c], dg = g - pg[c], db = b - pb[c];
        const dd = dr * dr + dg * dg + db * db;
        if (dd < bd) { bd = dd; best = c; }
      }
      const er = r - pr[best], eg = g - pg[best], eb = b - pb[best];
      const c = palette[best], o = i * 4;
      dst[o] = c[0]; dst[o + 1] = c[1]; dst[o + 2] = c[2]; dst[o + 3] = 255;
      const xn = x + dir, xb = x - dir;
      if (xn >= 0 && xn < w) {
        const t = q + d3;
        buf[t] += er * W_NEXT; buf[t + 1] += eg * W_NEXT; buf[t + 2] += eb * W_NEXT;
      }
      if (below) {
        const j = q + w * 3;
        if (xb >= 0 && xb < w) {
          const t = j - d3;
          buf[t] += er * W_BACK; buf[t + 1] += eg * W_BACK; buf[t + 2] += eb * W_BACK;
        }
        buf[j] += er * W_DOWN; buf[j + 1] += eg * W_DOWN; buf[j + 2] += eb * W_DOWN;
        if (xn >= 0 && xn < w) {
          const t = j + d3;
          buf[t] += er * W_DIAG; buf[t + 1] += eg * W_DIAG; buf[t + 2] += eb * W_DIAG;
        }
      }
    }
  }
  return dst;
}
