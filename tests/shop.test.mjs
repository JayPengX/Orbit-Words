import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOP, shopEntry, freezes, boostUntil } from '../public/lib/shop.mjs';
import { streakDays, freezeDue, longestStreak } from '../public/lib/earn.mjs';
import { taipeiDay, PLUS } from '../public/lib/quadra.mjs';

const DAY = 86_400_000;
const now = Date.parse('2026-09-28T04:00:00Z');
const played = n => ({ id: `vocab:g:${n}`, t: now - n * DAY, app: 'vocab', kind: 'game', amount: 0, xp: 10 });

test('protection cards: bought, granted a Plus month, used on a missed day', () => {
  // Played 5 to 2 days ago, missed yesterday: one card saves the streak.
  const entries = [2, 3, 4, 5].map(played);
  assert.equal(streakDays({ entries }, now), 0);
  assert.deepEqual(freezeDue({ entries }, now), []);
  const bought = [...entries, shopEntry('freeze', 'a', now - 6 * DAY)];
  assert.equal(freezes({ entries: bought }, now).held, 1);
  const due = freezeDue({ entries: bought }, now);
  assert.deepEqual(due.map(e => e.id), [`vocab:fz:${taipeiDay(now - DAY)}`]);
  const after = { entries: [...bought, ...due] };
  assert.equal(freezes(after, now).held, 0);
  assert.equal(streakDays(after, now), 5);
  assert.equal(longestStreak(after), 5);
  assert.deepEqual(freezeDue(after, now), []);
  // Two days missed and one card: the streak can't be saved, the card stays.
  const two = { entries: [3, 4].map(played).concat(shopEntry('freeze', 'b', now - 9 * DAY)) };
  assert.deepEqual(freezeDue(two, now), []);
  // A Plus month grants one (a yearly plan's later months don't count yet).
  const plus = { entries: [2, 3].map(played).concat(['2026-09', '2026-10', '2026-11'].map(m => ({ id: `eco:plus:${m}`, t: now, app: 'eco', kind: 'plus', amount: 0 }))) };
  assert.equal(freezes(plus, now).granted, PLUS.vocab.cards);
  assert.equal(freezeDue(plus, now).length, 1);
  assert.equal(shopEntry('freeze', 'x', now).amount, -SHOP.freeze.price);
});

test('the ×2 boost: 30 minutes, stacked', () => {
  const w = { entries: [shopEntry('boost', 'a', now - 10 * 60_000), shopEntry('boost', 'b', now - 5 * 60_000)] };
  assert.equal(boostUntil(w, now), now - 10 * 60_000 + 60 * 60_000);
  assert.equal(boostUntil(w, now + 2 * 3_600_000), 0);
  assert.equal(shopEntry('boost', 'x', now).amount, -SHOP.boost.price);
});

test('word packs: bought once, half price for Plus, and they join the word list', async () => {
  const { packEntry, packOwned, ownedPacks, packPrice, packOpen, openPacks } = await import('../public/lib/shop.mjs');
  const { loadWords, addPacks, pickRound, stats, inLevels, PACK_IDS } = await import('../public/lib/words.mjs');
  const w = { entries: [] };
  assert.equal(packPrice(w, 'toeic', now), SHOP.packs.toeic);
  const member = { entries: [{ id: `eco:plus:${taipeiDay(now).slice(0, 7)}`, t: now, app: 'eco', kind: 'plus', amount: -990 }] };
  // A Plus member pays PLUS.vocab.packShare of the price (the Worker takes
  // no less), and studies a pack only once bought.
  assert.equal(packPrice(member, 'biz', now), Math.round(SHOP.packs.biz * PLUS.vocab.packShare));
  assert.equal(packEntry(member, 'biz', now).amount, -995);
  // The Worker's lowest pack prices (eco.js REWARDS_SHOP): a member's price.
  assert.deepEqual(Object.keys(SHOP.packs).map(id => packPrice(member, id, now)), [495, 745, 995]);
  assert.equal(packOpen(member, 'biz'), false);
  assert.deepEqual(openPacks(member), []);
  assert.equal(packOpen(w, 'biz'), false);
  const bought = { entries: [packEntry(w, 'toeic', now)] };
  assert.ok(packOwned(bought, 'toeic') && !packOwned(bought, 'ielts'));
  assert.deepEqual(ownedPacks(bought), ['toeic']);
  assert.equal(packEntry(w, 'toeic', now).id, packEntry(w, 'toeic', now + 1).id);
  const main = loadWords([['budget', 'n.', 3, 'n. 預算', ''], ['apple', 'n.', 1, 'n. 蘋果', '']]);
  const words = addPacks(main, { toeic: [['budget', 'n.', '預算'], ['itinerary', 'n.', '行程表']] });
  assert.equal(words.length, 3);
  assert.deepEqual(words.find(x => x.key === 'budget').packs, ['toeic']);
  assert.equal(words.find(x => x.key === 'itinerary').level, 'toeic');
  assert.ok(inLevels(words[0], ['toeic']) && !inLevels(words[1], ['toeic']));
  const round = pickRound(words, {}, { levels: ['toeic'], size: 10, now });
  assert.deepEqual(round.map(x => x.key).sort(), ['budget', 'itinerary']);
  const st = stats(words, {}, now);
  assert.equal(st.toeic.total, 2);
  assert.equal(st.all.total, 3);
  assert.equal(st[3].total, 1);
  assert.deepEqual(Object.keys(SHOP.packs), PACK_IDS);
  // Every pack word has a meaning, and the packs are a good size.
  const fs = await import('node:fs');
  const packs = JSON.parse(fs.readFileSync(new URL('../public/data/packs.json', import.meta.url)));
  for (const id of PACK_IDS) {
    assert.ok(packs[id].length >= 120, id);
    for (const r of packs[id]) assert.ok(r.length === 3 && r[0] && r[1] && r[2], JSON.stringify(r));
  }
});

test('missions about Play and plans give points, no free bet, once a day', async () => {
  const { missions, claimEntry } = await import('../public/lib/earn.mjs');
  const { freeBets } = await import('../public/lib/quadra.mjs');
  const day = taipeiDay(now);
  const w = { entries: [], settings: { 'act:odds': { value: { day, n: { parlay: 1, scratch: 1 } }, t: now } } };
  const ms = Object.fromEntries(missions(w, now).map(m => [m.id, m]));
  assert.ok(ms.parlay3.done && ms.scratch.done && ms.parlay3.bonus && !ms.quotes?.done && !('plan' in ms));
  const e = claimEntry(w, 'parlay3', now);
  assert.deepEqual([e.id, e.kind, e.amount, e.xp], [`vocab:m:${day}:parlay3`, 'mission', 0, 30]);
  const after = { ...w, entries: [e] };
  assert.equal(claimEntry(after, 'parlay3', now), null);
  assert.deepEqual(freeBets(after, now), []);
  // One claimed as a free bet before v7, the same day, stays claimed.
  const before = { ...w, entries: [{ id: `vocab:fb:${day}:parlay3`, t: now, app: 'vocab', kind: 'freebet', amount: 0, note: '30' }] };
  assert.equal(claimEntry(before, 'parlay3', now), null);
});

test('points buy a card, a boost or a pack, only with enough to spend; Plus earns ×1.5', async () => {
  const { redeemEntry, packOwned } = await import('../public/lib/shop.mjs');
  const { claimEntry, xpRate } = await import('../public/lib/earn.mjs');
  const { xpBalance } = await import('../public/lib/quadra.mjs');
  const rich = { entries: [{ id: 'vocab:g:1', t: now - DAY, app: 'vocab', kind: 'game', amount: 0, xp: 9_000 }] };
  const card = redeemEntry(rich, 'freeze', 'a', now);
  assert.deepEqual([card.id, card.kind, card.amount, card.note], ['vocab:xs:freeze:a', 'redeem', 0, String(SHOP.freeze.xp)]);
  const after = { entries: [...rich.entries, card] };
  assert.equal(freezes(after, now).bought, 1);
  assert.equal(xpBalance(after), 9_000 - SHOP.freeze.xp);
  const boost = redeemEntry(after, 'boost', 'b', now);
  assert.equal(boostUntil({ entries: [...after.entries, boost] }, now), now + SHOP.boost.minutes * 60_000);
  const pack = redeemEntry(after, 'pack', 'toeic', now);
  assert.equal(pack.id, 'vocab:xs:pack:toeic');
  assert.ok(packOwned({ entries: [pack] }, 'toeic'));
  // Not enough left: no entry.
  assert.equal(redeemEntry(after, 'pack', 'biz', now), null);
  assert.equal(redeemEntry({ entries: [] }, 'freeze', 'c', now), null);
  // A Plus member's mission gives ×1.5.
  const day = taipeiDay(now);
  const member = { entries: [{ id: `eco:plus:${day.slice(0, 7)}`, t: now, app: 'eco', kind: 'plus', amount: -490 }], settings: { 'act:odds': { value: { day, n: { scratch: 1 } }, t: now } } };
  assert.equal(xpRate(member, now), 1.5);
  assert.equal(claimEntry(member, 'scratch', now).xp, 30);
});

test('levels give streak cards at 5, 15, 25…, and points buy avatars (level ones can’t be bought)', async () => {
  const { redeemEntry } = await import('../public/lib/shop.mjs');
  const { avatarOwned } = await import('../public/lib/quadra.mjs');
  const xp = n => ({ id: `vocab:g:x${n}`, t: now - DAY, app: 'vocab', kind: 'game', amount: 0, xp: n });
  // 1,600 XP is level 5: one card; 19,600 is level 15: two.
  assert.equal(freezes({ entries: [xp(1_600)] }, now).granted, 1);
  assert.equal(freezes({ entries: [xp(19_600)] }, now).granted, 2);
  assert.equal(freezes({ entries: [xp(1_599)] }, now).granted, 0);
  const w = { entries: [xp(1_600)] };
  const cat = redeemEntry(w, 'avatar', 'cat', now);
  assert.deepEqual([cat.id, cat.note], ['vocab:xs:avatar:cat', '300']);
  assert.ok(avatarOwned({ entries: [...w.entries, cat] }, 'cat'));
  assert.equal(redeemEntry(w, 'avatar', 'panda', now), null);
  assert.equal(redeemEntry(w, 'avatar', 'gem', now), null);
});

test('a week with every weekly goal claimed brings a protection card', async () => {
  const { weeklyCards } = await import('../public/lib/shop.mjs');
  const wk = (week, ids) => ids.map(id => ({ id: `vocab:wk:${week}:${id}`, t: now, app: 'vocab', kind: 'mission', amount: 0, xp: 30 }));
  const all = ['days5', 'earn1000', 'missions10', 'games10'];
  const w = { entries: [...wk('2026-09-21', all), ...wk('2026-09-28', all.slice(0, 3))] };
  assert.equal(weeklyCards(w), 1);
  assert.equal(freezes(w, now).granted, 1);
});

test('the day’s soft cap: full, then half, then a tenth; ×rate moves the steps', async () => {
  const { dampXp, capStage } = await import('../public/lib/earn.mjs');
  assert.equal(dampXp(100, 0), 100);
  assert.equal(dampXp(100, 550), 50 + 25);
  assert.equal(dampXp(200, 1_200), 20);
  // 10 hours of good play (about 35 XP a minute) gives a little over 3,300, not 21,000.
  assert.ok(Math.abs(dampXp(21_000, 0) - (600 + 600 + (21_000 - 1_800) * 0.1)) < 1e-6);
  assert.equal(dampXp(900, 0, 1.5), 900);
  assert.deepEqual(capStage(0), { stage: 'full', left: 600 });
  assert.equal(capStage(700).stage, 'half');
  assert.equal(capStage(1_300).stage, 'low');
});

test('points swap a daily mission, buy back a missed day, and buy frames', async () => {
  const { redeemEntry, rerolls, repairable, SHOP } = await import('../public/lib/shop.mjs');
  const { dailyMissionIds, missions } = await import('../public/lib/earn.mjs');
  const { activeDaySet, streakOf, frameOwned } = await import('../public/lib/quadra.mjs');
  const rich = { entries: [{ id: 'vocab:g:1', t: now - DAY, app: 'vocab', kind: 'game', amount: 0, xp: 20_000 }] };
  const day = taipeiDay(now);
  const before = dailyMissionIds(day);
  const away = before[4];
  const swap = redeemEntry(rich, 'reroll', `${day}:${away}`, now);
  assert.deepEqual([swap.id, swap.note], [`vocab:xs:reroll:${day}:${away}`, String(SHOP.reroll.xp)]);
  const w = { entries: [...rich.entries, swap] };
  assert.deepEqual(rerolls(w, day), [away]);
  const after = missions(w, now).filter(m => !m.bonus).map(m => m.id);
  assert.equal(after.length, 6);
  assert.ok(!after.includes(away));
  assert.deepEqual(after.filter(id => !before.includes(id)).length, 1);
  // Repair (from October, missions keep a day): yesterday missed, the day before kept, no card.
  const later = Date.parse('2026-10-20T04:00:00Z');
  const k = n => ['words20', 'game1', 'quotes'].map(id => ({ id: `vocab:m:${taipeiDay(later - n * DAY)}:${id}`, t: later - n * DAY, app: 'vocab', kind: 'mission', amount: 0, xp: 1 }));
  const s = { entries: [...k(2), ...k(3)] };
  const yesterday = taipeiDay(later - DAY);
  assert.equal(repairable(s, activeDaySet(s), later), yesterday);
  const fixed = { entries: [...s.entries, { id: `vocab:xs:repair:${yesterday}`, t: later, app: 'vocab', kind: 'redeem', amount: 0, note: '1500' }] };
  assert.equal(repairable(fixed, activeDaySet(fixed), later), null);
  assert.equal(streakOf(fixed, later), 3);
  // Frames: a bought one with its price, a level one never.
  const gold = redeemEntry(rich, 'frame', 'gold', now);
  assert.deepEqual([gold.id, gold.note], ['vocab:xs:frame:gold', '8000']);
  assert.ok(frameOwned({ entries: [...rich.entries, gold] }, 'gold'));
  assert.equal(redeemEntry(rich, 'frame', 'legend', now), null);
});
