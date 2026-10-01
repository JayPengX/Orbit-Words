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
// Points earned make the level (the kit's xpLevel); points spent in the shop
// (shop.mjs redeemEntry) come off what's left to spend (xpBalance).
import { taipeiDay, todayActivity, poolBalance, xpOf, xpEarned, plusMember, plusTenure, PLUS, activeDaySet, streakBonus, missionDays, STREAK, ECONOMY } from './quadra.mjs';
import { freezes, freezeEntry, frozenDays, rerolls } from './shop.mjs';

export { xpOf };
const KIND_OF = { words: 'words', reward: 'words', game: 'game', mission: 'mission' };
// Points ×PLUS.vocab.xpBoost for a Quadra Plus member, and more with the
// streak (+2% a day of it, up to +30%: the kit's streakBonus).
export const xpRate = (wallet, now = Date.now()) => (plusMember(wallet, now) ? PLUS.vocab.xpBoost : 1) * (1 + streakBonus(streakDays(wallet, now)));
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

// ---- The day's soft cap on words and games (ECONOMY.dailyXp) ---------------------------
// Points from words and games today, the ones not yet written (`pending`) too.
export const capToday = (wallet, now = Date.now(), pending = 0) => {
  const e = xpToday(wallet, now);
  return e.words + e.game + pending;
};
// What `points` (at the person's rate) come to after today's `had`: the
// first ECONOMY.dailyXp.full ×rate in full, up to .half ×rate at half, then .rest.
export function dampXp(points, had, rate = 1) {
  const { full, half, rest } = ECONOMY.dailyXp;
  const a = full * rate;
  const b = half * rate;
  let out = 0;
  let left = Math.max(0, points);
  let e = Math.max(0, had);
  if (e < a) {
    const take = Math.min(left, a - e);
    out += take;
    e += take;
    left -= take;
  }
  if (left > 0 && e < b) {
    const take = Math.min(left, (b - e) * 2);
    out += take / 2;
    e += take / 2;
    left -= take;
  }
  return out + left * rest;
}
// Where today stands: 'full' (and how much is left at it), 'half', or 'low'.
export function capStage(had, rate = 1) {
  const { full, half } = ECONOMY.dailyXp;
  if (had < full * rate) return { stage: 'full', left: Math.ceil(full * rate - had) };
  if (had < half * rate) return { stage: 'half', left: Math.ceil(half * rate - had) };
  return { stage: 'low', left: 0 };
}

// Every point Rewards has ever given.
export const xpAllTime = xpEarned;

// ---- Missions: a few things a day across the apps, points when claimed ----------------
//
// Progress comes from each app's activity counts in the wallet
// (activityPatch) and when each app was last opened. Each gives `xp`.
//
// Every day six daily missions come from the pool (three in Rewards, three
// in the other apps, the same for everyone that day); claiming STREAK.missions
// of them keeps the streak (the kit's activeDaySet). The bonus missions spend
// money (an order, a bet, a ticket): always there, extra points, and never
// needed for the streak.
export const MISSIONS = [
  // Rewards
  { id: 'words20', app: 'vocab', group: 'words', xp: 15, goal: 20, count: a => a.vocab?.answer || 0 },
  { id: 'words50', app: 'vocab', group: 'words', xp: 30, goal: 50, count: a => a.vocab?.answer || 0 },
  { id: 'master3', app: 'vocab', xp: 20, goal: 3, count: a => a.vocab?.master || 0 },
  // Right answers to the harder kinds: by ear, from letters, dictation.
  { id: 'hard10', app: 'vocab', xp: 20, goal: 10, count: a => a.vocab?.hard || 0 },
  // A round of 10 words or more without a miss.
  { id: 'perfect', app: 'vocab', xp: 20, goal: 1, count: a => a.vocab?.perfect || 0 },
  { id: 'game1', app: 'vocab', group: 'games', xp: 10, goal: 1, count: a => a.vocab?.game || 0 },
  { id: 'games3', app: 'vocab', group: 'games', xp: 20, goal: 3, count: a => a.vocab?.game || 0 },
  // Today's challenge played.
  { id: 'challenge', app: 'vocab', xp: 15, goal: 1, count: (a, apps, day, wallet) => ((wallet?.entries || []).some(e => e.id === dailyId(day)) ? 1 : 0) },
  // The other apps: using them, nothing to spend and no personal choice
  // (a watchlist, a team to follow) needed.
  // Securities: different stocks' pages opened (each counts once a day).
  { id: 'quotes', app: 'stock', xp: 15, goal: 3, count: a => a.stock?.view || 0 },
  // Fixtures: different matches opened.
  { id: 'match', app: 'match', group: 'match', xp: 10, goal: 1, count: a => a.match?.open || 0 },
  { id: 'matches3', app: 'match', group: 'match', xp: 15, goal: 3, count: a => a.match?.open || 0 },
  // Orbit Class, Quadra's class schedule: checking the day's classes.
  { id: 'orbit', app: 'orbit', xp: 10, goal: 1, count: a => (a.orbit?.open || 0) + (a.orbit?.edit || 0) },
  { id: 'tour', app: 'eco', xp: 10, goal: 3, count: (a, apps, day) => ['stock', 'match', 'vocab'].filter(x => apps?.[x]?.last && taipeiDay(apps[x].last) === day).length },
  // Bonus: they spend money.
  { id: 'invest', app: 'stock', xp: 20, goal: 1, bonus: true, count: a => a.stock?.trade || 0 },
  { id: 'parlay3', app: 'odds', xp: 30, goal: 1, bonus: true, count: a => a.odds?.parlay || 0 },
  { id: 'scratch', app: 'odds', xp: 20, goal: 1, bonus: true, count: a => a.odds?.scratch || 0 },
  { id: 'lotto', app: 'odds', xp: 20, goal: 1, bonus: true, count: a => a.odds?.lottery || 0 }
];
// The day's six: three in Rewards, three elsewhere, picked by the date (one
// of a group at most: not 20 words and 50 the same day).
export function dailyMissionIds(day, swapped = []) {
  const pick = (list, n) => {
    const groups = new Set();
    return list
      .map(m => [hash(`${day}:${m.id}`), m])
      .sort((a, b) => a[0] - b[0])
      .filter(([, m]) => !m.group || (!groups.has(m.group) && groups.add(m.group)))
      .slice(0, n)
      .map(([, m]) => m.id);
  };
  const core = MISSIONS.filter(m => !m.bonus);
  const ids = [...pick(core.filter(m => m.app === 'vocab'), 3), ...pick(core.filter(m => m.app !== 'vocab'), 3)];
  // A swapped one gives way to the next of its side (Rewards or the other
  // apps) not already there, one of a group at most.
  for (const away of swapped) {
    const i = ids.indexOf(away);
    if (i < 0) continue;
    const m = MISSIONS.find(x => x.id === away);
    const side = core.filter(x => (x.app === 'vocab') === (m.app === 'vocab'));
    const groups = new Set(ids.filter(id => id !== away).map(id => MISSIONS.find(x => x.id === id).group).filter(Boolean));
    const next = side
      .map(x => [hash(`${day}:${x.id}`), x])
      .sort((a, b) => a[0] - b[0])
      .map(([, x]) => x)
      .find(x => !ids.includes(x.id) && !swapped.includes(x.id) && !(x.group && groups.has(x.group)));
    if (next) ids[i] = next.id;
  }
  return ids;
}
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const missionId = (day, id) => `vocab:m:${day}:${id}`;
// Before v7 three missions gave a free bet under this id: one claimed that
// way today is still claimed.
const freeBetId = (day, id) => `vocab:fb:${day}:${id}`;

// Today's missions: the day's six, then the bonus ones (and any other
// claimed today, as claimed).
export function missions(wallet, now = Date.now()) {
  const day = taipeiDay(now);
  const act = todayActivity(wallet, now);
  const ids = new Set((wallet?.entries || []).map(e => e.id));
  const claimed = id => ids.has(missionId(day, id)) || ids.has(freeBetId(day, id));
  const today = new Set(dailyMissionIds(day, rerolls(wallet, day)));
  return MISSIONS.filter(m => m.bonus || today.has(m.id) || claimed(m.id)).map(m => {
    const progress = Math.min(m.goal, m.count(act, wallet?.apps, day, wallet));
    return { ...m, bonus: Boolean(m.bonus), progress, done: progress >= m.goal, claimed: claimed(m.id) };
  });
}
// Where today stands for the streak: daily missions claimed, of STREAK.missions.
export function streakToday(wallet, now = Date.now()) {
  const n = missionDays(wallet)[taipeiDay(now)] || 0;
  return { n: Math.min(n, STREAK.missions), goal: STREAK.missions, kept: activeDays(wallet).has(taipeiDay(now)) };
}
// The entry claiming a mission (null when it isn't done or is claimed).
export function claimEntry(wallet, id, now = Date.now()) {
  const m = missions(wallet, now).find(x => x.id === id);
  if (!m || !m.done || m.claimed) return null;
  return { id: missionId(taipeiDay(now), id), t: now, app: 'vocab', kind: 'mission', amount: 0, xp: Math.round(m.xp * xpRate(wallet, now)), note: id };
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

// Days the streak was kept (3 daily missions claimed; before October 2026 any
// practice or game), and the days a protection card covered: the kit's rule,
// so every app agrees.
export const activeDays = activeDaySet;

// Days in a row the streak was kept (today counts once it's kept; a day a
// protection card covered counts too).
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

// The longest run of days in a row kept (or, with `match`, with such entries).
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
// A streak that would break tonight: days in a row up to yesterday, today
// not kept yet, and it's evening in Taiwan.
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
// All of a week's goals claimed bring a streak protection card (shop.mjs).
export function weekStart(now = Date.now()) {
  const day = taipeiDay(now);
  const d = new Date(`${day}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}
const earnKinds = new Set(['words', 'reward', 'game']);
export const WEEKLY = [
  // Days this week the streak was kept with missions (a protection card's don't count).
  { id: 'days5', xp: 45, goal: 5, count: (list, wallet, week) => Object.entries(missionDays(wallet)).filter(([d, n]) => d >= week && n >= STREAK.missions).length },
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
    const progress = Math.min(g.goal, g.count(list, wallet, week));
    return { ...g, week, progress, done: progress >= g.goal, claimed: ids.has(weeklyId(week, g.id)) };
  });
}
export function claimWeekly(wallet, id, now = Date.now()) {
  const g = weeklyGoals(wallet, now).find(x => x.id === id);
  if (!g || !g.done || g.claimed) return null;
  return { id: weeklyId(g.week, id), t: now, app: 'vocab', kind: 'mission', amount: 0, xp: Math.round(g.xp * xpRate(wallet, now)), note: `week:${id}` };
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
  { id: 'wealthy', icon: '💎', test: c => walletRank(c.wallet).index >= RANKS.findIndex(r => r.id === 'wealthy') },
  // Quadra Plus, month by month (a yearly plan's months as they come).
  { id: 'plus3', icon: '✦', test: c => plusTenure(c.wallet) >= 3 },
  { id: 'plus6', icon: '🌟', test: c => plusTenure(c.wallet) >= 6 },
  { id: 'plus12', icon: '👑', test: c => plusTenure(c.wallet) >= 12 }
];
export const badges = ctx => BADGES.map(b => ({ ...b, earned: Boolean(b.test(ctx)) }));
