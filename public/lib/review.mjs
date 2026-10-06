// Review: the words to go back over, a word list to browse, bookmarks, and
// the numbers for 進度. Pure functions over the word list and the progress
// (words.mjs), so they're tested directly.
import { dayNum, retrievability, stateOf, keyOf, LEVELS, MASTERED } from './words.mjs';

const DAY = 86_400_000;

// ---- Bookmarks ----------------------------------------------------------------------------
//
// `marks`: { key: [1 marked / 0 unmarked, when (s)] }. Unmarking keeps the
// row, so two devices agree on the latest choice (mergeMarks) instead of
// one device's old mark coming back.
export const isMarked = (marks, key) => marks?.[key]?.[0] === 1;
export function toggleMark(marks, key, now = Date.now()) {
  return { ...marks, [key]: [isMarked(marks, key) ? 0 : 1, Math.round(now / 1000)] };
}
export function mergeMarks(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) if (Array.isArray(v) && (!out[k] || (v[1] || 0) > (out[k][1] || 0))) out[k] = v;
  return out;
}
export const markedCount = marks => Object.values(marks || {}).filter(v => v?.[0] === 1).length;

// ---- What to go back over -----------------------------------------------------------------
//
// 答錯 wrong: the last answer was a miss. 該複習 due: learnt and due today
// (or before). 學習中 learning: learnt, not yet mastered, last answered right.
// 收藏 marked: bookmarked. A word can be in more than one (wrong and due).
export const CATS = ['wrong', 'due', 'learning', 'marked'];
export function inCat(cat, p, key, { marks = {}, today = dayNum() } = {}) {
  if (cat === 'marked') return isMarked(marks, key);
  if (!p?.b) return false;
  if (cat === 'wrong') return p.o === 2 || (!p.o && (p.n || 0) > (p.r || 0) && p.b < MASTERED);
  if (cat === 'due') return p.d <= today;
  if (cat === 'learning') return p.b < MASTERED && !inCat('wrong', p, key);
  return false;
}
export function catCounts(words, progress, { marks = {}, now = Date.now() } = {}) {
  const today = dayNum(now);
  const out = Object.fromEntries(CATS.map(c => [c, 0]));
  for (const w of words) for (const c of CATS) if (inCat(c, progress[w.key], w.key, { marks, today })) out[c]++;
  return out;
}

// The chance this person still recalls a word now, 0 to 1 (null for a new word).
export function recallNow(p, now = Date.now(), factor = 1) {
  if (!p?.b || !p.t) return null;
  return retrievability((now - p.t) / DAY, (p.s || 0.1) * factor);
}

// Sorting: weak (least likely recalled now first; a miss first of all),
// recent (answered last first), missed (most misses first), az.
export const SORTS = ['weak', 'recent', 'missed', 'az'];
const misses = p => (p?.n || 0) - (p?.r || 0);
function sorter(sort, progress, now) {
  if (sort === 'az') return (a, b) => a.key.localeCompare(b.key);
  if (sort === 'recent') return (a, b) => (progress[b.key]?.t || 0) - (progress[a.key]?.t || 0);
  if (sort === 'missed') return (a, b) => misses(progress[b.key]) - misses(progress[a.key]) || (progress[b.key]?.l || 0) - (progress[a.key]?.l || 0) || a.key.localeCompare(b.key);
  const weak = w => {
    const p = progress[w.key];
    const r = recallNow(p, now);
    return r == null ? 2 : r - (p.o === 2 ? 1 : 0);
  };
  return (a, b) => weak(a) - weak(b) || a.key.localeCompare(b.key);
}

// A search: English by its start first, then anywhere in it; Chinese
// anywhere in the meaning. Empty matches everything.
export function matches(word, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  if (/[一-鿿]/.test(q)) return String(word.zh || '').includes(q);
  return word.key.includes(keyOf(q));
}
const startsFirst = (list, query) => {
  const q = keyOf(query || '');
  if (!q || /[一-鿿]/.test(q)) return list;
  return [...list.filter(w => w.key.startsWith(q)), ...list.filter(w => !w.key.startsWith(q))];
};

// The words in a review category, searched and sorted.
export function reviewList(words, progress, cat, { marks = {}, sort = 'weak', query = '', now = Date.now() } = {}) {
  const today = dayNum(now);
  const list = words.filter(w => inCat(cat, progress[w.key], w.key, { marks, today }) && matches(w, query)).sort(sorter(sort, progress, now));
  return query ? startsFirst(list, query) : list;
}

// The word list (單字): by level and state (new, learning, mastered,
// marked; 'all' for any), searched; in the list's own order (by level, then
// A to Z) unless searched.
export const STATES = ['all', 'new', 'learning', 'mastered', 'marked'];
export function browse(words, progress, { level = 0, state = 'all', query = '', marks = {} } = {}) {
  const list = words.filter(w => (!level || w.level === level) && (state === 'all' || (state === 'marked' ? isMarked(marks, w.key) : stateOf(progress[w.key]) === state)) && matches(w, query));
  return query ? startsFirst(list, query) : list;
}

// A deck of flash cards from a category: the weakest `n` (all with n = 0).
export function flashDeck(words, progress, cat, { n = 20, marks = {}, now = Date.now() } = {}) {
  const list = reviewList(words, progress, cat, { marks, sort: 'weak', now });
  return n ? list.slice(0, n) : list;
}

// ---- One word, in numbers -----------------------------------------------------------------
//
// { state, answers, right, accuracy (0-1 or null), recall (now, 0-1 or
// null), dueIn (days from today: 0 today, negative overdue; null for new),
// stability (days), lapses, last (ms) }.
export function wordInfo(p, now = Date.now(), factor = 1) {
  const state = stateOf(p);
  if (!p?.n && !p?.b) return { state, answers: 0, right: 0, accuracy: null, recall: null, dueIn: null, stability: null, lapses: 0, last: 0 };
  return {
    state,
    answers: p.n || 0,
    right: p.r || 0,
    accuracy: p.n ? (p.r || 0) / p.n : null,
    recall: recallNow(p, now, factor),
    dueIn: p.b ? p.d - dayNum(now) : null,
    stability: p.s || null,
    lapses: p.l || 0,
    last: p.t || 0
  };
}

// ---- The numbers for 進度 -----------------------------------------------------------------
//
// Over all answers: { answers, right, accuracy }.
export function totals(progress) {
  let answers = 0;
  let right = 0;
  for (const p of Object.values(progress || {})) (answers += p.n || 0), (right += p.r || 0);
  return { answers, right, accuracy: answers ? right / answers : null };
}
// Reviews coming: how many learnt words fall due each of the next `n` days
// (the first counts everything due today or before). [{ day (offset), n }].
export function forecast(progress, n = 7, now = Date.now()) {
  const today = dayNum(now);
  const out = Array.from({ length: n }, (_, i) => ({ day: i, n: 0 }));
  for (const p of Object.values(progress || {})) {
    if (!p?.b) continue;
    const i = Math.max(0, p.d - today);
    if (i < n) out[i].n++;
  }
  return out;
}
// Per level: { level, total, new, learning, mastered } (the bar in 進度).
export function levelBreakdown(words, progress) {
  return LEVELS.map(level => {
    const row = { level, total: 0, new: 0, learning: 0, mastered: 0 };
    for (const w of words) if (w.level === level) (row.total++, row[stateOf(progress[w.key])]++);
    return row;
  });
}
// How long words stay remembered: learnt words by stability, in buckets
// (under 2 days, 2-10, 10-30, a month and more).
export function memorySpread(progress) {
  const out = [0, 0, 0, 0];
  for (const p of Object.values(progress || {})) {
    if (!p?.b) continue;
    const s = p.s || 0;
    out[s < 2 ? 0 : s < 10 ? 1 : s < 30 ? 2 : 3]++;
  }
  return out;
}
