// What Rewards sells. Every purchase is an entry
// in the pass's wallet (app 'vocab', kind 'shop', a fixed id), so it is its
// own receipt: what's held is counted from the entries.
//
//   freeze     連續紀錄保護卡: used by itself on a missed day, so the streak
//              goes on ('vocab:fz:<day>' marks the day it covered)
//   boost      ×2 word-practice points for 30 minutes
//   pack       a word pack, bought once ('vocab:shop:pack:<id>', so never twice)
//   Plus       PLUS.vocab.cards protection cards every Plus month, and packs
//              at the kit's PLUS.vocab.packShare of the price (the Worker's
//              REWARDS_SHOP takes no less)
// Each can be bought with money ('vocab:shop:…', kind 'shop') or with points
// ('vocab:xs:…', kind 'redeem', amount 0, the points in the note; the
// Worker's REWARDS_XP takes no less). Rewards pays points, never money (v7):
// the shop is the only money it moves.
import { taipeiDay, plusMember, plusMonths, PLUS, xpBalance } from './quadra.mjs';

export const SHOP = {
  freeze: { price: 300, hold: 3, xp: 600 },
  boost: { price: 150, minutes: 30, xp: 300 },
  packs: { toeic: 990, ielts: 1_490, biz: 1_990 },
  packsXp: { toeic: 8_000, ielts: 12_000, biz: 16_000 }
};
const MIN = 60_000;
const mine = (wallet, prefix) => (wallet?.entries || []).filter(e => e.app === 'vocab' && typeof e.id === 'string' && e.id.startsWith(prefix));

export const shopEntry = (item, key, now = Date.now(), note = item) => ({ id: `vocab:shop:${item}:${key}`, t: now, app: 'vocab', kind: 'shop', amount: -SHOP[item].price, note });
// The same, for points: null when there aren't enough to spend.
export function redeemEntry(wallet, item, key, now = Date.now()) {
  const cost = item === 'pack' ? SHOP.packsXp[key] : SHOP[item].xp;
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
  // v8: PLUS.vocab.cards a Plus month (one a month before).
  const granted = plusMonthsSoFar(wallet, now) * PLUS.vocab.cards;
  const used = mine(wallet, 'vocab:fz:').length;
  return { bought, granted, used, held: Math.max(0, bought + granted - used) };
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
