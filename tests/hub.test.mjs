// Practice (points, the goal, the streak), the text, and what Orbit Words
// is: an Orbit app that moves no money (Truth and the guides are the kit's).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { xpOf, answerXp, levelOf, logAnswer, mergeDays, todayCount, streakOf, bestStreak, streakAtRisk, lastDays, DAILY_GOAL } = await import('../public/lib/practice.mjs');
const { STRINGS } = await import('../public/lib/i18n.mjs');
const kit = await import('#kit/quadra.mjs');

const noon = day => Date.parse(`${day}T04:00:00Z`);

test('points: 2 a right answer, 15 a first mastery; the level from them', () => {
  assert.equal(xpOf({ a: { r: 3, m: 1 }, b: { r: 10 } }), 3 * 2 + 15 + 20);
  assert.equal(answerXp({ correct: true, firstMastery: true }), 17);
  assert.equal(answerXp({ correct: false }), 0);
  assert.deepEqual([0, 99, 100, 1_600, 8_100, 36_100].map(x => levelOf(x).level), [1, 1, 2, 5, 10, 20]);
  assert.equal(levelOf(8_100, 'en').title, 'Skilled');
  assert.equal(levelOf(550).toNext, 350);
});

test('the day’s goal and the streak: 20 answers keep a day; two devices take the larger count', () => {
  let days = {};
  for (let i = 0; i < DAILY_GOAL; i++) days = logAnswer(days, noon('2026-10-03'));
  for (let i = 0; i < DAILY_GOAL; i++) days = logAnswer(days, noon('2026-10-04'));
  days = logAnswer(days, noon('2026-10-05'));
  assert.equal(todayCount(days, noon('2026-10-05')), 1);
  // Today isn't kept yet: the streak is yesterday's, and it ends tonight.
  assert.equal(streakOf(days, noon('2026-10-05')), 2);
  assert.equal(streakAtRisk(days, noon('2026-10-05')), 2);
  const other = { '2026-10-05': 25, '2026-10-01': 30 };
  const both = mergeDays(days, other);
  assert.equal(both['2026-10-05'], 25);
  assert.equal(streakOf(both, noon('2026-10-05')), 3);
  assert.equal(streakAtRisk(both, noon('2026-10-05')), 0);
  // 1 October kept too, but 2 October wasn't.
  assert.equal(bestStreak(both), 3);
  assert.equal(streakOf(both, noon('2026-10-07')), 0);
  assert.deepEqual(lastDays(both, 3, noon('2026-10-05')).map(d => d.kept), [true, true, true]);
  // Old days fall away.
  assert.equal(Object.keys(logAnswer({ '2024-01-01': 50 }, noon('2026-10-05'))).length, 1);
});

test('the text: every string in both languages', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.zh).sort());
});

test('Orbit Words is an Orbit app that moves no money, with no games, missions, shop or points to spend', () => {
  assert.equal(kit.APPS.vocab.name, 'Orbit Words');
  assert.equal(kit.APPS.vocab.family, 'orbit');
  const files = [];
  const walk = dir => {
    for (const f of readdirSync(dir)) {
      const p = `${dir}/${f}`;
      if (statSync(p).isDirectory()) f !== 'data' && f !== 'icons' && walk(p);
      else if (/\.(m?js|html|css|webmanifest)$/.test(f) && !/quadra\.(mjs|css)$|boot\.js$/.test(f)) files.push(p);
    }
  };
  walk(new URL('../public', import.meta.url).pathname);
  const text = files.map(f => readFileSync(f, 'utf8')).join('\n');
  for (const gone of [/Quadra Rewards/, /Quadra-Rewards/, /arcade|ported|games-ui|mini games|小遊戲|遊戲列表|今日挑戰/i, /\bmissions?\b|任務/i, /積分商店|積分兌換|保護卡/, /vocab:(?:w|g|m|xs|shop|fb):/]) assert.doesNotMatch(text, gone, String(gone));
  // It writes its payload, never an entry or a setting.
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /entries:|settings/);
});
