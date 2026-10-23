// Orbit Words: English words that stay. The high-school list (levels 1 to
// 6, every word recorded), taught by a memory model fitted to the person.
// Four tabs: 今天 (the goal and the round, whose choices are a sheet: levels,
// ways to learn, the sound's speed; new words, the word of the day), 複習
// (missed, due, learning and bookmarked words, flash cards), 單字 (the whole
// list, searched) and 進度 (how far, how well, what's coming). Any word
// opens its sheet.
//
// This file starts the app, saves and opens tabs; the screens are views/*.js,
// the teaching lib/*.mjs. It uses no money: the progress is its own payload
// on the Orbit Pass. The pass itself (looks, the truth about money,
// every app's guide) is the kit's Orbit Pass sheet, in every app. (It was
// Orbit Words; its id stays `vocab`, its storage and caches `orbit-words`.)
import * as kitUI from '#kit/ui.mjs';
// (As a namespace: a phone on an older kit lacks milestone, and a missing named import would stop the app.)
import * as kit from '#kit/orbit.mjs';
import { passSync } from '#kit/pass-sync.mjs';
import { orbitSession, taipeiDay, tabBar, topActions, installGate, watchUpdates, schedulePush, notify, keepOffline, storedAccount, cachedPayload } from '#kit/orbit.mjs';
import { loadWords, loadHints, keyOf, stateOf } from './lib/words.mjs';
import { DAILY_GOAL, streakAtRisk } from './lib/practice.mjs';
import { catCounts } from './lib/review.mjs';
import { decodePayload, encodePayload, mergeCopy } from './lib/copy.mjs';
import { state, hooks, t, locale } from './shell.js';
import { renderSession, busy } from './views/session.js';
import { renderToday } from './views/today.js';
import { renderReview } from './views/review.js';
import { renderBrowse } from './views/browse.js';
import { renderProgress } from './views/progress.js';
import { openWord, closeWord } from './views/sheet.js';
import { el, put, fitSenses, FIT_SENSES } from './ui.js';

document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
const $ = id => document.getElementById(id);
const TABS = ['today', 'review', 'list', 'progress'];
const VIEWS = { today: renderToday, review: renderReview, list: renderBrowse, progress: renderProgress };
const VERSION = document.querySelector('meta[name="build-version"]')?.content || 'dev';

const q = orbitSession('vocab', { lang: locale });

// ---- Saved progress (the pass's vocab payload, gzipped: lib/copy.mjs) ----------------------

// Another copy of the progress (the pass's, the phone's, one a merge brought in) into this one.
const absorb = decoded => Object.assign(state, mergeCopy(state, decoded));

// The progress kept on this phone too (under the account), at every change:
// what's learned with no connection stays when the app is closed, and the app
// opens on it at once, not after the sign-in. Merged with the pass's copy,
// never in its place: the pass's copy is read and merged in before anything
// is written over it, whenever it may have changed (the kit's pass-sync.mjs), so a
// phone that was offline, or another device's newer progress, is never
// written over.
const LOCAL_KEY = 'orbit-words.progress.v1';
async function keepLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ account: storedAccount(), payload: await encodePayload(state) }));
  } catch {}
}
function localCopy() {
  try {
    const kept = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    return kept && kept.account === storedAccount() ? kept.payload : null;
  } catch {
    return null;
  }
}
const pass = passSync(q, {
  decode: decodePayload,
  encode: () => encodePayload(state),
  // The pass's copy read (after an opening with no connection, once it's back; on coming back to the app).
  apply: theirs => {
    absorb(theirs);
    keepLocal();
    quietRefresh();
  }
});
// One write at a time; a change goes up 1.5 s later (or at once when the app is put away).
let timer = 0;
function sync({ soon = false } = {}) {
  clearTimeout(timer);
  if (soon) return (timer = setTimeout(() => sync(), 1500));
  if (!state.loaded) return Promise.resolve();
  // The words mastered, toward the 五百字 milestone.
  kit.milestone?.(q, 'vocab', Object.values(state.progress || {}).filter(p => stateOf(p) === 'mastered').length);
  return pass.sync();
}
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && sync());

hooks.changed = () => (pass.changed(), keepLocal(), sync({ soon: true }));
hooks.sync = () => sync();
hooks.render = render;

// ---- Drawing ------------------------------------------------------------------------------

// The open tab: what's running in it (a round, cards), else its screen.
function render() {
  const box = $(`panel-${state.tab}`);
  if (!box) return;
  if (!state.words) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.session?.home === state.tab) renderSession(box);
  else {
    VIEWS[state.tab](box);
    // Every tab but the first opens on the kit's large title (今天 has none).
    if (state.tab !== TABS[0]) box.prepend(kitUI.navTitle(t(`tab_${state.tab}`)));
  }
  // 複習's count on its tab: the words missed last time.
  tabNav.badge('review', catCounts(state.words, state.progress, { marks: state.marks }).wrong, { tone: 'accent' });
}

const TAB_ICONS = { today: 'home', review: 'history', list: 'book', progress: 'chart' };
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
watchUpdates({ current: VERSION, key: 'orbitWords', cachePrefix: 'orbit-words-' });
// The same top-right in every app (the guide and the pass: the kit's sheet).
topActions(q);
tabNav.select(state.tab);
q.on('wallet', quietRefresh);

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
  const starting = q.start();
  // A phone that has studied here: its own copy up at once (no wait on the
  // sign-in, nor on a connection at all), the pass's merged in when it comes.
  const mine = await decodePayload(localCopy() || cachedPayload('vocab'));
  const show = () => {
    if (state.loaded) return render();
    state.loaded = true;
    $('loading').hidden = true;
    openFromHash(true);
  };
  if (mine) {
    await words;
    absorb(mine);
    show();
  }
  const first = await starting;
  await words;
  // The pass's copy merged (one that can't be read is never saved over); what
  // this phone learned that the pass hasn't got yet goes up.
  await pass.first(first, { local: Boolean(mine) });
  for (const item of first?.inbox || []) absorb(await decodePayload(item.payload));
  if (first?.inbox?.length) pass.changed();
  keepLocal();
  show();
  pass.watch();
  loadHintList();
  await sync();
  for (const item of first?.inbox || []) q.dropInbox(item.id).catch(() => {});
  setTimeout(checkStreak, 2000);
}
if (!gated) boot();

// Where the address points: a tab (#review), or a word (#word=abandon, its
// sheet over the open tab). At start, and whenever it changes while the app
// is open (a link, a notice's tap). A guide (#help=…) is the kit's: it opens
// the Orbit Pass sheet.
function openFromHash(start = false) {
  const hash = decodeURIComponent(location.hash.slice(1));
  const word = hash.startsWith('word=') ? state.byKey.get(keyOf(hash.slice(5))) : null;
  const tab = TABS.includes(hash) ? hash : start ? 'today' : null;
  if (tab && (tab !== state.tab || start)) showTab(tab);
  if (word) openWord(word);
  else if (tab) closeWord();
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());

// Opens without a connection: the kit registers the worker and has it keep every file loaded.
keepOffline();

// Meanings fitted to their line after any redraw (ui.js), once a frame.
let sensesDue = false;
new MutationObserver(() => {
  if (sensesDue) return;
  sensesDue = true;
  requestAnimationFrame(() => {
    sensesDue = false;
    fitSenses([...document.querySelectorAll(FIT_SENSES)].filter(n => !n.dataset.full));
  });
}).observe(document.body, { childList: true, subtree: true });
addEventListener('resize', () => fitSenses([...document.querySelectorAll(FIT_SENSES)]));
