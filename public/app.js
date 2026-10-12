// Orbit Words: English words that stay. The high-school list (levels 1 to
// 6, every word recorded), taught by a memory model fitted to the person.
// Five tabs: 今天 (the goal, a round, new words, the word of the day), 練習
// (levels, ways to learn, the sound's speed), 複習 (missed, due, learning
// and bookmarked words, flash cards), 單字 (the whole list, searched) and
// 進度 (how far, how well, what's coming). Any word opens its sheet.
//
// This file starts the app, saves and opens tabs; the screens are views/*.js,
// the teaching lib/*.mjs. It uses no money: the progress is its own payload
// on the Quadra Pass. The pass itself (Plus, looks, the truth about money,
// every app's guide) is the kit's Quadra Pass sheet, in every app. (It was
// Quadra Hub; its id stays `vocab`, its storage and caches `quadra-hub`.)
import { quadraSession, tabBar, topActions, installGate, watchUpdates, schedulePush, notify } from '#kit/quadra.mjs';
import { loadWords, loadHints, packProgress, unpackProgress, mergeProgress, mergeCal, keyOf } from './lib/words.mjs';
import { DAILY_GOAL, mergeDays, mergeLog, todayCount, streakOf, streakAtRisk, taipeiDay } from './lib/practice.mjs';
import { mergeMarks, catCounts } from './lib/review.mjs';
import { state, hooks, t, locale } from './shell.js';
import { renderSession, busy } from './views/session.js';
import { renderToday } from './views/today.js';
import { renderPractice } from './views/practice.js';
import { renderReview } from './views/review.js';
import { renderBrowse } from './views/browse.js';
import { renderProgress } from './views/progress.js';
import { openWord, closeWord } from './views/sheet.js';
import { el, put } from './ui.js';

document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
const $ = id => document.getElementById(id);
const TABS = ['today', 'practice', 'review', 'list', 'progress'];
// Older links and notices said #words for 今天.
const TAB_ALIAS = { words: 'today' };
const VIEWS = { today: renderToday, practice: renderPractice, review: renderReview, list: renderBrowse, progress: renderProgress };
const VERSION = document.querySelector('meta[name="build-version"]')?.content || 'dev';

const q = quadraSession('vocab', { lang: locale });

// ---- Saved progress (the pass's vocab payload, gzipped) -----------------------------------

async function gzipB64(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gunzipB64(b64) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}
// 'z3:' + gzip of the progress (words.mjs packProgress).
async function decodePayload(payload) {
  if (!payload?.startsWith('z3:')) return null;
  try {
    return unpackProgress(JSON.parse(await gunzipB64(payload.slice(3))));
  } catch {
    return null;
  }
}
const encodePayload = async () => `z3:${await gzipB64(JSON.stringify(packProgress(state)))}`;

// Another copy of the progress (the pass's, or one a merge brought in): per
// word the newest; days and logs the larger; bookmarks the latest choice.
function absorb(decoded) {
  if (!decoded) return;
  state.progress = mergeProgress(state.progress, decoded.progress);
  state.days = mergeDays(state.days, decoded.days);
  state.log = mergeLog(state.log, decoded.log);
  state.marks = mergeMarks(state.marks, decoded.marks);
  if (decoded.levels && !state.levelsTouched) state.levels = decoded.levels;
  if (decoded.mode) state.mode = decoded.mode;
  if (decoded.opt?.rate) state.opt = { ...state.opt, rate: decoded.opt.rate };
  state.study = [...new Set([...state.study, ...decoded.study])];
  state.cal = mergeCal(state.cal, decoded.cal);
}

// ---- Sync: the payload, one write at a time -----------------------------------------------
let chain = Promise.resolve();
let dirty = false;
let timer = 0;
function sync({ soon = false } = {}) {
  clearTimeout(timer);
  if (soon) return (timer = setTimeout(() => sync(), 1500));
  chain = chain.then(push).catch(() => {});
  return chain;
}
async function push() {
  if (!q.active || !state.loaded || !dirty || state.unreadable) return;
  const payload = await encodePayload();
  dirty = false;
  try {
    await q.write({ payload });
  } catch (error) {
    dirty = true;
    throw error;
  }
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && sync());

hooks.changed = () => ((dirty = true), sync({ soon: true }));
hooks.sync = () => sync();
hooks.render = render;

// ---- Drawing ------------------------------------------------------------------------------

// The open tab: what's running in it (a round, cards), else its screen.
function render() {
  $('status').textContent = state.loaded ? t('statusLine', { n: Math.min(todayCount(state.days), DAILY_GOAL), goal: DAILY_GOAL, s: streakOf(state.days) }) : '';
  const box = $(`panel-${state.tab}`);
  if (!box) return;
  if (!state.words) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.session?.home === state.tab) renderSession(box);
  else VIEWS[state.tab](box);
  // 複習's count on its tab: the words missed last time.
  tabNav.badge('review', catCounts(state.words, state.progress, { marks: state.marks }).wrong, { tone: 'accent' });
}

const TAB_ICONS = { today: 'home', practice: 'grid', review: 'history', list: 'book', progress: 'chart' };
const tabNav = tabBar({ tabs: TABS.map(id => ({ id, label: t(`tab_${id}`), icon: TAB_ICONS[id] })), onSelect: (tab, { again }) => (again ? resetTab(tab) : showTab(tab)) });
function showTab(tab) {
  state.tab = tab;
  tabNav.select(tab);
  render();
}
// The open tab tapped again at the top: a finished round there is put away.
function resetTab(tab) {
  if (state.session?.home === tab && state.session.kind === 'round' && state.session.done) (state.session = null), render();
}
// A redraw that never interrupts a question or typing.
const quietRefresh = () => !busy() && !(document.activeElement?.tagName === 'INPUT') && render();

window.__fxStarted = true;
const gated = installGate('vocab', locale);
watchUpdates({ current: VERSION, key: 'quadraHub', cachePrefix: 'quadra-hub-', busy });
// The same top-right in every app (the guide and the pass: the kit's sheet).
topActions(q);
tabNav.select(state.tab);
q.on('wallet', quietRefresh);
q.on('active', live => live && sync());

// Notices (the kit's: a banner on screen, a system notice in the background
// once turned on in the account sheet): a streak that ends tonight, now
// (after 20:00 Taiwan time) and, while the app is closed, at 20:00 today
// (if the goal isn't met yet) and the next two evenings.
function checkStreak() {
  const n = streakAtRisk(state.days);
  const body = t('noticeStreakBody', { goal: DAILY_GOAL });
  if (n && new Date(Date.now() + 8 * 3_600_000).getUTCHours() >= 20) notify(q, { title: t('noticeStreak', { n }), body, tag: `streak:${taipeiDay()}`, hash: 'today', kind: 'streak' });
  const now = Date.now();
  const eight = day => Date.parse(`${taipeiDay(now + day * 86_400_000)}T20:00:00+08:00`);
  const items = [];
  if (n && eight(0) > now) items.push({ at: eight(0), title: t('noticeStreak', { n }), body, tag: `streak:${taipeiDay(now)}`, hash: 'today', kind: 'streak' });
  for (const day of [1, 2]) items.push({ at: eight(day), title: t('noticeStreakSoon'), body, tag: `streak:${taipeiDay(now + day * 86_400_000)}`, hash: 'today', kind: 'streak' });
  schedulePush(q, items);
}

async function loadWordList() {
  state.words = loadWords(await fetch(`./data/words.json?v=${VERSION}`).then(r => r.json()));
  state.byKey = new Map(state.words.map(w => [w.key, w]));
}
// The hints come after the first screen: nothing on it waits for them. A
// failed read leaves them out until the next opening (never saved empty).
async function loadHintList() {
  try {
    const res = await fetch(`./data/hints.json?v=${VERSION}`);
    if (!res.ok) throw new Error(String(res.status));
    state.hints = loadHints(await res.json());
    if (!busy()) render();
  } catch {}
}

async function boot() {
  const words = loadWordList().catch(() => null);
  const first = await q.start();
  await words;
  const theirs = await decodePayload(first?.payload);
  // A copy on the pass that can't be read is never saved over.
  if (first?.payload && !theirs) state.unreadable = true;
  absorb(theirs);
  for (const item of first?.inbox || []) absorb(await decodePayload(item.payload));
  state.loaded = true;
  $('loading').hidden = true;
  openFromHash(true);
  if (first?.inbox?.length) dirty = true;
  loadHintList();
  await sync();
  for (const item of first?.inbox || []) q.dropInbox(item.id).catch(() => {});
  setTimeout(checkStreak, 2000);
}
if (!gated) boot();

// Where the address points: a tab (#review), or a word (#word=abandon, its
// sheet over the open tab). At start, and whenever it changes while the app
// is open (a link, a notice's tap). A guide (#help=…) is the kit's: it opens
// the Quadra Pass sheet.
function openFromHash(start = false) {
  const hash = decodeURIComponent(location.hash.slice(1));
  const word = hash.startsWith('word=') ? state.byKey.get(keyOf(hash.slice(5))) : null;
  const named = TAB_ALIAS[hash] || hash;
  const tab = TABS.includes(named) ? named : start ? 'today' : null;
  if (tab && (tab !== state.tab || start)) showTab(tab);
  if (word) openWord(word);
  else if (tab) closeWord();
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
