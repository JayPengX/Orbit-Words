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
import * as fmtKit from '#kit/format.mjs';
import { orbitSession, taipeiDay, tabBar, topActions, installGate, watchUpdates, schedulePush, notify, keepOffline, storedAccount, cachedPayload } from '#kit/orbit.mjs';
import { loadWords, loadHints, loadMore, keyOf, askTerm, stateOf, warmMeanings, stats, learningList } from './lib/words.mjs';
import { DAILY_GOAL, streakAtRisk, goalStatus } from './lib/practice.mjs';
import { catCounts } from './lib/review.mjs';
import { decodePayload, encodePayload, mergeCopy } from './lib/copy.mjs';
import { state, hooks, t, locale, moreOf } from './shell.js';
import { renderSession, busy, startRound } from './views/session.js';
import { renderToday } from './views/today.js';
import { renderReview } from './views/review.js';
import { renderBrowse, searchFor } from './views/browse.js';
import { renderProgress } from './views/progress.js';
import { openWord, closeWord, redrawWord } from './views/sheet.js';
import { el, put, fitSenses, FIT_SENSES } from './ui.js';
import './testing.js';

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

hooks.changed = () => (pass.changed(), keepLocal(), sync({ soon: true }), goalWatch());
hooks.sync = () => sync();
hooks.render = render;
hooks.tab = tab => (tab === state.tab ? scrollTo({ top: 0 }) : showTab(tab));

// ---- Drawing ------------------------------------------------------------------------------

// The open tab: what's running in it (a round, cards), else its screen.
// A round (or cards, a paper) started or put away is a new screen: it opens
// at the top, never where the tapped row was far down the home (a round
// opened on blank, Jay 2026-11-03).
let drawn;
let drawnTab;
function render() {
  const box = $(`panel-${state.tab}`);
  if (!box) return;
  if (!state.words && state.wordsFailed) return put(box, kitUI.empty({ icon: 'book', title: t('wordsFailed'), action: { label: t('contestRetry'), onTap: () => hooks.retryWords?.() } }));
  if (!state.words) return put(box, el('div', { class: 'q-skel-lines', role: 'status' }, [0, 1, 2, 3].map(() => el('i', { class: 'q-skel' }))));
  const running = state.session?.home === state.tab ? state.session : null;
  if (running !== drawn && drawnTab === state.tab) kitUI.freshScreen ? kitUI.freshScreen() : scrollTo(0, 0);
  drawn = running;
  drawnTab = state.tab;
  if (running) renderSession(box);
  else {
    VIEWS[state.tab](box);
    // Every tab but the first opens on the kit's large title (今天 has none).
    if (state.tab !== TABS[0]) box.prepend(kitUI.navTitle(t(`tab_${state.tab}`)));
  }
  lockRound(running);
  // 複習's count on its tab: the words missed last time.
  tabNav.badge('review', catCounts(state.words, state.progress, { marks: state.marks }).wrong, { tone: 'accent' });
  tellDue();
}

// The family's notebook (kit family.mjs): how many words are due today, for
// Orbit Class's 下課背五個 (a break's one tap to #five). Only the count.
function tellDue() {
  const n = stats(state.words, state.progress).all.due;
  const day = fmtKit.localDay ? fmtKit.localDay(Date.now()) : taipeiDay(Date.now());
  import('#kit/family.mjs')
    .then(f => f.tell?.('vocab', 'due', { day, n }))
    .catch(() => {});
  tellLearning();
}

// …and the words being learned, for Orbit News' 新聞學單字 (told when they change).
let toldLearning = '';
function tellLearning() {
  const words = learningList(state.words, state.progress, k => moreOf(k)?.forms);
  const sig = words.map(w => w.w + (w.f ? w.f.length : '')).join();
  if (sig === toldLearning) return;
  toldLearning = sig;
  import('#kit/family.mjs')
    .then(f => f.tell?.('vocab', 'learning', { words }))
    .catch(() => {});
}

// While a round's screen fits the screen, the page doesn't scroll (nothing
// under it to scroll to); a taller one (a long sentence, the end's list of
// words) scrolls as ever.
function lockRound(running) {
  const root = document.documentElement;
  if (!running) return root.classList.remove('run-lock');
  requestAnimationFrame(() => {
    if (drawn !== running) return;
    root.classList.remove('run-lock');
    root.classList.toggle('run-lock', document.scrollingElement.scrollHeight <= innerHeight + 1);
  });
}
addEventListener('resize', () => lockRound(drawn));

const TAB_ICONS = { today: 'home', review: 'history', list: 'book', progress: 'chart' };
const tabNav = tabBar({ tabs: TABS.map(id => ({ id, label: t(`tab_${id}`), icon: TAB_ICONS[id] })), onSelect: (tab, { again }) => (again ? resetTab(tab) : showTab(tab)) });
function showTab(tab) {
  state.tab = tab;
  tabNav.select(tab);
  render();
}
// The open tab tapped again at the top: a finished round there is put away.
function resetTab(tab) {
  if (state.session?.home === tab && state.session.done) (state.session = null), render();
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
// A new kind of screen (turned on its side, a window made wider): the tab laid out again for it.
kit.onScreen?.(() => state.loaded && quietRefresh());

// Notices (the kit's: a banner on screen, a system notice in the background
// once turned on in the account sheet): a streak that ends tonight, now
// (after 20:00 Taiwan time) and, while the app is closed, at 20:00 today
// (if the goal isn't met yet) and the next two evenings.
function checkStreak() {
  const n = streakAtRisk(state.days);
  const body = t('noticeStreakBody', { goal: DAILY_GOAL });
  // (20:00 and the day by the phone's own clock, wherever it is: 2026-11-06.)
  const now = Date.now();
  const dayOf = t => (fmtKit.localDay ? fmtKit.localDay(t) : taipeiDay(t));
  const eight = day => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + day, 20).getTime();
  };
  if (n && new Date(now).getHours() >= 20) notify(q, { title: t('noticeStreak', { n }), body, tag: `streak:${dayOf(now)}`, hash: 'today', kind: 'streak' });
  const items = [];
  if (n && eight(0) > now) items.push({ at: eight(0), title: t('noticeStreak', { n }), body, tag: `streak:${dayOf(now)}`, hash: 'today', kind: 'streak' });
  for (const day of [1, 2]) items.push({ at: eight(day), title: t('noticeStreakSoon'), body, tag: `streak:${dayOf(eight(day))}`, hash: 'today', kind: 'streak' });
  streakSeen = goalSeen();
  schedulePush(q, items);
}
// The day's goal met (or a new day begun) after the notices were planned:
// planned again, so tonight's 連續…今晚到期 is taken back.
let streakSeen = '';
const goalSeen = () => `${(fmtKit.localDay ? fmtKit.localDay(Date.now()) : taipeiDay(Date.now()))}:${goalStatus(state.days).left === 0}`;
const goalWatch = () => streakSeen && streakSeen !== goalSeen() && checkStreak();

// (Each list's address carries its own hash, stamped at deploy (Orbit-Core
// kit/stamp-app.mjs): a deploy that didn't change it leaves the phone's copy;
// with the build's version, every deploy downloaded all three again, 466 KB.)
async function loadWordList() {
  const res = await fetch('./data/words.json');
  if (!res.ok) throw new Error(String(res.status));
  state.words = loadWords(await res.json());
  state.byKey = new Map(state.words.map(w => [w.key, w]));
  warmMeanings(state.words);
}
// The list, however long it takes: a failed read lifts the cover onto 讀不到 with
// 再試一次 (and tries again by itself when the phone comes back online), never a
// spinner forever; everything after it waits for the words.
function wordsReady() {
  return new Promise(done => {
    const go = () =>
      loadWordList().then(
        () => ((state.wordsFailed = false), done()),
        () => {
          state.wordsFailed = true;
          $('loading').hidden = true;
          render();
        }
      );
    hooks.retryWords = () => ((state.wordsFailed = false), render(), go());
    addEventListener('online', () => state.wordsFailed && hooks.retryWords());
    go();
  });
}
// The hints come after the first screen: nothing on it waits for them. A
// failed read leaves them out until the next opening (never saved empty).
async function loadHintList() {
  try {
    const res = await fetch('./data/hints.json');
    if (!res.ok) throw new Error(String(res.status));
    state.hints = loadHints(await res.json());
    if (!busy()) render();
  } catch {}
}
// A word's example and forms, for its sheet and the contest's 填空: after the first screen too.
// A failed read says so on the contest's card, with 再試一次 (hooks.loadMore).
async function loadMoreList() {
  state.moreFailed = false;
  try {
    // (測試工具: as if the file can't be read; testing.js.)
    if (globalThis.ORBIT_TEST?.flags?.vocabNoMore) throw new Error('test');
    const res = await fetch('./data/more.json');
    if (!res.ok) throw new Error(String(res.status));
    state.more = loadMore(await res.json());
    redrawWord();
    // (今天's contest card waits for them: 填空's sentences.)
    if (!busy()) render();
  } catch {
    state.moreFailed = true;
    if (!busy()) render();
  }
}
hooks.loadMore = () => (loadMoreList(), render());

async function boot() {
  const words = wordsReady();
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
  loadMoreList();
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
  // 問 Orbit's question (the Pass sheet, kit ask-orbit.mjs: #ask=<words>): the word it asks about.
  // (The address read first: the tab shown at start writes its own over it.)
  if (/(?:^#|&)ask=/.test(location.hash)) {
    const hash = location.hash;
    if (start) showTab('today');
    import('#kit/ask-orbit.mjs')
      .then(m => {
        const text = m.takeAsk?.({ hash, pathname: location.pathname, search: location.search });
        if (text) askWords(text);
      })
      .catch(() => {});
    return;
  }
  const hash = decodeURIComponent(location.hash.slice(1));
  // #five: 下課背五個 from Orbit Class, a five-word round on 今天 (once: the address goes back to #today).
  if (hash === 'five') {
    history.replaceState(null, '', '#today');
    showTab('today');
    if (!busy()) startRound({ size: 5 });
    return;
  }
  const word = hash.startsWith('word=') ? state.byKey.get(keyOf(hash.slice(5))) : null;
  const tab = TABS.includes(hash) ? hash : start ? 'today' : null;
  if (tab && (tab !== state.tab || start)) showTab(tab);
  if (word) openWord(word);
  else if (tab) closeWord();
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());
// A word asked about: its sheet when it's on the list, else the list searched
// for it (English or a Chinese meaning), else 今天 (「今天要背哪些單字」).
async function askWords(text) {
  // 「背 10 個單字」: a command (kit act.mjs, read by code, no AI call) starts a round on 今天, as its button does.
  const act = await import('#kit/act.mjs').then(m => m.readAct?.(text)).catch(() => null);
  if (act?.act === 'practice') {
    showTab('today');
    if (!busy()) startRound(act.size ? { size: act.size } : {});
    return;
  }
  const term = askTerm(text);
  const word = term && state.byKey.get(keyOf(term));
  if (word) return void openWord(word);
  if (!term) return void showTab('today');
  searchFor(term);
  showTab('list');
}

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
