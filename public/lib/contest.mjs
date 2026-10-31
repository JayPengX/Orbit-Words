// 拼字比賽: a timed practice paper, as the national high-school vocabulary
// contest (國教署 全國高級中等學校學生英文單字比賽) sets its paper, weighted
// by this person's own record. One of the app's modes, not what the app is
// built around. Pure functions (no DOM), so they're tested directly.
//
// The contest's paper (115 學年度 plan, 區域決賽): levels 1–6 of the 大考中心
// list; 聽英拼寫 50 (hear the word, write it; in lower case, a capital where
// none belongs scoring nothing) and 詞彙題 50 (one blank a question, the best
// word from the options: 單題 like the 學測's vocabulary questions, then 題組
// like Cool English's collocation sets, a bank of words for a few
// sentences); 2 points each, 200 in all; 40 minutes for both. How the 50
// splits between 單題 and 題組 isn't published: 30 and 20 here (four sets of
// five, each bank one word over). Besides that 標準 paper: a 短卷 for a
// quick go and a 長卷 with 100 choice questions.
//
// The words: a share of each part (WEAK) from this person's weak words
// (missed, misspelt, slipping, overdue), the rest drawn by level, the top
// levels heaviest, new and half-learnt words before the mastered. No word
// twice in a paper.
import { MASTERED, dayNum, distractors } from './words.mjs';

// The papers: how many of each part ({ spell, single, group }; 題組 in sets of SET_SIZE).
export const PART_IDS = ['spell', 'single', 'group'];
export const PAPERS = {
  short: { spell: 20, single: 10, group: 10 },
  full: { spell: 50, single: 30, group: 20 },
  long: { spell: 50, single: 60, group: 40 }
};
export const PAPER_IDS = Object.keys(PAPERS);
export const paperOf = id => PAPERS[id] || PAPERS.full;
export const totalOf = shape => shape.spell + shape.single + shape.group;
export const POINTS_EACH = 2;
export const SET_SIZE = 5;
// The pace, 40 minutes for the 標準 paper as the contest's: each heard word
// said twice and SPELL_SECONDS to write it (as the recording runs on), then
// one clock for the choice questions, VOCAB_SECONDS each.
export const SPELL_SECONDS = 20;
export const VOCAB_SECONDS = (40 * 60 - PAPERS.full.spell * SPELL_SECONDS) / (PAPERS.full.single + PAPERS.full.group);
export const vocabSecondsOf = shape => Math.round((shape.single + shape.group) * VOCAB_SECONDS);
export const minutesOf = shape => Math.round((shape.spell * SPELL_SECONDS + vocabSecondsOf(shape)) / 60);
// How a paper spreads its words over the levels: the harder half heaviest.
export const LEVEL_SHARE = { 1: 0.03, 2: 0.07, 3: 0.15, 4: 0.25, 5: 0.25, 6: 0.25 };
// The share of each part taken from the weak words, when there are that many.
const WEAK = 0.4;
// The new and half-learnt before the mastered.
const STATE_WEIGHT = { new: 1, learning: 1.5, mastered: 0.35 };
// Contests kept (`ct` in the payload).
export const CONTEST_KEEP = 20;

// How weak a word is for this person (0: nothing against it): misses, lapses,
// the last answer missed, overdue; for the heard part, a misspelling counts most.
export function weakness(p, { today = dayNum(), spell = false } = {}) {
  if (!p?.n) return 0;
  let w = Math.max(0, (p.n || 0) - (p.r || 0)) + 1.5 * (p.l || 0) + (p.o === 2 ? 2 : 0);
  if (spell && (p.x?.length || p.h === 's')) w += 3;
  if (p.b && p.d <= today) w += 1 + Math.min(2, (today - p.d) / 7);
  if (p.b && p.b < MASTERED && w) w += 0.5;
  return w;
}

// `k` of `items` drawn without replacement, each as likely as its weight
// (Efraimidis–Spirakis: the k largest random^(1/weight)).
export function weightedPick(items, weight, k, random = Math.random) {
  return items
    .map(x => [weight(x), x])
    .filter(([w]) => w > 0)
    .map(([w, x]) => [random() ** (1 / w), x])
    .sort((a, b) => b[0] - a[0])
    .slice(0, k)
    .map(([, x]) => x);
}

// Where a word stands in its own example (more.json), a form of it counted
// ("leaking" for leak), never as the sentence's first word (its capital would
// give it away): { before, form, after }, or null. `exact`: the word itself only.
export function blankOf(word, more, { exact = false } = {}) {
  const en = more?.en || '';
  if (!en || en.length > 120) return null;
  const forms = [word.word, ...(exact ? [] : more.forms || [])].filter(f => /^[a-z-]+$/.test(f)).sort((a, b) => b.length - a.length);
  for (const f of forms) {
    const m = new RegExp(`\\b${f}\\b`).exec(en);
    if (m && m.index > 0) return { before: en.slice(0, m.index), form: m[0], after: en.slice(m.index + m[0].length) };
  }
  return null;
}

const plain = w => /^[a-z]+$/.test(w.word) && Boolean(w.zh);
const stateOfP = p => (!p?.b ? 'new' : p.b >= MASTERED ? 'mastered' : 'learning');
function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A paper: { spell: [words], single: [{ word, before, form, after, choices:
// [{ key, text }] }], group: [{ word, before, form, after, set, bank }] },
// each in a random order (a set's sentences together). `more`: key → { forms,
// en } (the examples, the sentences of 詞彙題).
export function makePaper(words, progress, { shape = PAPERS.full, more = new Map(), now = Date.now(), random = Math.random } = {}) {
  const today = dayNum(now);
  const pool = words.filter(w => LEVEL_SHARE[w.level] && plain(w));
  const perLevel = {};
  for (const w of pool) perLevel[w.level] = (perLevel[w.level] || 0) + 1;
  const used = new Set();
  const draw = (list, n, spell) => {
    const free = list.filter(w => !used.has(w.key));
    const weak = weightedPick(free, w => weakness(progress[w.key], { today, spell }), Math.round(n * WEAK), random);
    for (const w of weak) used.add(w.key);
    const rest = weightedPick(
      free.filter(w => !used.has(w.key)),
      w => (LEVEL_SHARE[w.level] / perLevel[w.level]) * STATE_WEIGHT[stateOfP(progress[w.key])],
      n - weak.length,
      random
    );
    for (const w of rest) used.add(w.key);
    return shuffle([...weak, ...rest], random);
  };
  // The sentences first: only words whose example can carry them (單題: the word as it is, so its options read alike).
  const exact = new Map();
  const any = new Map();
  for (const w of pool) {
    const m = more.get(w.key);
    const e = blankOf(w, m, { exact: true });
    if (e) exact.set(w.key, e);
    const a = e || blankOf(w, m);
    if (a) any.set(w.key, a);
  }
  const single = draw(pool.filter(w => exact.has(w.key)), shape.single, false).map(w => ({ word: w, ...exact.get(w.key), choices: singleChoices(w, words, random) }));
  const sets = Math.floor(shape.group / SET_SIZE);
  const asked = draw(pool.filter(w => any.has(w.key)), sets * SET_SIZE, false);
  // Each set's bank: its five words as the sentences have them, and one more.
  const spare = draw(pool.filter(w => any.has(w.key)), sets, false);
  const group = [];
  for (let s = 0; s < sets; s++) {
    const mine = asked.slice(s * SET_SIZE, (s + 1) * SET_SIZE);
    const bank = [...mine, spare[s]].filter(Boolean).map(w => ({ key: w.key, text: any.get(w.key).form })).sort((a, b) => a.text.localeCompare(b.text));
    for (const w of mine) group.push({ word: w, ...any.get(w.key), set: s, bank });
  }
  return { spell: draw(pool, shape.spell, true), single, group };
}
// A word's own example as a question (the 詞彙題 mode): { before, form,
// after, choices }, or null when its example can't carry it.
export function sentenceQuestion(word, more, words, random = Math.random) {
  const blank = blankOf(word, more, { exact: true });
  return blank ? { ...blank, choices: singleChoices(word, words, random) } : null;
}
// A 單題's four options: the word and three of the same part of speech
// (distractors' 'context': a sentence asks for the right word of its kind,
// not a look-alike).
export function singleChoices(word, words, random = Math.random) {
  return shuffle([word, ...distractors(word, words, 3, { type: 'context', random })], random).map(w => ({ key: w.key, text: w.word }));
}

// A heard word as the contest marks it: exactly the word, in lower case.
// 'right', 'caps' (the right letters, a capital among them: no score),
// 'wrong', or 'blank'.
export function markSpelling(typed, word) {
  const t = String(typed || '').trim().replace(/\s+/g, ' ');
  if (!t) return 'blank';
  if (t === word) return 'right';
  return t.toLowerCase() === word.toLowerCase() ? 'caps' : 'wrong';
}

// The score per part and in all, from the answers ([{ part, correct }]):
// { spell: { right, n }, single, group, vocab: { right, n }, points, max }.
export function scorePaper(answers, shape = PAPERS.full) {
  const out = {};
  for (const id of PART_IDS) out[id] = { right: answers.filter(a => a.part === id && a.correct).length, n: shape[id] };
  out.vocab = { right: out.single.right + out.group.right, n: shape.single + shape.group };
  out.points = (out.spell.right + out.vocab.right) * POINTS_EACH;
  out.max = totalOf(shape) * POINTS_EACH;
  return out;
}

// A contest kept: [when (s), heard words right, vocabulary right, seconds
// taken, questions]. (Rows of four, from before the papers had sizes, are 100.)
export const contestRow = ({ at, score, seconds }) => [Math.round(at / 1000), score.spell.right, score.vocab.right, Math.round(seconds), score.spell.n + score.vocab.n];
const goodRow = r => Array.isArray(r) && (r.length === 4 || r.length === 5) && r.every(Number.isFinite);
const sizeOf = r => r[4] ?? 100;
// Two devices' contests as one: each once, the latest first.
export function mergeContests(a = [], b = []) {
  const byAt = new Map();
  for (const r of [...a, ...b]) if (goodRow(r)) byAt.set(r[0], r);
  return [...byAt.values()].sort((x, y) => y[0] - x[0]).slice(0, CONTEST_KEEP);
}
export const readContests = list => (Array.isArray(list) ? mergeContests(list) : []);
// The last paper's points and the best, of papers this size (null when none).
export function contestStats(list, total = totalOf(PAPERS.full)) {
  const mine = (list || []).filter(r => sizeOf(r) === total);
  if (!mine.length) return null;
  const points = r => (r[1] + r[2]) * POINTS_EACH;
  return { last: points(mine[0]), best: Math.max(...mine.map(points)), n: mine.length, max: total * POINTS_EACH };
}
