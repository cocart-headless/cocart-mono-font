// CoCart Mono review-sheet data, shared by the web sheet and the fillable PDFs. Needs window.CCV (cocart-mono-validate.js). window.CCReview.get(id) → { all } or { sheet, one, example }
(function () {
if (window.CCReview) return;
function get(id) {
    const rg = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const isMark = cp => (cp >= 0xE31 && cp <= 0xE3A && cp !== 0xE32 && cp !== 0xE33) || (cp >= 0xE47 && cp <= 0xE4E) || (cp >= 0x300 && cp <= 0x36F);
    const cells = cps => cps.map(cp => ({ ch: (isMark(cp) ? '\u25CC' : '') + String.fromCodePoint(cp), cp: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0') }));
    const sizes = [{ label: '9 pt', size: '9pt' }, { label: '12 pt', size: '12pt' }, { label: '18 pt', size: '18pt' }, { label: '28 pt', size: '28pt' }];
    const S = [
      { key: 'Thai', name: 'Thai · ไทย', range: 'U+0E01–0E5B', cps: [...rg(0xE01, 0xE3A), ...rg(0xE3F, 0xE5B)],
        pairs: [['ถ ภ', 'ถนน ภาษี'], ['ข ช ซ', 'ขาย ชา ซื้อ'], ['บ ป', 'บาท ปลา'], ['ด ต', 'ดี ตา'], ['ผ ฝ', 'ผ้า ฝน'], ['พ ฟ', 'พัสดุ ฟรี'], ['ฎ ฏ', 'กฎ ปฏิทิน'], ['ค ด ศ', 'คืน ดู ศูนย์'], ['ย บ', 'ยอด บิล'], ['ล ส', 'ลด ส่ง'], ['ม น', 'มี นำ'], ['อ ฮ', 'ออก ฮา']],
        phrases: 'ราคา ฿1,290 · ส่งฟรีเมื่อซื้อครบ ฿500\nหยิบใส่ตะกร้า · ยอดรวม ฿2,450.00 · รหัสคูปอง CC-2026\nชำระเงิน · ที่อยู่จัดส่ง · สั่งซื้อสำเร็จ\nปิ่น ฟื้น ปั่น น้ำ กี้ ญุ ฐู ฎุ ฤดู',
        questions: ['Do tone marks and upper vowels sit at the right height, especially when stacked (กี้, ปิ่น)?', 'Do ป ฝ ฟ ฬ leave enough room for the marks above them?', 'Are the loops readable at 12 pt, or do they fill in?'] },
      { key: 'Armenian', name: 'Armenian · Հայերեն', range: 'U+0531–058F', cps: [...rg(0x531, 0x556), ...rg(0x559, 0x58A), 0x58F],
        pairs: [['հ ց ճ', 'հաշիվ ցուցակ ճաշ'], ['Հ Ց Ճ', 'ՀԱՅ ՑՈՒՑԱԿ ՃԱՇ'], ['ո ռ', 'ոսկի ռուբլի'], ['ա ս', 'ապրանք սակագին'], ['դ ղ', 'դրամ ղեկ'], ['ե է', 'երկու էջ'], ['պ փ', 'պատվեր փոխանակում'], ['զ ք', 'զեղչ քարտ'], ['Ա Ը', 'ԱՆՎՃԱՐ ԸՆԴԱՄԵՆԸ']],
        phrases: 'Ավելացնել զամբյուղ · Անվճար առաքում\nԳին ֏9 900 · Ընդամենը ֏24 500\nՊատվերը հաստատված է · Զեղչ 30%\nԱՌԱՔՈՒՄ · ԶԱՄԲՅՈՒՂ · և',
        questions: ['Which capitals or lowercase letters look like a different letter?', 'Does the և ligature look right, and does ֏ read as the dram sign?', 'Is anything too narrow or crowded for the monospaced cell?'] },
      { key: 'Georgian', name: 'Georgian · ქართული', range: 'U+10D0–10FF · U+1C90–1CBF', cps: [...rg(0x10D0, 0x10FF), ...rg(0x1C90, 0x1CBA), ...rg(0x1CBD, 0x1CBF)],
        pairs: [['ვ კ ჳ', 'ვალი კალათა'], ['დ ღ', 'დღე ღირს'], ['ძ ჭ', 'ძველი ჭიქა'], ['თ ო', 'თანხა ორი'], ['ბ შ', 'ბარათი შეკვეთა'], ['ე ჟ', 'ერთი ჟურნალი'], ['ნ წ', 'ნივთი წლის'], ['ყ ც', 'ყიდვა ცალი']],
        phrases: 'კალათაში დამატება · უფასო მიწოდება\nფასი ₾49 · სულ ₾124.50\nშეკვეთა დადასტურებულია · ფასდაკლება 30%\nᲙᲐᲚᲐᲗᲐ · ᲤᲐᲡᲓᲐᲙᲚᲔᲑᲐ',
        questions: ['Which Mkhedruli letters look wrong or like another letter?', 'Do the Mtavruli capitals (last row of the grid) read naturally in ALL-CAPS text?', 'Are the archaic letters (ჱ–ჵ) acceptable, or should they be redrawn?'] },
      { key: 'Cyrillic', name: 'Cyrillic · Кириллица', range: 'Russian · Ukrainian · Belarusian · Bulgarian · Serbian · Macedonian · Kazakh', cps: [...rg(0x401, 0x40C), 0x40E, 0x40F, ...rg(0x410, 0x44F), ...rg(0x451, 0x45C), 0x45E, 0x45F, 0x490, 0x491, 0x492, 0x493, 0x49A, 0x49B, 0x4A2, 0x4A3, 0x4AE, 0x4AF, 0x4B0, 0x4B1, 0x4BA, 0x4BB, 0x4D8, 0x4D9, 0x4E8, 0x4E9],
        pairs: [['ш щ', 'шапка щётка'], ['и й', 'итого йогурт'], ['ь ъ', 'день объём'], ['б в', 'был вход'], ['з э', 'заказ экран'], ['ц щ', 'цена щит'], ['Ш Щ', 'ШАГ ЩИТ'], ['і ї й', 'ціна їжа йти'], ['Е Ё', 'ЕДА ЁЛКА'], ['ү ұ у', 'үй ұл уақыт']],
        phrases: 'Добавить в корзину · Бесплатная доставка\nЦена 1 290 ₽ · Итого 24 500,00 ₽ · Заказ подтверждён\nДодати до кошика · Ціна 349 ₴ · Знижка 30%\nДодај у корпу · Цена 2.490 дин. · Добави в количката\nСебетке қосу · Бағасы 4 990 ₸ · ӘҒҚҢӨҰҮҺ',
        questions: ['Do б, д, г, л, п and т look right for your language? Bulgarian, Serbian and Macedonian readers often expect different shapes.', 'Are ш/щ, и/й and ь/ъ easy to tell apart at 12 pt?', 'Do ₽, ₴ and ₸ read correctly and sit at the right size next to numbers?'] },
      { key: 'Greek', name: 'Greek · Ελληνικά', range: 'U+0370–03FF (monotonic)', cps: [0x386, 0x388, 0x389, 0x38A, 0x38C, 0x38E, 0x38F, 0x390, ...rg(0x391, 0x3A1), ...rg(0x3A3, 0x3A9), 0x3AA, 0x3AB, ...rg(0x3AC, 0x3CE), 0x37E, 0x387],
        pairs: [['ν υ', 'νέο υπόλοιπο'], ['ι ί ϊ', 'τιμή αξία προϊόν'], ['σ ς', 'σύνολο τιμές'], ['ζ ξ', 'ζώνη ξενοδοχείο'], ['κ χ', 'καλάθι χρέωση'], ['ο σ', 'όροι σειρά'], ['Η Ν', 'ΗΜΕΡΑ ΝΕΟ'], ['ν v · ρ p', 'νέο v1 · ρυθμός p2']],
        phrases: 'Προσθήκη στο καλάθι · Δωρεάν αποστολή\nΤιμή 49,90 € · Σύνολο 124,50 €\nΗ παραγγελία επιβεβαιώθηκε · Έκπτωση 30%\nΚΑΛΑΘΙ · ΠΡΟΪΟΝΤΑ · ΑΠΟΣΤΟΛΗ',
        questions: ['Do the accents on capitals (Ά Έ Ή Ώ) sit correctly without crowding the letter before?', 'Is final ς clearly different from σ?', 'Are ν/υ and ι/ί clear at 12 pt, and do ν and ρ stay distinct from Latin v and p in codes?'] }
    ];
    const build = s => ({ ...s, count: s.cps.length, chars: cells(s.cps), hasMarks: s.cps.some(isMark), pairs: s.pairs.map(([set, words]) => ({ set, words })), sizes });
    const V = window.CCV, one = id && V.LANGS.find(l => l.id === id);
    if (!one) return { all: S.map(build) };
    const PH = {
      ru: 'Добавить в корзину · Бесплатная доставка\nЦена 1 290 ₽ · Итого 24 500,00 ₽ · Заказ подтверждён\nСкидка 30% · Оформить заказ · Адрес доставки',
      uk: 'Додати до кошика · Безкоштовна доставка\nЦіна 349 ₴ · Разом 1 249,00 ₴ · Знижка 30%\nОформити замовлення · Адреса доставки',
      sr: 'Додај у корпу · Бесплатна достава\nЦена 2.490 дин. · Укупно 12.450,00 дин.\nПоруџбина је потврђена · Попуст 30%',
      bg: 'Добави в количката · Безплатна доставка\nЦена 49,90 € · Общо 124,50 € · Отстъпка 30%',
      kk: 'Себетке қосу · Тегін жеткізу\nБағасы 4 990 ₸ · Барлығы 24 500 ₸ · Жеңілдік 30%\nӘҒҚҢӨҰҮҺ · әғқңөұүһ'
    };
    const LOC = { uz: 'uz-Latn', sr: 'sr-Cyrl', nb: 'nb-NO' };
    const CUR = { da: 'DKK', nb: 'NOK', sv: 'SEK', is: 'ISK', pl: 'PLN', cs: 'CZK', hu: 'HUF', ro: 'RON', tr: 'TRY', az: 'AZN', sq: 'ALL', cy: 'GBP', uz: 'UZS', vi: 'VND', ru: 'RUB', uk: 'UAH', be: 'BYN', sr: 'RSD', mk: 'MKD', kk: 'KZT', th: 'THB', hy: 'AMD', ka: 'GEL' };
    const intl = () => { const loc = LOC[one.id] || one.id, cur = CUR[one.id] || 'EUR'; try {
      const n = new Intl.NumberFormat(loc, { style: 'currency', currency: cur }), d = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const m = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(loc, { month: 'long' }).format(new Date(2026, i, 15))), w = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(new Date(2026, 10, 9 + i)));
      return [n.format(1290.5) + ' · ' + n.format(24500) + ' · ' + n.format(9.99), d.format(new Date(2026, 10, 11)), m.join(' · '), w.join(' · ')].join('\n'); } catch (e) { return ''; } };
    const LOOK = { 'ı': 'i', 'ł': 'l', 'đ': 'd', 'ð': 'd', 'þ': 'p', 'ß': 'B', 'ə': 'e', 'ø': 'o', 'æ': 'a', 'œ': 'o', 'ʻ': "'", 'ʼ': "'" };
    const latinPairs = () => { const G = {}; one.chars.filter(c => /\p{Ll}/u.test(c) || LOOK[c]).forEach(c => { const b = LOOK[c] || c.normalize('NFD')[0]; if (b === c) return; (G[b] = G[b] || []).push(c); });
      return Object.entries(G).flatMap(([b, v]) => { const out = []; for (let i = 0; i < v.length; i += 4) out.push([b, ...v.slice(i, i + 4)]); return out; }).map(g => { const set = g.join(' '); return [set, set.toUpperCase() === set ? set : set.toUpperCase()]; }); };
    const base = S.find(s => s.key === one.script);
    const letters = one.chars.filter(c => !/\s/.test(c)).join(' ');
    const usesIntl = !PH[one.id] && !(base && one.script !== 'Cyrillic');
    const sheet = { key: one.script, name: one.name + ' · ' + one.native, range: one.script,
      cps: one.chars.map(c => c.codePointAt(0)).filter(cp => cp > 0x20 && cp !== 0x202F),
      pairs: base ? base.pairs : latinPairs(),
      phrases: (PH[one.id] || (base && one.script !== 'Cyrillic' ? base.phrases : intl())) + (usesIntl ? '\n' + letters : ''),
      questions: (base ? base.questions : ['Do the accents sit at the right height and on the right side of each letter?', 'Does any letter look like a different letter, or like one from another language?', 'Are the quotation marks and the currency sign the ones you use?']).concat(usesIntl ? ['The prices, date, months and weekdays in section 3 come from your browser\'s own ' + one.name + ' data. Do they read naturally?'] : []) };
    const ex = one.chars.find(c => c.codePointAt(0) > 0x7F) || one.chars[0];
    return { sheet: build(sheet), one, example: 'U+' + ex.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') };
}
window.CCReview = { get };
})();
