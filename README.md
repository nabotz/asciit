# ASCIIt

**English** · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-7bf1a8)](LICENSE)
![WebGL2](https://img.shields.io/badge/WebGL2-GPU%20rendering-5c6bc0)
![Dependencies](https://img.shields.io/badge/dependencies-0-7bf1a8)
![Build step](https://img.shields.io/badge/build%20step-none-8b8b96)
![UI languages](https://img.shields.io/badge/UI-EN%20%7C%20ID-8b8b96)

A real-time ASCII art editor that runs **100% in your browser, on your GPU**.
No server, no account, no credits, no tracking.

<p align="center">
  <img src="docs/demo.gif" width="720" alt="ASCIIt cycling through the Characters, Braille, Dither and 3D Hex modes on the sample clip">
</p>

## Four render modes

| Characters | Braille |
|---|---|
| ![Characters mode](docs/mode-characters.png) | ![Braille mode](docs/mode-braille.png) |
| Glyph ramp in the source's own colors, 6 presets + custom charset, edge boost | 2×4 dots per cell read from 8 texels (not a fake ramp), real Unicode braille |
| **Dither** | **3D Hex** |
| ![Dither mode](docs/mode-dither.png) | ![3D Hex mode](docs/mode-hex.png) |
| bayer8 / halftone / lines with 6 palettes (mono, grey4, gameboy, pico8, cga, cyberpunk) | Three-faced hexagonal prisms (1.35 / 1.0 / 0.55 shading), instanced geometry |

## The output is real text

The TXT export picks every character with the same formula as the shader, so what you see is
what you get. This is the sample image exported in Braille mode at 90 columns:

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

## Run it

All you need is Python 3 (for a static file server) and a modern browser with WebGL2.

```bash
git clone https://github.com/nabotz/asciit.git
cd asciit
./run.sh            # default port 8123
# or: python3 -m http.server 8123 --bind 127.0.0.1
```

Open **http://localhost:8123**. Sample video: **http://localhost:8123/?video=assets/demo.mp4**.

**Windows:** double-click `run.bat` (or run `run.bat 8124` from a terminal for another port).
The script finds Python 3 (`py` / `python` / `python3`), opens the browser for you, and
forces `.js` files to be served as `text/javascript` — some Windows registries map `.js`
to `text/plain`, and browsers refuse to load ES modules with that type.

> Why a server? Browsers block ES modules and textures loaded from `file://`.
> `./run.sh` is just Python's built-in `http.server` — no dependencies.

## Controls

Load a source with the **Open image/video** button, or by dragging & dropping a file anywhere
on the window. The sidebar has grid columns, cell size,
contrast/brightness/invert, edge boost, dither settings and 4 post FX (chromatic, scanline,
vignette, grain). Videos get a player bar with play/pause, a timeline, ±1 frame, speed and sound.

| Key | Action |
|---|---|
| `1`–`4` | Switch mode (Characters · Braille · Dither · 3D Hex) |
| `Space` | Play / pause |
| `←` / `→` | Previous / next frame |
| `Shift` + `←` / `→` | Back / forward 1 second |
| `E` | Save PNG |
| `T` | Save TXT |

UI language: **English / Indonesian** — `EN`/`ID` buttons in the top-left corner; your choice is
remembered in the browser. The initial language follows your browser; add `?lang=en` or
`?lang=id` to the URL to force one for a single visit.

## Export

- **PNG** — the frame currently on screen, at `cols × cell` resolution (e.g. 110 × 8 → 880 px).
  For video: pause, then pick the frame with the timeline or `←`/`→`.
- **TXT / Copy** — ASCII text of the current frame (Characters & Braille modes). Open it with a
  monospace font; braille needs a font with glyphs U+2800–U+28FF.
- **Video** — recorded in real time from the canvas with `MediaRecorder`:
  - *1 full loop*: from 0:00 to the end of the video, speed forced to 1×;
  - *custom duration*: N seconds from 0:00 (the video loops if it is shorter);
  - the video's audio is included when the box is checked and the video has sound;
  - progress bar + Cancel button; position, speed and play state are restored afterwards.

## Browser support

| | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Rendering (WebGL2) | ✅ | ✅ | ✅ 15+ |
| Accurate ±1 frame (`requestVideoFrameCallback`) | ✅ 83+ | ✅ 132+ | ✅ 15.4+ |
| Video export | MP4 (recent versions) + WebM | WebM | MP4 (+ WebM in recent versions) |
| PNG / TXT export, copy to clipboard | ✅ | ✅ | ✅ |

Developed and tested in Chromium. Video formats are detected at runtime with
`MediaRecorder.isTypeSupported()`, so the app only offers what your browser can actually record.
Without `requestVideoFrameCallback`, frame stepping falls back to a 30 fps estimate.

## GPU

All the heavy lifting happens on the GPU through WebGL2 (not canvas 2D):

```
source (image / video)
   │
   ├─ pass 1  grid      : source → cols×rows texture (levels/contrast/brightness/invert)
   ├─ pass 2  glyph     : cols×rows instanced quads, atlas slot picked in the vertex shader
   │                       · characters : ramp index from luma
   │                       · braille    : 8 texels (2×4) → Unicode U+2800 bitmask
   │                       · dither     : fullscreen bayer8/halftone + palette
   │                       · hex        : hexagonal prism geometry (instanced)
   └─ pass 3  post FX   : chromatic · scanline · vignette · grain
```

- **1 draw call** for the whole character grid (`drawArraysInstanced`).
- The glyph atlas is built once per charset/font size and stored as a texture.
- Video frames are uploaded as textures (`texImage2D`) — no per-frame `getImageData`,
  so there is no slow CPU readback.
- The only readback: 64×64 pixels for auto-levels (min/max luma per frame).

The FPS counter sits in the bottom-left corner. The load is light for a real GPU: the
default demo (110 columns) is just 110×38 = 4,180 instances per frame, and 300 columns on a
16:9 source (~31,000 instances) is still comfortable. On a software renderer without a GPU
(SwiftShader) it only manages a few fps. If it feels heavy, lower the columns/cell size or
turn off post FX.

## Project structure

```
index.html          UI + controls (no framework)
js/shaders.js       all GLSL: grid, glyph, dither, hex, post
js/gl.js            WebGL2 helpers: programs, FBOs, glyph atlas, hex geometry
js/main.js          state, render loop, sources (image/video), export
js/i18n.js          two-language UI strings (Indonesian / English)
assets/demo.jpg     sample image
assets/demo.mp4     4-second sample clip
docs/               README images (demo GIF, mode gallery, social preview)
run.sh              static server
run.bat             static server for Windows (double-click)
```

## Extending

- **New charset**: add it to `RAMP_PRESETS` in `js/main.js` (or type it straight into the
  Charset field). The atlas is rebuilt automatically.
- **New dither palette**: add an RGB array to `PALETTES` and an `<option>` in `index.html`
  (16 colors max, uniform `uPalette[16]`).
- **New post FX**: copy a block in `FS_POST` (`js/shaders.js`), add a slider in `index.html`,
  then pass its uniform in `main.js`.
- **Other shader effects** (halftone, thermal, glitch, …): each needs its own shader; add it as
  a new pass between scene and post.
- **New UI language**: copy the `en` block in `js/i18n.js`, change its code (e.g. `ja`),
  translate it, then add a `<button data-lang="ja">JA</button>` in `index.html`.

## Roadmap

- [x] Characters, Braille, Dither and 3D Hex modes
- [x] Video player with frame stepping
- [x] PNG, TXT and MP4/WebM export
- [x] English / Indonesian UI
- [ ] Floyd–Steinberg (error-diffusion) dithering
- [ ] More shader effects (halftone, glitch, thermal)
- [ ] Frame-accurate video export with WebCodecs (no dropped frames)
- [ ] Colored HTML / ANSI text export
- [ ] Resizable sidebar and a better mobile layout

## Limitations

- **Floyd–Steinberg dithering** (error diffusion) isn't available — this GPU version only has
  *ordered* algorithms (bayer/halftone/lines). Floyd–Steinberg needs sequential error
  propagation, which in practice means the CPU or a multi-pass shader.
- **Shader effects**: only 4 common post FX so far (chromatic, scanline, vignette, grain).
- **Fonts** depend on the system (`Courier New` → monospace fallback), so glyph shapes can
  differ slightly between browsers.
- **Video export** is recorded in real time (not encoded frame by frame): only frames that get
  rendered end up in the file, so a slow GPU means a lower frame rate, and the tab must stay in
  the foreground. WebM files from `MediaRecorder` don't store a duration in the header (some
  players can't seek them) — pick MP4 when it's available.
- **±1 frame** uses a frame-rate estimate taken during playback (e.g. 24/25/29.97/30/60). For
  VFR (variable frame rate) videos a step may not be exactly one frame.
- **`?video=URL`** downloads the video into a blob first, because Python's static server
  doesn't support HTTP Range requests (without them the video can't be seeked).
- Braille uses 8 texels per cell, so the braille grid is 2× wider than in the other modes —
  that's the nature of braille, not a bug.

## License & credits

The algorithms used here (luma grid, glyph ramp, ordered dither, hex prisms, Sobel edge
detection) are public techniques. The code was written for this project and is not a copy
of any other app's code or assets. The sample image and clip are original 3D renders made
for this project.

Released under the [MIT](LICENSE) license. Inspired by [ascii-magic.com](https://ascii-magic.com).
