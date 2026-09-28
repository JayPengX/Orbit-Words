// Words: the high-school English reference list (大考中心, 108 curriculum),
// levels 1 to 6, and how Rewards teaches it. Pure functions (no DOM), so
// they're tested directly.
//
// Every word the person has met has a box (a Leitner box): 0 new, 1 to 3
// learning, 4 and 5 mastered. A right answer moves it up a box and schedules
// it later (BOX_DAYS), a wrong one sends it back to box 1, due again today.
// A new word answered right the first time it's seen is one the person
// already knows: it goes straight to box 3, so one more right answer on
// review (two days on) masters it. Only answers that test something move a
// word up: flash cards (grading yourself) take a new word to box 1 at most.
//
// A round mixes due reviews with new words, and asks each word the way that
// suits its box: new words by meaning, then the reverse, then by sound, then
// building it from letters, and mastered ones by dictation (hear it, spell it).

export const LEVELS = [1, 2, 3, 4, 5, 6];
export const BOX_DAYS = [0, 0, 1, 2, 5, 14];
// A new word right the first time: already known.
export const KNOWN_BOX = 3;
export const MASTERED = 4;
export const TYPES = ['card', 'meaning', 'word', 'listen', 'letters', 'spell'];
// Which study modes a person can choose; 'smart' picks per word.
export const MODES = ['smart', 'card', 'meaning', 'word', 'listen', 'letters', 'spell'];
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

// One answer. Returns the word's new progress and whether this answer
// mastered it for the first time (for the reward).
export function grade(p, correct, { type = 'meaning', now = Date.now() } = {}) {
  const was = p || { b: 0, d: 0, n: 0, r: 0, t: 0 };
  const today = dayNum(now);
  let b;
  if (!correct) b = 1;
  else if (type === 'card') b = Math.max(1, was.b);
  else if (!was.b && !was.n) b = KNOWN_BOX;
  else b = Math.min(5, (was.b || 0) + 1);
  const next = { ...was, b, d: today + BOX_DAYS[b], n: (was.n || 0) + 1, r: (was.r || 0) + (correct ? 1 : 0), t: now };
  const firstMastery = b >= MASTERED && !was.m;
  if (firstMastery) next.m = 1;
  return { p: next, firstMastery };
}

// The kind of question a word gets in smart mode, by its box: first its
// meaning (see the word, pick the meaning), then the reverse (see the
// meaning, pick the word), then by ear, then building it from its letters,
// then dictation. A phrase or a long word is never unscrambled (too many
// tiles for a phone): it's asked by ear, or spelled.
export function smartType(p, random = Math.random, word = null) {
  const b = p?.b || 0;
  const long = word ? /\s/.test(word.word) || word.word.length > 11 : false;
  if (b === 0) return 'meaning';
  if (b === 1) return p?.n > 1 && random() < 0.5 ? 'word' : 'meaning';
  if (b === 2) return random() < 0.6 ? 'word' : 'listen';
  if (b === 3) return long ? 'listen' : random() < 0.6 ? 'letters' : 'listen';
  return long || random() < 0.7 ? 'spell' : 'letters';
}

// The words for a round: due reviews first (most overdue, lowest box), then
// new words in list order, about 60% review when there's enough of it.
export function pickRound(words, progress, { levels = LEVELS, size = 10, now = Date.now(), random = Math.random, newShare = 0.4 } = {}) {
  const today = dayNum(now);
  const inLevels = words.filter(w => levels.includes(w.level));
  const due = inLevels
    .filter(w => progress[w.key]?.b && progress[w.key].d <= today)
    .sort((a, b) => progress[a.key].d - progress[b.key].d || progress[a.key].b - progress[b.key].b || random() - 0.5);
  // New words by level, then in a fixed mixed order (not alphabetical).
  const fresh = inLevels.filter(w => !progress[w.key]?.b).sort((a, b) => a.level - b.level || hash(a.key) - hash(b.key));
  // New words: the lower levels first, a little shuffled within the next few.
  const window = fresh.slice(0, 60).sort(() => random() - 0.5);
  // Reviews take their share (all of the round when nothing new is left),
  // new words the rest; either one fills in when the other runs short.
  let dueCount = Math.min(due.length, window.length ? Math.round(size * (1 - newShare)) : size);
  const newCount = Math.min(window.length, size - dueCount);
  dueCount = Math.min(due.length, size - newCount);
  const round = [...due.slice(0, dueCount), ...window.slice(0, newCount)];
  // Interleaved, so reviews and new words alternate.
  return round.sort(() => random() - 0.5).slice(0, size);
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Other words to choose from: same level and part of speech when possible.
export function distractors(word, words, n = 3, { random = Math.random, bySound = false } = {}) {
  const pool = words.filter(w => w.key !== word.key && w.zh && w.zh.split('\n')[0] !== word.zh.split('\n')[0]);
  const score = w => {
    let s = random() * 0.5;
    if (w.level === word.level) s += 1;
    if (w.pos.split('/')[0] === word.pos.split('/')[0]) s += 1;
    if (bySound) {
      if (w.key[0] === word.key[0]) s += 1.5;
      if (Math.abs(w.key.length - word.key.length) <= 1) s += 1;
      if (w.key.slice(-2) === word.key.slice(-2)) s += 0.8;
    }
    return s;
  };
  const sample = pool.length > 400 ? Array.from({ length: 400 }, () => pool[Math.floor(random() * pool.length)]) : pool;
  const seen = new Set();
  return sample
    .map(w => [w, score(w)])
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .filter(w => !seen.has(w.key) && seen.add(w.key))
    .slice(0, n);
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

// A question: { type, word, choices (for choice types), letters (for letters) }.
export function makeQuestion(word, type, words, { random = Math.random } = {}) {
  if (type === 'meaning') {
    const options = shuffle([word, ...distractors(word, words, 3, { random })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: shortMeaning(w.zh) })), answer: word.key };
  }
  if (type === 'word' || type === 'listen') {
    const options = shuffle([word, ...distractors(word, words, 3, { random, bySound: type === 'listen' })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: w.word })), answer: word.key };
  }
  if (type === 'letters') {
    const letters = [...word.word];
    let mixed = shuffle(letters, random);
    for (let i = 0; i < 4 && mixed.join('') === word.word && letters.length > 1; i++) mixed = shuffle(letters, random);
    return { type, word, letters: mixed, answer: word.key };
  }
  return { type, word, answer: word.key };
}

// A typed answer against the word: case, curly quotes and spaces don't matter.
export const sameWord = (typed, word) => keyOf(typed).replace(/\s+/g, ' ') === keyOf(word).replace(/\s+/g, ' ');

// Where a typed answer goes wrong, letter by letter, for the feedback:
// [{ ch, ok }] over the right spelling.
export function spellDiff(typed, word) {
  const a = keyOf(typed);
  const b = String(word);
  return [...b].map((ch, i) => ({ ch, ok: a[i] === ch.toLowerCase() }));
}

// What an answer pays, in NT$ (see ECONOMY.vocab): a right answer to a real
// question, and a word mastered for the first time. Flash cards pay nothing.
export function payFor({ correct, type, firstMastery }, rates) {
  let v = 0;
  if (correct && type !== 'card') v += rates.perCorrect;
  if (firstMastery) v += rates.perMastered;
  return v;
}

// Counts per level: { 1: { total, seen, mastered, due }, …, all: {…} }.
export function stats(words, progress, now = Date.now()) {
  const today = dayNum(now);
  const out = { all: { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 } };
  for (const l of LEVELS) out[l] = { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 };
  for (const w of words) {
    const p = progress[w.key];
    for (const s of [out[w.level], out.all]) {
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

// ---- Saved progress (this app's payload on the pass) ------------------------------
//
// { v: 3, w: { word: [box, due day, seen, right, last seen (s), mastered once] },
//   levels, mode, star: [words] }. The app gzips it.

export function packProgress({ progress, levels, mode, star = [] }) {
  const w = {};
  for (const [k, p] of Object.entries(progress)) w[k] = [p.b || 0, p.d || 0, p.n || 0, p.r || 0, Math.round((p.t || 0) / 1000), p.m ? 1 : 0];
  return { v: 3, w, levels, mode, star };
}
export function unpackProgress(obj) {
  if (obj?.v === 3 && obj.w) {
    const progress = {};
    for (const [k, a] of Object.entries(obj.w)) progress[k] = { b: a[0], d: a[1], n: a[2], r: a[3], t: a[4] * 1000, ...(a[5] ? { m: 1 } : {}) };
    return { progress, levels: Array.isArray(obj.levels) && obj.levels.length ? obj.levels : null, mode: obj.mode || null, star: Array.isArray(obj.star) ? obj.star : [] };
  }
  if (obj?.source === 'vocab-tool-sync') return { progress: migrateWords(obj), levels: null, mode: null, star: [] };
  return null;
}

// Quadra Words' progress (its synced snapshot): each word's attempts, right
// answers and streak become a box. Two right in a row was "mastered" there,
// and is here too; words already mastered don't pay again.
export function migrateWords(snapshot, now = Date.now()) {
  const base = Number(snapshot.exportedAt) || now;
  const out = {};
  for (const [key, h] of Object.entries(snapshot.progress || {})) {
    let attempts, correct, streak, last, lastSeen;
    if (Array.isArray(h)) {
      [attempts, correct, streak] = h;
      last = h[4] === 1 ? 'correct' : h[4] === 2 ? 'incorrect' : null;
      lastSeen = base - (h[5] || 0) * 1000;
    } else if (h && typeof h === 'object') {
      attempts = h.attempts;
      correct = h.correct;
      streak = h.correctStreak;
      last = h.lastResult;
      lastSeen = h.lastSeen;
    } else continue;
    if (!attempts) continue;
    const b = streak >= 3 ? 5 : streak >= 2 ? 4 : last === 'correct' ? 2 : 1;
    out[keyOf(key)] = { b, d: dayNum(lastSeen || now) + BOX_DAYS[b], n: attempts || 0, r: correct || 0, t: lastSeen || now, ...(b >= MASTERED ? { m: 1 } : {}) };
  }
  return out;
}

// Two copies of the progress (two devices): per word, the one seen last.
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
