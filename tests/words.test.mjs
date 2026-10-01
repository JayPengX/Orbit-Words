// The words, the scheduling and the wrong options (words.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, addPacks, grade, gapDays, pickRound, makeQuestion, distractors, lookAlike, meaningAlike, sameMeaning, editDistance, clozeGaps, clozeText, sameWord, spellDiff, stats, hardest, packProgress, unpackProgress, mergeProgress, dayNum, smartType, shortMeaning, wordOfDay, MASTERED } from '../public/lib/words.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const main = loadWords(read('words.json'));
const words = addPacks(main, read('packs.json'));
const byKey = new Map(words.map(w => [w.key, w]));
const W = k => byKey.get(k);
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const now = Date.parse('2026-10-05T04:00:00Z');
const DAY = 86_400_000;

test('the word list: levels 1 to 6 with meanings, and three packs', () => {
  assert.equal(main.length, 6170);
  for (const l of [1, 2, 3, 4, 5, 6]) assert.ok(main.filter(w => w.level === l).length > 950);
  assert.equal(main.filter(w => !w.zh).length, 0);
  for (const p of ['toeic', 'ielts', 'biz']) assert.ok(words.filter(w => w.packs?.includes(p)).length > 100, p);
});

test('boxes: right moves a word up once a day, wrong sends it back; a lapse makes its gaps shorter', () => {
  // Right the first time: already known, box 3, due tomorrow.
  const p = grade(undefined, true, { now }).p;
  assert.deepEqual([p.b, p.d], [3, dayNum(now) + 1]);
  // Again the same day: no step up.
  assert.equal(grade(p, true, { now: now + 60_000 }).p.b, 3);
  const r = grade(p, true, { now: now + DAY });
  assert.deepEqual([r.p.b, r.p.d, r.firstMastery], [4, dayNum(now) + 1 + 7, true]);
  // Forgotten once mastered: back to box 1, due now, one lapse, and the word it was taken for.
  const lost = grade(r.p, false, { now: now + 9 * DAY, chose: 'adapt' }).p;
  assert.deepEqual([lost.b, lost.d, lost.l, lost.c], [1, dayNum(now) + 9, 1, ['adapt']]);
  // The latest mix-up goes first, four at most.
  let c = lost;
  for (const k of ['a', 'b', 'c', 'adapt', 'e']) c = grade(c, false, { now: now + 9 * DAY, chose: k }).p;
  assert.deepEqual(c.c, ['e', 'adapt', 'c', 'b']);
  // Missed before it was learnt isn't a lapse.
  assert.equal(grade(grade(undefined, false, { now }).p, false, { now }).p.l, undefined);
  // The gaps: 1, 3, 7 and 21 days, shorter with every lapse.
  assert.deepEqual([2, 3, 4, 5].map(b => gapDays(b)), [1, 3, 7, 21]);
  assert.deepEqual([0, 1, 2, 4].map(l => gapDays(5, l)), [21, 14, 11, 7]);
  // Mastered once only.
  let q;
  let firsts = 0;
  for (let i = 0; i < 8; i++) {
    const g = grade(q, true, { now: now + i * DAY });
    q = g.p;
    if (g.firstMastery) firsts++;
    if (i === 4) q = grade(q, false, { now: now + i * DAY + 1000 }).p;
  }
  assert.equal(firsts, 1);
});

test('asked the hardest way a word is ready for: recognising first, producing once learnt, never unscrambling a long word', () => {
  const kinds = p => {
    const seen = new Set();
    for (let i = 0; i < 40; i++) seen.add(smartType(p, random, { word: 'apple' }, {}));
    return [...seen].sort();
  };
  assert.deepEqual(kinds({ b: 0 }), ['listen', 'meaning', 'word']);
  assert.deepEqual(kinds({ b: 4 }), ['cloze', 'spell']);
  // A word that keeps slipping is asked as if it were two boxes on.
  assert.deepEqual(kinds({ b: 2, l: 2 }), ['cloze', 'spell']);
  for (let i = 0; i < 30; i++) assert.notEqual(smartType({ b: 2 }, random, { word: 'responsibility' }, {}), 'letters');
  // A round spreads over the kinds that suit.
  const used = {};
  for (let i = 0; i < 8; i++) {
    const k = smartType({ b: 2 }, random, { word: 'apple' }, used);
    used[k] = (used[k] || 0) + 1;
  }
  assert.deepEqual(Object.values(used), [2, 2, 2, 2]);
});

test('a round leads with the words missed and forgotten most, brings their mix-ups, and keeps look-alikes apart', () => {
  const today = dayNum(now);
  const level1 = words.filter(w => w.level === 1);
  const progress = {};
  for (const w of level1.slice(0, 30)) progress[w.key] = { b: 3, d: today - 1, n: 3, r: 3, t: now - DAY };
  // Missed last time, and forgotten three times: first in line.
  progress[level1[40].key] = { b: 1, d: today, n: 4, r: 2, t: now - DAY };
  progress[level1[41].key] = { b: 2, d: today, n: 9, r: 5, t: now - DAY, l: 3, c: [level1[50].key] };
  const round = pickRound(words, progress, { levels: [1], size: 10, now, random });
  assert.equal(round.length, 10);
  const keys = round.map(w => w.key);
  assert.ok(keys.includes(level1[40].key) && keys.includes(level1[41].key));
  // The word it was mixed up with comes along (new, not due).
  assert.ok(keys.includes(level1[50].key));
  // Plenty due (more than two rounds): 20% new, the mix-up partner one of them.
  assert.equal(round.filter(w => !progress[w.key]).length, 2);
  // With little due, mostly new.
  const few = pickRound(words, { [level1[0].key]: { b: 2, d: today, n: 1, r: 1, t: now - DAY } }, { levels: [1], size: 10, now, random });
  assert.equal(few.filter(w => w.key !== level1[0].key).length, 9);
  // No two neighbours spelt alike when the round can avoid it.
  const alike = ['adapt', 'adopt', 'apple', 'happy', 'house', 'mouse'].map(W);
  const due = Object.fromEntries(alike.map(w => [w.key, { b: 2, d: today, n: 1, r: 1, t: now - DAY }]));
  for (let n = 0; n < 20; n++) {
    const spread = pickRound(alike, due, { levels: [...new Set(alike.map(w => w.level))], size: 6, now, random });
    for (let i = 1; i < spread.length; i++) assert.ok(lookAlike(spread[i - 1].key, spread[i].key) < 0.6, spread.map(w => w.key).join());
  }
});

test('the wrong options are the likeliest mix-ups: spelling, meaning, part of speech, and this person’s own', () => {
  assert.equal(editDistance('adopt', 'adapt'), 1);
  assert.ok(lookAlike('adopt', 'adapt') > lookAlike('adopt', 'banana'));
  assert.ok(meaningAlike('n. 能力、才幹', 'n. 品質、特性、才能') > meaningAlike('n. 能力、才幹', 'n. 香蕉'));
  assert.ok(sameMeaning('a. 大的、巨大的', 'a. 巨大的、龐大的'));
  assert.ok(!sameMeaning('n. 能力、才幹', 'n. 品質、特性、才能'));
  // Meaning to English: spelt alike.
  assert.ok(distractors(W('adopt'), words, 3, { type: 'word', random }).some(w => w.key === 'adapt'));
  assert.ok(distractors(W('principle'), words, 3, { type: 'listen', random }).some(w => w.key === 'principal'));
  // English to meaning: close in meaning or spelling.
  const ability = distractors(W('ability'), words, 3, { type: 'meaning', random }).map(w => w.key);
  assert.ok(ability.some(k => /bility|ality/.test(k)), ability.join());
  // A word this person took it for comes first.
  assert.equal(distractors(W('adopt'), words, 3, { type: 'meaning', confused: ['banana'], random })[0].key, 'banana');
  for (const k of ['economic', 'principle', 'desert', 'quiet', 'listen', 'reimburse']) {
    for (const type of ['meaning', 'word', 'listen']) {
      const d = distractors(W(k), words, 3, { type, random });
      assert.equal(d.length, 3, `${k} ${type}`);
      // Never an option that would also be right, the same shape, no two that read the same.
      for (const x of d) {
        assert.ok(!sameMeaning(x.zh, W(k).zh), `${k} ${x.key}`);
        assert.equal(/\s/.test(x.word), /\s/.test(k));
      }
      assert.equal(new Set(d.map(x => (type === 'meaning' ? shortMeaning(x.zh) : x.key))).size, 3);
    }
  }
  // A phrase among phrases.
  const phrase = words.find(w => /\s/.test(w.word));
  assert.ok(distractors(phrase, words, 3, { type: 'word', random }).every(w => /\s/.test(w.word)));
});

test('questions: four distinct choices with the answer, letters to unscramble, a cloze with about half its letters hidden', () => {
  const w = W('student');
  for (const type of ['meaning', 'word', 'listen']) {
    const q = makeQuestion(w, type, words, { random });
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.key)).size, 4);
    assert.ok(q.choices.some(c => c.key === w.key));
  }
  assert.deepEqual([...makeQuestion(w, 'letters', words, { random }).letters].sort(), [...w.word].sort());
  const gaps = clozeGaps('responsibility', 2, random);
  assert.ok(!gaps.includes(0) && gaps.length >= 5 && gaps.length <= 7, gaps.join());
  // More hidden the better it's known.
  assert.ok(clozeGaps('responsibility', 5, random).length > gaps.length);
  assert.deepEqual(makeQuestion(w, 'cloze', words, { random, p: { b: 3 } }).gaps.length, 3);
  assert.equal(clozeText('apple', [1, 3]), 'a_p_e');
  assert.deepEqual(clozeGaps('look up', 2, random).filter(i => 'look up'[i] === ' '), []);
  assert.ok(sameWord(' Student ', 'student'));
  assert.ok(sameWord('o’clock', "o'clock"));
  assert.deepEqual(spellDiff('studnet', 'student').map(d => d.ok), [true, true, true, true, false, false, true]);
});

test('progress round-trips with lapses and mix-ups and merges newest per word; the hardest words', () => {
  const progress = { apple: { b: 3, d: 20000, n: 4, r: 3, t: 1_790_000_000_000 }, go: { b: 5, d: 20100, n: 9, r: 9, t: 1_790_000_001_000, m: 1, l: 2, c: ['do', 'so'] } };
  const days = { '2026-10-04': 25 };
  const back = unpackProgress(JSON.parse(JSON.stringify(packProgress({ progress, levels: [1, 'toeic'], mode: 'cloze', days }))));
  assert.deepEqual(back, { progress, levels: [1, 'toeic'], mode: 'cloze', days });
  // Anything else isn't this app's progress; an unknown mode or level is left out.
  assert.equal(unpackProgress({ source: 'vocab-tool-sync', progress: {} }), null);
  assert.deepEqual(unpackProgress({ v: 3, w: {}, levels: [9, 2], mode: 'card' }).levels, [2]);
  assert.equal(unpackProgress({ v: 3, w: {}, mode: 'card' }).mode, null);
  assert.equal(mergeProgress(progress, { apple: { b: 1, d: 1, n: 5, r: 3, t: 1_790_000_009_000 } }).apple.b, 1);
  assert.equal(stats(words, progress).all.mastered, 1);
  assert.deepEqual(hardest(words, { apple: { ...progress.apple, l: 1 }, go: progress.go }).map(w => w.key), ['go', 'apple']);
  assert.equal(MASTERED, 4);
});

test('the word of the day changes daily and is a single word', () => {
  const a = wordOfDay(words, now);
  assert.notEqual(a.key, wordOfDay(words, now + DAY).key);
  assert.match(a.word, /^[a-z]+$/);
});
