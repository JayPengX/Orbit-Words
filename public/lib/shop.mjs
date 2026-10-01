// What Rewards sells. Every purchase is an entry
// in the pass's wallet (app 'vocab', kind 'shop', a fixed id), so it is its
// own receipt: what's held is counted from the entries.
//
//   freeze     連續紀錄保護卡: used by itself on a missed day, so the streak
//              goes on ('vocab:fz:<day>' marks the day it covered)
//   boost      ×2 word-practice points for 30 minutes
//   pack       a word pack, bought once ('vocab:shop:pack:<id>', so never twice)
//   avatar, frame   for the account button, bought once with points
//   reroll     a daily mission swapped ('vocab:xs:reroll:<day>:<mission>')
//   repair     a missed day bought back ('vocab:xs:repair:<day>'), points only
//   Plus       PLUS.vocab.cards protection cards every Plus month, and packs
//              at the kit's PLUS.vocab.packShare of the price (the Worker's
//              REWARDS_SHOP takes no less)
// Each can be bought with money ('vocab:shop:…', kind 'shop') or with points
// ('vocab:xs:…', kind 'redeem', amount 0, the points in the note; the
// Worker's REWARDS_XP takes no less). Rewards pays points, never money (v7):
// the shop is the only money it moves.
import { taipeiDay, plusMember, plusMonths, PLUS, xpBalance, xpEarned, xpLevel, levelCards, AVATARS, FRAMES, streakCards, longestStreakOf } from './quadra.mjs';

export const SHOP = {
  freeze: { price: 300, hold: 3, xp: 600 },
  boost: { price: 150, minutes: 30, xp: 300 },
  packs: { toeic: 990, ielts: 1_490, biz: 1_990 },
  packsXp: { toeic: 8_000, ielts: 12_000, biz: 16_000 },
  // Points only: a daily mission swapped (two a day at most), a missed day
  // bought back for the streak (yesterday's, when the day before was kept).
  reroll: { xp: 100, perDay: 2 },
  repair: { xp: 1_500, least: 3 }
};
const MIN = 60_000;
const mine = (wallet, prefix) => (wallet?.entries || []).filter(e => e.app === 'vocab' && typeof e.id === 'string' && e.id.startsWith(prefix));

export const shopEntry = (item, key, now = Date.now(), note = item) => ({ id: `vocab:shop:${item}:${key}`, t: now, app: 'vocab', kind: 'shop', amount: -SHOP[item].price, note });
// The same, for points: null when there aren't enough to spend.
export function redeemEntry(wallet, item, key, now = Date.now()) {
  const cost = item === 'pack' ? SHOP.packsXp[key] : item === 'avatar' ? AVATARS.find(a => a.id === key)?.xp : item === 'frame' ? FRAMES.find(f => f.id === key)?.xp : SHOP[item]?.xp;
  if (!cost || xpBalance(wallet) < cost) return null;
  return { id: `vocab:xs:${item}:${key}`, t: now, app: 'vocab', kind: 'redeem', amount: 0, note: String(cost) };
}
// Bought either way.
const boughtAny = (wallet, item) => [...mine(wallet, `vocab:shop:${item}:`), ...mine(wallet, `vocab:xs:${item}:`)];

// ---- Streak protection ----------------------------------------------------------------
// Plus months up to this one (a yearly plan holds its later months ahead).
const plusMonthsSoFar = (wallet, now) => [...plusMonths(wallet)].filter(m => m <= taipeiDay(now).slice(0, 7)).length;
export function freezes(wallet, now = Date.now()) {
  const bought = boughtAny(wallet, 'freeze').length;
  // v8: PLUS.vocab.cards a Plus month (one a month before); and one at
  // level 5, 15, 25… (the kit's levelCards).
  // And one a streak milestone, and one a week with every weekly goal claimed.
  const granted = plusMonthsSoFar(wallet, now) * PLUS.vocab.cards + levelCards(xpLevel(xpEarned(wallet)).level) + streakCards(longestStreakOf(wallet)) + weeklyCards(wallet);
  const used = mine(wallet, 'vocab:fz:').length;
  return { bought, granted, used, held: Math.max(0, bought + granted - used) };
}
// Weeks with every weekly goal claimed ('vocab:wk:<Monday>:<goal>'). The
// goals are earn.mjs' WEEKLY (days5, earn1000, missions10); before the games
// went (weeks before WEEKLY_FROM) a week had a fourth, games10, and needed
// all four, so no earlier week gains a card now.
const WEEKLY_IDS = ['days5', 'earn1000', 'missions10'];
const WEEKLY_FROM = '2026-09-28';
export function weeklyCards(wallet) {
  const weeks = {};
  for (const e of mine(wallet, 'vocab:wk:')) {
    const [, , week, id] = e.id.split(':');
    (weeks[week] = weeks[week] || new Set()).add(id);
  }
  return Object.entries(weeks).filter(([week, ids]) => WEEKLY_IDS.every(id => ids.has(id)) && (week >= WEEKLY_FROM || ids.size >= 4)).length;
}
// The days a card covered.
export const frozenDays = wallet => new Set(mine(wallet, 'vocab:fz:').map(e => e.id.slice(9)));
export const freezeEntry = (day, now = Date.now()) => ({ id: `vocab:fz:${day}`, t: now, app: 'vocab', kind: 'freeze', amount: 0, note: day });

// ---- The ×2 boost -----------------------------------------------------------------------
// When the running boost ends (0 for none): one bought during another adds
// its 30 minutes after it.
export function boostUntil(wallet, now = Date.now()) {
  let end = 0;
  for (const e of boughtAny(wallet, 'boost').sort((a, b) => a.t - b.t)) end = Math.max(end, e.t) + SHOP.boost.minutes * MIN;
  return end > now ? end : 0;
}
export const boostedToday = (wallet, now = Date.now()) => boughtAny(wallet, 'boost').some(e => taipeiDay(e.t) === taipeiDay(now));

// ---- Word packs --------------------------------------------------------------------------
export const packId = id => `vocab:shop:pack:${id}`;
export const packOwned = (wallet, id) => (wallet?.entries || []).some(e => (e.id === packId(id) || e.id === `vocab:xs:pack:${id}`) && e.app === 'vocab');
export const ownedPacks = wallet => Object.keys(SHOP.packs).filter(id => packOwned(wallet, id));
// Studied once bought (progress stays with the words). Before v7 a Plus
// member had every pack while a member; now a member pays packShare of it.
export const packOpen = (wallet, id) => packOwned(wallet, id);
export const openPacks = wallet => Object.keys(SHOP.packs).filter(id => packOpen(wallet, id));
export const packPrice = (wallet, id, now = Date.now()) => (plusMember(wallet, now) ? Math.round(SHOP.packs[id] * PLUS.vocab.packShare) : SHOP.packs[id]);
export const packEntry = (wallet, id, now = Date.now(), note = id) => ({ id: packId(id), t: now, app: 'vocab', kind: 'shop', amount: -packPrice(wallet, id, now), note });

// ---- Mission swaps ---------------------------------------------------------------------
// Today's swaps, in order: the missions swapped away.
export const rerolls = (wallet, day) => mine(wallet, `vocab:xs:reroll:${day}:`).sort((a, b) => a.t - b.t).map(e => e.id.split(':')[4]);

// ---- Streak repair ---------------------------------------------------------------------
// Yesterday, when it can be bought back: missed (no missions, no card),
// a streak of SHOP.repair.least days or more up to the day before (not
// worth the points for less), and no card left to cover it. Otherwise null.
export function repairable(wallet, activeDays, now = Date.now()) {
  const yesterday = taipeiDay(now - 86_400_000);
  if (activeDays.has(yesterday) || freezes(wallet, now).held > 0) return null;
  let run = 0;
  while (run < SHOP.repair.least && activeDays.has(taipeiDay(now - (2 + run) * 86_400_000))) run++;
  return run >= SHOP.repair.least ? yesterday : null;
}
