// i18n.js — teks UI dua bahasa (Indonesia / English).
// Tambah bahasa: salin blok `en`, ganti kodenya (mis. `ja`), terjemahkan, lalu tambahkan
// tombolnya di index.html (<button data-lang="ja">JA</button>).
// Elemen HTML ditandai: data-i18n (teks), data-i18n-html (teks dengan <kbd>),
// data-i18n-title (tooltip), data-i18n-aria (aria-label). Variabel ditulis {nama}.

const STRINGS = {
  id: {
    'lang.aria': 'Bahasa',
    tagline: 'GPU renderer · 4 mode · post FX · ekspor',
    'src.label': 'Sumber',
    'src.open': 'Buka gambar/video',
    'src.open.title': 'Pilih gambar atau video (bisa juga drag & drop ke jendela)',
    'mode.label': 'Mode',
    'mode.characters': 'Characters (ramp)',
    'mode.braille': 'Braille (2×4 titik)',
    'mode.dither': 'Dither + palet',
    'mode.hex': '3D Hex',
    'cols.label': 'Kolom (grid)',
    'cell.label': 'Ukuran cell (px)',
    'preset.label': 'Charset preset',
    'charset.label': 'Charset manual',
    'invert.label': 'Invert',
    'contrast.label': 'Contrast',
    'bright.label': 'Brightness',
    'edge.label': 'Edge boost',
    'palette.label': 'Palet dither',
    'dalgo.label': 'Algoritma',
    'dithercell.label': 'Ukuran titik',
    'export.frame': 'Ekspor frame',
    'png.title': 'Simpan frame sebagai PNG (E)',
    'txt.title': 'Simpan teks ASCII frame ini (T)',
    'copy.label': 'Salin',
    'copy.title': 'Salin teks ASCII ke clipboard',
    'txt.note': 'TXT/Salin hanya untuk mode Characters & Braille.',
    'export.video': 'Ekspor video',
    'vdur.loop': '1 putaran penuh (dari 0:00)',
    'vdur.custom': 'Durasi kustom',
    'vsecs.title': 'Durasi rekaman (detik)',
    'unit.sec': 'dtk',
    'vaudio.label': 'Sertakan audio video',
    'vrec.label': 'Rekam video',
    'vcancel.label': 'Batal',
    'vnote': 'Hanya untuk sumber video. Rekaman berjalan real-time, jadi biarkan tab ini tetap di depan.',
    shortcuts: '<kbd>1</kbd>–<kbd>4</kbd> mode · <kbd>spasi</kbd> play/pause · '
      + '<kbd>←</kbd>/<kbd>→</kbd> ±1 frame · <kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> ±1 dtk · '
      + '<kbd>E</kbd> PNG · <kbd>T</kbd> TXT',
    'p.back': 'Mundur 1 frame (←)',
    'p.play': 'Play/pause (spasi)',
    'p.fwd': 'Maju 1 frame (→)',
    'p.seek': 'Geser untuk lompat',
    'p.rate': 'Kecepatan putar',
    'p.mute': 'Suara on/off',

    'st.ready': 'Siap. Drop gambar/video ke jendela, atau klik Buka gambar/video.',
    'st.imgFail': 'Gagal memuat gambar: {name}',
    'st.vidUnreadable': 'Video tidak bisa dibaca browser ini.',
    'st.vidUrlFail': 'Video tidak bisa dimuat: {url} ({err})',
    'st.pngFail': 'Gagal membuat PNG.',
    'st.pngSaved': 'PNG tersimpan ({kb} KB)',
    'st.txtOnly': 'TXT hanya untuk mode Characters & Braille.',
    'st.txtSaved': 'TXT tersimpan ({cols} kolom × {rows} baris)',
    'st.copyOnly': 'Salin teks hanya untuk mode Characters & Braille.',
    'st.copied': 'Teks ASCII disalin ({cols} kolom × {rows} baris)',
    'st.copyFail': 'Gagal menyalin ke clipboard: {err}',
    'st.noRecorder': 'Browser ini tidak mendukung perekaman video.',
    'st.recFail': 'Perekaman gagal: {err}',
    'st.recCancelled': 'Perekaman dibatalkan.',
    'st.recSaved': 'Video tersimpan: {dur} · {mb} MB{note}',
    'st.waitRec': 'Tunggu perekaman selesai atau tekan Batal dulu.',
    'st.error': 'Error: {err}',
    'st.noWebgl': 'WebGL2 tidak tersedia di browser ini',
    'fmt.none': 'Browser ini tidak mendukung perekaman',
    'rec.preparing': 'Menyiapkan…',
    'rec.progress': 'Merekam {done} / {total}',
    'rec.withAudio': ' · dengan audio',
    'rec.noAudio': ' · tanpa audio ({reason})',
    'rec.reasonSilent': 'video tidak punya suara',
    'rec.reasonFormat': 'format ini tanpa dukungan audio di browser ini',
  },

  en: {
    'lang.aria': 'Language',
    tagline: 'GPU renderer · 4 modes · post FX · export',
    'src.label': 'Source',
    'src.open': 'Open image/video',
    'src.open.title': 'Choose an image or video (you can also drag & drop it onto the window)',
    'mode.label': 'Mode',
    'mode.characters': 'Characters (ramp)',
    'mode.braille': 'Braille (2×4 dots)',
    'mode.dither': 'Dither + palette',
    'mode.hex': '3D Hex',
    'cols.label': 'Columns (grid)',
    'cell.label': 'Cell size (px)',
    'preset.label': 'Charset preset',
    'charset.label': 'Custom charset',
    'invert.label': 'Invert',
    'contrast.label': 'Contrast',
    'bright.label': 'Brightness',
    'edge.label': 'Edge boost',
    'palette.label': 'Dither palette',
    'dalgo.label': 'Algorithm',
    'dithercell.label': 'Dot size',
    'export.frame': 'Export frame',
    'png.title': 'Save frame as PNG (E)',
    'txt.title': 'Save this frame as ASCII text (T)',
    'copy.label': 'Copy',
    'copy.title': 'Copy ASCII text to the clipboard',
    'txt.note': 'TXT/Copy only works in Characters & Braille modes.',
    'export.video': 'Export video',
    'vdur.loop': '1 full loop (from 0:00)',
    'vdur.custom': 'Custom duration',
    'vsecs.title': 'Recording length (seconds)',
    'unit.sec': 's',
    'vaudio.label': 'Include video audio',
    'vrec.label': 'Record video',
    'vcancel.label': 'Cancel',
    'vnote': 'Video sources only. Recording runs in real time, so keep this tab in the foreground.',
    shortcuts: '<kbd>1</kbd>–<kbd>4</kbd> mode · <kbd>space</kbd> play/pause · '
      + '<kbd>←</kbd>/<kbd>→</kbd> ±1 frame · <kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> ±1 s · '
      + '<kbd>E</kbd> PNG · <kbd>T</kbd> TXT',
    'p.back': 'Back 1 frame (←)',
    'p.play': 'Play/pause (space)',
    'p.fwd': 'Forward 1 frame (→)',
    'p.seek': 'Drag to seek',
    'p.rate': 'Playback speed',
    'p.mute': 'Sound on/off',

    'st.ready': 'Ready. Drop an image/video onto the window, or click Open image/video.',
    'st.imgFail': "Couldn't load image: {name}",
    'st.vidUnreadable': "This browser can't read the video.",
    'st.vidUrlFail': "Couldn't load video: {url} ({err})",
    'st.pngFail': "Couldn't create the PNG.",
    'st.pngSaved': 'PNG saved ({kb} KB)',
    'st.txtOnly': 'TXT only works in Characters & Braille modes.',
    'st.txtSaved': 'TXT saved ({cols} columns × {rows} rows)',
    'st.copyOnly': 'Copy only works in Characters & Braille modes.',
    'st.copied': 'ASCII text copied ({cols} columns × {rows} rows)',
    'st.copyFail': "Couldn't copy to the clipboard: {err}",
    'st.noRecorder': "This browser doesn't support video recording.",
    'st.recFail': 'Recording failed: {err}',
    'st.recCancelled': 'Recording cancelled.',
    'st.recSaved': 'Video saved: {dur} · {mb} MB{note}',
    'st.waitRec': 'Wait for the recording to finish, or press Cancel first.',
    'st.error': 'Error: {err}',
    'st.noWebgl': "WebGL2 isn't available in this browser",
    'fmt.none': 'Recording not supported in this browser',
    'rec.preparing': 'Preparing…',
    'rec.progress': 'Recording {done} / {total}',
    'rec.withAudio': ' · with audio',
    'rec.noAudio': ' · no audio ({reason})',
    'rec.reasonSilent': 'the video has no sound',
    'rec.reasonFormat': 'this format has no audio support in this browser',
  },
};

const STORE_KEY = 'asciit.lang';
let lang = 'id';
const listeners = [];

export const LANGS = Object.keys(STRINGS);
export const getLang = () => lang;
export const onLangChange = (fn) => { listeners.push(fn); };

// Urutan: ?lang= (sekali pakai) > pilihan tersimpan > bahasa browser > English.
function detectLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && STRINGS[q]) return q;
  } catch { /* abaikan */ }
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch { /* storage diblokir: pakai bahasa browser */ }
  for (const l of navigator.languages || [navigator.language || '']) {
    const base = String(l).toLowerCase().split('-')[0];
    if (STRINGS[base]) return base;
  }
  return 'en';
}

// t('kunci', { var: nilai }); nilai boleh { key, vars } untuk teks bertingkat
// (mis. alasan "tanpa audio"), supaya pesan bisa diterjemahkan ulang saat bahasa diganti.
export function t(key, vars = {}) {
  const s = STRINGS[lang]?.[key] ?? STRINGS.id[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    if (v && typeof v === 'object' && v.key) return t(v.key, v.vars);
    return v ?? '';
  });
}

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}

export function setLang(next, save = true) {
  if (!STRINGS[next]) return;
  lang = next;
  if (save) { try { localStorage.setItem(STORE_KEY, next); } catch { /* tidak tersimpan, tetap jalan */ } }
  applyI18n();
  listeners.forEach((fn) => fn(next));
}

export function initI18n() {
  lang = detectLang();
  applyI18n();
}
