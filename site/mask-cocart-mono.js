// CoCart Mono — key masking.
// Adds a mask glyph and invisible twins to the glyph set, then appends backtrack-only chained substitutions to
// GSUB so API keys draw as dots on screen while the text itself (file, clipboard, history) is untouched.
//   1. Words. A context word (token, consumer_secret, AUTH_KEY …) that doesn't start mid-word swaps its last
//      letter for a twin with the same drawing.
//   2. Notes. A key prefix (ck_, sk_live_, glpat- …), a separator after a marked word (=, ": ", ', ' …) or a
//      full context (Bearer , --token ) swaps its last character for a twin: the note.
//   3. Masks. The four characters after a note stay readable, so keys can be told apart. A character becomes
//      the mask if there's a note and four key characters behind it, or a mask right behind it. After a quote
//      note, everything up to the closing quote is masked; otherwise a mask ends at the first character a key
//      can't contain. Nothing looks ahead, so a character is final the moment it's drawn.
//   Restraint: no prefix or word inside a word (stock_ is not ck_, mytoken= is not token=); after a context,
//   a window that reads like a word (string, null, process) or a template (${, {{, <%) is left alone.
// Usage: CCMask.addGlyphs(G); build with extras: CCMask.extras(); sfnt = CCMask.apply(sfnt, gid, { feature: 'ss02' | 'ccmp' })
(function () {
  const PREFIXES = {
    'Commerce': {
      'WooCommerce': ['ck_', 'cs_'],
      'Stripe': ['sk_live_', 'sk_test_', 'rk_live_', 'rk_test_', 'whsec_'],
      'PayPal & Braintree': ['A21AA', 'access_token$production$', 'access_token$sandbox$'],
      'Square': ['sq0atp-', 'sq0csp-', 'EAAA'],
      'Shopify': ['shpat_', 'shpss_', 'shpca_', 'shppa_'],
      'Paddle': ['pdl_live_apikey_', 'pdl_sdbx_apikey_'],
      'Flutterwave': ['FLWSECK-', 'FLWSECK_TEST-'],
      'Mercado Pago': ['APP_USR-'],
      'Plaid': ['access-production-', 'access-development-', 'access-sandbox-'],
      'EasyPost': ['EZAK', 'EZTK'],
      'Shippo': ['shippo_live_', 'shippo_test_'],
      'Bitcoin (BIP 32)': ['xprv', 'tprv'],
    },
    'Code & CI': {
      'GitHub': ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_'],
      'GitLab': ['glpat-', 'gloas-', 'gldt-', 'glrt-', 'glcbt-', 'glptt-', 'glft-', 'glimt-', 'glagent-', 'glwt-', 'glsoat-', 'glffct-'],
      'Bitbucket': ['ATBB'],
      'Atlassian': ['ATATT', 'ATCTT'],
      'Linear': ['lin_api_', 'lin_oauth_'],
      'Postman': ['PMAK-'],
      'CircleCI': ['CCIPAT_', 'CCIPRJ_'],
      'Buildkite': ['bkua_'],
      'SonarQube': ['squ_', 'sqa_', 'sqp_'],
      'Figma': ['figd_'],
      'Docker': ['dckr_pat_', 'dckr_oat_'],
      'npm': ['npm_'],
      'PyPI': ['pypi-'],
      'RubyGems': ['rubygems_'],
    },
    'Cloud': {
      'AWS': ['AKIA', 'ASIA', 'ABIA', 'ACCA'],
      'Google': ['AIza', 'ya29.', 'GOCSPX-'],
      'Vercel': ['vck_', 'vcp_', 'vca_', 'vcr_'],
      'DigitalOcean': ['dop_v1_', 'doo_v1_', 'dor_v1_'],
      'Supabase': ['sb_secret_', 'sbp_'],
      'Databricks': ['dapi'],
      'Heroku': ['HRKU-'],
      'PlanetScale': ['pscale_tkn_', 'pscale_pw_', 'pscale_oauth_'],
      'Netlify': ['nfp_'],
      'Fly.io': ['fm2_'],
      'Alibaba Cloud': ['LTAI'],
      'HashiCorp Vault': ['hvs.', 'hvb.', 'hvr.'],
      'Pulumi': ['pul-'],
      'Doppler': ['dp.st.', 'dp.pt.', 'dp.ct.', 'dp.sa.', 'dp.scim.', 'dp.audit.'],
      '1Password': ['ops_'],
    },
    'AI': {
      'Anthropic': ['sk-ant-'],
      'OpenAI': ['sk-proj-', 'sk-svcacct-', 'sk-admin-'],
      'Hugging Face': ['hf_'],
      'Replicate': ['r8_'],
      'Perplexity': ['pplx-'],
      'Groq': ['gsk_'],
      'xAI': ['xai-'],
      'OpenRouter': ['sk-or-v1-'],
      'NVIDIA': ['nvapi-'],
      'Tavily': ['tvly-'],
      'LangSmith': ['lsv2_pt_', 'lsv2_sk_'],
      'Langfuse': ['sk-lf-'],
      'Pinecone': ['pcsk_'],
      'Sourcegraph': ['sgp_'],
      'Cerebras': ['csk-'],
    },
    'Messaging & data': {
      'Slack': ['xoxb-', 'xoxp-', 'xoxa-', 'xoxr-', 'xoxs-', 'xoxe-', 'xoxe.xoxp-', 'xoxe.xoxb-', 'xapp-', 'hooks.slack.com/services/'],
      'Discord': ['discord.com/api/webhooks/', 'discordapp.com/api/webhooks/'],
      'SendGrid': ['SG.'],
      'Sentry': ['sntrys_', 'sntryu_'],
      'Grafana': ['glsa_', 'glc_'],
      'New Relic': ['NRAK-', 'NRII-'],
      'PostHog': ['phx_'],
      'HubSpot': ['pat-na1-', 'pat-eu1-'],
      'Contentful': ['CFPAT-'],
      'Typeform': ['tfp_'],
      'Notion': ['ntn_'],
    },
    'Standards': {
      'JSON Web Token': ['eyJ'],
      'age': ['AGE-SECRET-KEY-1'],
      'PEM': ['PRIVATE KEY-----', 'LS0tLS1CRUdJTi'],
      'OpenSSH': ['b3BlbnNzaC1rZXktdjE'],
    },
  };
  // context words, any case; a word may follow _ - . or a space, never a letter or digit
  const WORDS = ['token', 'secret', 'password', 'passwd', 'pwd', 'passphrase', 'api_key', 'apikey', 'api-key', 'apisecret', 'apitoken',
    'access_key', 'accesskey', 'access-key', 'accesstoken', 'authtoken', 'refreshtoken', 'sessiontoken', 'secret_key', 'secretkey', 'secret-key',
    'private_key', 'privatekey', 'private-key', 'clientsecret', 'consumer_key', 'consumerkey', 'consumer-key', 'consumersecret', 'webhooksecret', 'signingsecret',
    'account_key', 'accountkey', 'sharedaccesskey', 'encryption_key', 'master_key', 'license_key', 'licence_key',
    'auth_key', 'logged_in_key', 'nonce_key', 'auth_salt', 'logged_in_salt', 'nonce_salt'];
  // what can follow a context word before the secret: env, INI, YAML, JSON, PHP / wp-config, JS, Python, Go
  const SEPS = ['=', '="', "='", ' = ', ' = "', " = '", ': ', ': "', ": '", ':"', '": "', '":"', "': '", "':'", '" => "', "' => '", "', '", '", "', '"] = "', "'] = '", ' := "'];
  const FULL = ['--token ', '--api-key ', '--password ', '--secret ', '--auth-token ', '--access-token ', 'bearer ', 'authorization: basic ', 'authorization: bot ', 'authorization: token ', 'authorization: ssws '];
  const WEAK = ['=', ' ', '"', "'"], TEMPLATE = ['$', '{', '<', '%'];
  const WINDOW = 4;
  const hex = c => 'u' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  const ALL_PREFIXES = Object.values(PREFIXES).flatMap(o => Object.values(o).flat());
  const STRONG = [...new Set(ALL_PREFIXES.map(p => p.at(-1)))];
  if (STRONG.some(c => WEAK.includes(c))) throw new Error('a prefix ends in a context separator');
  const NOTE_CH = [...STRONG, ...WEAK];
  const WORD_CH = [...new Set(WORDS.map(w => w.at(-1)).flatMap(c => [c, c.toUpperCase()]))];
  const noteName = c => 'key.n.' + hex(c), wordName = c => 'key.w.' + hex(c);
  const MASKS = ['key.mask', 'key.mask.dq', 'key.mask.sq'];
  const range = (a, b) => Array.from({ length: b.charCodeAt(0) - a.charCodeAt(0) + 1 }, (_, i) => String.fromCharCode(a.charCodeAt(0) + i));
  const LOWER = range('a', 'z'), UPPER = range('A', 'Z'), DIGIT = range('0', '9');
  const ALNUM = [...LOWER, ...UPPER, ...DIGIT], BODY = [...ALNUM, '_', '-', '.', '+', '/', '=', '~'];
  const PRINT = range('!', '~'), WIDE_DQ = PRINT.filter(c => c !== '"'), WIDE_SQ = PRINT.filter(c => c !== "'");

  function addGlyphs(G) {
    const R0 = 92, K = 0.55, N = 32; // radius R0 + K·stroke: 232 units across at Light, 254 at Regular, 294 at Bold
    const mask = { s: '', dots: [], wf: 1, upright: true, fill: [Array.from({ length: N }, (_, i) => { const a = 2 * Math.PI * i / N; return [300 + R0 * Math.cos(a), -255 + R0 * Math.sin(a), K * Math.cos(a), K * Math.sin(a)]; })] };
    MASKS.forEach(m => G[m] = mask);
    const tw = (name, c) => { G[name] = G[c]; if (G[c + '.it']) G[name + '.it'] = G[c + '.it']; };
    NOTE_CH.forEach(c => tw(noteName(c), c)); WORD_CH.forEach(c => tw(wordName(c), c));
    return G;
  }
  const extras = () => [...MASKS, ...NOTE_CH.map(noteName), ...WORD_CH.map(wordName)];

  // ---- bytes
  const u16 = (a, v) => { a.push((v >> 8) & 255, v & 255); return a; };
  const cov = gs => { const g = [...new Set(gs.filter(x => x !== undefined && x >= 0))].sort((a, b) => a - b); const a = u16(u16([], 1), g.length); g.forEach(x => u16(a, x)); return a; };
  function singleSub(pairs) { pairs = pairs.filter(([a, b]) => a !== undefined && b !== undefined).sort((x, y) => x[0] - y[0]);
    const a = u16(u16(u16([], 2), 6 + 2 * pairs.length), pairs.length); pairs.forEach(([, t]) => u16(a, t)); return a.concat(cov(pairs.map(p => p[0]))); }
  function lookup(type, subs) { const a = u16(u16(u16([], type), 0), subs.length); let o = 6 + 2 * subs.length; subs.forEach(s => { u16(a, o); o += s.length; }); subs.forEach(s => a.push(...s)); if (o > 65535) throw new Error('lookup too large'); return a; }
  // chain-context format 3 subtables sharing one coverage pool at the end of the lookup
  function chainLookup(rules) {
    const n = rules.length, hdr = 6 + 2 * n, size = r => 10 + 2 * r.bt.length + 2 * r.inp.length + 4 * r.recs.length;
    const starts = []; let o = hdr; rules.forEach(r => { starts.push(o); o += size(r); });
    const pool = [], at = new Map(), poolStart = o;
    const ref = gs => { const c = cov(gs), k = c.join(','); if (!at.has(k)) { at.set(k, pool.length); pool.push(...c); } return poolStart + at.get(k); };
    const a = u16(u16(u16([], 6), 0), n); starts.forEach(s => u16(a, s));
    rules.forEach((r, i) => { const s = starts[i], off = gs => { const v = ref(gs) - s; if (v > 65535) throw new Error('coverage offset overflow'); return v; };
      u16(a, 3); u16(a, r.bt.length); r.bt.forEach(g => u16(a, off(g))); u16(a, r.inp.length); r.inp.forEach(g => u16(a, off(g))); u16(a, 0);
      u16(a, r.recs.length); r.recs.forEach(([q, l]) => { u16(a, q); u16(a, l); }); });
    a.push(...pool); if (a.length > 65535) throw new Error('chain lookup too large'); return a;
  }

  function rules(gid, base) {
    const g = c => gid[c], nT = c => gid[noteName(c)], wT = c => gid[wordName(c)], zd = gid['zero.dot'];
    const withZero = cs => cs.map(g).concat(cs.includes('0') && zd !== undefined ? [zd] : []);
    const body = withZero(BODY), wdq = withZero(WIDE_DQ), wsq = withZero(WIDE_SQ), wide = withZero(PRINT), lower = LOWER.map(g);
    const notes = NOTE_CH.map(nT), words = WORD_CH.map(wT), twins = [...notes, ...words];
    const weakN = WEAK.map(nT), dqN = [nT('"')], sqN = [nT("'")], plainN = [...STRONG, '=', ' '].map(nT);
    const exact = c => [g(c), nT(c), wT(c), c === '0' ? zd : undefined];
    const anyCase = c => [...new Set([c, c.toLowerCase(), c.toUpperCase()])].flatMap(exact);
    const [Nn, Nw, Nm, Nd, Ns] = [0, 1, 2, 3, 4].map(i => base + i);
    const byLen = a => a.slice().sort((x, y) => [...y[0]].length - [...x[0]].length);
    const pat = (p, cls, sub, boundary) => { const cs = [...p], bt = cs.slice(0, -1).reverse().map(cls), inp = [cls(cs.at(-1))];
      return [...(boundary ? [{ bt: [...bt, boundary], inp, recs: [] }] : []), { bt, inp, recs: [[0, sub]] }]; };
    const alnum = ALNUM.map(g), alnumU = [...alnum, g('_')];
    const wordRules = byLen(WORDS.map(w => [w])).flatMap(([w]) => pat(w, anyCase, Nw, alnum));
    const noteRules = byLen([...ALL_PREFIXES.map(p => [p, 'p']), ...FULL.map(p => [p, 'f']), ...SEPS.map(p => [p, 's'])]).flatMap(([p, k]) =>
      k === 'p' ? pat(p, exact, Nn, alnumU) : k === 'f' ? pat(p, anyCase, Nn, alnum)
        : (() => { const cs = [...p]; return [{ bt: [...cs.slice(0, -1).reverse().map(exact), words], inp: [exact(cs.at(-1))], recs: [[0, Nn]] }]; })());
    const W = cls => Array(WINDOW).fill(cls);
    const maskRules = [
      { bt: [...W(lower), weakN], inp: [wide], recs: [] },
      { bt: [...Array(WINDOW - 1).fill(wide), TEMPLATE.map(g), weakN], inp: [wide], recs: [] },
      { bt: [...W(wdq), dqN], inp: [wdq], recs: [[0, Nd]] },
      { bt: [...W(wsq), sqN], inp: [wsq], recs: [[0, Ns]] },
      { bt: [...W(body), plainN], inp: [body], recs: [[0, Nm]] },
      { bt: [[gid['key.mask']]], inp: [[...body, ...twins]], recs: [[0, Nm]] },
      { bt: [[gid['key.mask.dq']]], inp: [[...wdq, ...twins]], recs: [[0, Nd]] },
      { bt: [[gid['key.mask.sq']]], inp: [[...wsq, ...twins]], recs: [[0, Ns]] },
    ];
    const to = (src, t) => src.filter(x => x !== undefined).map(x => [x, t]);
    const toNote = NOTE_CH.map(c => [g(c), nT(c)]);
    const toWord = WORD_CH.map(c => [g(c), wT(c)]);
    const lookups = [lookup(1, [singleSub(toNote)]), lookup(1, [singleSub(toWord)]),
      lookup(1, [singleSub(to([...new Set([...body, ...twins])], gid['key.mask']))]),
      lookup(1, [singleSub(to([...new Set([...wdq, ...twins])], gid['key.mask.dq']))]),
      lookup(1, [singleSub(to([...new Set([...wsq, ...twins])], gid['key.mask.sq']))]),
      chainLookup(wordRules), chainLookup(noteRules), chainLookup(maskRules)];
    return { lookups, feature: [base + 5, base + 6, base + 7], count: count() };
  }

  // ---- sfnt / GSUB plumbing
  function tables(sfnt) { const d = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength), T = {};
    for (let i = 0; i < d.getUint16(4); i++) { const o = 12 + 16 * i; T[String.fromCharCode(...sfnt.subarray(o, o + 4))] = sfnt.slice(d.getUint32(o + 8), d.getUint32(o + 8) + d.getUint32(o + 12)); } return T; }
  function putTable(sfnt, tag, data) {
    const dv = new DataView(sfnt.buffer, sfnt.byteOffset, sfnt.byteLength), T = Object.entries(tables(sfnt)).filter(([t]) => t !== tag).map(([t, d]) => ({ tag: t, data: d }));
    T.push({ tag, data }); T.sort((a, b) => a.tag < b.tag ? -1 : 1);
    const n = T.length, hdr = 12 + 16 * n; let size = hdr; T.forEach(t => size += (t.data.length + 3) & ~3);
    const out = new Uint8Array(size), w = new DataView(out.buffer);
    w.setUint32(0, dv.getUint32(0)); w.setUint16(4, n); let es = 0; while ((1 << (es + 1)) <= n) es++;
    w.setUint16(6, 16 * (1 << es)); w.setUint16(8, es); w.setUint16(10, 16 * n - 16 * (1 << es));
    const sum = b => { let s = 0; for (let i = 0; i < b.length; i += 4) s = (s + (((b[i] << 24) | ((b[i + 1] || 0) << 16) | ((b[i + 2] || 0) << 8) | (b[i + 3] || 0)) >>> 0)) >>> 0; return s; };
    let off = hdr, headOff = -1;
    T.forEach((t, i) => { const r = 12 + 16 * i; for (let k = 0; k < 4; k++) out[r + k] = t.tag.charCodeAt(k);
      if (t.tag === 'head') { headOff = off; t.data = t.data.slice(); new DataView(t.data.buffer).setUint32(8, 0); }
      w.setUint32(r + 4, sum(t.data)); w.setUint32(r + 8, off); w.setUint32(r + 12, t.data.length); out.set(t.data, off); off += (t.data.length + 3) & ~3; });
    if (headOff >= 0) w.setUint32(headOff + 8, (0xB1B0AFBA - sum(out)) >>> 0);
    return out;
  }
  function parseGSUB(b) {
    if (!b) return { scripts: [{ tag: 'DFLT', def: { req: 0xFFFF, f: [] }, langs: [] }], feats: [], offs: [], blob: [] };
    const d = new DataView(b.buffer, b.byteOffset, b.byteLength), u = o => d.getUint16(o), tag = o => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
    const SL = u(4), FL = u(6), LL = u(8), ls = o => ({ req: u(o + 2), f: Array.from({ length: u(o + 4) }, (_, k) => u(o + 6 + 2 * k)) });
    const scripts = Array.from({ length: u(SL) }, (_, i) => { const r = SL + 2 + 6 * i, so = SL + u(r + 4);
      return { tag: tag(r), def: u(so) ? ls(so + u(so)) : null, langs: Array.from({ length: u(so + 2) }, (_, k) => { const lr = so + 4 + 6 * k; return { tag: tag(lr), ls: ls(so + u(lr + 4)) }; }) }; });
    const feats = Array.from({ length: u(FL) }, (_, i) => { const r = FL + 2 + 6 * i, fo = FL + u(r + 4); return { tag: tag(r), l: Array.from({ length: u(fo + 2) }, (_, k) => u(fo + 4 + 2 * k)) }; });
    const n = u(LL), offs = Array.from({ length: n }, (_, k) => u(LL + 2 + 2 * k));
    return { scripts, feats, offs, blob: Array.from(b.subarray(LL + 2 + 2 * n)) };
  }
  function writeGSUB({ scripts, feats, offs, blob }, added) {
    const SL = [], FL = [], LL = [];
    u16(SL, scripts.length); let so = 2 + 6 * scripts.length; const sb = scripts.map(s => { const a = [], all = [s.def, ...s.langs.map(l => l.ls)].filter(Boolean);
      const lsb = x => { const q = u16(u16(u16([], 0), x.req), x.f.length); x.f.forEach(f => u16(q, f)); return q; };
      const head = 4 + 6 * s.langs.length; let o = head; const parts = [];
      u16(a, s.def ? o : 0); if (s.def) { const p = lsb(s.def); parts.push(p); o += p.length; }
      u16(a, s.langs.length); s.langs.forEach(l => { a.push(...[...l.tag].map(c => c.charCodeAt(0))); u16(a, o); const p = lsb(l.ls); parts.push(p); o += p.length; });
      parts.forEach(p => a.push(...p)); return a; });
    scripts.forEach((s, i) => { SL.push(...[...s.tag].map(c => c.charCodeAt(0))); u16(SL, so); so += sb[i].length; }); sb.forEach(x => SL.push(...x));
    u16(FL, feats.length); let fo = 2 + 6 * feats.length; const fb = feats.map(f => { const a = u16(u16([], 0), f.l.length); f.l.forEach(x => u16(a, x)); return a; });
    feats.forEach((f, i) => { FL.push(...[...f.tag].map(c => c.charCodeAt(0))); u16(FL, fo); fo += fb[i].length; }); fb.forEach(x => FL.push(...x));
    const n = offs.length + added.length, shift = 2 * added.length; u16(LL, n); offs.forEach(o => u16(LL, o + shift));
    let lo = 2 + 2 * n + blob.length; added.forEach(l => { if (lo > 65535) throw new Error('lookup list offset overflow'); u16(LL, lo); lo += l.length; });
    LL.push(...blob); added.forEach(l => LL.push(...l));
    const hdr = u16(u16(u16(u16(u16([], 1), 0), 10), 10 + SL.length), 10 + SL.length + FL.length);
    return Uint8Array.from([...hdr, ...SL, ...FL, ...LL]);
  }
  function apply(sfnt, gid, { feature = 'ss02' } = {}) {
    const g = parseGSUB(tables(sfnt).GSUB), R = rules(gid, g.offs.length);
    const feats = g.feats.map((f, i) => ({ ...f, old: i }));
    let fresh = null;
    if (feature === 'ccmp' && feats.some(f => f.tag === 'ccmp')) feats.filter(f => f.tag === 'ccmp').forEach(f => f.l.push(...R.feature));
    else { fresh = { tag: feature, l: R.feature, old: -1 }; feats.push(fresh); }
    feats.sort((a, b) => a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0);
    const map = {}; feats.forEach((f, i) => { if (f.old >= 0) map[f.old] = i; });
    const fix = x => { x.f = x.f.map(i => map[i]); if (x.req !== 0xFFFF) x.req = map[x.req]; if (fresh) x.f.push(feats.indexOf(fresh)); };
    g.scripts.forEach(s => { if (s.def) fix(s.def); s.langs.forEach(l => fix(l.ls)); });
    g.feats = feats.map(({ tag, l }) => ({ tag, l }));
    const out = putTable(sfnt, 'GSUB', writeGSUB(g, R.lookups)); out.maskCount = R.count; return out;
  }
  const count = () => ({ prefixes: ALL_PREFIXES.length, issuers: Object.values(PREFIXES).reduce((a, o) => a + Object.keys(o).length, 0), contexts: WORDS.length * SEPS.length + FULL.length, words: WORDS.length });
  const api = { addGlyphs, extras, apply, PREFIXES, WORDS, SEPS, FULL, WINDOW, count };
  (typeof window !== 'undefined' ? window : globalThis).CCMask = api;
})();
