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
  assert.equal(freezes(plus, now).granted, 1);
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
  assert.ok(ms.parlay3.done && ms.scratch.done && !ms.plan.done);
  const e = claimEntry(w, 'parlay3', now);
  assert.deepEqual([e.id, e.kind, e.amount, e.xp], [`vocab:m:${day}:parlay3`, 'mission', 0, 30]);
  const after = { ...w, entries: [e] };
  assert.equal(claimEntry(after, 'parlay3', now), null);
  assert.deepEqual(freeBets(after, now), []);
  // One claimed as a free bet before v7, the same day, stays claimed.
  const before = { ...w, entries: [{ id: `vocab:fb:${day}:parlay3`, t: now, app: 'vocab', kind: 'freebet', amount: 0, note: '30' }] };
  assert.equal(claimEntry(before, 'parlay3', now), null);
});
