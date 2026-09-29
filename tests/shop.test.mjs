import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOP, shopEntry, freezes, boostUntil, capsFor } from '../public/lib/shop.mjs';
import { streakDays, freezeDue, roomToday, longestStreak } from '../public/lib/earn.mjs';
import { ECONOMY, taipeiDay } from '../public/lib/quadra.mjs';

const DAY = 86_400_000;
const now = Date.parse('2026-09-28T04:00:00Z');
const played = n => ({ id: `vocab:g:${n}`, t: now - n * DAY, app: 'vocab', kind: 'game', amount: 10 });

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

test('the ×2 boost: 30 minutes, stacked, and a higher word cap that day', () => {
  const w = { entries: [shopEntry('boost', 'a', now - 10 * 60_000), shopEntry('boost', 'b', now - 5 * 60_000)] };
  assert.equal(boostUntil(w, now), now - 10 * 60_000 + 60 * 60_000);
  assert.equal(boostUntil(w, now + 2 * 3_600_000), 0);
  assert.equal(capsFor(w, now).words, ECONOMY.vocab.dailyCap + SHOP.boost.capBonus);
  assert.equal(capsFor({ entries: [] }, now).words, ECONOMY.vocab.dailyCap);
  assert.equal(roomToday(w, 'words', 0, now), ECONOMY.vocab.dailyCap + SHOP.boost.capBonus);
  const member = { entries: [{ id: `eco:plus:${taipeiDay(now).slice(0, 7)}`, t: now, app: 'eco', kind: 'plus', amount: -290 }] };
  assert.equal(capsFor(member, now).words, ECONOMY.vocab.dailyCap + SHOP.plus.wordsCap);
});
