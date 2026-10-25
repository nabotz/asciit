# ASCIIt (GPU)

Editor ASCII real-time yang jalan **100% di browser, di GPU kamu**.
Tanpa server, tanpa akun, tanpa kredit, tanpa tracking.

Semua render memakai WebGL2: sumber → tekstur grid kecil → **instanced glyph quads**
(satu draw call untuk puluhan ribu karakter) → post FX → layar.

```
sumber (gambar / video)
   │
   ├─ pass 1  grid      : source → tekstur cols×rows (contrast/brightness/levels)
   ├─ pass 2  glyph     : cols×rows instanced quad, slot atlas dipilih di vertex shader
   │                       · characters : indeks ramp dari luma
   │                       · braille    : 8 texel (2×4) → bitmask Unicode U+2800
   │                       · dither     : fullscreen bayer8/halftone + palet
   │                       · hex        : geometri prisma heksagon (instanced)
   └─ pass 3  post FX   : chromatic · scanline · vignette · grain
```

## Jalankan

Butuh Python 3 saja (untuk server statis) + browser modern dengan WebGL2.

```bash
git clone https://github.com/nabotz/asciit.git
cd asciit
./run.sh            # default port 8123
# atau: python3 -m http.server 8123 --bind 127.0.0.1
```

Buka **http://localhost:8123**. Video contoh: **http://localhost:8123/?video=assets/demo.mp4**.

**Windows:** klik dua kali `run.bat` (atau `run.bat 8124` dari terminal untuk port lain).
Script ini mencari Python 3 (`py` / `python` / `python3`), membuka browser otomatis, dan
memaksa file `.js` dikirim sebagai `text/javascript` — di sebagian Windows registry
mendaftarkan `.js` sebagai `text/plain`, dan browser menolak ES module dengan tipe itu.

> Kenapa perlu server? Browser memblokir ES module + tekstur dari `file://`.
> `./run.sh` cuma `http.server` bawaan Python — tidak ada dependensi.

## Yang bisa dilakukan

| Mode | Keterangan |
|---|---|
| **Characters** | ramp glyph, 6 preset + charset manual, warna asli per cell, edge boost |
| **Braille** | 2×4 titik per cell, dibaca dari 8 texel (bukan ramp tiruan), Unicode asli |
| **Dither** | bayer8 / halftone / lines + 6 palet (mono, grey4, gameboy, pico8, cga, cyberpunk) |
| **3D Hex** | prisma heksagon 3 muka (1.35 / 1.0 / 0.55) — geometri instanced |

Kontrol: kolom grid, ukuran cell, contrast/brightness/invert, edge boost, 4 post FX,
player video (play/pause, timeline, ±1 frame, kecepatan, suara), dan ekspor **PNG**,
**TXT** (teks ASCII, bisa langsung disalin), serta **video** MP4/WebM.

Shortcut: `1`–`4` ganti mode · `spasi` play/pause · `←`/`→` ±1 frame ·
`Shift`+`←`/`→` ±1 detik · `E` simpan PNG · `T` simpan TXT.

Sumber bisa dipilih lewat tombol file atau di-drag & drop ke mana saja di jendela.

Bahasa UI: **Indonesia / English** — tombol `ID`/`EN` di kiri atas, pilihan disimpan di browser.
Bahasa awal mengikuti bahasa browser; `?lang=en` atau `?lang=id` di URL untuk memaksa sekali buka.

## GPU

Semua kerja berat ada di GPU lewat WebGL2 (bukan canvas 2D):

- **1 draw call** untuk seluruh grid karakter (`drawArraysInstanced`).
- Atlas glyph dibuat sekali per charset/font-size, disimpan sebagai tekstur.
- Video diproses sebagai tekstur tiap frame (`texImage2D`) — tidak ada `getImageData`
  per frame, jadi tidak ada readback CPU yang bikin lambat.
- Satu-satunya readback: 64×64 piksel untuk auto-levels (min/max luma per frame).

Angka FPS ada di kiri bawah. Di mesin uji ini (software renderer SwiftShader,
tanpa GPU) 880×884 jalan ~7 fps — di GPU nyata pola pemakaiannya ringan:
110×68 = 7.480 instance per frame itu kecil, 4K dengan 300 kolom (±51.000 instance)
masih nyaman. Kalau terasa berat: turunkan kolom/ukuran cell atau matikan post FX.

## Ekspor

- **PNG** — frame yang sedang tampil, resolusi = `cols × cell` (mis. 110 × 8 → 880 px).
  Tombol `PNG` / `E`. Untuk video: pause, lalu pilih frame lewat timeline atau `←`/`→`.
- **TXT / Salin** — teks ASCII frame yang sedang tampil (mode Characters & Braille).
  Karakternya dipilih dengan rumus yang sama persis dengan shader. Tombol `TXT` / `T`,
  atau `Salin` ke clipboard. Buka dengan font monospace; braille butuh font yang punya
  glyph U+2800–U+28FF.
- **Video** — direkam real-time dari canvas lewat `MediaRecorder`:
  - *1 putaran penuh*: dari 0:00 sampai akhir video, kecepatan dipaksa 1×;
  - *durasi kustom*: N detik dari 0:00 (video diulang kalau lebih pendek);
  - format yang muncul hanya yang didukung browser: **MP4 (H.264)** di Chrome/Edge versi
    baru, **WebM (VP9/VP8)** di Chrome/Edge/Firefox;
  - audio video ikut terekam kalau dicentang dan videonya bersuara;
  - ada progres + tombol Batal; posisi, kecepatan, dan status play dikembalikan setelah selesai.

## Struktur

```
index.html          UI + kontrol (tanpa framework)
js/shaders.js       semua GLSL: grid, glyph, dither, hex, post
js/gl.js            helper WebGL2: program, FBO, atlas glyph, geometri hex
js/main.js          state, render loop, sumber (image/video), ekspor
js/i18n.js          teks UI dua bahasa (Indonesia / English)
assets/demo.jpg     gambar contoh
assets/demo.mp4     klip contoh 4 detik
run.sh              server statis
run.bat             server statis untuk Windows (klik dua kali)
```

## Cara menambah

- **Charset baru**: tambahkan ke `RAMP_PRESETS` di `js/main.js` (atau ketik langsung
  di kolom Charset). Atlas dibangun ulang otomatis.
- **Palet dither baru**: tambahkan array RGB ke `PALETTES` dan `<option>` di `index.html`
  (maksimum 16 warna, seragam `uPalette[16]`).
- **Post FX baru**: salin satu blok di `FS_POST` (`js/shaders.js`) + slider baru di
  `index.html` lalu teruskan uniform-nya di `main.js`.
- **Efek shader lain** (halftone, thermal, glitch, dst): masing-masing butuh shader
  sendiri; tambahkan sebagai pass baru antara scene dan post.
- **Bahasa baru**: salin blok `en` di `js/i18n.js`, ganti kodenya (mis. `ja`), terjemahkan
  isinya, lalu tambahkan tombol `<button data-lang="ja">JA</button>` di `index.html`.

## Batasan

- **Dither Floyd–Steinberg** (error diffusion) tidak ada di sini — versi GPU ini hanya
  algoritma *ordered* (bayer/halftone/lines). Floyd butuh propagasi error berurutan,
  praktisnya di CPU/shader multi-pass.
- **Efek shader** baru 4 post FX umum (chromatic, scanline, vignette, grain); efek lain
  seperti halftone, glitch, atau thermal belum ada.
- **Font** bergantung pada font sistem (`Courier New` → fallback monospace). Bentuk glyph
  bisa beda tipis dari browser lain.
- **Video ekspor** direkam real-time (bukan encode per frame): frame yang masuk = frame yang
  sempat dirender, jadi di GPU lambat fps hasilnya turun; tab harus tetap di depan.
  File WebM dari `MediaRecorder` tidak menyimpan durasi di header (sebagian player tidak
  bisa seek) — pilih MP4 kalau tersedia.
- **±1 frame** memakai perkiraan fps dari pemutaran (mis. 24/25/29,97/30/60). Untuk video
  VFR (fps berubah-ubah) langkahnya bisa tidak persis 1 frame.
- **`?video=URL`** mengunduh video dulu jadi blob, karena server statis Python tidak
  mendukung HTTP Range (tanpa itu video tidak bisa di-seek).
- Braille memakai 8 texel per cell sehingga grid braille 2× lebih lebar dari mode lain —
  itu memang sifat braille, bukan bug.

## Lisensi & kredit

Algoritma yang dipakai di sini (luma grid, ramp glyph, ordered dither, prisma hex,
deteksi tepi Sobel) adalah teknik publik. Kode ini ditulis sendiri, bukan salinan kode
atau aset aplikasi lain.

Dirilis dengan lisensi [MIT](LICENSE). Terinspirasi dari [ascii-magic.com](https://ascii-magic.com).
