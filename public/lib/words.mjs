// Words: the high-school English reference list (大考中心, 108 curriculum),
// levels 1 to 6, the word packs, and how Quadra Hub teaches them. Pure
// functions (no DOM), so they're tested directly.
//
// Learning is meant to be hard, because what's hard to recall is what's
// remembered ("desirable difficulty"):
//   - Every wrong option is the one most likely to be picked by mistake: a
//     word spelt almost the same (adapt / adopt / adept), one that means
//     something close (能力 / 才能), the same part of speech and shape, and
//     above all a word this person has already mixed this one up with
//     (`distractors`). Two options are never both right.
//   - Each word is asked in the hardest way it's ready for: recognising it
//     (English to meaning, meaning to English, by ear), then producing it
//     (unscrambling, filling in its missing letters, dictation) as it's
//     learnt (`smartType`).
//   - Spaced repetition with lapses (`grade`, `pickRound`): Leitner boxes,
//     due again later the better a word is known, back to the first box when
//     it's missed, and sooner every time it's forgotten again. A round leads
//     with the words missed and forgotten most, adds the words they were
//     confused with, and keeps confusable words apart in the round.
//
// A word's progress (the payload's `w`): { b box, d due day, n answers,
// r right, t last answer (ms), m mastered once, l lapses, c [keys it was
// mistaken for, latest first] }.

export const LEVELS = [1, 2, 3, 4, 5, 6];
// Themed lists (data/packs.json) that share progress with the main list's
// words and add the rest, their level the pack's id.
export const PACK_IDS = ['toeic', 'ielts', 'biz'];
// How hard a level is (a pack counts as level 5).
export const levelRank = level => (typeof level === 'number' ? level : 5);
// A word is in the chosen levels by its level, or by a pack it's in.
export const inLevels = (w, levels) => levels.includes(w.level) || Boolean(w.packs?.some(p => levels.includes(p)));
// The main list with the packs added: { pack: [[word, pos, zh], …] }.
export function addPacks(words, packs) {
  const out = words.map(w => ({ ...w }));
  const byKey = new Map(out.map(w => [w.key, w]));
  for (const id of PACK_IDS) {
    for (const [word, pos, zh] of packs?.[id] || []) {
      const key = keyOf(word);
      const had = byKey.get(key);
      if (had) had.packs = [...new Set([...(had.packs || []), id])];
      else {
        const w = { i: out.length, word, key, pos, level: id, zh, ph: '', packs: [id] };
        out.push(w);
        byKey.set(key, w);
      }
    }
  }
  return out;
}

// Days until a word in each box is asked again (box 0 is new). Box 4 and up
// is mastered: a week, then three.
export const BOX_DAYS = [0, 0, 1, 3, 7, 21];
// A new word right the first time: already known, checked again tomorrow.
export const KNOWN_BOX = 3;
export const MASTERED = 4;
// Each time a word is forgotten again (a lapse: missed after it had been
// learnt), its gaps shrink by this much more, so a word that keeps slipping
// keeps coming back.
const LAPSE_SHRINK = 0.5;
// How many mix-ups are remembered per word.
const CONFUSED_KEEP = 4;
// Which study modes a person can choose; 'smart' picks per word.
export const MODES = ['smart', 'meaning', 'word', 'listen', 'letters', 'cloze', 'spell'];
const DAY = 86_400_000;
const TPE = 8 * 3_600_000;

// A day number (days since 1970 in Taiwan), for due dates.
export const dayNum = (t = Date.now()) => Math.floor((t + TPE) / DAY);
export const keyOf = word => String(word || '').toLowerCase().replace(/’/g, "'").trim();

// The raw list ([word, pos, level, zh, phonetic]) as objects.
export function loadWords(rows) {
  return rows.map(([word, pos, level, zh, ph], i) => ({ i, word, key: keyOf(word), pos, level, zh, ph: ph || '' }));
}

export function stateOf(p) {
  if (!p || !p.b) return 'new';
  return p.b >= MASTERED ? 'mastered' : 'learning';
}

// The gap after a right answer that puts a word in box `b`, with its lapses.
export const gapDays = (b, lapses = 0) => (BOX_DAYS[b] ? Math.max(1, Math.round(BOX_DAYS[b] / (1 + LAPSE_SHRINK * lapses))) : 0);

// One answer. `chose`: the word picked instead, on a wrong answer to a
// choice. Returns the word's new progress and whether this answer mastered
// it for the first time.
export function grade(p, correct, { now = Date.now(), chose = null } = {}) {
  const was = p || { b: 0, d: 0, n: 0, r: 0, t: 0 };
  const today = dayNum(now);
  // Answered already today (a retry, a second round): no step up today.
  const again = was.n > 0 && dayNum(was.t) === today;
  const next = { ...was, n: (was.n || 0) + 1, r: (was.r || 0) + (correct ? 1 : 0), t: now };
  if (!correct) {
    next.b = 1;
    next.d = today;
    // Forgotten after it had been learnt: a lapse.
    if ((was.b || 0) >= 2) next.l = (was.l || 0) + 1;
    if (chose) next.c = [chose, ...(was.c || []).filter(k => k !== chose)].slice(0, CONFUSED_KEEP);
  } else if (!was.b && !was.n) {
    next.b = KNOWN_BOX;
    next.d = today + 1;
  } else if (again) {
    next.b = Math.max(1, was.b || 0);
    next.d = Math.max(was.d || 0, today + 1);
  } else {
    next.b = Math.min(5, (was.b || 0) + 1);
    next.d = today + gapDays(next.b, was.l || 0);
  }
  const firstMastery = next.b >= MASTERED && !was.m;
  if (firstMastery) next.m = 1;
  return { p: next, firstMastery };
}

// "Too easy": a word the person already knows, mastered and out of the way
// for two months.
export function markKnown(p, now = Date.now()) {
  const was = p || { b: 0, d: 0, n: 0, r: 0, t: 0 };
  return { ...was, b: 5, d: dayNum(now) + 60, t: now, m: 1 };
}

// ---- How a word is asked -----------------------------------------------------------
//
// By its box, from recognising to producing it: a new word by its meaning,
// the other way round or by ear; then from its letters and with letters
// missing; a known one by dictation. A word that keeps slipping (lapses)
// is asked the harder way too: recognising it isn't the problem.
export const SMART_TYPES = [
  ['meaning', 'word', 'listen'],
  ['meaning', 'word', 'listen', 'letters'],
  ['word', 'listen', 'letters', 'cloze'],
  ['listen', 'cloze', 'spell', 'word'],
  ['cloze', 'spell'],
  ['spell', 'cloze']
];
export const isLong = word => Boolean(word) && (/\s/.test(word.word) || word.word.length > 11);
// The kind for this word: of the ones that suit it, the one this round has
// asked least so far (used: { type: count }), so a round mixes them.
export function smartType(p, random = Math.random, word = null, used = {}) {
  const box = Math.min(5, (p?.b || 0) + Math.min(2, p?.l || 0));
  let kinds = SMART_TYPES[box];
  // A phrase or a long word is never unscrambled (too many tiles for a phone).
  if (isLong(word)) kinds = kinds.filter(k => k !== 'letters');
  let best = null;
  let low = Infinity;
  for (const k of kinds) {
    const score = (used[k] || 0) + random() * 0.9;
    if (score < low) (low = score), (best = k);
  }
  return best;
}

// ---- A round ---------------------------------------------------------------------------
//
// Due words first, the weakest first: the ones missed last time (box 1),
// then the ones forgotten most (lapses), then the most overdue. New words
// fill the rest, fewer when much is waiting. A word due that was mixed up
// with another brings that one along, so the two are told apart side by
// side. Then the round is ordered so words that look alike aren't asked
// one after the other (interleaved, never blocked).
export function pickRound(words, progress, { levels = LEVELS, size = 10, now = Date.now(), random = Math.random } = {}) {
  const today = dayNum(now);
  const chosen = words.filter(w => inLevels(w, levels));
  const byKey = new Map(chosen.map(w => [w.key, w]));
  const weakness = w => {
    const p = progress[w.key];
    return (p.b === 1 ? 100 : 0) + 10 * (p.l || 0) + Math.min(30, today - p.d) - p.b;
  };
  const due = chosen.filter(w => progress[w.key]?.b && progress[w.key].d <= today).sort((a, b) => weakness(b) - weakness(a) || random() - 0.5);
  // New words from every chosen level alike, the hardest first (a fixed mixed
  // order within a level), a little shuffled within the next few.
  const byLevel = [...new Set(chosen.map(w => w.level))].sort((a, b) => levelRank(b) - levelRank(a)).map(l => chosen.filter(w => w.level === l && !progress[w.key]?.b).sort((a, b) => hash(a.key) - hash(b.key)));
  const fresh = [];
  for (let i = 0; fresh.length < 60 && byLevel.some(list => i < list.length); i++) for (const list of byLevel) if (i < list.length) fresh.push(list[i]);
  const window = fresh.sort(() => random() - 0.5);
  // New words: 40% of a round, 20% when more than two rounds are due.
  const newShare = due.length > size * 2 ? 0.2 : 0.4;
  let dueCount = Math.min(due.length, window.length ? Math.round(size * (1 - newShare)) : size);
  const newCount = Math.min(window.length, size - dueCount);
  dueCount = Math.min(due.length, size - newCount);
  const round = due.slice(0, dueCount);
  const inRound = new Set(round.map(w => w.key));
  // The words they were mixed up with, in up to half the places left.
  for (const w of due.slice(0, dueCount)) {
    const other = byKey.get(progress[w.key].c?.[0]);
    if (other && !inRound.has(other.key) && round.length < dueCount + Math.floor((size - dueCount) / 2)) {
      round.push(other);
      inRound.add(other.key);
    }
  }
  for (const w of window) if (round.length < dueCount + newCount && !inRound.has(w.key)) (round.push(w), inRound.add(w.key));
  return spread(round.sort(() => random() - 0.5));
}
// Reorders a list so no two neighbours look alike, where it can: each next
// word is one that doesn't look like the one before, the ones with the most
// look-alikes still left first (so they aren't all that's left at the end).
const ALIKE = 0.6;
function spread(list) {
  const left = [...list];
  const out = [];
  while (left.length) {
    const alikeLeft = w => left.filter(x => x !== w && lookAlike(x.key, w.key) >= ALIKE).length;
    let best = 0;
    let most = -1;
    left.forEach((w, i) => {
      if (out.length && lookAlike(out.at(-1).key, w.key) >= ALIKE) return;
      const n = alikeLeft(w);
      if (n > most) (most = n), (best = i);
    });
    out.push(...left.splice(best, 1));
  }
  return out;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---- The wrong options ----------------------------------------------------------------
//
// How alike two spellings are, 0 to 1: the edit distance against the
// longer one, more for a shared start and end and the same length.
export function editDistance(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}
const shared = (a, b, from) => {
  let n = 0;
  while (n < a.length && n < b.length && (from ? a[n] === b[n] : a[a.length - 1 - n] === b[b.length - 1 - n])) n++;
  return n;
};
export function lookAlike(a, b) {
  const len = Math.max(a.length, b.length) || 1;
  const s = 1 - editDistance(a, b) / len + Math.min(4, shared(a, b, true)) * 0.06 + Math.min(4, shared(a, b, false)) * 0.04 + (Math.abs(a.length - b.length) <= 1 ? 0.08 : 0);
  return Math.max(0, Math.min(1, s));
}

// A meaning's terms: the first two lines' terms, without the part-of-speech
// marks (「a. 能幹的、能夠的」 → 能幹的, 能夠的).
const zhCache = new Map();
function zhOf(zh) {
  let hit = zhCache.get(zh);
  if (hit) return hit;
  const lines = String(zh || '').split(/\r?\n/).slice(0, 2);
  const terms = new Set(lines.flatMap(l => l.replace(/^\s*[a-z]+\.\s*/i, '').replace(/\[[^\]]*\]|\([^)]*\)|（[^）]*）/g, '').split(/[、,，;；]/)).map(x => x.trim()).filter(Boolean));
  // The characters that carry meaning: not the grammar ones every term has.
  const chars = new Set([...terms].join('').replace(/[^一-鿿]/g, '').replace(/[的地得之使被把了著者等某一]/g, ''));
  hit = { terms, chars };
  zhCache.set(zh, hit);
  return hit;
}
// Two meanings with a term in common: both would be right.
export function sameMeaning(a, b) {
  const x = zhOf(a).terms;
  for (const t of zhOf(b).terms) if (x.has(t)) return true;
  return false;
}
// How close two meanings are, 0 to 1: the meaningful characters they share.
export function meaningAlike(a, b) {
  const x = zhOf(a).chars;
  const y = zhOf(b).chars;
  if (!x.size || !y.size) return 0;
  let both = 0;
  for (const c of x) if (y.has(c)) both++;
  return both / Math.min(x.size, y.size, 4);
}
const posSet = pos => new Set(String(pos || '').split('/').map(p => p.replace(/\.$/, '').trim()).filter(Boolean));
const samePos = (a, b) => {
  const x = posSet(a);
  const y = posSet(b);
  if (!x.size || !y.size) return 0;
  if ([...x][0] === [...y][0]) return 1;
  return [...x].some(p => y.has(p)) ? 0.5 : 0;
};
// How each kind of question weighs the ways to be confused: by meaning
// when the options are meanings, by spelling when they're spellings, by
// spelling and sound when the word is only heard.
const WEIGH = {
  meaning: { look: 1.2, mean: 1.8, pos: 0.8 },
  word: { look: 2, mean: 1.1, pos: 0.8 },
  listen: { look: 2.4, mean: 0.4, pos: 0.4 }
};
// The `n` words most likely to be picked instead of `word` in a question of
// `type`: the ones this person has mixed it up with first (`confused`), then
// the best by WEIGH, the same shape (a phrase with phrases), never one that
// means the same, and no two options that would read the same.
export function distractors(word, words, n = 3, { type = 'meaning', confused = [], random = Math.random } = {}) {
  const w = WEIGH[type] || WEIGH.meaning;
  const phrase = /\s/.test(word.word);
  const mistaken = new Map(confused.map((k, i) => [k, 3 - i * 0.5]));
  const scored = [];
  for (const c of words) {
    if (c.key === word.key || !c.zh || /\s/.test(c.word) !== phrase || sameMeaning(c.zh, word.zh)) continue;
    const look = lookAlike(c.key, word.key);
    const mean = meaningAlike(c.zh, word.zh);
    const s = w.look * look + w.mean * mean + w.pos * samePos(c.pos, word.pos) + 0.2 * (c.level === word.level) + (mistaken.get(c.key) || 0) + random() * 0.15;
    scored.push([s, c]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const out = [];
  for (const [, c] of scored) {
    if (out.length >= n) break;
    const shown = type === 'meaning' ? shortMeaning(c.zh) : c.key;
    if (out.some(o => (type === 'meaning' ? shortMeaning(o.zh) === shown || sameMeaning(o.zh, c.zh) : o.key === shown))) continue;
    out.push(c);
  }
  return out;
}

// The first meaning line, short (for choices).
export function shortMeaning(zh) {
  const line = String(zh || '').split('\n')[0];
  return line.replace(/^[a-z]+\.\s*/i, '').split('、').slice(0, 3).join('、');
}

function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The letters a cloze hides: about half, never the first, more the better
// the word is known; spaces and hyphens stay. A list of indexes.
export function clozeGaps(word, box = 2, random = Math.random) {
  const open = [...word].map((ch, i) => i).filter(i => i > 0 && /[a-z]/i.test(word[i]));
  const share = Math.min(0.75, 0.4 + 0.1 * Math.max(0, box - 2));
  const n = Math.max(1, Math.round(open.length * share));
  return shuffle(open, random).slice(0, n).sort((a, b) => a - b);
}

// A question: { type, word, choices (for choice types), letters (to
// unscramble), gaps (a cloze's hidden letters), answer }.
export function makeQuestion(word, type, words, { random = Math.random, p = null } = {}) {
  const confused = p?.c || [];
  if (type === 'meaning') {
    const options = shuffle([word, ...distractors(word, words, 3, { type, confused, random })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: shortMeaning(w.zh) })), answer: word.key };
  }
  if (type === 'word' || type === 'listen') {
    const options = shuffle([word, ...distractors(word, words, 3, { type, confused, random })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: w.word })), answer: word.key };
  }
  if (type === 'letters') {
    const letters = [...word.word];
    let mixed = shuffle(letters, random);
    for (let i = 0; i < 4 && mixed.join('') === word.word && letters.length > 1; i++) mixed = shuffle(letters, random);
    return { type, word, letters: mixed, answer: word.key };
  }
  if (type === 'cloze') return { type, word, gaps: clozeGaps(word.word, p?.b || 2, random), answer: word.key };
  return { type, word, answer: word.key };
}
// A cloze as shown: the word with its gaps as underscores.
export const clozeText = (word, gaps) => [...word].map((ch, i) => (gaps.includes(i) ? '_' : ch)).join('');

// A typed answer against the word: case, curly quotes and spaces don't matter.
export const sameWord = (typed, word) => keyOf(typed).replace(/\s+/g, ' ') === keyOf(word).replace(/\s+/g, ' ');

// Where a typed answer goes wrong, letter by letter, for the feedback:
// [{ ch, ok }] over the right spelling.
export function spellDiff(typed, word) {
  const a = keyOf(typed);
  const b = String(word);
  return [...b].map((ch, i) => ({ ch, ok: a[i] === ch.toLowerCase() }));
}

// Counts per level: { 1: { total, seen, learning, mastered, due }, …, all: {…} }.
export function stats(words, progress, now = Date.now()) {
  const today = dayNum(now);
  const out = { all: { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 } };
  for (const l of [...LEVELS, ...PACK_IDS]) out[l] = { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 };
  for (const w of words) {
    const p = progress[w.key];
    for (const s of new Set([out[w.level], ...(w.packs || []).map(id => out[id]), out.all])) {
      s.total++;
      if (p?.b) {
        s.seen++;
        if (p.b >= MASTERED) s.mastered++;
        else s.learning++;
        if (p.d <= today) s.due++;
      }
    }
  }
  return out;
}
// The words that slip most: missed after being learnt, most often first.
export const hardest = (words, progress, n = 5) =>
  words.filter(w => progress[w.key]?.l > 0).sort((a, b) => progress[b.key].l - progress[a.key].l || progress[b.key].t - progress[a.key].t).slice(0, n);

// ---- Saved progress (this app's payload on the pass) ------------------------------
//
// { v: 3, w: { word: [box, due day, answers, right, last answer (s),
//   mastered once, lapses, [mistaken for]] }, levels, mode, days }
// (`days`: answers per Taiwan day, practice.mjs). The app gzips it.
export function packProgress({ progress, levels, mode, days = {} }) {
  const w = {};
  for (const [k, p] of Object.entries(progress)) {
    const row = [p.b || 0, p.d || 0, p.n || 0, p.r || 0, Math.round((p.t || 0) / 1000), p.m ? 1 : 0];
    if (p.l || p.c?.length) row.push(p.l || 0);
    if (p.c?.length) row.push(p.c);
    w[k] = row;
  }
  return { v: 3, w, levels, mode, days };
}
export function unpackProgress(obj) {
  if (obj?.v !== 3 || !obj.w) return null;
  const progress = {};
  for (const [k, a] of Object.entries(obj.w)) progress[k] = { b: a[0], d: a[1], n: a[2], r: a[3], t: a[4] * 1000, ...(a[5] ? { m: 1 } : {}), ...(a[6] ? { l: a[6] } : {}), ...(Array.isArray(a[7]) && a[7].length ? { c: a[7] } : {}) };
  return {
    progress,
    levels: Array.isArray(obj.levels) && obj.levels.length ? obj.levels.filter(l => LEVELS.includes(l) || PACK_IDS.includes(l)) : null,
    mode: MODES.includes(obj.mode) ? obj.mode : null,
    days: obj.days && typeof obj.days === 'object' ? obj.days : {}
  };
}

// Two copies of the progress (two devices): per word, the one answered last.
export function mergeProgress(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, p] of Object.entries(b)) {
    const q = out[k];
    if (!q || (p.t || 0) > (q.t || 0)) out[k] = q?.m && !p.m ? { ...p, m: 1 } : p;
    else if (p.m && !q.m) out[k] = { ...q, m: 1 };
  }
  return out;
}

// The word of the day: the same for everyone on a Taiwan day, from levels 3-6
// (a single word, not a phrase), a different one each day.
export function wordOfDay(words, now = Date.now()) {
  const pool = words.filter(w => w.level >= 3 && /^[a-z]+$/.test(w.word) && w.zh);
  if (!pool.length) return null;
  const n = dayNum(now);
  // A fixed stride coprime with the pool size walks the list without repeats.
  let stride = 7919;
  while (gcd(stride, pool.length) !== 1) stride++;
  return pool[(n * stride) % pool.length];
}
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
