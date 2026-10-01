// The words, the scheduling and the wrong options (words.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, toStudy, grade, gradeOf, retrievability, boxOf, pickRound, makeQuestion, distractors, lookAlike, meaningAlike, sameMeaning, editDistance, clozeGaps, clozeText, sameWord, spellDiff, stats, hardest, packProgress, unpackProgress, mergeProgress, dayNum, smartType, shortMeaning, wordOfDay, MASTERED } from '../public/lib/words.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const words = loadWords(read('words.json'));
const byKey = new Map(words.map(w => [w.key, w]));
const W = k => byKey.get(k);
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const now = Date.parse('2026-10-05T04:00:00Z');
const DAY = 86_400_000;

test('the word list: levels 1 to 6 with meanings', () => {
  assert.equal(words.length, 6170);
  for (const l of [1, 2, 3, 4, 5, 6]) assert.ok(words.filter(w => w.level === l).length > 950);
  assert.equal(words.filter(w => !w.zh).length, 0);
});

test('the memory model: recall falls to 90% at the stability; the grade from the answer and its time', () => {
  assert.equal(retrievability(0, 5), 1);
  assert.ok(Math.abs(retrievability(5, 5) - 0.9) < 1e-9);
  assert.ok(retrievability(20, 5) < 0.8);
  assert.equal(gradeOf(false, 'spell', 1000, 'apple'), 1);
  assert.equal(gradeOf(true, 'meaning', 12_000), 2);
  assert.equal(gradeOf(true, 'meaning', 1_000), 3);
  assert.equal(gradeOf(true, 'spell', 2_000, 'apple'), 4);
  assert.equal(gradeOf(true, 'spell', 0, 'apple'), 3);
  assert.deepEqual([1, 2, 4, 10, 30].map(boxOf), [1, 2, 3, 4, 5]);
});

test('grading: writing proves more than picking, a late recall more than a fresh one, a miss cuts it and makes it harder', () => {
  const first = type => grade(undefined, true, { now, type, ms: 3000 }).p;
  assert.ok(first('spell').s > first('meaning').s);
  // A right answer is due again when recall would be 90%: its stability in days.
  const p = first('cloze');
  assert.equal(p.d, dayNum(now) + Math.round(p.s));
  // Recalled on the due day vs. a day after its last answer: the later one gains more.
  const late = grade(p, true, { now: now + Math.round(p.s) * DAY, type: 'cloze', ms: 4000, word: 'apple' }).p;
  const early = grade(p, true, { now: now + DAY, type: 'cloze', ms: 4000, word: 'apple' }).p;
  assert.ok(late.s > early.s && early.s > p.s);
  // The same right answer, written vs. picked.
  const wrote = grade(p, true, { now: now + 3 * DAY, type: 'spell', ms: 4000, word: 'apple' }).p;
  const picked = grade(p, true, { now: now + 3 * DAY, type: 'meaning', ms: 4000 }).p;
  assert.ok(wrote.s > picked.s);
  // Quick beats slow.
  const quick = grade(p, true, { now: now + 3 * DAY, type: 'spell', ms: 1500, word: 'apple' }).p;
  const slow = grade(p, true, { now: now + 3 * DAY, type: 'spell', ms: 20_000, word: 'apple' }).p;
  assert.ok(quick.s > wrote.s && wrote.s > slow.s);
  // Asked again the same day: little change.
  assert.ok(grade(p, true, { now: now + 60_000, type: 'spell', ms: 2000, word: 'apple' }).p.s <= p.s + 1);
  // Climb to mastered (more than 10 days), then forget it: a lapse, due today, much shorter, harder.
  let q = p;
  let t = now;
  let firsts = 0;
  for (let i = 0; i < 6 && q.b < MASTERED + 1; i++) {
    t += Math.round(q.s) * DAY;
    const g = grade(q, true, { now: t, type: 'spell', ms: 3000, word: 'apple' });
    q = g.p;
    if (g.firstMastery) firsts++;
  }
  assert.ok(q.b >= MASTERED && q.m === 1 && firsts === 1);
  t += 5 * DAY;
  const lost = grade(q, false, { now: t, chose: 'adapt' }).p;
  assert.deepEqual([lost.d, lost.l, lost.c], [dayNum(t), 1, ['adapt']]);
  assert.ok(lost.s < q.s / 3 && lost.D > q.D && lost.b < MASTERED);
  // The latest mix-up goes first, four at most.
  let c = lost;
  for (const k of ['a', 'b', 'c', 'adapt', 'e']) c = grade(c, false, { now: t, chose: k }).p;
  assert.deepEqual(c.c, ['e', 'adapt', 'c', 'b']);
  // Missed before it was learnt isn't a lapse.
  assert.equal(grade(grade(undefined, false, { now }).p, false, { now }).p.l, undefined);
  // Progress from before the model (a box, no stability) still grades.
  const old = grade({ b: 3, d: dayNum(now), n: 3, r: 3, t: now - 3 * DAY }, true, { now, type: 'cloze', ms: 3000, word: 'apple' }).p;
  assert.ok(old.s > 3);
});

test('smart mode mixes every kind in a round, producing more the better a word is known, never unscrambling a long word', () => {
  const kinds = p => {
    const seen = new Set();
    for (let i = 0; i < 60; i++) seen.add(smartType(p, random, { word: 'apple' }, {}));
    return [...seen].sort();
  };
  assert.deepEqual(kinds({ b: 0 }), ['cloze', 'letters', 'listen', 'meaning', 'word']);
  assert.deepEqual(kinds({ b: 5 }), ['cloze', 'spell']);
  // A word that keeps slipping is asked as if it were two boxes on.
  assert.deepEqual(kinds({ b: 3, l: 2 }), ['cloze', 'spell']);
  for (let i = 0; i < 30; i++) assert.notEqual(smartType({ b: 2 }, random, { word: 'responsibility' }, {}), 'letters');
  // A round of new and learning words goes through all six kinds.
  const used = {};
  for (let i = 0; i < 12; i++) {
    const k = smartType({ b: i % 2 }, random, { word: 'apple' }, used);
    used[k] = (used[k] || 0) + 1;
  }
  assert.deepEqual(Object.keys(used).sort(), ['cloze', 'letters', 'listen', 'meaning', 'spell', 'word']);
});

test('a round leads with the likeliest forgotten, brings their mix-ups, holds new words back while many are being learnt, and keeps look-alikes apart', () => {
  const today = dayNum(now);
  const level1 = words.filter(w => w.level === 1);
  const progress = {};
  for (const w of level1.slice(0, 30)) progress[w.key] = { b: 3, s: 6, D: 5, d: today - 1, n: 3, r: 3, t: now - 7 * DAY };
  // Missed an hour ago, and one long overdue with little stability: first in line.
  progress[level1[40].key] = { b: 1, s: 0.4, D: 7, d: today, n: 4, r: 2, t: now - 3_600_000 };
  progress[level1[41].key] = { b: 2, s: 2, D: 8, d: today - 20, n: 9, r: 5, t: now - 22 * DAY, l: 3, c: [level1[50].key] };
  const round = pickRound(words, progress, { levels: [1], size: 10, now, random });
  assert.equal(round.length, 10);
  const keys = round.map(w => w.key);
  assert.ok(keys.includes(level1[40].key) && keys.includes(level1[41].key));
  // The word it was mixed up with comes along (new, not due).
  assert.ok(keys.includes(level1[50].key));
  // Plenty due (more than two rounds): 20% new, the mix-up partner one of them.
  assert.equal(round.filter(w => !progress[w.key]).length, 2);
  // With little due, mostly new.
  const few = pickRound(words, { [level1[0].key]: { b: 2, s: 2, d: today, n: 1, r: 1, t: now - 2 * DAY } }, { levels: [1], size: 10, now, random });
  assert.equal(few.filter(w => w.key !== level1[0].key).length, 9);
  // Sixty words still being learnt: no new ones, the slipping ones instead.
  const busy = Object.fromEntries(level1.slice(0, 60).map(w => [w.key, { b: 1, s: 1, D: 6, d: today + 1, n: 1, r: 1, t: now }]));
  const held = pickRound(words, busy, { levels: [1], size: 10, now, random });
  assert.equal(held.length, 10);
  assert.ok(held.every(w => busy[w.key]));
  // Studying: the next new words, the same each time, none already learnt or taken.
  const next = toStudy(words, progress, { levels: [1, 2], n: 10 });
  assert.equal(next.length, 10);
  assert.deepEqual(toStudy(words, progress, { levels: [1, 2], n: 10 }).map(w => w.key), next.map(w => w.key));
  assert.ok(next.every(w => !progress[w.key]) && next.some(w => w.level === 1) && next.some(w => w.level === 2));
  const taken = new Set(next.slice(0, 4).map(w => w.key));
  assert.deepEqual(toStudy(words, progress, { levels: [1, 2], n: 6, skip: taken }).map(w => w.key), next.slice(4).map(w => w.key));
  // A studied batch waiting for its quiz isn't brought in new by a round.
  const batch = new Set(toStudy(words, progress, { levels: [1], n: 60 }).map(w => w.key));
  assert.ok(pickRound(words, {}, { levels: [1], size: 10, now, random, skip: batch }).every(w => !batch.has(w.key)));
  // No two neighbours spelt alike when the round can avoid it.
  const alike = ['adapt', 'adopt', 'apple', 'happy', 'house', 'mouse'].map(W);
  const due = Object.fromEntries(alike.map(w => [w.key, { b: 2, s: 2, d: today, n: 1, r: 1, t: now - 3 * DAY }]));
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
  for (const k of ['economic', 'principle', 'desert', 'quiet', 'listen', 'accommodate']) {
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
  // A phrase among phrases (the list has none; four made up).
  const phrases = [['look up', 'v. 查閱'], ['give up', 'v. 放棄'], ['take off', 'v. 起飛'], ['put on', 'v. 穿上']].map(([word, zh], i) => ({ i: 9000 + i, word, key: word, zh, pos: 'v.', level: 3 }));
  assert.ok(distractors(phrases[0], [...words, ...phrases], 3, { type: 'word', random }).every(w => /\s/.test(w.word)));
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
  const progress = { apple: { b: 3, d: 20000, n: 4, r: 3, t: 1_790_000_000_000, s: 5.5, D: 4.25 }, go: { b: 5, d: 20100, n: 9, r: 9, t: 1_790_000_001_000, m: 1, l: 2, c: ['do', 'so'] }, sun: { b: 2, d: 20001, n: 1, r: 1, t: 1_790_000_002_000 } };
  const days = { '2026-10-04': 25 };
  const back = unpackProgress(JSON.parse(JSON.stringify(packProgress({ progress, levels: [1, 3], mode: 'cloze', days, study: ['tree'] }))));
  assert.deepEqual(back, { progress, levels: [1, 3], mode: 'cloze', days, study: ['tree'] });
  // Only levels that exist; none of them, none chosen.
  assert.equal(unpackProgress({ v: 3, w: {}, levels: ['toeic'] }).levels, null);
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
