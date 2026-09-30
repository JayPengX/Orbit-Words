// Points in Rewards: what was earned today (words, games, missions), the
// day's missions, and the wealth ranks.
//
// Rewards pays points (XP), never money (v7: money comes only from Quadra's
// opening money and allowance). Every point is an entry in the pass's
// wallet (app 'vocab', amount 0, its points in `xp`, a fixed id, so a retry
// or a second device never counts twice):
//   words     word practice, one entry a batch of answers ('vocab:w:…';
//             Quadra Words' older ones are kind 'reward')
//   game      a finished game round ('vocab:g:…')
//   mission   a claimed mission or weekly goal ('vocab:m:<day>:<mission>')
// Before v7 the same entries paid NT$ (their amount): those count as points too.
import { taipeiDay, todayActivity, poolBalance } from './quadra.mjs';
import { freezes, freezeEntry, frozenDays } from './shop.mjs';

const KIND_OF = { words: 'words', reward: 'words', game: 'game', mission: 'mission' };
// An entry's points: its `xp`, or what it paid before v7.
export const xpOf = e => (e?.app === 'vocab' && KIND_OF[e.kind] ? (e.xp > 0 ? e.xp : e.amount > 0 ? e.amount : 0) : 0);
// Points as text: "120 XP" (one decimal under 10, for a game's small steps).
export function xpText(v, { sign = false } = {}) {
  const n = Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return `${sign && n > 0 ? '+' : ''}${n.toLocaleString('en-US')} XP`;
}

// Points today per kind: { words, game, mission, total }.
export function xpToday(wallet, now = Date.now()) {
  const day = taipeiDay(now);
  const out = { words: 0, game: 0, mission: 0, total: 0 };
  for (const e of wallet?.entries || []) {
    if (e.app !== 'vocab' || taipeiDay(e.t) !== day) continue;
    const kind = KIND_OF[e.kind];
    if (!kind) continue;
    out[kind] += xpOf(e);
    out.total += xpOf(e);
  }
  return out;
}

// Every point Rewards has ever given.
export const xpAllTime = wallet => (wallet?.entries || []).reduce((sum, e) => sum + xpOf(e), 0);

// ---- Missions: a few things a day across the apps, points when claimed ----------------
//
// Progress comes from each app's activity counts in the wallet
// (activityPatch) and when each app was last opened. Each gives `xp`.
export const MISSIONS = [
  { id: 'words20', app: 'vocab', xp: 20, goal: 20, count: a => a.vocab?.answer || 0 },
  { id: 'master3', app: 'vocab', xp: 15, goal: 3, count: a => a.vocab?.master || 0 },
  { id: 'game1', app: 'vocab', xp: 10, goal: 1, count: a => a.vocab?.game || 0 },
  { id: 'invest', app: 'stock', xp: 15, goal: 1, count: a => (a.stock?.trade || 0) + (a.stock?.watch || 0) },
  { id: 'match', app: 'match', xp: 10, goal: 1, count: a => (a.match?.open || 0) + (a.match?.follow || 0) },
  // Orbit Class, Quadra's class schedule: checking the day's classes.
  { id: 'orbit', app: 'orbit', xp: 10, goal: 1, count: a => (a.orbit?.open || 0) + (a.orbit?.edit || 0) },
  { id: 'tour', app: 'eco', xp: 10, goal: 3, count: (a, apps, day) => ['stock', 'match', 'vocab'].filter(x => apps?.[x]?.last && taipeiDay(apps[x].last) === day).length },
  { id: 'parlay3', app: 'odds', xp: 30, goal: 1, count: a => a.odds?.parlay || 0 },
  { id: 'scratch', app: 'odds', xp: 20, goal: 1, count: a => a.odds?.scratch || 0 },
  { id: 'plan', app: 'stock', xp: 30, goal: 1, count: a => a.stock?.plan || 0 }
];
export const missionId = (day, id) => `vocab:m:${day}:${id}`;
// Before v7 three missions gave a free bet under this id: one claimed that
// way today is still claimed.
const freeBetId = (day, id) => `vocab:fb:${day}:${id}`;

export function missions(wallet, now = Date.now()) {
  const day = taipeiDay(now);
  const act = todayActivity(wallet, now);
  const ids = new Set((wallet?.entries || []).map(e => e.id));
  return MISSIONS.map(m => {
    const progress = Math.min(m.goal, m.count(act, wallet?.apps, day));
    return { ...m, progress, done: progress >= m.goal, claimed: ids.has(missionId(day, m.id)) || ids.has(freeBetId(day, m.id)) };
  });
}
// The entry claiming a mission (null when it isn't done or is claimed).
export function claimEntry(wallet, id, now = Date.now()) {
  const m = missions(wallet, now).find(x => x.id === id);
  if (!m || !m.done || m.claimed) return null;
  return { id: missionId(taipeiDay(now), id), t: now, app: 'vocab', kind: 'mission', amount: 0, xp: m.xp, note: id };
}

// ---- Wealth ranks: where the pool stands, and the next step ------------------------
export const RANKS = [
  { id: 'start', min: 0, icon: '🌱' },
  { id: 'saver', min: 50_000, icon: '🪙' },
  { id: 'steady', min: 100_000, icon: '💼' },
  { id: 'comfort', min: 250_000, icon: '🏡' },
  { id: 'wealthy', min: 500_000, icon: '💎' },
  { id: 'rich', min: 1_000_000, icon: '🏦' },
  { id: 'multi', min: 5_000_000, icon: '👑' },
  { id: 'tycoon', min: 20_000_000, icon: '🚀' }
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

// Days with word practice or a game, and the days a protection card covered.
const played = e => e.app === 'vocab' && (e.kind === 'words' || e.kind === 'reward' || e.kind === 'game');
export const activeDays = wallet => new Set([...(wallet?.entries || []).filter(played).map(e => taipeiDay(e.t)), ...frozenDays(wallet)]);

// Days in a row with word practice or a game, from the entries (today counts
// once something is earned; a day a protection card covered counts too).
export function streakDays(wallet, now = Date.now()) {
  const days = activeDays(wallet);
  let n = 0;
  let t = now;
  if (!days.has(taipeiDay(t))) t -= 86_400_000;
  while (days.has(taipeiDay(t))) {
    n++;
    t -= 86_400_000;
  }
  return n;
}

// The longest run of days in a row with word practice or a game.
export function longestStreak(wallet, match = null) {
  const days = [...(match ? new Set((wallet?.entries || []).filter(match).map(e => taipeiDay(e.t))) : activeDays(wallet))].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && Date.parse(`${d}T00:00:00Z`) - Date.parse(`${prev}T00:00:00Z`) === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
// A streak that would break tonight: days in a row up to yesterday, nothing
// yet today, and it's evening in Taiwan.
export function streakAtRisk(wallet, now = Date.now()) {
  const today = taipeiDay(now);
  const hour = new Date(now + 8 * 3_600_000).getUTCHours();
  const n = streakDays(wallet, now);
  return !activeDays(wallet).has(today) && n > 0 && hour >= 20 ? n : 0;
}

// The protection cards to use now: the days missed since the streak's last
// day (not today, which can still be played), when the cards held cover all
// of them. Empty when nothing was missed or a card can't save the streak.
export function freezeDue(wallet, now = Date.now()) {
  const held = freezes(wallet, now).held;
  if (!held) return [];
  const days = activeDays(wallet);
  const gap = [];
  let t = now - 86_400_000;
  while (!days.has(taipeiDay(t)) && gap.length <= held) {
    gap.push(taipeiDay(t));
    t -= 86_400_000;
  }
  if (!gap.length || gap.length > held) return [];
  return gap.reverse().map(day => freezeEntry(day, now));
}

// ---- The daily challenge (games.mjs picks the game) ----------------------------------------
export const dailyId = day => `vocab:d:${day}`;
// Days in a row the challenge was played, up to yesterday (today counts once played).
export function dailyStreak(wallet, now = Date.now()) {
  const ids = new Set((wallet?.entries || []).map(e => e.id));
  let n = 0;
  let t = now;
  if (!ids.has(dailyId(taipeiDay(t)))) t -= 86_400_000;
  while (ids.has(dailyId(taipeiDay(t)))) {
    n++;
    t -= 86_400_000;
  }
  return n;
}

// ---- Weekly goals: a Taiwan week (Monday to Sunday), claimed like missions ------------------
//
// Claimed as missions (kind 'mission', ids 'vocab:wk:<Monday>:<goal>').
export function weekStart(now = Date.now()) {
  const day = taipeiDay(now);
  const d = new Date(`${day}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}
const earnKinds = new Set(['words', 'reward', 'game']);
export const WEEKLY = [
  { id: 'days5', xp: 45, goal: 5, count: list => new Set(list.filter(e => earnKinds.has(e.kind)).map(e => taipeiDay(e.t))).size },
  // Points from words and games (the id is older than the points).
  { id: 'earn1000', xp: 45, goal: 1000, count: list => Math.floor(list.filter(e => earnKinds.has(e.kind)).reduce((s, e) => s + xpOf(e), 0)) },
  { id: 'missions10', xp: 40, goal: 10, count: list => list.filter(e => e.kind === 'mission' && e.id.startsWith('vocab:m:')).length },
  { id: 'games10', xp: 30, goal: 10, count: list => list.filter(e => e.kind === 'game' && !e.id.startsWith('vocab:d:')).length }
];
export const weeklyId = (week, id) => `vocab:wk:${week}:${id}`;
export function weeklyGoals(wallet, now = Date.now()) {
  const week = weekStart(now);
  const list = (wallet?.entries || []).filter(e => e.app === 'vocab' && taipeiDay(e.t) >= week && e.t <= now);
  const ids = new Set((wallet?.entries || []).map(e => e.id));
  return WEEKLY.map(g => {
    const progress = Math.min(g.goal, g.count(list));
    return { ...g, week, progress, done: progress >= g.goal, claimed: ids.has(weeklyId(week, g.id)) };
  });
}
export function claimWeekly(wallet, id, now = Date.now()) {
  const g = weeklyGoals(wallet, now).find(x => x.id === id);
  if (!g || !g.done || g.claimed) return null;
  return { id: weeklyId(g.week, id), t: now, app: 'vocab', kind: 'mission', amount: 0, xp: g.xp, note: `week:${id}` };
}

// ---- Badges: milestones, earned once and kept (they're read from the record) ----------------
//
// ctx: { wallet, mastered, bests, games } (bests from games.mjs' mergeBests).
export const BADGES = [
  { id: 'firstGame', icon: '🎮', test: c => (c.wallet?.entries || []).some(e => e.app === 'vocab' && e.kind === 'game') },
  { id: 'words100', icon: '📘', test: c => c.mastered >= 100 },
  { id: 'words500', icon: '📚', test: c => c.mastered >= 500 },
  { id: 'words1000', icon: '🎓', test: c => c.mastered >= 1000 },
  { id: 'streak7', icon: '🔥', test: c => longestStreak(c.wallet) >= 7 },
  { id: 'streak30', icon: '☄️', test: c => longestStreak(c.wallet) >= 30 },
  { id: 'daily7', icon: '📅', test: c => longestStreak(c.wallet, e => e.id?.startsWith('vocab:d:')) >= 7 },
  { id: 'allGames', icon: '🕹️', test: c => (c.games || []).every(g => c.bests?.[g]) },
  { id: 'games20', icon: '👾', test: c => Object.keys(c.bests || {}).length >= 20 },
  { id: 'missions50', icon: '🎁', test: c => (c.wallet?.entries || []).filter(e => e.app === 'vocab' && e.kind === 'mission').length >= 50 },
  { id: 'earned10k', icon: '💰', test: c => xpAllTime(c.wallet) >= 10_000 },
  { id: 'wealthy', icon: '💎', test: c => walletRank(c.wallet).index >= RANKS.findIndex(r => r.id === 'wealthy') }
];
export const badges = ctx => BADGES.map(b => ({ ...b, earned: Boolean(b.test(ctx)) }));
