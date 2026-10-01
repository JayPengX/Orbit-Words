// Practice (points, the goal, the streak), Truth's numbers, the guides and
// the text, and what Quadra Hub is: a related add-on that moves no money.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { xpOf, answerXp, levelOf, logAnswer, mergeDays, todayCount, streakOf, bestStreak, streakAtRisk, lastDays, DAILY_GOAL } = await import('../public/lib/practice.mjs');
const { PLAY, houseKeep, boostedKeep, freeBetWorth, roundTrip, plusMath, record, overdraftYear, vipShare } = await import('../public/lib/truth.mjs');
const { HELP, HELP_ORDER, parseHelpHash } = await import('../public/lib/help.mjs');
const { STRINGS } = await import('../public/lib/i18n.mjs');
const kit = await import('../public/lib/quadra.mjs');

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

test('truth: what the house keeps, what boosts and free bets are worth, what trading costs', () => {
  assert.equal(Math.round(houseKeep(1) * 1000), 136);
  assert.equal(Math.round(houseKeep(3) * 1000), 356);
  assert.ok(houseKeep(7) > 4 * houseKeep(1));
  // The boost gives back a little of the cut; Plus's a little more, never all of it.
  const plain = boostedKeep(3, 8);
  const plus = boostedKeep(3, 8, kit.PLUS.odds.boost);
  assert.ok(plus < plain && plain < houseKeep(3) && plus > 0.3);
  assert.equal(freeBetWorth(200), 86);
  assert.ok(freeBetWorth(200, PLAY.freeMinOdds) < freeBetWorth(200));
  assert.deepEqual(roundTrip(100_000), { fee: 284, tax: 300, total: 584, share: 0.00584 });
  assert.equal(roundTrip(100_000, true).fee, 2 * Math.floor(100_000 * 0.001425 * kit.PLUS.stock.commission));
  // The commission minimum still applies.
  assert.equal(roundTrip(1_000).fee, 40);
  const m = plusMath();
  assert.equal(m.fee, kit.PLUS.fee);
  assert.ok(m.betsWorth < m.betsFace && m.betsWorth < m.fee);
  assert.equal(m.tradesToBreakEven, Math.ceil(kit.PLUS.fee / m.savedPerTrade));
  assert.ok(overdraftYear() > 0.12 && overdraftYear() < 0.13);
  assert.ok(kit.VIP.tiers.every(t => vipShare(t) < 0.15));
});

test('truth: this account’s own record from the wallet', () => {
  const e = (app, kind, amount, extra = {}) => ({ id: `${app}:${kind}:${amount}`, t: 1, app, kind, amount, ...extra });
  const w = {
    entries: [
      e('eco', 'start', 30_000), e('eco', 'pay', 6_000), e('eco', 'plus', -490), e('eco', 'od', -120), e('eco', 'vip', 80),
      e('eco', 'freebet', 0, { note: '200' }), e('odds', 'stake', -1_000), e('odds', 'refund', 100), e('odds', 'payout', 450), e('odds', 'plusboost', 12),
      e('odds', 'lottery', -300), e('odds', 'prize', 100)
    ],
    snap: {}
  };
  const r = record(w);
  assert.deepEqual([r.staked, r.won, r.tickets, r.prizes, r.plusPaid, r.od, r.vip, r.freeBets], [900, 462, 300, 100, 490, 120, 80, 200]);
  assert.equal(Math.round(r.betBack * 100), 51);
  assert.equal(r.sides.given, 36_080);
  assert.equal(record({ entries: [] }).betBack, null);
});

test('help covers every app in both languages; every string exists in both', () => {
  for (const app of HELP_ORDER) {
    assert.ok(HELP[app].zh.length && HELP[app].zh.length === HELP[app].en.length, app);
    HELP[app].zh.forEach((s, i) => assert.equal(s[0], HELP[app].en[i][0]));
  }
  assert.deepEqual(parseHelpHash('#help=stock:orders'), { app: 'stock', topic: 'orders' });
  assert.equal(parseHelpHash('#words'), null);
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.zh).sort());
});

test('Quadra Hub is a related add-on that moves no money, with no games, missions, shop or points to spend', () => {
  assert.equal(kit.APPS.vocab.name, 'Quadra Hub');
  assert.equal(kit.APPS.vocab.path, '/Quadra-Hub/');
  assert.equal(kit.APPS.vocab.related, true);
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
  // It writes its payload and a member's looks, never an entry.
  const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /entries:/);
});
