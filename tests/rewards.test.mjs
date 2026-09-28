import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, grade, pickRound, makeQuestion, sameWord, spellDiff, stats, packProgress, unpackProgress, migrateWords, mergeProgress, payFor, dayNum, MASTERED } from '../public/lib/words.mjs';
import { earnedToday, missions, claimEntry, rankOf, streakDays, CAPS } from '../public/lib/earn.mjs';
import { move, canMove, mergePoints, pairResult, scoreRound, bestRound } from '../public/lib/games.mjs';
import { HELP, HELP_ORDER, parseHelpHash } from '../public/lib/help.mjs';
import { STRINGS } from '../public/lib/i18n.mjs';
import { ECONOMY, taipeiDay } from '../public/lib/quadra.mjs';

const words = loadWords(JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url))));
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('the word list has levels 1 to 6 with meanings', () => {
  assert.equal(words.length, 6170);
  for (const l of [1, 2, 3, 4, 5, 6]) assert.ok(words.filter(w => w.level === l).length > 950);
  assert.equal(words.filter(w => !w.zh).length, 0);
});

test('boxes go up on right answers, back to 1 on a miss, cards cap at 1', () => {
  const now = Date.parse('2026-09-28T04:00:00Z');
  // Right the first time: already known, straight to box 3; one more masters it.
  let p = grade(undefined, true, { now }).p;
  assert.equal(p.b, 3);
  p = grade(p, true, { now }).p;
  assert.equal(p.b, 4);
  assert.equal(p.m, 1);
  // Missed first, then climbing one box at a time.
  let s = grade(undefined, false, { now }).p;
  assert.equal(s.b, 1);
  for (let i = 0; i < 3; i++) s = grade(s, true, { now }).p;
  assert.equal(s.b, 4);
  assert.equal(grade(p, false, { now }).p.b, 1);
  assert.equal(grade(undefined, true, { type: 'card', now }).p.b, 1);
  assert.equal(grade(grade(undefined, false, { now }).p, true, { type: 'card', now }).p.b, 1);
  // First mastery pays once only.
  let q;
  let firsts = 0;
  for (let i = 0; i < 6; i++) {
    const r = grade(q, true, { now });
    q = r.p;
    if (r.firstMastery) firsts++;
    if (i === 4) q = grade(q, false, { now }).p;
  }
  assert.equal(firsts, 1);
});

test('a round mixes due reviews and new words in the chosen levels', () => {
  const now = Date.now();
  const progress = {};
  for (const w of words.filter(w => w.level === 1).slice(0, 20)) progress[w.key] = { b: 2, d: dayNum(now) - 1, n: 2, r: 2, t: now };
  const round = pickRound(words, progress, { levels: [1, 2], size: 10, random });
  assert.equal(round.length, 10);
  assert.ok(round.every(w => w.level <= 2));
  const due = round.filter(w => progress[w.key]).length;
  assert.ok(due >= 5 && due <= 7, `due ${due}`);
});

test('questions: four distinct choices with the answer among them', () => {
  const w = words.find(x => x.word === 'student');
  for (const type of ['meaning', 'word', 'listen']) {
    const q = makeQuestion(w, type, words, { random });
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.key)).size, 4);
    assert.ok(q.choices.some(c => c.key === w.key));
  }
  const l = makeQuestion(w, 'letters', words, { random });
  assert.deepEqual([...l.letters].sort(), [...w.word].sort());
  assert.ok(sameWord(' Student ', 'student'));
  assert.ok(sameWord('o’clock', "o'clock"));
  assert.deepEqual(spellDiff('studnet', 'student').map(d => d.ok), [true, true, true, true, false, false, true]);
});

test('pay: right answers and first mastery, nothing for cards', () => {
  assert.equal(payFor({ correct: true, type: 'meaning' }, ECONOMY.vocab), 3);
  assert.equal(payFor({ correct: true, type: 'spell', firstMastery: true }, ECONOMY.vocab), 28);
  assert.equal(payFor({ correct: true, type: 'card' }, ECONOMY.vocab), 0);
});

test('progress round-trips, merges newest per word, and Quadra Words migrates', () => {
  const progress = { apple: { b: 3, d: 20000, n: 4, r: 3, t: 1_790_000_000_000 }, go: { b: 5, d: 20100, n: 9, r: 9, t: 1_790_000_001_000, m: 1 } };
  const back = unpackProgress(JSON.parse(JSON.stringify(packProgress({ progress, levels: [1, 2], mode: 'spell' }))));
  assert.deepEqual(back.progress, progress);
  assert.deepEqual(back.levels, [1, 2]);
  const merged = mergeProgress(progress, { apple: { b: 1, d: 1, n: 5, r: 3, t: 1_790_000_009_000 } });
  assert.equal(merged.apple.b, 1);
  const base = 1_790_000_000_000;
  const old = migrateWords({ exportedAt: base, progress: { abandon: [5, 4, 2, 1200, 1, 60], absorb: [3, 1, 0, 900, 2, 120], Absolute: { attempts: 2, correct: 1, correctStreak: 1, lastResult: 'correct', lastSeen: base } } });
  assert.equal(old.abandon.b, MASTERED);
  assert.equal(old.abandon.m, 1);
  assert.equal(old.absorb.b, 1);
  assert.equal(old.absolute.b, 2);
  assert.ok(unpackProgress({ source: 'vocab-tool-sync', exportedAt: base, progress: { abandon: [1, 1, 1, null, 1, 0] } }).progress.abandon);
  assert.equal(stats(words, old).all.mastered, 1);
});

test('earnings per kind today, missions and claims', () => {
  const now = Date.parse('2026-09-28T04:00:00Z');
  const day = taipeiDay(now);
  const wallet = {
    entries: [
      { id: 'vocab:w:1', t: now - 1000, app: 'vocab', kind: 'words', amount: 90 },
      { id: 'vocab:old', t: now - 2000, app: 'vocab', kind: 'reward', amount: 10 },
      { id: 'vocab:g:1', t: now - 3000, app: 'vocab', kind: 'game', amount: 20 },
      { id: 'vocab:g:0', t: now - 3 * 86_400_000, app: 'vocab', kind: 'game', amount: 20 },
      { id: 'odds:x', t: now, app: 'odds', kind: 'bet', amount: -100 }
    ],
    settings: { 'act:vocab': { value: { day, n: { answer: 25, master: 1, game: 1 } }, t: now }, 'act:stock': { value: { day, n: { trade: 1 } }, t: now } },
    apps: { stock: { last: now }, match: { last: now - 3 * 86_400_000 }, vocab: { last: now } }
  };
  const e = earnedToday(wallet, now);
  assert.deepEqual([e.words, e.game, e.mission], [100, 20, 0]);
  const ms = Object.fromEntries(missions(wallet, now).map(m => [m.id, m]));
  assert.ok(ms.words20.done && ms.game1.done && ms.invest.done);
  assert.ok(!ms.master3.done && !ms.match.done && !ms.tour.done);
  const entry = claimEntry(wallet, 'words20', now);
  assert.equal(entry.amount, 60);
  assert.equal(entry.id, `vocab:m:${day}:words20`);
  assert.equal(claimEntry({ ...wallet, entries: [...wallet.entries, entry] }, 'words20', now), null);
  assert.equal(claimEntry(wallet, 'master3', now), null);
  assert.equal(streakDays(wallet, now), 1);
  assert.equal(CAPS.words + CAPS.game + CAPS.mission, 1300);
});

test('wealth ranks', () => {
  assert.equal(rankOf(110_000).rank.id, 'start');
  assert.equal(rankOf(150_000).rank.id, 'saver');
  assert.equal(rankOf(2e8).next, null);
  assert.equal(rankOf(225_000).progress, 0.5);
});

test('2048 moves and merges', () => {
  const b = [2, 2, 4, 4, 0, 0, 0, 0, 8, 0, 8, 16, 0, 0, 0, 0];
  const r = move(b, 'left');
  assert.deepEqual(r.board.slice(0, 4), [4, 8, 0, 0]);
  assert.deepEqual(r.board.slice(8, 12), [16, 16, 0, 0]);
  assert.deepEqual(r.merged.sort((x, y) => x - y), [4, 8, 16]);
  assert.equal(mergePoints([16, 32, 8]), 3);
  assert.equal(canMove([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]), false);
  assert.equal(move(b, 'up').board[0], 2);
});

test('word pairs: a miss costs only after both cards were seen', () => {
  const a = { id: 'x:w', key: 'x', face: 'word' };
  const b = { id: 'y:m', key: 'y', face: 'meaning' };
  assert.equal(pairResult(a, { id: 'x:m', key: 'x', face: 'meaning' }, new Set()), 'match');
  assert.equal(pairResult(a, b, new Set(['x:w'])), 'look');
  assert.equal(pairResult(a, b, new Set(['x:w', 'y:m'])), 'miss');
  assert.ok(scoreRound('pairs', ['ok', 'ok', 'ok']).total > 0);
  for (const g of ['derby', 'freethrow', 'pairs']) assert.ok(bestRound(g) <= 80, g);
});

test('help covers every app in both languages, and every string exists in both', () => {
  for (const app of HELP_ORDER) {
    assert.ok(HELP[app].zh.length && HELP[app].zh.length === HELP[app].en.length, app);
    HELP[app].zh.forEach((s, i) => assert.equal(s[0], HELP[app].en[i][0]));
  }
  assert.deepEqual(parseHelpHash('#help=stock:orders'), { app: 'stock', topic: 'orders' });
  assert.equal(parseHelpHash('#words'), null);
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.zh).sort());
});

test('new games: every one pays a modest round, inside the daily cap', async () => {
  const { GAMES, bestRound, STREAK, ICON } = await import('../public/lib/games.mjs');
  assert.equal(GAMES.length, 8);
  for (const g of GAMES) {
    assert.ok(STREAK[g] && ICON[g], g);
    assert.ok(bestRound(g) > 0 && bestRound(g) <= 80, `${g} ${bestRound(g)}`);
    assert.ok(STRINGS.zh[`game_${g}`] && STRINGS.en[`gameKind_${g}`], g);
  }
});

test('speed match: four different meanings with the answer among them', async () => {
  const { speedQuestion } = await import('../public/lib/games.mjs');
  const pool = words.slice(0, 300).map(w => ({ key: w.key, word: w.word, meaning: w.zh.split('、')[0] }));
  for (let i = 0; i < 50; i++) {
    const q = speedQuestion(pool, random);
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(c => c.meaning)).size, 4);
    assert.ok(q.choices.includes(q.word));
  }
});

test('hangman: hits keep lives, misses cost one, solved and over', async () => {
  const { guessLetter, hangmanSolved, hangmanOver, hangmanMask, hangmanPay, HANGMAN } = await import('../public/lib/games.mjs');
  let s = { word: 'apple', guessed: new Set(), lives: HANGMAN.lives };
  s = guessLetter(s, 'p').state;
  assert.deepEqual(hangmanMask(s), ['_', 'p', 'p', '_', '_']);
  const miss = guessLetter(s, 'z');
  assert.equal(miss.hit, false);
  assert.equal(miss.state.lives, HANGMAN.lives - 1);
  assert.equal(guessLetter(miss.state, 'z').hit, null);
  for (const ch of 'ale') s = guessLetter(s, ch).state;
  assert.ok(hangmanSolved(s) && hangmanOver(s));
  assert.ok(hangmanPay(6) > hangmanPay(1));
});

test('mini sudoku: a valid grid and a puzzle with exactly one answer', async () => {
  const { sudokuPuzzle, sudokuCount, sudokuOk } = await import('../public/lib/games.mjs');
  for (let n = 0; n < 40; n++) {
    const { puzzle, solution } = sudokuPuzzle(random);
    for (let i = 0; i < 16; i++) assert.ok(sudokuOk(solution, i, solution[i]));
    assert.equal(sudokuCount(puzzle), 1);
    assert.ok(puzzle.every((v, i) => !v || v === solution[i]));
    assert.ok(puzzle.filter(Boolean).length <= 8);
  }
});

test('daily challenge, weekly goals, badges and bests', async () => {
  const { dailyGame, dailyBonus, DAILY, mergeBests, GAMES, ALL_GAMES } = await import('../public/lib/games.mjs');
  const { dailyStreak, dailyId, weeklyGoals, claimWeekly, weekStart, badges, longestStreak, streakAtRisk } = await import('../public/lib/earn.mjs');
  assert.ok(ALL_GAMES.includes(dailyGame('2026-09-28')));
  assert.equal(dailyGame('2026-09-28'), dailyGame('2026-09-28'));
  assert.equal(dailyBonus(0), DAILY.base);
  assert.equal(dailyBonus(99), DAILY.base + DAILY.perDay * DAILY.maxDays);
  // Monday 28 Sep 2026, noon in Taiwan.
  const now = Date.parse('2026-09-28T04:00:00Z');
  assert.equal(weekStart(now), '2026-09-28');
  assert.equal(weekStart(Date.parse('2026-10-04T15:00:00Z')), '2026-09-28');
  const day = n => now - n * 86_400_000;
  const entries = [];
  for (let n = 1; n <= 7; n++) entries.push({ id: dailyId(taipeiDay(day(n))), t: day(n), app: 'vocab', kind: 'game', amount: 10 });
  const wallet = { entries };
  assert.equal(dailyStreak(wallet, now), 7);
  assert.equal(longestStreak(wallet), 7);
  assert.equal(streakAtRisk(wallet, now), 0);
  assert.equal(streakAtRisk(wallet, Date.parse('2026-09-28T13:00:00Z')), 7);
  const wk = { entries: [...entries, ...Array.from({ length: 10 }, (_, i) => ({ id: `vocab:g:${i}`, t: now - i, app: 'vocab', kind: 'game', amount: 150 }))] };
  const goals = weeklyGoals(wk, now);
  assert.equal(goals.find(g => g.id === 'games10').done, true);
  assert.equal(goals.find(g => g.id === 'earn1500').done, true);
  assert.equal(goals.find(g => g.id === 'days5').progress, 1);
  const claim = claimWeekly(wk, 'games10', now);
  assert.equal(claim.kind, 'mission');
  assert.ok(claim.amount <= CAPS.mission);
  assert.equal(claimWeekly({ entries: [...wk.entries, claim] }, 'games10', now), null);
  const b = badges({ wallet: wk, mastered: 120, bests: {}, games: GAMES });
  assert.ok(b.find(x => x.id === 'firstGame').earned);
  assert.ok(b.find(x => x.id === 'words100').earned);
  assert.ok(b.find(x => x.id === 'daily7').earned);
  assert.ok(!b.find(x => x.id === 'allGames').earned);
  assert.deepEqual(mergeBests({ pairs: { v: 10, t: 1 } }, { pairs: { v: 8, t: 2 }, merge: { v: 5, t: 3 } }), { pairs: { v: 10, t: 1 }, merge: { v: 5, t: 3 } });
});

test('the word of the day changes daily and is a single word', async () => {
  const { wordOfDay } = await import('../public/lib/words.mjs');
  const a = wordOfDay(words, Date.parse('2026-09-28T04:00:00Z'));
  const b = wordOfDay(words, Date.parse('2026-09-29T04:00:00Z'));
  assert.notEqual(a.key, b.key);
  assert.match(a.word, /^[a-z]+$/);
});
