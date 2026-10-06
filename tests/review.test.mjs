// Review, the word list, bookmarks, hints and the numbers for 進度
// (review.mjs, practice.mjs's log, words.mjs's outcome and misspellings).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loadWords, loadHints, grade, distractors, dayNum, markKnown } from '../public/lib/words.mjs';
import { inCat, catCounts, reviewList, browse, flashDeck, toggleMark, mergeMarks, isMarked, markedCount, wordInfo, totals, forecast, levelBreakdown, memorySpread, matches } from '../public/lib/review.mjs';
import { logResult, mergeLog, periodOf, logAnswer, daysPractised } from '../public/lib/practice.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const words = loadWords(read('words.json'));
const byKey = new Map(words.map(w => [w.key, w]));
const W = k => byKey.get(k);
const now = Date.parse('2026-10-05T04:00:00Z');
const DAY = 86_400_000;
const today = dayNum(now);

test('a miss is remembered as the last outcome, a misspelling as typed (not a word picked or another word)', () => {
  let p = grade(null, false, { now, type: 'spell', word: 'necessary', typed: 'neccessary' }).p;
  assert.equal(p.o, 2);
  assert.deepEqual(p.x, ['neccessary']);
  p = grade(p, false, { now: now + DAY, type: 'cloze', word: 'necessary', typed: 'Necesary ' }).p;
  assert.deepEqual(p.x, ['necesary', 'neccessary']);
  // The same misspelling again moves to the front, three kept at most.
  for (const s of ['a1', 'a2', 'necesary']) p = grade(p, false, { now: now + 2 * DAY, type: 'spell', word: 'necessary', typed: s }).p;
  assert.deepEqual(p.x, ['necesary', 'a2', 'a1']);
  // Right: the outcome turns, the misspellings stay.
  p = grade(p, true, { now: now + 3 * DAY, type: 'spell', word: 'necessary' }).p;
  assert.equal(p.o, 1);
  assert.equal(p.x.length, 3);
  // Another word picked is a mix-up, not a misspelling.
  const q = grade(null, false, { now, type: 'word', word: 'adapt', chose: 'adopt', typed: 'adopt' }).p;
  assert.deepEqual([q.c, q.x], [['adopt'], undefined]);
});

test('review categories: missed, due, learning, bookmarked', () => {
  const progress = {
    adapt: { b: 1, d: today, n: 2, r: 1, t: now - DAY, o: 2, s: 1 },
    adopt: { b: 2, d: today + 3, n: 2, r: 2, t: now - DAY, o: 1, s: 3 },
    able: { b: 5, d: today - 1, n: 5, r: 5, t: now - 40 * DAY, o: 1, s: 40, m: 1 },
    // Saved before outcomes were kept: missed at least once and not mastered counts as missed.
    about: { b: 1, d: today + 1, n: 3, r: 2, t: now - DAY, s: 1 }
  };
  const marks = toggleMark({}, 'apple', now);
  const ctx = { marks, today };
  assert.deepEqual(['wrong', 'due', 'learning', 'marked'].map(c => inCat(c, progress.adapt, 'adapt', ctx)), [true, true, false, false]);
  assert.deepEqual(['wrong', 'due', 'learning'].map(c => inCat(c, progress.adopt, 'adopt', ctx)), [false, false, true]);
  assert.deepEqual(['wrong', 'due', 'learning'].map(c => inCat(c, progress.able, 'able', ctx)), [false, true, false]);
  assert.equal(inCat('wrong', progress.about, 'about', ctx), true);
  assert.equal(inCat('marked', undefined, 'apple', ctx), true);
  assert.deepEqual(catCounts(words, progress, { marks, now }), { wrong: 2, due: 2, learning: 1, marked: 1 });
  // Weakest first: a miss before a word just slipping.
  assert.deepEqual(reviewList(words, progress, 'due', { marks, now }).map(w => w.key), ['adapt', 'able']);
  assert.deepEqual(reviewList(words, progress, 'wrong', { sort: 'az', now }).map(w => w.key), ['about', 'adapt']);
  assert.deepEqual(flashDeck(words, progress, 'wrong', { n: 1, now }).map(w => w.key), ['adapt']);
});

test('bookmarks: the latest choice wins on every device, unmarking included', () => {
  let a = toggleMark({}, 'apple', now);
  const b = toggleMark(a, 'apple', now + 1000);
  assert.equal(isMarked(b, 'apple'), false);
  // The phone unmarked it later than the tablet marked it: unmarked.
  assert.equal(isMarked(mergeMarks(a, b), 'apple'), false);
  assert.equal(isMarked(mergeMarks(b, a), 'apple'), false);
  a = toggleMark(b, 'apple', now + 5000);
  assert.equal(isMarked(mergeMarks(b, a), 'apple'), true);
  assert.equal(markedCount(mergeMarks(a, toggleMark({}, 'go', now))), 2);
});

test('the word list: by level and state, searched in English (its start first) or Chinese', () => {
  const progress = { apple: { b: 5, d: today + 30, n: 3, r: 3, t: now, s: 40 }, apply: { b: 1, d: today, n: 1, r: 0, t: now, s: 0.5 } };
  assert.equal(browse(words, {}, {}).length, words.length);
  assert.equal(browse(words, {}, { level: 6 }).every(w => w.level === 6), true);
  assert.deepEqual(browse(words, progress, { state: 'mastered' }).map(w => w.key), ['apple']);
  assert.deepEqual(browse(words, progress, { state: 'learning' }).map(w => w.key), ['apply']);
  assert.deepEqual(browse(words, progress, { state: 'marked', marks: toggleMark({}, 'apply', now) }).map(w => w.key), ['apply']);
  const hits = browse(words, {}, { query: 'app' });
  assert.ok(hits.length > 5);
  assert.ok(hits.slice(0, 3).every(w => w.key.startsWith('app')), hits.slice(0, 3).map(w => w.key).join());
  assert.ok(browse(words, {}, { query: '蘋果' }).some(w => w.key === 'apple'));
  assert.equal(matches(W('apple'), '  '), true);
});

test('one word in numbers: answers, accuracy, recall now and when it’s next asked', () => {
  assert.deepEqual(wordInfo(undefined, now).state, 'new');
  const info = wordInfo({ b: 3, d: today + 2, n: 4, r: 3, t: now - 5 * DAY, s: 5, l: 1 }, now);
  assert.equal(info.accuracy, 0.75);
  assert.ok(Math.abs(info.recall - 0.9) < 0.001);
  assert.equal(info.dueIn, 2);
  assert.equal(info.lapses, 1);
  // "I know it": mastered, out of the way for two months.
  assert.equal(wordInfo(markKnown(undefined, now), now).state, 'mastered');
});

test('進度’s numbers: totals, reviews coming, each level, how long words stay', () => {
  const progress = { a: { b: 1, d: today - 2, n: 4, r: 2, s: 1 }, b: { b: 2, d: today + 1, n: 2, r: 2, s: 3 }, c: { b: 5, d: today + 40, n: 6, r: 6, s: 45 }, d: { b: 0, d: 0, n: 0, r: 0 } };
  assert.deepEqual(totals(progress), { answers: 12, right: 10, accuracy: 10 / 12 });
  assert.deepEqual(forecast(progress, 3, now).map(f => f.n), [1, 1, 0]);
  assert.deepEqual(memorySpread(progress), [1, 1, 0, 1]);
  const lv = levelBreakdown(words, { apple: { b: 5 }, about: { b: 1 } });
  assert.equal(lv.length, 6);
  const one = lv.find(r => r.level === W('apple').level);
  assert.equal(one.new + one.learning + one.mastered, one.total);
});

test('the day’s log: right answers and seconds, a minute at most a question; two devices take the larger', () => {
  let log = logResult({}, true, 4_000, now);
  log = logResult(log, false, 600_000, now);
  const day = Object.keys(log)[0];
  assert.deepEqual(log[day], [1, 64]);
  let days = logAnswer(logAnswer({}, now), now);
  const week = periodOf(days, log, 7, now);
  assert.deepEqual([week.answers, week.right, week.accuracy, week.perAnswer], [2, 1, 0.5, 32]);
  // Days with answers but no log (from before it) don't count against accuracy.
  days = { ...days, '2026-10-01': 30 };
  assert.equal(periodOf(days, log, 7, now).answers, 2);
  assert.equal(daysPractised(days), 2);
  assert.deepEqual(mergeLog(log, { [day]: [3, 10] })[day], [3, 64]);
  assert.equal(periodOf({}, {}, 7, now).accuracy, null);
});

test('hints: every level 4-6 word has a line to remember it by, and its usual confusions are real words', () => {
  const hints = loadHints(read('hints.json'));
  assert.ok(hints.size > 3000);
  for (const [k, h] of hints) {
    assert.ok(byKey.has(k), k);
    assert.ok(h.tip.length > 3, k);
    for (const c of h.common) assert.ok(byKey.has(c) && c !== k, `${k} → ${c}`);
  }
  assert.equal(loadHints({ x: 5, y: ['tip', 'nope'] }).get('y').common.length, 0);
  // A usual confusion is offered as a wrong option.
  const w = [...hints].find(([, h]) => h.common.length)[0];
  const opts = distractors(W(w), words, 3, { type: 'word', common: hints.get(w).common, random: () => 0.5 }).map(x => x.key);
  assert.ok(opts.includes(hints.get(w).common[0]), `${w}: ${opts}`);
});

test('the meanings: no field tags or stray escapes left in them', () => {
  for (const w of words) assert.doesNotMatch(w.zh, /\[[^\]]*\]|\\r/, w.word);
  assert.ok(existsSync(new URL('../public/data/hints.json', import.meta.url)));
});
