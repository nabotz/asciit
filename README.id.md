<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/logo-light.svg">
  <img src="docs/logo-dark.svg" width="760" alt="ASCIIt">
</picture>

### Ubah gambar atau video jadi ASCII art live, langsung di GPU kamu.

<sub>Tanpa server · tanpa akun · tanpa kredit · tanpa tracking · tidak ada yang keluar dari komputermu</sub>

<br><br>

<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-7bf1a8?style=flat-square&labelColor=0d1117" alt="Lisensi: MIT"></a>
<img src="https://img.shields.io/badge/WebGL2-GPU%20rendering-5ce1e6?style=flat-square&labelColor=0d1117&logo=webgl&logoColor=white" alt="WebGL2">
<img src="https://img.shields.io/badge/dependencies-0-a78bfa?style=flat-square&labelColor=0d1117" alt="Tanpa dependensi">
<img src="https://img.shields.io/badge/build%20step-none-7bf1a8?style=flat-square&labelColor=0d1117" alt="Tanpa build step">
<img src="https://img.shields.io/badge/UI-EN%20%7C%20ID-5ce1e6?style=flat-square&labelColor=0d1117" alt="UI bahasa Inggris dan Indonesia">

[English](README.md) &nbsp;·&nbsp; **Bahasa Indonesia**

[Mode](#empat-cara-menggambar-piksel) &nbsp;·&nbsp;
[Ekspor teks](#ini-teks-sungguhan-bukan-gambar-teks) &nbsp;·&nbsp;
[Player](#putar-per-frame-ekspor-sesukamu) &nbsp;·&nbsp;
[Mulai](#jalankan-di-komputermu) &nbsp;·&nbsp;
[Shortcut](#semua-bisa-lewat-keyboard) &nbsp;·&nbsp;
[Cara kerja](#cara-kerjanya) &nbsp;·&nbsp;
[Roadmap](#yang-akan-datang)

<br>

<img src="docs/hero.webp" width="748" alt="Klip contoh berganti dari video sumber ke ASCII, lalu berputar melewati mode Characters, Braille, Dither, dan 3D Hex">

<br><br>

<table>
<tr>
<td width="33%" valign="top">
<img src="docs/icon-modes.svg" width="44" alt=""><br>
<b>Empat mode render</b><br>
<sub>Characters, Braille, Dither, dan 3D Hex. Ganti dengan <kbd>1</kbd>–<kbd>4</kbd>.</sub>
</td>
<td width="33%" valign="top">
<img src="docs/icon-text.svg" width="44" alt=""><br>
<b>Hasilnya teks asli</b><br>
<sub>Ekspor TXT dan salin memakai rumus yang sama dengan shader. Yang kamu lihat, itu yang kamu tempel.</sub>
</td>
<td width="33%" valign="top">
<img src="docs/icon-player.svg" width="44" alt=""><br>
<b>Player per frame</b><br>
<sub>Play, geser timeline, ±1 frame, ubah kecepatan, nyalakan suara.</sub>
</td>
</tr>
<tr>
<td width="33%" valign="top">
<img src="docs/icon-record.svg" width="44" alt=""><br>
<b>Ekspor video</b><br>
<sub>MP4 atau WebM dengan audio, satu putaran penuh atau durasi kustom.</sub>
</td>
<td width="33%" valign="top">
<img src="docs/icon-gpu.svg" width="44" alt=""><br>
<b>Satu draw call</b><br>
<sub>Seluruh grid digambar sekali secara instanced. Tanpa readback CPU per frame.</sub>
</td>
<td width="33%" valign="top">
<img src="docs/icon-zero.svg" width="44" alt=""><br>
<b>Tanpa dependensi</b><br>
<sub>Tanpa framework, tanpa npm, tanpa build. Cukup server statis Python.</sub>
</td>
</tr>
</table>

</div>

<br>

<p align="center"><img src="docs/divider.svg" width="860" alt=""></p>

<sub><b>01</b> &nbsp;·&nbsp; MODE RENDER</sub>

## Empat cara menggambar piksel

<table>
<tr>
<td width="50%" valign="top">
<img src="docs/mode-characters.png" alt="Mode Characters"><br>
<kbd>1</kbd> &nbsp;<b>Characters</b><br>
<sub>Ramp glyph dengan warna asli sumber. 6 preset plus charset manual, dengan edge boost.</sub>
</td>
<td width="50%" valign="top">
<img src="docs/mode-braille.png" alt="Mode Braille"><br>
<kbd>2</kbd> &nbsp;<b>Braille</b><br>
<sub>2×4 titik per cell, dibaca dari 8 texel, bukan ramp tiruan. Unicode braille asli.</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<img src="docs/mode-dither.png" alt="Mode Dither"><br>
<kbd>3</kbd> &nbsp;<b>Dither</b><br>
<sub>bayer8, halftone, atau lines, dengan 6 palet: mono, grey4, gameboy, pico8, cga, cyberpunk.</sub>
</td>
<td width="50%" valign="top">
<img src="docs/mode-hex.png" alt="Mode 3D Hex"><br>
<kbd>4</kbd> &nbsp;<b>3D Hex</b><br>
<sub>Prisma heksagon 3 muka (shading 1.35 / 1.0 / 0.55), digambar sebagai geometri instanced.</sub>
</td>
</tr>
</table>

<sub><b>02</b> &nbsp;·&nbsp; TEKS ASLI</sub>

## Ini teks sungguhan, bukan gambar teks

Ekspor TXT memilih setiap karakter dengan rumus yang sama persis dengan shader, jadi isi file
sama dengan yang tampil di layar. Ini gambar contoh yang diekspor di mode Braille, 90 kolom.
Blok, salin, lalu tempel di mana saja.

```
⠀⠀⠀⠀⠀⠀⢀⣤⣶⣾⣿⣿⣷⣶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⣾⠿⠛⠉⠉⠛⢿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀
⠀⠀⢀⣴⣿⠃⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⠀⠀
⠀⠀⣾⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀
⠀⣼⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
⢰⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧
⣸⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⢸⣿⣿⣿⣿⣿⡀⠀⢀⣠⣾⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⣠⣴⣶⣿⣿⣷⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠿⣿⣿⣿⣿⡟⠀
⠀⠀⠻⢿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠛⠉⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀
⠀⠀⠀⠀⠀⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠻⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
```

<sub><b>03</b> &nbsp;·&nbsp; PLAYER & EKSPOR</sub>

## Putar per frame, ekspor sesukamu

<p align="center">
  <img src="docs/ui.webp" width="860" alt="Editor ASCIIt: sidebar pengaturan di kiri, klip contoh di mode Characters, dan player bar dengan timeline, langkah frame, kecepatan, dan suara">
</p>

Buka sumber lewat tombol **Buka gambar/video**, atau drag & drop file ke mana saja di jendela. Di sidebar ada kolom grid, ukuran cell, contrast, brightness, invert, edge boost,
pengaturan dither, dan 4 post FX (chromatic, scanline, vignette, grain).

| Ekspor | Hasilnya |
|---|---|
| **PNG** | Frame yang tampil, resolusi `cols × cell` (110 × 8 → 880 px). Untuk video, pause dulu lalu pilih frame-nya. |
| **TXT / Salin** | Frame yang tampil sebagai teks biasa (Characters & Braille). Braille butuh font yang punya U+2800–U+28FF. |
| **Video** | Direkam live dari canvas lewat `MediaRecorder`: satu putaran penuh di 1×, atau N detik dari 0:00. Audio ikut kalau videonya bersuara. Ada progres dan tombol Batal; posisi, kecepatan, dan status play dikembalikan setelah selesai. |

<sub><b>04</b> &nbsp;·&nbsp; MULAI CEPAT</sub>

## Jalankan di komputermu

Butuh Python 3 saja (untuk server statis) dan browser dengan WebGL2.

```bash
git clone https://github.com/nabotz/asciit.git
cd asciit
./run.sh            # jalan di port 8123
```

Lalu buka **http://localhost:8123**, atau **http://localhost:8123/?video=assets/demo.mp4** untuk klip contoh.

> [!TIP]
> **Di Windows**, klik dua kali `run.bat` (atau `run.bat 8124` untuk port lain). Script ini
> mencari Python 3 (`py` / `python` / `python3`), membuka browser, dan memaksa `.js` dikirim
> sebagai `text/javascript`. Di sebagian Windows, registry mendaftarkan `.js` sebagai
> `text/plain`, dan browser menolak ES module dengan tipe itu.

> [!NOTE]
> **Kenapa perlu server?** Browser memblokir ES module dan tekstur dari `file://`.
> `run.sh` cuma `http.server` bawaan Python, jadi tetap tidak ada yang perlu di-install.

<sub><b>05</b> &nbsp;·&nbsp; SHORTCUT</sub>

## Semua bisa lewat keyboard

| Tombol | Fungsi |
|---|---|
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> | Characters · Braille · Dither · 3D Hex |
| <kbd>Spasi</kbd> | Play / pause |
| <kbd>←</kbd> <kbd>→</kbd> | Frame sebelumnya / berikutnya |
| <kbd>Shift</kbd> + <kbd>←</kbd> <kbd>→</kbd> | Mundur / maju 1 detik |
| <kbd>E</kbd> | Simpan PNG |
| <kbd>T</kbd> | Simpan TXT |

UI tersedia dalam **bahasa Indonesia dan Inggris**. Pakai tombol `ID` / `EN` di kiri atas; pilihanmu
disimpan di browser. Kunjungan pertama mengikuti bahasa browser, dan `?lang=id` atau `?lang=en`
memaksa satu bahasa untuk sekali buka.

<sub><b>06</b> &nbsp;·&nbsp; DUKUNGAN BROWSER</sub>

## Jalan di browser mana

| | Chrome / Edge | Firefox | Safari |
|---|:---:|:---:|:---:|
| Render (WebGL2) | ✅ | ✅ | ✅&nbsp;15+ |
| ±1 frame akurat (`requestVideoFrameCallback`) | ✅&nbsp;83+ | ✅&nbsp;132+ | ✅&nbsp;15.4+ |
| Ekspor video | MP4 (versi baru) + WebM | WebM | MP4 (+ WebM di versi baru) |
| Ekspor PNG / TXT, salin ke clipboard | ✅ | ✅ | ✅ |

Dikembangkan dan diuji di Chromium. Format video dideteksi saat app berjalan lewat
`MediaRecorder.isTypeSupported()`, jadi app hanya menawarkan format yang benar-benar bisa direkam
browser-mu. Tanpa `requestVideoFrameCallback`, langkah per frame memakai perkiraan 30 fps.

<sub><b>07</b> &nbsp;·&nbsp; DI BALIK LAYAR</sub>

## Cara kerjanya

<details>
<summary><b>Pipeline GPU</b></summary>

<br>

Semua kerja berat ada di GPU lewat WebGL2, bukan canvas 2D:

```
sumber (gambar / video)
   │
   ├─ pass 1  grid      : source → tekstur cols×rows (levels/contrast/brightness/invert)
   ├─ pass 2  glyph     : cols×rows instanced quad, slot atlas dipilih di vertex shader
   │                       · characters : indeks ramp dari luma
   │                       · braille    : 8 texel (2×4) → bitmask Unicode U+2800
   │                       · dither     : fullscreen bayer8/halftone + palet
   │                       · hex        : geometri prisma heksagon (instanced)
   └─ pass 3  post FX   : chromatic · scanline · vignette · grain
```

- **1 draw call** untuk seluruh grid karakter (`drawArraysInstanced`).
- Atlas glyph dibuat sekali per charset dan ukuran font, disimpan sebagai tekstur.
- Frame video di-upload sebagai tekstur (`texImage2D`). Tidak ada `getImageData` per frame, jadi tidak ada readback CPU yang lambat.
- Satu-satunya readback: 64×64 piksel untuk auto-levels (min/max luma per frame).

Bebannya ringan untuk GPU sungguhan: demo bawaan (110 kolom) cuma 110×38 = 4.180 instance per
frame, dan 300 kolom pada sumber 16:9 (±31.000 instance) masih nyaman. Di software renderer tanpa
GPU (SwiftShader) jalannya hanya beberapa fps. Kalau terasa berat, turunkan kolom atau ukuran
cell, atau matikan post FX. Angka FPS ada di kiri bawah.

</details>

<details>
<summary><b>Struktur proyek</b></summary>

<br>

```
index.html          UI + kontrol (tanpa framework)
js/shaders.js       semua GLSL: grid, glyph, dither, hex, post
js/gl.js            helper WebGL2: program, FBO, atlas glyph, geometri hex
js/main.js          state, render loop, sumber (image/video), ekspor
js/i18n.js          teks UI dua bahasa (Indonesia / English)
assets/demo.jpg     gambar contoh
assets/demo.mp4     klip contoh 4 detik
docs/               media README (logo, hero, ikon, galeri, social preview)
run.sh              server statis
run.bat             server statis untuk Windows (klik dua kali)
```

</details>

<details>
<summary><b>Cara menambah</b></summary>

<br>

- **Charset baru:** tambahkan ke `RAMP_PRESETS` di `js/main.js`, atau ketik langsung di kolom Charset. Atlas dibangun ulang otomatis.
- **Palet dither baru:** tambahkan array RGB ke `PALETTES` dan `<option>` di `index.html` (maksimum 16 warna, uniform `uPalette[16]`).
- **Post FX baru:** salin satu blok di `FS_POST` (`js/shaders.js`), tambah slider di `index.html`, lalu teruskan uniform-nya di `main.js`.
- **Efek shader lain** (halftone, thermal, glitch, dst.): masing-masing butuh shader sendiri; tambahkan sebagai pass baru antara scene dan post.
- **Bahasa UI baru:** salin blok `en` di `js/i18n.js`, ganti kodenya (mis. `ja`), terjemahkan, lalu tambahkan `<button data-lang="ja">JA</button>` di `index.html`.

</details>

<details>
<summary><b>Batasan yang diketahui</b></summary>

<br>

- **Belum ada dither Floyd–Steinberg** (error diffusion). Versi GPU ini hanya punya algoritma *ordered* (bayer/halftone/lines); error diffusion butuh propagasi berurutan, praktisnya di CPU atau shader multi-pass.
- **Efek shader:** baru 4 post FX umum (chromatic, scanline, vignette, grain).
- **Font** diambil dari sistem (`Courier New`, lalu monospace apa saja), jadi bentuk glyph bisa beda tipis antar browser.
- **Ekspor video direkam real-time**, bukan di-encode per frame: hanya frame yang sempat dirender yang masuk ke file, jadi GPU lambat menurunkan fps hasilnya, dan tab harus tetap di depan. File WebM dari `MediaRecorder` tidak menyimpan durasi di header (sebagian player tidak bisa seek), jadi pilih MP4 kalau tersedia.
- **±1 frame** memakai perkiraan fps dari pemutaran (24/25/29,97/30/60…). Untuk video VFR (fps berubah-ubah) langkahnya bisa tidak persis 1 frame.
- **`?video=URL`** mengunduh video dulu jadi blob, karena server statis Python tidak mendukung HTTP Range (tanpa itu video tidak bisa di-seek).
- Braille membaca 8 texel per cell, jadi grid-nya 2× lebih lebar dari mode lain. Begitulah braille bekerja, bukan bug.

</details>

<sub><b>08</b> &nbsp;·&nbsp; ROADMAP</sub>

## Yang akan datang

- [x] Mode Characters, Braille, Dither, dan 3D Hex
- [x] Player video dengan langkah per frame
- [x] Ekspor PNG, TXT, dan video MP4/WebM
- [x] UI Indonesia / English
- [ ] Dither Floyd–Steinberg (error diffusion)
- [ ] Efek shader tambahan (halftone, glitch, thermal)
- [ ] Ekspor video per frame dengan WebCodecs (tanpa frame yang hilang)
- [ ] Ekspor teks berwarna (HTML / ANSI)
- [ ] Sidebar yang bisa diubah lebarnya dan tampilan mobile yang lebih baik

<br>

<p align="center"><img src="docs/divider.svg" width="860" alt=""></p>

<div align="center">

<sub>Algoritma di sini (luma grid, ramp glyph, ordered dither, prisma hex, deteksi tepi Sobel) adalah teknik publik.<br>
Kodenya ditulis untuk proyek ini, dan gambar serta klip contoh adalah render 3D orisinal.<br>
Logo memakai subset font <a href="https://github.com/JetBrains/JetBrainsMono">JetBrains Mono</a> (<a href="docs/OFL-JetBrainsMono.txt">OFL 1.1</a>).</sub>

<sub>Dirilis dengan lisensi <a href="LICENSE">MIT</a> &nbsp;·&nbsp; Terinspirasi dari <a href="https://ascii-magic.com">ascii-magic.com</a> &nbsp;·&nbsp; <a href="#top">Kembali ke atas ↑</a></sub>

</div>
