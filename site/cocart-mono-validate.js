// CoCart Mono validation data + font/CSS parsers. Exposes window.CCV.
(function () {
if (window.CCV) return;
const rg = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('');
// [id, name, native, script, letters (lowercase or full set), extras (punctuation, currency), noUpper]
const L = [
  ['fr', 'French', 'Français', 'Latin', 'àâæçéèêëîïôœùûüÿ', '«»€\u202F'],
  ['de', 'German', 'Deutsch', 'Latin', 'äöüßẞ', '„“‚‘€'],
  ['es', 'Spanish', 'Español', 'Latin', 'áéíñóúü', '¡¿«»€'],
  ['pt', 'Portuguese', 'Português', 'Latin', 'áâãàçéêíóôõú', '«»€'],
  ['it', 'Italian', 'Italiano', 'Latin', 'àèéìíòóù', '«»€'],
  ['ca', 'Catalan', 'Català', 'Latin', 'àçéèíïòóúü·', '«»€'],
  ['nl', 'Dutch', 'Nederlands', 'Latin', 'áäéëíïóöúü', '„”€'],
  ['da', 'Danish', 'Dansk', 'Latin', 'æøå', '«»'],
  ['nb', 'Norwegian', 'Norsk', 'Latin', 'æøå', '«»'],
  ['sv', 'Swedish', 'Svenska', 'Latin', 'åäö', '”’'],
  ['fi', 'Finnish', 'Suomi', 'Latin', 'åäöšž', '”’€'],
  ['is', 'Icelandic', 'Íslenska', 'Latin', 'áðéíóúýþæö', '„“'],
  ['pl', 'Polish', 'Polski', 'Latin', 'ąćęłńóśźż', '„”«»'],
  ['cs', 'Czech', 'Čeština', 'Latin', 'áčďéěíňóřšťúůýž', '„“‚‘'],
  ['sk', 'Slovak', 'Slovenčina', 'Latin', 'áäčďéíĺľňóôŕšťúýž', '„“€'],
  ['hu', 'Hungarian', 'Magyar', 'Latin', 'áéíóöőúüű', '„”»«'],
  ['ro', 'Romanian', 'Română', 'Latin', 'ăâîșț', '„”«»şţ'],
  ['tr', 'Turkish', 'Türkçe', 'Latin', 'çğıöşüİ', '₺'],
  ['az', 'Azerbaijani', 'Azərbaycanca', 'Latin', 'çəğıöşüİ', '₼'],
  ['hr', 'Croatian', 'Hrvatski', 'Latin', 'čćđšž', '„“€'],
  ['sl', 'Slovenian', 'Slovenščina', 'Latin', 'čšž', '„“€'],
  ['sq', 'Albanian', 'Shqip', 'Latin', 'çë', '«»'],
  ['lt', 'Lithuanian', 'Lietuvių', 'Latin', 'ąčęėįšųūž', '„“€'],
  ['lv', 'Latvian', 'Latviešu', 'Latin', 'āčēģīķļņšūž', '„“€'],
  ['et', 'Estonian', 'Eesti', 'Latin', 'äöõüšž', '„“€'],
  ['cy', 'Welsh', 'Cymraeg', 'Latin', 'âêîôûŵŷẁẃẅỳýÿäëïöü', '£'],
  ['eo', 'Esperanto', 'Esperanto', 'Latin', 'ĉĝĥĵŝŭ', ''],
  ['uz', 'Uzbek', 'Oʻzbekcha', 'Latin', 'ʻʼ', ''],
  ['vi', 'Vietnamese', 'Tiếng Việt', 'Latin', 'àảãáạăằẳẵắặâầẩẫấậđèẻẽéẹêềểễếệìỉĩíịòỏõóọôồổỗốộơờởỡớợùủũúụưừửữứựỳỷỹýỵ', '₫'],
  ['ru', 'Russian', 'Русский', 'Cyrillic', 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', '«»„“₽№'],
  ['uk', 'Ukrainian', 'Українська', 'Cyrillic', 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюяʼ', '«»₴№'],
  ['be', 'Belarusian', 'Беларуская', 'Cyrillic', 'абвгдеёжзійклмнопрстуўфхцчшыьэюяʼ', '«»'],
  ['bg', 'Bulgarian', 'Български', 'Cyrillic', 'абвгдежзийклмнопрстуфхцчшщъьюя', '„“'],
  ['sr', 'Serbian', 'Српски', 'Cyrillic', 'абвгдђежзијклљмнњопрстћуфхцчџш', '„“'],
  ['mk', 'Macedonian', 'Македонски', 'Cyrillic', 'абвгдѓежзѕијклљмнњопрстќуфхцчџш', '„“'],
  ['kk', 'Kazakh', 'Қазақша', 'Cyrillic', 'аәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя', '«»₸'],
  ['el', 'Greek', 'Ελληνικά', 'Greek', 'αάβγδεέζηήθιίϊΐκλμνξοόπρσςτυύϋΰφχψωώ', '«»\u037E\u0387€'],
  ['th', 'Thai', 'ไทย', 'Thai', rg(0xE01, 0xE3A) + rg(0xE3F, 0xE5B), '', 1],
  ['hy', 'Armenian', 'Հայերեն', 'Armenian', rg(0x531, 0x556) + rg(0x559, 0x58A) + '\u058F', '«»', 1],
  ['ka', 'Georgian', 'ქართული', 'Georgian', rg(0x10D0, 0x10FF) + rg(0x1C90, 0x1CBA) + rg(0x1CBD, 0x1CBF), '„“₾', 1]
];
const LANGS = L.map(([id, name, native, script, letters, extras, noUpper]) => {
  const seen = new Set(), chars = [];
  const add = c => { if (!seen.has(c)) { seen.add(c); chars.push(c); } };
  [...letters].forEach(add);
  if (!noUpper) [...letters].forEach(c => { const u = c.toUpperCase(); if ([...u].length === 1 && u !== c) add(u); });
  [...(extras || '')].forEach(add);
  return { id, name, native, script, chars };
});
// Clusters for shaping + metrics. Marks are typed decomposed (NFD) where noted.
const CL = {
  Latin: [['e\u0301', 'é typed as e + accent'], ['s\u0326 S\u0326', 'ș Ș typed with comma below'], ['i\u0307', 'i + dot above (Lithuanian)'], ['e\u0302\u0301', 'ế typed as e + ˆ + ´'], ['E\u0302\u0301', 'Ế typed as E + ˆ + ´'], ['o\u031B\u0300', 'ờ typed as o + horn + `'], ['a\u0306\u0309', 'ẳ typed as a + ˘ + hook'], ['Ẩ Ẫ Ỗ Ặ', 'Vietnamese stacked capitals'], ['Ő Ű Ğ İ', 'Hungarian and Turkish capitals'], ['ą ę į ų', 'Ogonek descenders'], ['ģ ķ ļ ņ', 'Latvian comma below'], ['ŵ ŷ ẅ', 'Welsh']],
  Cyrillic: [['и\u0306', 'й typed as и + breve'], ['е\u0308', 'ё typed as е + diaeresis'], ['Ё Й Ї Ў', 'Capitals with marks'], ['а\u0301 О\u0301', 'Stress marks'], ['Ѓ Ќ', 'Macedonian capitals'], ['щ ц д', 'Descenders'], ['ә ғ қ ң ө ұ ү һ', 'Kazakh letters']],
  Greek: [['α\u0301', 'ά typed as α + tonos'], ['ι\u0308\u0301', 'ΐ typed as ι + ¨ + ´'], ['Ά Έ Ή Ώ', 'Capitals with tonos'], ['Ϊ Ϋ ΐ ΰ', 'Dialytika'], ['ς ζ ξ', 'Descenders']],
  Thai: [['กี้', 'Upper vowel + tone'], ['ปิ่น', 'Tall consonant + vowel + tone'], ['ฟื้น', 'Tall consonant + sara uee + tone'], ['ฝั่ง', 'Mai han-akat + tone'], ['ป่ ฬ้', 'Tone beside ascender'], ['ญุ ฐู ฎุ', 'Lower vowels under descenders'], ['น้ำ ซ่ำ', 'Tone + sara am'], ['ก็ ปั้', 'Mai taikhu, stacked'], ['ฤๅ', 'Ru + lakkhangyao']],
  Armenian: [['և', 'Ech-yiwn ligature'], ['Ճ Փ Ֆ', 'Wide capitals'], ['ք փ ֆ', 'Ascender + descender'], ['ինչո՞ւ', 'Question mark inside a word'], ['֏9 900', 'Dram sign with digits']],
  Georgian: [['ჰ ჶ ჷ', 'Tall letters'], ['ფ ქ ღ', 'Ascenders and descenders'], ['Ჰ Ჶ', 'Mtavruli capitals'], ['₾49', 'Lari sign with digits']]
};
const REFS = { Latin: "'Noto Sans Mono'", Cyrillic: "'Noto Sans Mono'", Greek: "'Noto Sans Mono'", Thai: "'Noto Sans Thai'", Armenian: "'Noto Sans Armenian'", Georgian: "'Noto Sans Georgian'" };
const isMark = c => /[\p{Mn}\p{Me}]/u.test(c);
const CLUSTERS = Object.entries(CL).map(([script, list]) => ({ script, ref: REFS[script], items: list.map(([t, name], i) => ({ id: script + i, t, name, cells: [...t].filter(c => !isMark(c)).length, cp: [...t].find(c => c !== ' ' && !isMark(c)).codePointAt(0) })) }));

function parseFont(buf) {
  const v = new DataView(buf), n = v.getUint16(4), T = {};
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; T[String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3))] = v.getUint32(o + 8); }
  const cm = T.cmap, nt = v.getUint16(cm + 2); let b4 = 0, b12 = 0;
  for (let i = 0; i < nt; i++) { const off = cm + v.getUint32(cm + 8 + i * 8), f = v.getUint16(off); if (f === 12) b12 = off; if (f === 4 && !b4) b4 = off; }
  const set = new Set();
  if (b12) { const ng = v.getUint32(b12 + 12); for (let i = 0; i < ng; i++) { const s = v.getUint32(b12 + 16 + i * 12), e = v.getUint32(b12 + 20 + i * 12); for (let c = s; c <= e; c++) set.add(c); } }
  else if (b4) { const sx = v.getUint16(b4 + 6), E = b4 + 14, S = E + sx + 2, D = S + sx, R = D + sx;
    for (let i = 0; i < sx / 2; i++) { const e = v.getUint16(E + i * 2), s = v.getUint16(S + i * 2), r = v.getUint16(R + i * 2); if (s === 0xFFFF) continue;
      for (let c = s; c <= e; c++) { const g = r ? v.getUint16(R + i * 2 + r + (c - s) * 2) : 1; if (g) set.add(c); } } }
  const os = T['OS/2'], hh = T.hhea;
  return { set, upm: v.getUint16(T.head + 18), winA: v.getUint16(os + 74), winD: v.getUint16(os + 76), hA: v.getInt16(hh + 4), hD: v.getInt16(hh + 6), hGap: v.getInt16(hh + 8), typoA: v.getInt16(os + 68), typoD: v.getInt16(os + 70), typoGap: v.getInt16(os + 72), useTypo: !!(v.getUint16(os + 62) & 128) };
}
function parseRange(s) {
  return s.split(',').map(p => p.trim().replace(/^U\+/i, '')).filter(Boolean).map(p => {
    if (p.includes('?')) return [parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)];
    const [a, b] = p.split('-'); return [parseInt(a, 16), parseInt(b || a, 16)];
  });
}
function parseCSS(text) {
  const out = []; const re = /@font-face\s*\{([^}]*)\}/g; let m;
  while ((m = re.exec(text))) {
    const b = m[1], fam = (b.match(/font-family:\s*["']([^"']+)/) || [])[1], file = (b.match(/url\(["']?\.?\/?([^"')?]+\.ttf)/) || [])[1];
    if (!fam || !file) continue;
    const ur = (b.match(/unicode-range:\s*([^;}]+)/) || [])[1];
    out.push({ family: fam, weight: ((b.match(/font-weight:\s*([\d ]+)/) || [])[1] || '400').trim(), style: ((b.match(/font-style:\s*(\w+)/) || [])[1] || 'normal'), file, ranges: ur ? parseRange(ur) : null, order: out.length });
  }
  return out;
}
const cpLabel = c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
window.CCV = { LANGS, CLUSTERS, parseFont, parseCSS, cpLabel, isMark };
})();
