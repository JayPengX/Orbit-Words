// What Rewards sells, and the challenges' rules. Every purchase is an entry
// in the pass's wallet (app 'vocab', kind 'shop', a fixed id), so it is its
// own receipt: what's held is counted from the entries.
//
//   freeze     連續紀錄保護卡: used by itself on a missed day, so the streak
//              goes on ('vocab:fz:<day>' marks the day it covered)
//   boost      ×2 word-practice pay for 30 minutes, and a higher word cap
//              that day
//   Plus       a protection card every Plus month, a higher word cap
import { ECONOMY, taipeiDay, plusMonths, plusMember } from './quadra.mjs';

export const SHOP = {
  freeze: { price: 300, hold: 3 },
  boost: { price: 150, minutes: 30, capBonus: 200 },
  plus: { wordsCap: 50, freezesAMonth: 1 }
};
const MIN = 60_000;
const mine = (wallet, prefix) => (wallet?.entries || []).filter(e => e.app === 'vocab' && typeof e.id === 'string' && e.id.startsWith(prefix));

export const shopEntry = (item, key, now = Date.now(), note = item) => ({ id: `vocab:shop:${item}:${key}`, t: now, app: 'vocab', kind: 'shop', amount: -SHOP[item].price, note });

// ---- Streak protection ----------------------------------------------------------------
// Plus months up to this one (a yearly plan holds its later months ahead).
const plusMonthsSoFar = (wallet, now) => [...plusMonths(wallet)].filter(m => m <= taipeiDay(now).slice(0, 7)).length;
export function freezes(wallet, now = Date.now()) {
  const bought = mine(wallet, 'vocab:shop:freeze:').length;
  const granted = plusMonthsSoFar(wallet, now) * SHOP.plus.freezesAMonth;
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
  for (const e of mine(wallet, 'vocab:shop:boost:').sort((a, b) => a.t - b.t)) end = Math.max(end, e.t) + SHOP.boost.minutes * MIN;
  return end > now ? end : 0;
}
export const boostedToday = (wallet, now = Date.now()) => mine(wallet, 'vocab:shop:boost:').some(e => taipeiDay(e.t) === taipeiDay(now));

// ---- Today's caps -----------------------------------------------------------------------
// The kit's caps, the word cap raised for Plus members and on a day a boost
// was bought.
export function capsFor(wallet, now = Date.now()) {
  const words = ECONOMY.vocab.dailyCap + (plusMember(wallet, now) ? SHOP.plus.wordsCap : 0) + (boostedToday(wallet, now) ? SHOP.boost.capBonus : 0);
  return { words, game: ECONOMY.gamesDailyCap, mission: ECONOMY.missionsDailyCap, total: words + ECONOMY.gamesDailyCap + ECONOMY.missionsDailyCap };
}

// ---- Challenges --------------------------------------------------------------------------
//
// A game played for a stake: beat the target and win the stake × win. The
// target is your median of the last `keep` rounds of that game (so you beat
// it about half the time), and never lower than the highest it has been
// (`bar`, kept in the pass), so easy rounds on purpose can't lower it.
// A round that only ties the target doesn't beat it.
export const CHALLENGE = { stakes: [50, 200, 500], win: 1.8, warmup: 5, keep: 15 };
export function median(list) {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// The target for a game (null until warmed up).
export function challengeTarget(recent = [], bar = 0) {
  if (recent.length < CHALLENGE.warmup) return null;
  const m = median(recent.slice(-CHALLENGE.keep));
  return Math.round(Math.max(m, bar || 0) * 10) / 10;
}
export const challengeWon = (score, target) => target != null && score > target;
export const challengePrize = stake => Math.round(stake * CHALLENGE.win);
export const stakeEntry = (key, stake, game, now = Date.now(), note = game) => ({ id: `vocab:c:${key}`, t: now, app: 'vocab', kind: 'stake', amount: -stake, note });
export const prizeEntry = (key, stake, now = Date.now(), note = '') => ({ id: `vocab:c:${key}:w`, t: now, app: 'vocab', kind: 'payout', amount: challengePrize(stake), note });
// Stakes and prizes, all time: { staked, won, n, wins }.
export function challengeRecord(wallet) {
  const list = mine(wallet, 'vocab:c:');
  const stakes = list.filter(e => e.kind === 'stake');
  const prizes = list.filter(e => e.kind === 'payout');
  return { staked: -stakes.reduce((s, e) => s + e.amount, 0), won: prizes.reduce((s, e) => s + e.amount, 0), n: stakes.length, wins: prizes.length };
}
