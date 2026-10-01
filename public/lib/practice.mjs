// What practice adds up to: points (XP) and the level, the day's goal and
// the streak. All of it comes from this app's own payload (words.mjs): the
// right answers and masteries in the word progress, the answers per Taiwan
// day in `days`. Nothing here is money or touches the Quadra wallet.

// Points: a right answer, and a word mastered the first time.
export const POINTS = { right: 2, mastered: 15 };
// A day counts for the streak once this many answers were given.
export const DAILY_GOAL = 20;
// Days kept in the payload (a year and a bit, for the longest streak).
const KEEP_DAYS = 400;

export function xpOf(progress) {
  let xp = 0;
  for (const p of Object.values(progress || {})) xp += (p.r || 0) * POINTS.right + (p.m ? POINTS.mastered : 0);
  return xp;
}
// What one answer earned: shown in the round.
export const answerXp = ({ correct, firstMastery }) => (correct ? POINTS.right : 0) + (firstMastery ? POINTS.mastered : 0);
export function xpText(v, { sign = false } = {}) {
  const n = Math.round(v);
  return `${sign && n > 0 ? '+' : ''}${n.toLocaleString('en-US')} XP`;
}

// Level L starts at 100·(L−1)² points: 100 for level 2, 1,600 for 5, 8,100
// for 10, 36,100 for 20 (about 18,000 right answers), 240,100 for 50.
// A title every few levels.
export const xpForLevel = L => 100 * (L - 1) ** 2;
export const TITLES = [
  [1, '新手', 'Rookie'],
  [5, '學徒', 'Apprentice'],
  [10, '好手', 'Skilled'],
  [15, '高手', 'Expert'],
  [20, '達人', 'Master'],
  [30, '大師', 'Grandmaster'],
  [40, '傳奇', 'Legend'],
  [50, '神話', 'Mythic']
];
export function levelOf(xp, lang = 'zh') {
  const x = Math.max(0, xp || 0);
  let level = Math.max(1, Math.floor(1 + Math.sqrt(x / 100)));
  while (xpForLevel(level + 1) <= x) level++;
  while (level > 1 && xpForLevel(level) > x) level--;
  const [, zh, en] = [...TITLES].reverse().find(([min]) => level >= min);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  return { level, title: lang === 'en' ? en : zh, from, to, progress: (x - from) / (to - from), toNext: to - x };
}

// ---- Days ------------------------------------------------------------------------------
//
// `days`: { 'YYYY-MM-DD' (Taiwan): answers }.
export const taipeiDay = (t = Date.now()) => new Date(t + 8 * 3_600_000).toISOString().slice(0, 10);
const dayBefore = d => new Date(Date.parse(`${d}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

// One more answer today; old days dropped.
export function logAnswer(days, now = Date.now()) {
  const day = taipeiDay(now);
  const from = taipeiDay(now - KEEP_DAYS * 86_400_000);
  const out = Object.fromEntries(Object.entries(days || {}).filter(([d]) => d > from));
  out[day] = (out[day] || 0) + 1;
  return out;
}
// Two devices' days: the larger count each day.
export function mergeDays(a = {}, b = {}) {
  const out = { ...a };
  for (const [d, n] of Object.entries(b)) out[d] = Math.max(out[d] || 0, Number(n) || 0);
  return out;
}
export const todayCount = (days, now = Date.now()) => days?.[taipeiDay(now)] || 0;
const kept = (days, d) => (days?.[d] || 0) >= DAILY_GOAL;
// Days in a row with the goal met, up to today (or yesterday, while today
// isn't done yet).
export function streakOf(days, now = Date.now()) {
  let d = taipeiDay(now);
  if (!kept(days, d)) d = dayBefore(d);
  let n = 0;
  while (kept(days, d)) (n++, (d = dayBefore(d)));
  return n;
}
export function bestStreak(days) {
  const list = Object.keys(days || {}).filter(d => kept(days, d)).sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < list.length; i++) {
    run = i && dayBefore(list[i]) === list[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
// The streak would end tonight: there is one, and today's goal isn't met.
export const streakAtRisk = (days, now = Date.now()) => (kept(days, taipeiDay(now)) ? 0 : streakOf(days, now));
// The last `n` days, oldest first: [{ day, answers, kept }].
export function lastDays(days, n = 7, now = Date.now()) {
  const out = [];
  let d = taipeiDay(now);
  for (let i = 0; i < n; i++, d = dayBefore(d)) out.unshift({ day: d, answers: days?.[d] || 0, kept: kept(days, d) });
  return out;
}
