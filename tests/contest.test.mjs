// 拼字比賽's practice paper (lib/contest.mjs): the contest's shape and the other sizes, the words it draws, how it marks and keeps scores.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, loadMore, dayNum, packProgress, unpackProgress } from '../public/lib/words.mjs';
import { PAPERS, PAPER_IDS, totalOf, minutesOf, SET_SIZE, makePaper, sentenceQuestion, weakness, blankOf, markSpelling, scorePaper, contestRow, mergeContests, contestStats } from '../public/lib/contest.mjs';
import { mergeCopy } from '../public/lib/copy.mjs';

const words = loadWords(JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url))));
const more = loadMore(JSON.parse(readFileSync(new URL('../public/data/more.json', import.meta.url))));
const seeded = (n = 7) => () => ((n = (n * 16807) % 2147483647) / 2147483647);
const NOW = Date.parse('2026-10-30T04:00:00Z');
const today = dayNum(NOW);

test('a paper is the final’s 100: 50 heard, 30 單題 and 20 題組 in sets of five, no word twice, levels 1–6, top levels heaviest', () => {
  const p = makePaper(words, {}, { more, now: NOW, random: seeded() });
  const TOTAL = totalOf(PAPERS.full);
  assert.deepEqual([p.spell.length, p.single.length, p.group.length], [50, 30, 20]);
  const all = [...p.spell, ...p.single.map(q => q.word), ...p.group.map(q => q.word)];
  assert.equal(new Set(all.map(w => w.key)).size, TOTAL);
  assert.ok(all.every(w => w.level >= 1 && w.level <= 6 && /^[a-z]+$/.test(w.word)));
  assert.ok(all.filter(w => w.level >= 4).length / TOTAL > 0.6);
  // 單題: the word itself in its sentence, four options of its kind, one of them it.
  for (const q of p.single) {
    assert.equal(q.form, q.word.word);
    assert.ok(q.before.length > 0);
    assert.equal(q.choices.length, 4);
    assert.equal(q.choices.filter(c => c.key === q.word.key).length, 1);
    assert.equal(new Set(q.choices.map(c => c.key)).size, 4);
  }
  // 題組: four sets, each bank its five words as written plus one more.
  for (let s = 0; s < 20 / SET_SIZE; s++) {
    const set = p.group.filter(q => q.set === s);
    assert.equal(set.length, SET_SIZE);
    assert.equal(set[0].bank.length, SET_SIZE + 1);
    for (const q of set) assert.ok(q.bank.some(b => b.key === q.word.key && b.text === q.form));
  }
});

test('each paper size: its parts in full, 題組 in whole sets, 40 minutes for the 標準 one', () => {
  for (const id of PAPER_IDS) {
    const shape = PAPERS[id];
    const p = makePaper(words, {}, { shape, more, now: NOW, random: seeded(5) });
    assert.deepEqual([p.spell.length, p.single.length, p.group.length], [shape.spell, shape.single, shape.group], id);
    assert.equal(shape.group % SET_SIZE, 0);
    const all = [...p.spell, ...p.single.map(q => q.word), ...p.group.map(q => q.word)];
    assert.equal(new Set(all.map(w => w.key)).size, totalOf(shape), id);
  }
  assert.deepEqual([minutesOf(PAPERS.short), minutesOf(PAPERS.full), minutesOf(PAPERS.long)], [16, 40, 63]);
  assert.equal(totalOf(PAPERS.long) - PAPERS.long.spell, 100, 'the long paper: 100 choice questions');
});

test('a word as a sentence question: its own example, four options, null without one', () => {
  const w = words.find(x => x.word === 'scarcity') || words.find(x => more.get(x.key)?.en && blankOf(x, more.get(x.key), { exact: true }));
  const q = sentenceQuestion(w, more.get(w.key), words, seeded(2));
  assert.ok(q && q.before.length > 0 && q.form === w.word);
  assert.equal(q.choices.filter(c => c.key === w.key).length, 1);
  assert.equal(sentenceQuestion(w, { forms: [], en: '' }, words), null);
});

test('weak words fill about 40% of a part, and a misspelt word weighs most for the heard part', () => {
  const pool = words.filter(w => w.level === 5 && /^[a-z]+$/.test(w.word)).slice(0, 300);
  const progress = {};
  for (const w of pool.slice(0, 200)) progress[w.key] = { b: 2, d: today - 3, n: 4, r: 2, t: NOW - 5 * 86_400_000, o: 2 };
  const spelt = pool[0].key;
  progress[spelt] = { ...progress[spelt], x: ['wrng'], h: 's' };
  const p = makePaper(words, progress, { more, now: NOW, random: seeded(3) });
  assert.equal(p.spell.filter(w => progress[w.key]).length, 20);
  assert.ok(weakness(progress[spelt], { today, spell: true }) > weakness(progress[spelt], { today }));
  assert.equal(weakness(undefined), 0);
  assert.equal(weakness({ b: 5, d: today + 30, n: 3, r: 3 }, { today }), 0, 'a known word, not due: not weak');
});

test('a blank finds the word (or, for a set, a form of it), never as the first word', () => {
  const leak = { forms: ['leaks', 'leaking', 'leaked'], en: 'The roof started leaking.' };
  assert.deepEqual(blankOf({ word: 'leak' }, leak), { before: 'The roof started ', form: 'leaking', after: '.' });
  assert.equal(blankOf({ word: 'leak' }, leak, { exact: true }), null);
  assert.equal(blankOf({ word: 'rain' }, { forms: [], en: 'Rain is scarce here.' }), null);
  assert.equal(blankOf({ word: 'cat' }, { forms: [], en: 'A category of things.' }), null, 'whole words only');
});

test('heard words are marked as the final does: exact and lower case', () => {
  assert.equal(markSpelling(' scarcity ', 'scarcity'), 'right');
  assert.equal(markSpelling('Scarcity', 'scarcity'), 'caps');
  assert.equal(markSpelling('scarsity', 'scarcity'), 'wrong');
  assert.equal(markSpelling('', 'scarcity'), 'blank');
});

test('points per part and in all (2 each, of 200); scores kept, merged across devices, last and best', () => {
  const answers = [
    ...Array.from({ length: 50 }, (_, i) => ({ part: 'spell', correct: i < 40 })),
    ...Array.from({ length: 30 }, (_, i) => ({ part: 'single', correct: i < 25 })),
    ...Array.from({ length: 20 }, (_, i) => ({ part: 'group', correct: i < 12 }))
  ];
  const s = scorePaper(answers);
  assert.deepEqual([s.spell.right, s.vocab.right, s.vocab.n, s.points, s.max], [40, 37, 50, 154, 200]);
  const a = contestRow({ at: NOW, score: s, seconds: 2400.4 });
  assert.deepEqual(a, [Math.round(NOW / 1000), 40, 37, 2400, 100]);
  // An older row (four numbers) is a 100-question paper; a short paper's scores are kept apart.
  const b = [a[0] + 86_400, 30, 30, 2000];
  const c = [a[0] + 2 * 86_400, 18, 19, 900, 40];
  const merged = mergeContests([a], [b, a, ['junk']]);
  assert.deepEqual(merged, [b, a]);
  assert.deepEqual(contestStats(merged), { last: 120, best: 154, n: 2, max: 200 });
  assert.deepEqual(contestStats([c, ...merged], 40), { last: 74, best: 74, n: 1, max: 80 });
  assert.equal(contestStats([]), null);
  const shortScore = scorePaper([{ part: 'spell', correct: true }], PAPERS.short);
  assert.deepEqual([shortScore.points, shortScore.max, shortScore.vocab.n], [2, 80, 20]);
  const back = unpackProgress(packProgress({ progress: {}, levels: [1], mode: 'smart', ct: merged }));
  assert.deepEqual(back.ct, merged);
  assert.deepEqual(mergeCopy({ progress: {}, ct: [a] }, { progress: {}, ct: [b] }).ct, [b, a]);
});

test('a sentence’s options are never close in meaning to the word (two could fit the blank)', () => {
  const cabin = words.find(w => w.word === 'cabin');
  for (let seed = 1; seed < 40; seed++) {
    const keys = sentenceQuestion(cabin, { forms: [], en: 'This cabin is a very special place.' }, words, seeded(seed)).choices.map(c => c.key);
    for (const k of ['hut', 'cottage', 'shed']) assert.ok(!keys.includes(k), `${k} with cabin`);
  }
});
