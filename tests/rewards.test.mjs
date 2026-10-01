import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, grade, pickRound, makeQuestion, sameWord, spellDiff, stats, packProgress, unpackProgress, migrateWords, mergeProgress, payFor, dayNum, MASTERED, smartType } from '../public/lib/words.mjs';
import { xpToday, xpAllTime, xpText, missions, claimEntry, rankOf, streakDays, dailyMissionIds, MISSIONS, streakToday } from '../public/lib/earn.mjs';
import { move, canMove, mergePoints, pairResult, scoreRound, bestRound } from '../public/lib/games.mjs';
import { HELP, HELP_ORDER, parseHelpHash } from '../public/lib/help.mjs';
import { STRINGS } from '../public/lib/i18n.mjs';
import { ECONOMY, taipeiDay } from '../public/lib/quadra.mjs';

// Noon in Taiwan on a day (searching from `from`, a step of `dir` days) whose
// daily missions include `ids`.
function dayWith(ids, from, dir = 1) {
  for (let t = Date.parse(`${from}T04:00:00Z`), i = 0; i < 400; i++, t += dir * 86_400_000) if (ids.every(id => dailyMissionIds(taipeiDay(t)).includes(id))) return t;
  throw new Error('no such day');
}
const words = loadWords(JSON.parse(readFileSync(new URL('../public/data/words.json', import.meta.url))));
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test('the word list has levels 1 to 6 with meanings', () => {
  assert.equal(words.length, 6170);
  for (const l of [1, 2, 3, 4, 5, 6]) assert.ok(words.filter(w => w.level === l).length > 950);
  assert.equal(words.filter(w => !w.zh).length, 0);
});

test('boxes go up on right answers, once a day, back to 1 on a miss, cards cap at 1', () => {
  const now = Date.parse('2026-09-28T04:00:00Z');
  const day = 86_400_000;
  // Right the first time: already known, box 3, due tomorrow. Right again the
  // same day (any kind of question) doesn't master it; right tomorrow does.
  let p = grade(undefined, true, { now }).p;
  assert.equal(p.b, 3);
  assert.equal(p.d, dayNum(now) + 1);
  for (const type of ['word', 'listen', 'spell']) assert.equal(grade(p, true, { type, now: now + 60_000 }).p.b, 3);
  assert.equal(grade(undefined, true, { type: 'spell', now }).p.b, 3);
  const r = grade(p, true, { now: now + day });
  assert.equal(r.p.b, 4);
  assert.equal(r.firstMastery, true);
  // Missed first: box 1; a retry right the same day stays in 1, due tomorrow;
  // then one box a day.
  let s = grade(undefined, false, { now }).p;
  assert.equal(s.b, 1);
  s = grade(s, true, { now: now + 60_000 }).p;
  assert.deepEqual([s.b, s.d], [1, dayNum(now) + 1]);
  for (let i = 1; i <= 3; i++) s = grade(s, true, { now: now + i * day }).p;
  assert.equal(s.b, 4);
  assert.equal(grade(p, false, { now }).p.b, 1);
  assert.equal(grade(undefined, true, { type: 'card', now }).p.b, 1);
  assert.equal(grade(grade(undefined, false, { now }).p, true, { type: 'card', now }).p.b, 1);
  // First mastery pays once only.
  let q;
  let firsts = 0;
  for (let i = 0; i < 8; i++) {
    const g = grade(q, true, { now: now + i * day });
    q = g.p;
    if (g.firstMastery) firsts++;
    if (i === 4) q = grade(q, false, { now: now + i * day + 1000 }).p;
  }
  assert.equal(firsts, 1);
});

test('smart mode spreads a round over the five kinds that test (never a flash card)', () => {
  const seen = new Set();
  const used = {};
  const word = { word: 'apple', level: 1 };
  for (let i = 0; i < 12; i++) {
    const k = smartType({ b: [0, 0, 1, 2, 3, 0][i % 6] }, Math.random, word, used);
    used[k] = (used[k] || 0) + 1;
    seen.add(k);
  }
  assert.deepEqual([...seen].sort(), ['letters', 'listen', 'meaning', 'spell', 'word']);
  // A long word is never unscrambled.
  for (let i = 0; i < 30; i++) assert.notEqual(smartType({ b: 3 }, Math.random, { word: 'responsibility' }, {}), 'letters');
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

test('points: right answers and first mastery, nothing for cards', () => {
  assert.equal(payFor({ correct: true, type: 'meaning' }, ECONOMY.vocab), 2);
  assert.equal(payFor({ correct: true, type: 'spell', firstMastery: true }, ECONOMY.vocab), 17);
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

test('points per kind today (old paid entries count as points), missions and claims', () => {
  // Before the streak's missions rule (any game kept a day then).
  const now = dayWith(['words20', 'game1'], '2026-09-30', -1);
  const day = taipeiDay(now);
  const wallet = {
    entries: [
      { id: 'vocab:w:1', t: now - 1000, app: 'vocab', kind: 'words', amount: 90 },
      { id: 'vocab:old', t: now - 2000, app: 'vocab', kind: 'reward', amount: 10 },
      { id: 'vocab:g:1', t: now - 3000, app: 'vocab', kind: 'game', amount: 0, xp: 20 },
      { id: 'vocab:shop:boost:a', t: now - 4000, app: 'vocab', kind: 'shop', amount: -150 },
      { id: 'vocab:g:0', t: now - 3 * 86_400_000, app: 'vocab', kind: 'game', amount: 20 },
      { id: 'odds:x', t: now, app: 'odds', kind: 'bet', amount: -100 }
    ],
    settings: { 'act:vocab': { value: { day, n: { answer: 25, master: 1, game: 1 } }, t: now }, 'act:stock': { value: { day, n: { trade: 1 } }, t: now } },
    apps: { stock: { last: now }, match: { last: now - 3 * 86_400_000 }, vocab: { last: now } }
  };
  const e = xpToday(wallet, now);
  assert.deepEqual([e.words, e.game, e.mission, e.total], [100, 20, 0, 120]);
  assert.equal(xpAllTime(wallet), 140);
  const ms = Object.fromEntries(missions(wallet, now).map(m => [m.id, m]));
  assert.ok(ms.words20.done && ms.game1.done && ms.invest.done);
  for (const id of ['master3', 'match', 'tour']) assert.ok(!ms[id]?.done, id);
  const entry = claimEntry(wallet, 'words20', now);
  // Points, never money.
  assert.deepEqual([entry.amount, entry.xp, entry.kind], [0, 15, 'mission']);
  assert.equal(entry.id, `vocab:m:${day}:words20`);
  assert.equal(claimEntry({ ...wallet, entries: [...wallet.entries, entry] }, 'words20', now), null);
  assert.equal(claimEntry(wallet, 'master3', now), null);
  assert.equal(streakDays(wallet, now), 1);
  // Every mission gives points; none gives money or a free bet.
  for (const m of missions(wallet, now)) assert.ok(m.xp > 0 && !m.pay && !m.freebet, m.id);
  assert.deepEqual([xpText(1234), xpText(2.4, { sign: true }), xpText(0)], ['1,234 XP', '+2.4 XP', '0 XP']);
});

test('wealth ranks', () => {
  assert.equal(rankOf(30_000).rank.id, 'start');
  assert.equal(rankOf(50_000).rank.id, 'saver');
  assert.equal(rankOf(2e8).next, null);
  assert.equal(rankOf(75_000).progress, 0.5);
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

test('new games: every one gives a modest round of points', async () => {
  const { GAMES, bestRound, STREAK, ICON } = await import('../public/lib/games.mjs');
  assert.equal(GAMES.length, 6);
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
  for (let n = 1; n <= 7; n++) entries.push({ id: dailyId(taipeiDay(day(n))), t: day(n), app: 'vocab', kind: 'game', amount: 0, xp: 10 });
  const wallet = { entries };
  assert.equal(dailyStreak(wallet, now), 7);
  assert.equal(longestStreak(wallet), 7);
  assert.equal(streakAtRisk(wallet, now), 0);
  assert.equal(streakAtRisk(wallet, Date.parse('2026-09-28T13:00:00Z')), 7);
  const wk = { entries: [...entries, ...Array.from({ length: 10 }, (_, i) => ({ id: `vocab:g:${i}`, t: now - i, app: 'vocab', kind: 'game', amount: 0, xp: 150 }))] };
  const goals = weeklyGoals(wk, now);
  assert.equal(goals.find(g => g.id === 'games10').done, true);
  assert.equal(goals.find(g => g.id === 'earn1000').done, true);
  // Days kept with missions (none here: games kept the streak then).
  assert.equal(goals.find(g => g.id === 'days5').progress, 0);
  const claim = claimWeekly(wk, 'games10', now);
  // 30 XP, and the 8-day streak's +16%.
  const { xpRate } = await import('../public/lib/earn.mjs');
  assert.equal(xpRate(wk, now), 1.16);
  assert.deepEqual([claim.kind, claim.amount, claim.xp], ['mission', 0, Math.round(30 * 1.16)]);
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

test('missions count concrete things: an order, three stocks opened, a match opened', () => {
  const now = dayWith(['match', 'quotes'], '2026-10-05');
  const day = taipeiDay(now);
  const act = (app, n) => ({ [`act:${app}`]: { value: { day, n }, t: now } });
  const ms = w => Object.fromEntries(missions({ entries: [], settings: w }, now).map(m => [m.id, m]));
  // Watching or following doesn't count.
  let m = ms({ ...act('stock', { watch: 3 }), ...act('match', { follow: 2 }) });
  assert.ok(!m.invest.done && !m.match.done && !m.quotes.done);
  m = ms({ ...act('stock', { trade: 1, view: 2 }), ...act('match', { open: 1 }) });
  assert.ok(m.invest.done && m.match.done && !m.quotes.done);
  assert.equal(ms(act('stock', { view: 3 })).quotes.done, true);
  // Every mission has a text in both languages, and an icon-free id.
  for (const x of MISSIONS) assert.ok(STRINGS.zh[`mission_${x.id}`] && STRINGS.en[`mission_${x.id}`], x.id);
});

test('six daily missions a day (three in Rewards), bonus ones always; three claimed keep the streak', () => {
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const day = taipeiDay(Date.parse('2026-10-02T04:00:00Z') + i * 86_400_000);
    const ids = dailyMissionIds(day);
    assert.equal(ids.length, 6);
    assert.equal(ids.filter(id => MISSIONS.find(m => m.id === id).app === 'vocab').length, 3);
    assert.deepEqual(dailyMissionIds(day), ids);
    const groups = ids.map(id => MISSIONS.find(m => m.id === id).group).filter(Boolean);
    assert.equal(new Set(groups).size, groups.length);
    ids.forEach(id => seen.add(id));
  }
  // Every everyday mission comes up; the bonus ones (they spend money) never are daily ones.
  for (const m of MISSIONS) assert.equal(seen.has(m.id), !m.bonus, m.id);
  const now = dayWith(['words20', 'game1'], '2026-10-05');
  const day = taipeiDay(now);
  const w = { entries: [{ id: `vocab:d:${day}`, t: now, app: 'vocab', kind: 'game', amount: 0, xp: 5 }], settings: { 'act:vocab': { value: { day, n: { answer: 20, game: 1, hard: 10, perfect: 1 } }, t: now }, 'act:odds': { value: { day, n: { parlay: 1, scratch: 1, lottery: 1 } }, t: now } } };
  const list = missions(w, now);
  assert.deepEqual(list.filter(m => m.bonus).map(m => m.id), ['invest', 'parlay3', 'scratch', 'lotto']);
  assert.equal(list.filter(m => !m.bonus).length, 6);
  // Two daily ones and three bonus ones (two count): four, not kept yet; a third daily one makes five.
  for (const id of ['parlay3', 'scratch', 'lotto', 'words20', 'game1']) w.entries.push(claimEntry(w, id, now));
  assert.deepEqual(streakToday(w, now), { n: 4, goal: 5, kept: false });
  assert.equal(streakDays(w, now), 0);
  const third = list.find(m => !m.bonus && m.done && !['words20', 'game1'].includes(m.id));
  assert.ok(third);
  w.entries.push(claimEntry(w, third.id, now));
  assert.equal(streakToday(w, now).kept, true);
  assert.equal(streakDays(w, now), 1);
});
