// 例句與記憶法 and 檢查我的句子 (Jay 11-10, the family's AI). The cards are
// made once for the whole list by Orbit-Core's builder (builders/ai.js
// wordsCards) and kept at /data/words/cards/<letter>.json: { cards: { word:
// { ex: [{ en, zh }], hook, confuse: [word] } } }. Only words in the list,
// examples that hold the word, a hook only where one truly helps.

export const letterOf = w => (/^[a-z]/i.test(w) ? w[0].toLowerCase() : '_');
export const cardsPath = w => `words/cards/${letterOf(w)}.json`;

const squash = s => String(s || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();

// A word's card from its letter's file; null when none. The examples drop
// one that's the sheet's own (Tatoeba's) sentence again; mix-ups only words
// in the list (`known`: key → word), never the word itself.
export function cardOf(doc, word, { own = '', known = null } = {}) {
  const cards = doc?.cards;
  if (!cards || !word) return null;
  const c = cards[word] || cards[String(word).toLowerCase()];
  if (!c || typeof c !== 'object') return null;
  const mine = squash(own);
  const ex = (Array.isArray(c.ex) ? c.ex : []).filter(e => e && typeof e.en === 'string' && e.en.trim() && squash(e.en) !== mine).slice(0, 2);
  const hook = typeof c.hook === 'string' ? c.hook.trim() : '';
  const self = String(word).toLowerCase();
  const confuse = (Array.isArray(c.confuse) ? c.confuse : []).map(x => String(x || '').toLowerCase().trim()).filter(k => k && k !== self && (!known || known.has(k)));
  if (!ex.length && !hook && !confuse.length) return null;
  return { ex, hook, confuse };
}

// The corrected sentence, word by word, each part marked when it isn't in
// what was written (a longest common run of words, case and stops aside).
export function wordDiff(said, fixed) {
  const a = String(said || '').split(/\s+/).filter(Boolean);
  const b = String(fixed || '').split(/\s+/).filter(Boolean);
  const norm = w => w.toLowerCase().replace(/[^a-z0-9']/g, '');
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = norm(a[i]) === norm(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (j < m) {
    if (i < n && norm(a[i]) === norm(b[j])) (out.push({ text: b[j], changed: false }), i++, j++);
    else if (i < n && L[i + 1][j] >= L[i][j + 1]) i++;
    else out.push({ text: b[j++], changed: true });
  }
  return out;
}

// 拍一頁變單字卡: the words the AI read off a page, as the list's own
// (`byKey`: key → word; `forms`: a form's key → its word's key, data/more.json),
// in the page's order, once each; and how many it read that the list hasn't.
export function pageWords(words, byKey, forms = new Map()) {
  const seen = new Set();
  const found = [];
  let other = 0;
  for (const raw of words || []) {
    const k = String(raw || '').toLowerCase().replace(/’/g, "'").trim();
    const key = byKey.has(k) ? k : forms.get(k);
    if (!key || !byKey.has(key)) {
      if (k) other++;
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(byKey.get(key));
  }
  return { found, other };
}
