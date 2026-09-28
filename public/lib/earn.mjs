// Earning in Rewards: what the pool has paid today (words, games, missions)
// against each one's daily cap, the day's missions, and the wealth ranks.
//
// Every payment is an entry in the pass's wallet (app 'vocab', a fixed id,
// so a retry or a second device never pays twice):
//   words     word practice, one entry a batch of answers ('vocab:w:…';
//             Quadra Words' older ones are kind 'reward')
//   game      a finished game round ('vocab:g:…')
//   mission   a claimed mission ('vocab:m:<day>:<mission>', once a day each)
import { ECONOMY, taipeiDay, todayActivity, poolBalance } from './quadra.mjs';

export const CAPS = { words: ECONOMY.vocab.dailyCap, game: ECONOMY.gamesDailyCap, mission: ECONOMY.missionsDailyCap };
const KIND_OF = { words: 'words', reward: 'words', game: 'game', mission: 'mission' };

// Paid today per kind: { words, game, mission, total }.
export function earnedToday(wallet, now = Date.now()) {
  const day = taipeiDay(now);
  const out = { words: 0, game: 0, mission: 0, total: 0 };
  for (const e of wallet?.entries || []) {
    if (e.app !== 'vocab' || taipeiDay(e.t) !== day) continue;
    const kind = KIND_OF[e.kind];
    if (!kind) continue;
    out[kind] += e.amount;
    out.total += e.amount;
  }
  return out;
}
// Room left today for a kind, counting what's waiting to be sent.
export const roomToday = (wallet, kind, pending = 0, now = Date.now()) => Math.max(0, CAPS[kind] - earnedToday(wallet, now)[kind] - pending);

// Everything Rewards has ever paid.
export function earnedAllTime(wallet) {
  return (wallet?.entries || []).filter(e => e.app === 'vocab' && KIND_OF[e.kind]).reduce((sum, e) => sum + e.amount, 0);
}

// ---- Missions: a few things a day across the apps, paid when claimed ----------------
//
// None of them is about betting. Progress comes from each app's activity
// counts in the wallet (activityPatch) and when each app was last opened.
export const MISSIONS = [
  { id: 'words20', app: 'vocab', pay: 60, goal: 20, count: a => a.vocab?.answer || 0 },
  { id: 'master3', app: 'vocab', pay: 60, goal: 3, count: a => a.vocab?.master || 0 },
  { id: 'game1', app: 'vocab', pay: 40, goal: 1, count: a => a.vocab?.game || 0 },
  { id: 'invest', app: 'stock', pay: 60, goal: 1, count: a => (a.stock?.trade || 0) + (a.stock?.watch || 0) },
  { id: 'match', app: 'match', pay: 40, goal: 1, count: a => (a.match?.open || 0) + (a.match?.follow || 0) },
  { id: 'tour', app: 'eco', pay: 40, goal: 3, count: (a, apps, day) => ['stock', 'match', 'vocab'].filter(x => apps?.[x]?.last && taipeiDay(apps[x].last) === day).length }
];
export const missionId = (day, id) => `vocab:m:${day}:${id}`;

export function missions(wallet, now = Date.now()) {
  const day = taipeiDay(now);
  const act = todayActivity(wallet, now);
  const ids = new Set((wallet?.entries || []).map(e => e.id));
  return MISSIONS.map(m => {
    const progress = Math.min(m.goal, m.count(act, wallet?.apps, day));
    return { ...m, progress, done: progress >= m.goal, claimed: ids.has(missionId(day, m.id)) };
  });
}
// The entry claiming a mission (null when it isn't done, is claimed, or
// today's cap is used up).
export function claimEntry(wallet, id, now = Date.now()) {
  const m = missions(wallet, now).find(x => x.id === id);
  if (!m || !m.done || m.claimed) return null;
  const amount = Math.min(m.pay, roomToday(wallet, 'mission', 0, now));
  if (amount <= 0) return null;
  return { id: missionId(taipeiDay(now), id), t: now, app: 'vocab', kind: 'mission', amount, note: id };
}

// ---- Wealth ranks: where the pool stands, and the next step ------------------------
export const RANKS = [
  { id: 'start', min: 0, icon: '🌱' },
  { id: 'saver', min: 150_000, icon: '🪙' },
  { id: 'steady', min: 300_000, icon: '💼' },
  { id: 'comfort', min: 600_000, icon: '🏡' },
  { id: 'wealthy', min: 1_000_000, icon: '💎' },
  { id: 'rich', min: 5_000_000, icon: '🏦' },
  { id: 'multi', min: 10_000_000, icon: '👑' },
  { id: 'tycoon', min: 100_000_000, icon: '🚀' }
];
export function rankOf(balance) {
  let i = 0;
  while (i + 1 < RANKS.length && balance >= RANKS[i + 1].min) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] || null;
  const progress = next ? Math.max(0, Math.min(1, (balance - rank.min) / (next.min - rank.min))) : 1;
  return { rank, next, progress, index: i, toNext: next ? Math.max(0, next.min - balance) : 0 };
}
export const walletRank = wallet => rankOf(poolBalance(wallet));

// Days in a row with word practice or a game, from the entries (today counts
// once something is paid).
export function streakDays(wallet, now = Date.now()) {
  const days = new Set((wallet?.entries || []).filter(e => e.app === 'vocab' && (e.kind === 'words' || e.kind === 'reward' || e.kind === 'game')).map(e => taipeiDay(e.t)));
  let n = 0;
  let t = now;
  if (!days.has(taipeiDay(t))) t -= 86_400_000;
  while (days.has(taipeiDay(t))) {
    n++;
    t -= 86_400_000;
  }
  return n;
}
