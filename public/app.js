// Quadra Rewards: where Quadra rewards effort and explains itself. Words
// (the high-school list, levels 1 to 6, six ways to learn), mini games and
// daily missions give points (XP), never money (v7); the shop spends from
// the Quadra Pass's shared wallet; the wealth ranks show where the pool
// stands; the help centre explains every app.
import {
  quadraSession, tabBar, topActions, installGate, watchUpdates, recordAffinity, setting, settingPatch, taipeiDay, poolBalance, money, randomId, notify, schedulePush, APPS, ECONOMY, PLUS, ask, tell, plusCard, plusMember, openPlus, affinityPatch, xpLevel, xpBalance, xpExpiring, xpForLevel, AVATARS, avatarOwned, avatarBought, levelCards, STREAK, streakBonus, longestStreakOf, FRAMES, frameOwned, activeDaySet
} from './lib/quadra.mjs';
import { SHOP, shopEntry, redeemEntry, freezes, boostUntil, openPacks, packPrice, packEntry, packOpen, rerolls, repairable } from './lib/shop.mjs';
import { LEVELS, PACK_IDS, addPacks, levelRank, inLevels, MODES, loadWords, pickRound, smartType, markKnown, makeQuestion, grade, payFor, sameWord, spellDiff, stats, stateOf, packProgress, unpackProgress, mergeProgress, migrateWords, shortMeaning, wordOfDay } from './lib/words.mjs';
import {
  xpToday, xpOf, xpText, xpRate, missions, claimEntry, rankOf, RANKS, streakDays, xpAllTime, streakAtRisk, streakToday, dailyId, dailyStreak, weeklyGoals, claimWeekly, badges, freezeDue, capToday, dampXp, capStage } from './lib/earn.mjs';
import { GAMES, gameInfo, dailyGame, dailyBonus, mergeBests } from './lib/games.mjs';
import { HELP_ORDER, helpFor, parseHelpHash } from './lib/help.mjs';
import { pickVoice } from './lib/voice.mjs';
import { detectLocale, makeT } from './lib/i18n.mjs';
import { mountGames } from './games-ui.js';

const locale = detectLocale();
const t = makeT(locale);
document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
const $ = id => document.getElementById(id);
const TABS = ['home', 'words', 'games', 'missions'];
const VERSION = document.querySelector('meta[name="build-version"]')?.content || 'dev';

const state = {
  tab: 'home',
  wallet: null,
  words: null,
  byKey: new Map(),
  progress: {},
  levels: [1, 2, 3],
  mode: 'smart',
  loaded: false,
  round: null,
  help: { app: 'pass', topic: null }
};

const q = quadraSession('vocab', { lang: locale });

// ---- Helpers ------------------------------------------------------------------------

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of [].concat(children)) if (child != null && child !== false) node.append(child);
  return node;
}
const put = (node, ...kids) => node.replaceChildren(...kids.filter(k => k != null && k !== false));
const nt = v => money(v);
const xp = v => xpText(v);
const section = (title, content, { sub = '', action = null } = {}) =>
  el('section', { class: 'q-section' }, [el('div', { class: 'q-section-head' }, [el('h2', { text: title }), action]), sub ? el('p', { class: 'section-sub', text: sub }) : null, content]);
function toast(text, kind = '') {
  const box = el('div', { class: `toast ${kind}`, text });
  $('toasts').append(box);
  setTimeout(() => box.remove(), 2600);
}
const bar = (value, max, cls = '') => el('div', { class: `meter ${cls}` }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);

// ---- Saved progress (the pass's Rewards payload, gzipped) --------------------------------

async function gzipB64(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gunzipB64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}
// 'z3:' + gzip: this app's payload; plain gzip base64: Quadra Words' snapshot.
async function decodePayload(payload) {
  if (!payload) return null;
  try {
    const text = payload.startsWith('z3:') ? await gunzipB64(payload.slice(3)) : await gunzipB64(payload);
    return unpackProgress(JSON.parse(text));
  } catch {
    return null;
  }
}
const encodePayload = async () => `z3:${await gzipB64(JSON.stringify(packProgress({ progress: state.progress, levels: state.levels, mode: state.mode })))}`;

// ---- Points earned here: entries waiting to go to the pass ------------------------------
//
// A batch of answers, a game round or a claimed mission becomes an entry
// with a fixed id at once (amount 0, its points in `xp`), kept on this
// device (quadra.rewards.out) until the pass has it, so nothing is lost
// offline or counted twice. A shop purchase waits here the same way.
const OUT_KEY = 'quadra.rewards.out';
const outbox = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(OUT_KEY) || '[]');
    } catch {
      return [];
    }
  },
  write(list) {
    try {
      localStorage.setItem(OUT_KEY, JSON.stringify(list));
    } catch {}
  }
};
// Before v7 these entries paid NT$, which the Worker no longer takes: any
// still waiting become points, and a mission's free bet is gone.
outbox.write(outbox.read().filter(e => !String(e.id).startsWith('vocab:fb:')).map(e => (e.amount > 0 ? { ...e, amount: 0, xp: e.amount } : e)));
const earned = () => {
  const e = xpToday(state.wallet);
  for (const x of outbox.read()) if (taipeiDay(x.t) === taipeiDay() && !walletHas(x.id) && xpOf(x)) e[x.kind === 'reward' ? 'words' : x.kind] += xpOf(x);
  e.total = e.words + e.game + e.mission;
  return e;
};
const walletHas = id => (state.wallet?.entries || []).some(e => e.id === id);
// The wallet with what's still waiting to be sent, for anything counted from entries.
const withOutbox = () => ({ ...(state.wallet || {}), entries: [...(state.wallet?.entries || []), ...outbox.read().filter(e => !walletHas(e.id))] });

// Your best round per game: in the wallet's settings (bests:vocab), and on
// this device until the pass has it.
const BESTS_KEY = 'quadra.rewards.bests';
let bestsDirty = false;
function localBests() {
  try {
    return JSON.parse(localStorage.getItem(BESTS_KEY) || '{}');
  } catch {
    return {};
  }
}
const bests = () => mergeBests(setting(state.wallet, 'bests:vocab', {}), localBests());
function recordBest(game, v) {
  const had = bests()[game];
  if (!(v > 0) || (had && had.v >= v)) return false;
  try {
    localStorage.setItem(BESTS_KEY, JSON.stringify({ ...localBests(), [game]: { v, t: Date.now() } }));
  } catch {}
  bestsDirty = true;
  return Boolean(had);
}
// Today's challenge: the game, whether it's played, the streak and its bonus.
function daily() {
  const day = taipeiDay();
  const w = withOutbox();
  const streak = dailyStreak(w);
  const done = w.entries.some(e => e.id === dailyId(day));
  return { day, game: dailyGame(day), done, streak, bonus: dailyBonus(streak) };
}
const boosted = () => boostUntil(withOutbox()) > Date.now();

// Activity counts for the missions (act:vocab), added up here.
const act = { answer: 0, master: 0, game: 0, hard: 0, perfect: 0 };
function actPatch() {
  const day = taipeiDay();
  const had = setting(state.wallet, 'act:vocab', null);
  const n = had?.day === day ? { ...had.n } : {};
  let any = false;
  for (const [k, v] of Object.entries(act)) {
    if (!v) continue;
    n[k] = (n[k] || 0) + v;
    act[k] = 0;
    any = true;
  }
  return any ? settingPatch('act:vocab', { day, n }).settings : {};
}

// Settings chosen here (the avatar worn) waiting for the next write.
let pendingSettings = {};

// The open batch of word points.
let batch = null;
// Every answer goes in the batch (flash cards and misses too: practice keeps
// the streak); only the points it earns count as points.
function addWordPoints(points) {
  points = Math.max(0, points);
  // The ×2 boost bought in the shop, Plus's ×1.5 and the streak's bonus.
  const rate = xpRate(withOutbox()) * (boosted() ? 2 : 1);
  // The day's soft cap (the boost and the rate move its steps too).
  points = dampXp(points * rate, capToday(withOutbox(), Date.now(), batch?.xp || 0), rate);
  batch ||= { id: `vocab:w:${randomId()}`, t: Date.now(), app: 'vocab', kind: 'words', amount: 0, xp: 0, n: 0 };
  batch.xp += points;
  batch.n++;
  if (batch.n >= 10) closeBatch();
  return points;
}
function closeBatch() {
  if (!batch?.n) return (batch = null);
  const { n, ...entry } = batch;
  outbox.write([...outbox.read(), { ...entry, xp: Math.round(entry.xp), note: locale === 'en' ? `${n} answers` : `${n} 題` }]);
  batch = null;
}
// A finished game round or a mission: one entry now.
function payEntry(entry) {
  outbox.write([...outbox.read(), entry]);
  sync();
}

// ---- Sync: payload + entries + activity, one write at a time ----------------------------
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
  if (!q.active || !state.loaded) return;
  closeBatchIfIdle();
  const out = outbox.read().filter(e => !walletHas(e.id));
  const settings = { ...actPatch(), ...affinityPatch('vocab').settings, ...(bestsDirty ? settingPatch('bests:vocab', bests()).settings : {}), ...pendingSettings };
  pendingSettings = {};
  bestsDirty = false;
  if (!dirty && !out.length && !Object.keys(settings).length) return;
  const payload = dirty && !state.unreadable ? await encodePayload() : undefined;
  dirty = false;
  try {
    const res = await q.write({ payload, wallet: { entries: out, settings } });
    if (res?.wallet) state.wallet = res.wallet;
    outbox.write(outbox.read().filter(e => !walletHas(e.id)));
  } catch (error) {
    if (payload) dirty = true;
    if (settings['bests:vocab']) bestsDirty = true;
    // The avatar chosen goes with the next try (unless changed since).
    if (settings.avatar && !('avatar' in pendingSettings)) pendingSettings = { ...pendingSettings, avatar: settings.avatar };
    throw error;
  }
  quietRefresh();
}
// A redraw that never interrupts a question or a game in play.
function quietRefresh() {
  if ((state.tab === 'words' && state.round && !state.round.done) || (state.tab === 'games' && games?.busy())) return;
  refresh();
}
function closeBatchIfIdle() {
  if (batch && (!state.round || state.round.done)) closeBatch();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    closeBatch();
    sync();
  }
});

// Another copy of the progress (the pass's, or one merged in): per word the newest.
function absorb(decoded) {
  if (!decoded) return;
  state.progress = mergeProgress(state.progress, decoded.progress);
  if (decoded.levels && !state.levelsTouched) state.levels = decoded.levels;
  if (decoded.mode && MODES.includes(decoded.mode)) state.mode = decoded.mode;
}

// ---- Words ----------------------------------------------------------------------------------

async function loadWordList() {
  const [main, packs] = await Promise.all([
    fetch(`./data/words.json?v=${VERSION}`).then(r => r.json()),
    fetch(`./data/packs.json?v=${VERSION}`).then(r => r.json()).catch(() => ({}))
  ]);
  state.words = addPacks(loadWords(main), packs);
  state.byKey = new Map(state.words.map(w => [w.key, w]));
}
// The words this pass can study: the main list and the packs it owns (or
// has with Quadra Plus).
function myWords() {
  const owned = openPacks(withOutbox());
  return (state.words || []).filter(w => typeof w.level === 'number' || owned.includes(w.level));
}
// The levels chosen, packs only once owned.
const myLevels = () => state.levels.filter(l => LEVELS.includes(l) || packOpen(withOutbox(), l));
// A level's name: 第 3 級, or a pack's name.
const levelName = l => (typeof l === 'number' ? t('level', { n: l }) : t(`pack_${l}`));

// Pronunciation: every word has a recording in Microsoft's neural voice
// (data/audio, en-US Jenny); slow is the same clip at three quarters speed.
// One <audio> element is reused, so once a tap has played it (iOS only lets
// sound start from a tap) later words play from code too, and each word is
// started right in the tap that asks for it (never after a delay, which iOS
// would silence). Without the clip (offline, a missing file): the device's
// best English voice (lib/voice.mjs).
const clip = typeof Audio === 'function' ? new Audio() : null;
if (clip) {
  clip.preload = 'auto';
  clip.preservesPitch = true;
}
let voices = [];
const loadVoices = () => {
  try {
    voices = speechSynthesis.getVoices();
  } catch {}
};
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
// The recordings; the device's best English voice only when one is missing.
try {
  localStorage.removeItem('rewards.voice');
} catch {}
function voiceSpeak(text, slow) {
  if (!('speechSynthesis' in window)) return;
  if (!voices.length) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voices);
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-US';
  u.rate = slow ? 0.72 : 0.95;
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  speechSynthesis.speak(u);
  if (speechSynthesis.paused) speechSynthesis.resume();
}
function speak(word, { slow = false } = {}) {
  const text = word.word;
  if (!clip) return voiceSpeak(text, slow);
  try {
    clip.pause();
  } catch {}
  let fell = false;
  const fallback = () => {
    if (fell) return;
    fell = true;
    voiceSpeak(text, slow);
  };
  clip.onerror = fallback;
  clip.src = `./data/audio/${encodeURIComponent(text)}.mp3`;
  clip.playbackRate = slow ? 0.75 : 1;
  clip.play().catch(e => e?.name !== 'AbortError' && fallback());
}
const speakButton = (word, big = false) => el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), text: '🔊', onclick: e => (e.stopPropagation(), speak(word)) });

function renderWords() {
  const box = $('panel-words');
  if (!state.words) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.round) return renderRound(box);
  const st = stats(myWords(), state.progress);
  const today = earned();
  const selected = [...LEVELS, ...PACK_IDS].filter(l => myLevels().includes(l));
  const due = selected.reduce((s, l) => s + st[l].due, 0);
  const levelCards = el(
    'div',
    { class: 'level-grid' },
    LEVELS.map(l =>
      el('button', { class: `level-card${state.levels.includes(l) ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.levels.includes(l)), onclick: () => toggleLevel(l) }, [
        el('div', { class: 'level-top' }, [el('strong', { text: t('level', { n: l }) }), el('small', { text: t(`levelHint${l}`) })]),
        bar(st[l].mastered, st[l].total),
        el('div', { class: 'level-foot' }, [el('span', { class: 'num', text: `${st[l].mastered.toLocaleString()} / ${st[l].total.toLocaleString()}` }), st[l].due ? el('span', { class: 'due', text: t('dueN', { n: st[l].due }) }) : null])
      ])
    )
  );
  const modes = el(
    'div',
    { class: 'mode-grid' },
    MODES.map(m =>
      el('button', { class: `mode${state.mode === m ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.mode === m), onclick: () => ((state.mode = m), (dirty = true), sync({ soon: true }), renderWords()) }, [
        el('span', { class: 'mode-icon', text: MODE_ICON[m] }),
        el('strong', { text: t(`mode_${m}`) }),
        el('small', { text: t(`modeHint_${m}`) })
      ])
    )
  );
  put(
    box,
    el('div', { class: 'q-card pad start-card' }, [
      el('div', { class: 'start-top' }, [
        el('div', {}, [el('h2', { text: t('wordsTitle') }), el('p', { class: 'muted', text: selected.length ? t('wordsSub', { due, levels: selected.map(l => (typeof l === 'number' ? l : t(`pack_${l}`))).join('、') }) : t('pickLevel') })]),
        el('div', { class: 'earn-mini' }, [el('small', { class: 'muted', text: t('todayWords') }), el('strong', { class: 'num', text: xp(today.words) })])
      ]),
      boostLine(),
      el('div', { class: 'size-row' }, [
        el('span', { class: 'muted', text: t('roundSize') }),
        el('div', { class: 'segmented small', role: 'group' }, [10, 20, 30].map(n => el('button', { type: 'button', 'aria-pressed': String((state.size || 10) === n), text: t('wordsN', { n }), onclick: () => ((state.size = n), renderWords()) })))
      ]),
      el('button', { class: 'q-btn primary block big-start', type: 'button', disabled: !selected.length, text: t('startRound'), onclick: startRound })
    ]),
    section(t('levels'), levelCards),
    section(t('packsTitle'), packCards(st)),
    section(t('modes'), modes),
    section(t('progress'), progressCard(st))
  );
}

const MODE_ICON = { smart: '✨', card: '🗂️', meaning: '🔤', word: '🀄', listen: '🎧', letters: '🧩', spell: '✍️' };

function progressCard(st) {
  const a = st.all;
  return el('div', { class: 'q-card pad stat-row' }, [
    stat(t('stMastered'), a.mastered.toLocaleString()),
    stat(t('stLearning'), a.learning.toLocaleString()),
    stat(t('stDue'), a.due.toLocaleString()),
    stat(t('stLeft'), (a.total - a.seen).toLocaleString())
  ]);
}
const stat = (label, value) => el('div', { class: 'stat' }, [el('strong', { class: 'num', text: value }), el('small', { text: label })]);

// The word packs: owned ones chosen like a level, the others to buy.
function packCards(st) {
  const w = withOutbox();
  return el(
    'div',
    { class: 'level-grid packs' },
    PACK_IDS.map(id => {
      if (packOpen(w, id)) {
        const on = state.levels.includes(id);
        return el('button', { class: `level-card pack${on ? ' on' : ''}`, type: 'button', 'aria-pressed': String(on), onclick: () => toggleLevel(id) }, [
          el('div', { class: 'level-top' }, [el('strong', { text: t(`pack_${id}`) }), el('small', { text: t(`packHint_${id}`) })]),
          bar(st[id].mastered, st[id].total),
          el('div', { class: 'level-foot' }, [el('span', { class: 'num', text: `${st[id].mastered.toLocaleString()} / ${st[id].total.toLocaleString()}` }), st[id].due ? el('span', { class: 'due', text: t('dueN', { n: st[id].due }) }) : null])
        ]);
      }
      const n = state.words.filter(x => x.level === id || x.packs?.includes(id)).length;
      const price = packPrice(w, id);
      // Two ways to pay: money, or points (dimmed until there are enough).
      return el('div', { class: 'level-card pack locked' }, [
        el('div', { class: 'level-top' }, [el('strong', { text: t(`pack_${id}`) }), el('small', { text: t(`packHint_${id}`) })]),
        el('small', { class: 'muted', text: `${t('packWords', { n })} · ${t('packOnce')}` }),
        payButtons(price, SHOP.packsXp[id], () => buyPack(id), () => buyPack(id, { points: true })),
        plusMember(w) ? null : el('small', { class: 'pack-plus', text: t('packPlusHalf', { v: nt(Math.round(SHOP.packs[id] * PLUS.vocab.packShare)) }) })
      ]);
    })
  );
}
// Two ways to pay, side by side: money, and points (faded until there are
// enough to spend).
function payButtons(money, points, byMoney, byPoints) {
  const enough = xpBalance(withOutbox()) >= points;
  return el('div', { class: 'shop-pay' }, [
    el('button', { class: 'pay-btn', type: 'button', onclick: byMoney }, [el('span', { class: 'num', text: nt(money) })]),
    el('button', { class: `pay-btn xp${enough ? '' : ' short'}`, type: 'button', onclick: byPoints }, [el('span', { class: 'num', text: xp(points) })])
  ]);
}
// A pack for money or (points) for points.
async function buyPack(id, { points = false } = {}) {
  const w = withOutbox();
  if (packOpen(w, id)) return;
  const cost = points ? SHOP.packsXp[id] : packPrice(w, id);
  if (points ? xpBalance(w) < cost : poolBalance(w) < cost) return toast(t(points ? 'shopPoints' : 'shopFunds'));
  const shown = points ? xp(cost) : nt(cost);
  const ok = await ask({ lang: locale, icon: '📘', title: t(`pack_${id}`), body: t('packAsk', { v: shown, n: state.words.filter(x => x.level === id || x.packs?.includes(id)).length }), ok: points ? t('shopUseXp', { v: shown }) : t('shopBuy', { v: shown }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = points ? redeemEntry(w, 'pack', id) : packEntry(w, id, Date.now(), t(`pack_${id}`));
  if (!entry) return toast(t('shopPoints'));
  payEntry(entry);
  state.levelsTouched = true;
  if (!state.levels.includes(id)) state.levels = [...state.levels, id];
  dirty = true;
  toast(t('packDone', { name: t(`pack_${id}`) }), 'good');
  refresh();
}

function toggleLevel(l) {
  state.levelsTouched = true;
  state.levels = state.levels.includes(l) ? state.levels.filter(x => x !== l) : [...state.levels, l].sort((a, b) => levelRank(a) - levelRank(b) || String(a).localeCompare(String(b)));
  dirty = true;
  sync({ soon: true });
  renderWords();
}

// ---- A round ---------------------------------------------------------------------------

function startRound() {
  const list = pickRound(myWords(), state.progress, { levels: myLevels(), size: state.size || 10 });
  if (!list.length) return toast(t('nothingLeft'));
  state.round = { list, i: 0, results: [], earned: 0, q: null, answered: false, started: Date.now() };
  nextQuestion();
  recordAffinity('vocab', ['vocab:words', ...myLevels().map(l => `vocab:level${l}`)], 0.5);
}
function nextQuestion() {
  const r = state.round;
  const word = r.list[r.i];
  const used = {};
  for (const x of r.results) used[x.type] = (used[x.type] || 0) + 1;
  const type = r.retry?.has(word.key) ? 'meaning' : state.mode === 'smart' ? smartType(state.progress[word.key], Math.random, word, used) : state.mode;
  r.q = makeQuestion(word, type, state.words);
  r.answered = false;
  r.typed = '';
  // Building it from letters: the first letter given (two for a long word).
  r.built = type === 'letters' ? letterHint(r.q) : [];
  r.revealed = false;
  renderWords();
  // Only when the question is the sound (by ear, dictation): straight away,
  // inside the tap that led here (iOS plays sound only then). Else 🔊 plays it.
  if (['listen', 'spell'].includes(type)) speak(word);
}

function letterHint(question) {
  const word = question.word.word;
  const n = word.replace(/\s/g, '').length >= 8 ? 2 : 1;
  const used = new Set();
  const out = [];
  for (const ch of [...word].slice(0, n)) {
    const i = question.letters.findIndex((c, k) => c === ch && !used.has(k));
    if (i < 0) break;
    used.add(i);
    out.push({ ch, i, hint: true });
  }
  return out;
}
function answer(correct, typed = '') {
  const r = state.round;
  if (!r || r.answered) return;
  r.answered = true;
  const word = r.q.word;
  const before = stateOf(state.progress[word.key]);
  const res = grade(state.progress[word.key], correct, { type: r.q.type });
  state.progress = { ...state.progress, [word.key]: res.p };
  dirty = true;
  const pay = addWordPoints(payFor({ correct, type: r.q.type, firstMastery: res.firstMastery }, ECONOMY.vocab));
  if (r.q.type !== 'card') act.answer++;
  if (correct && ['listen', 'letters', 'spell'].includes(r.q.type)) act.hard++;
  if (res.firstMastery) act.master++;
  r.earned += pay;
  r.results.push({ word, correct, type: r.q.type, before, after: stateOf(res.p), pay, typed, mastered: res.firstMastery });
  // A missed word comes back once at the end of the round, to fix it while
  // it's fresh (asked by its meaning).
  if (!correct && !r.retry?.has(word.key)) {
    r.retry = r.retry || new Set();
    r.retry.add(word.key);
    r.list = [...r.list, word];
  }
  renderWords();
  sync({ soon: true });
}
// 太簡單: the word is known; it's put away and the round moves on.
function tooEasy() {
  const r = state.round;
  if (!r || r.answered) return;
  const word = r.q.word;
  const before = stateOf(state.progress[word.key]);
  state.progress = { ...state.progress, [word.key]: markKnown(state.progress[word.key]) };
  dirty = true;
  r.results.push({ word, correct: true, type: 'known', before, after: 'mastered', pay: 0, typed: '', mastered: false });
  r.list = [...r.list.slice(0, r.i + 1), ...r.list.slice(r.i + 1).filter(w => w.key !== word.key)];
  sync({ soon: true });
  advance();
}
function advance() {
  const r = state.round;
  if (r.i + 1 >= r.list.length) {
    r.done = true;
    // A clean round (10 words or more asked, no miss, flash cards aside).
    const asked = r.results.filter(x => x.type !== 'card' && x.type !== 'known');
    if (asked.length >= 10 && asked.every(x => x.correct)) act.perfect++;
    closeBatch();
    sync();
    return renderWords();
  }
  r.i++;
  nextQuestion();
}

function renderRound(box) {
  const r = state.round;
  const quit = el('button', { class: 'q-close', type: 'button', 'aria-label': t('endRound'), text: '×', onclick: () => ((state.round = null), closeBatch(), sync(), renderWords()) });
  if (r.done) return put(box, roundSummary(r));
  const head = el('div', { class: 'round-head' }, [
    quit,
    el('div', { class: 'round-bar' }, [el('i', { style: `width:${(r.i / r.list.length) * 100}%` })]),
    el('strong', { class: 'num round-earn', text: xpText(r.earned, { sign: true }) })
  ]);
  put(box, head, questionView(r));
  box.querySelector('input')?.focus({ preventScroll: true });
}

function wordHead(word, { meaning = false, reveal = true } = {}) {
  return el('div', { class: 'word-head' }, [
    el('div', { class: 'word-line' }, [el('strong', { class: 'word', text: word.word }), speakButton(word)]),
    el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos, levelName(word.level)].filter(Boolean).join(' · ') }),
    meaning && reveal ? el('p', { class: 'meaning', text: word.zh }) : null
  ]);
}

function questionView(r) {
  const { q: question } = r;
  const word = question.word;
  const done = r.answered;
  const last = done ? r.results.at(-1) : null;
  const card = el('div', { class: `q-card pad question type-${question.type}` });
  const prompt = el('p', { class: 'q-prompt', text: t(`ask_${question.type}`) });
  if (question.type === 'card') {
    put(
      card,
      prompt,
      wordHead(word, { meaning: true, reveal: r.revealed || done }),
      !r.revealed && !done
        ? el('button', { class: 'q-btn block', type: 'button', text: t('showMeaning'), onclick: () => ((r.revealed = true), renderWords()) })
        : !done
          ? el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('notYet'), onclick: () => answer(false) }), el('button', { class: 'q-btn primary', type: 'button', text: t('knewIt'), onclick: () => answer(true) })])
          : null
    );
  } else if (question.choices) {
    const top =
      question.type === 'meaning'
        ? wordHead(word)
        : question.type === 'word'
          ? el('div', { class: 'word-head' }, [el('p', { class: 'meaning big', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: word.pos })])
          : el('div', { class: 'word-head center' }, [speakButton(word, true), el('small', { class: 'muted', text: t('tapToHear') })]);
    const choices = el(
      'div',
      { class: `choices${question.type === 'meaning' ? ' long' : ''}` },
      question.choices.map((c, i) => {
        const cls = done ? (c.key === question.answer ? ' right' : last.typed === c.key ? ' wrong' : ' dim') : '';
        return el('button', { class: `choice${cls}`, type: 'button', disabled: done, onclick: () => answer(c.key === question.answer, c.key) }, [el('small', { class: 'choice-n', text: String(i + 1) }), el('span', { text: c.text })]);
      })
    );
    put(card, prompt, top, choices);
  } else if (question.type === 'letters') {
    const built = r.built;
    const used = new Set(built.map(b => b.i));
    const slots = el('div', { class: 'slots' }, [...word.word].map((ch, i) => el('span', { class: `slot${built[i] ? ' filled' : ''}${built[i]?.hint ? ' hint' : ''}${done ? (last.correct ? ' right' : ' wrong') : ''}`, text: built[i]?.ch ?? (ch === ' ' ? '␣' : '') })));
    const tiles = el(
      'div',
      { class: 'tiles' },
      question.letters.map((ch, i) =>
        el('button', {
          class: 'tile',
          type: 'button',
          disabled: done || used.has(i),
          text: ch === ' ' ? '␣' : ch,
          onclick: () => {
            r.built = [...built, { ch, i }];
            if (r.built.length === word.word.length) answer(sameWord(r.built.map(b => b.ch).join(''), word.word), r.built.map(b => b.ch).join(''));
            else renderWords();
          }
        })
      )
    );
    put(
      card,
      prompt,
      // The meaning only: hearing it would make it dictation with the letters given.
      el('div', { class: 'word-head' }, [el('p', { class: 'meaning big', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: [word.pos, t('letters', { n: word.word.replace(/\s/g, '').length })].filter(Boolean).join(' · ') })]),
      slots,
      tiles,
      !done && built.some(b => !b.hint) ? el('button', { class: 'q-btn small ghost', type: 'button', text: t('undo'), onclick: () => ((r.built = built.slice(0, -1)), renderWords()) }) : null
    );
  } else {
    // Dictation: hear it (and see the meaning), spell it.
    const input = el('input', { class: 'spell-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', value: r.typed, disabled: done, 'aria-label': t('ask_spell') });
    input.addEventListener('input', () => (r.typed = input.value));
    const form = el('form', { class: 'spell-form', onsubmit: e => (e.preventDefault(), input.value.trim() && answer(sameWord(input.value, word.word), input.value)) }, [input, el('button', { class: 'q-btn primary', type: 'submit', disabled: done, text: t('check') })]);
    put(
      card,
      prompt,
      el('div', { class: 'word-head center' }, [speakButton(word, true), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: t('letters', { n: word.word.length }) })]),
      form,
      done && !last.correct ? el('p', { class: 'diff' }, spellDiff(last.typed, word.word).map(d => el('span', { class: d.ok ? '' : 'bad', text: d.ch }))) : null
    );
  }
  if (!done) return el('div', {}, [card, question.type === 'card' ? null : el('button', { class: 'q-btn small ghost too-easy', type: 'button', text: t('tooEasy'), onclick: tooEasy })]);
  return el('div', { class: 'answered' }, [card, feedback(last)]);
}

function feedback(res) {
  const word = res.word;
  const status = res.mastered ? t('fbMastered') : res.correct ? t(res.type === 'card' ? 'fbKnew' : 'fbRight') : t('fbWrong');
  const next = el('button', { class: 'q-btn primary block', type: 'button', text: state.round.i + 1 >= state.round.list.length ? t('seeResult') : t('next'), onclick: advance });
  setTimeout(() => next.focus({ preventScroll: true }), 0);
  return el('div', { class: `q-card pad feedback ${res.correct ? 'good' : 'bad'}` }, [
    el('div', { class: 'fb-top' }, [el('strong', { text: status }), res.pay ? el('span', { class: 'fb-pay num', text: xpText(res.pay, { sign: true }) }) : null]),
    // The word's on screen already for a meaning question: its meaning only.
    res.type === 'card' ? null : res.type === 'meaning' ? el('p', { class: 'meaning', text: word.zh }) : wordHead(word, { meaning: true }),
    el('small', { class: 'muted', text: t(`state_${res.after}`) }),
    // Pinned above the tab bar: no scrolling down for it.
    el('div', { class: 'next-bar' }, [next])
  ]);
}

function roundSummary(r) {
  const right = r.results.filter(x => x.correct).length;
  const mastered = r.results.filter(x => x.mastered).length;
  return el('div', {}, [
    el('div', { class: 'q-card pad summary' }, [
      el('p', { class: 'summary-big num', text: `${right} / ${r.results.length}` }),
      el('p', { class: 'muted', text: t('summaryLine', { v: xp(r.earned), m: mastered }) }),
      el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('backToWords'), onclick: () => ((state.round = null), renderWords()) }), el('button', { class: 'q-btn primary', type: 'button', text: t('again'), onclick: startRound })])
    ]),
    el(
      'div',
      { class: 'q-card list result-list' },
      r.results.map(x =>
        el('div', { class: 'result-row' }, [
          el('span', { class: `dot ${x.correct ? 'good' : 'bad'}`, text: x.correct ? '✓' : '✗' }),
          el('div', {}, [el('strong', { text: x.word.word }), el('small', { class: 'muted', text: shortMeaning(x.word.zh) })]),
          el('small', { class: `pill ${x.after}`, text: t(`state_${x.after}`) })
        ])
      )
    )
  ]);
}

// Keys 1-4 pick a choice, Enter goes on.
document.addEventListener('keydown', e => {
  const r = state.round;
  if (!r || state.tab !== 'words' || r.done || e.target.tagName === 'INPUT') return;
  if (r.answered && e.key === 'Enter') return advance();
  const i = Number(e.key) - 1;
  if (!r.answered && r.q.choices && i >= 0 && i < r.q.choices.length) answer(r.q.choices[i].key === r.q.answer, r.q.choices[i].key);
});

// ---- Home ---------------------------------------------------------------------------------

function renderHome() {
  const box = $('panel-home');
  if (!state.wallet) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  const balance = poolBalance(state.wallet);
  const r = rankOf(balance);
  const streak = streakDays(state.wallet);
  const e = earned();
  const ms = missions(state.wallet);
  const held = freezes(withOutbox()).held;
  const lv = xpLevel(xpAllTime(withOutbox()), locale);
  const rankCard = el('div', { class: 'rank-card' }, [
    el('div', { class: 'rank-top' }, [
      el('span', { class: 'rank-icon', text: r.rank.icon }),
      el('div', {}, [el('small', { text: t('yourRank') }), el('strong', { text: t(`rank_${r.rank.id}`) })]),
      streak ? el('span', { class: 'streak', text: `${t('streak', { n: streak })}${held ? ` · 🛡️${held}` : ''}` }) : null
    ]),
    el('p', { class: 'rank-balance num', text: nt(balance) }),
    r.next ? bar(r.progress, 1, 'light') : null,
    el('p', { class: 'rank-next', text: r.next ? t('toNext', { v: nt(r.toNext), rank: t(`rank_${r.next.id}`) }) : t('topRank') })
  ]);
  // The level (every point earned), today's points and what's left to spend.
  const levelCard = el('button', { class: 'q-card pad xp-card', type: 'button', onclick: () => (showTab('missions'), setTimeout(() => $('level-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)) }, [
    el('div', { class: 'xp-top' }, [
      el('span', { class: 'xp-badge num', text: String(lv.level) }),
      el('div', { class: 'xp-name' }, [el('small', { text: t('levelWord') }), el('strong', { text: lv.title })]),
      el('div', { class: 'xp-today' }, [el('small', { text: t('todayXp') }), el('strong', { class: 'num', text: xpText(e.total, { sign: true }) })])
    ]),
    bar(lv.progress, 1, 'accent'),
    el('div', { class: 'xp-foot' }, [el('small', { class: 'muted', text: t('levelNext', { v: xp(lv.toNext), n: lv.level + 1 }) }), el('small', { class: 'num', text: t('xpToSpend', { v: xp(xpBalance(withOutbox())) }) })]),
    expiringLine(),
    capLine(),
    streakLine()
  ]);
  // The missions most worth doing now (ready to claim first); all of them,
  // the weekly goals, badges and ranks are on 任務.
  const next = ms.filter(m => !m.claimed).sort((a, b) => b.done - a.done || a.bonus - b.bonus).slice(0, 3);
  const d = daily();
  // Straight into today's game (the games tab under it, for after).
  const dailyCard = el('button', { class: `q-card pad daily-card${d.done ? ' done' : ''}`, type: 'button', onclick: () => (showTab('games'), games?.open(d.game)) }, [
    el('span', { class: 'daily-icon', 'aria-hidden': 'true', text: gameInfo(d.game, t, locale).icon }),
    el('span', { class: 'daily-text' }, [el('small', { text: t('dailyTitle') }), el('strong', { text: gameInfo(d.game, t, locale).name }), el('small', { class: 'muted', text: d.done ? t('dailyDone', { n: d.streak }) : t(d.streak ? 'dailyLine' : 'dailyLineNew', { v: xp(d.bonus), n: d.streak }) })]),
    el('span', { class: 'daily-go', text: d.done ? '✓' : '▶' })
  ]);
  put(
    box,
    rankCard,
    levelCard,
    dailyCard,
    next.length ? section(t('missions'), el('div', { class: 'q-card list' }, next.map(missionRow)), { action: el('button', { type: 'button', text: `${t('missionsAll')} ›`, onclick: () => showTab('missions') }) }) : null,
    section(t('shopTitle'), shopCard()),
    wordOfDayCard(),
    el('div', { class: 'spend-line' }, [
      el('small', { class: 'muted', text: t('spendLine') }),
      el('button', { class: 'link-btn', type: 'button', text: t('spendPlay'), onclick: () => q.go('odds') }),
      el('button', { class: 'link-btn', type: 'button', text: t('spendStock'), onclick: () => q.go('stock') })
    ])
  );
}

// ---- 任務: every daily mission, the weekly goals, badges and ranks ---------------------------

function missionRow(m) {
  const action = m.claimed
    ? el('span', { class: 'claimed', text: t('claimed') })
    : m.done
      ? el('button', { class: 'q-btn primary small', type: 'button', text: t('claim', { v: xp(m.xp) }), onclick: () => claim(m.id) })
      : el('button', { class: 'q-btn small', type: 'button', text: t('go'), onclick: () => goMission(m) });
  // A daily one not started can be swapped for points.
  const swap = !m.bonus && !m.claimed && !m.done && !m.progress && rerolls(withOutbox(), taipeiDay()).length < SHOP.reroll.perDay ? el('button', { class: 'link-btn swap-btn', type: 'button', text: t('swap', { v: xp(SHOP.reroll.xp) }), onclick: () => swapMission(m) }) : null;
  return el('div', { class: `mission${m.claimed ? ' done' : ''}` }, [
    el('span', { class: 'mission-icon', text: MISSION_ICON[m.id] }),
    el('div', { class: 'mission-text' }, [el('strong', { text: t(`mission_${m.id}`) }), el('div', { class: 'mission-bar' }, [bar(m.progress, m.goal, 'accent'), el('small', { class: 'num muted', text: `${m.progress}/${m.goal} · ${xp(m.xp)}` })]), swap]),
    action
  ]);
}
async function swapMission(m) {
  const w = withOutbox();
  if (xpBalance(w) < SHOP.reroll.xp) return toast(t('shopPoints'));
  const ok = await ask({ lang: locale, icon: '🔄', title: t('swapAsk'), body: t('swapAskBody', { name: t(`mission_${m.id}`), n: SHOP.reroll.perDay }), ok: t('shopUseXp', { v: xp(SHOP.reroll.xp) }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = redeemEntry(w, 'reroll', `${taipeiDay()}:${m.id}`);
  if (!entry) return toast(t('shopPoints'));
  payEntry(entry);
  toast(t('swapDone'), 'good');
  refresh();
}
// Missions and weekly goals done but not yet claimed: the 任務 tab's count.
const readyToClaim = () => (state.wallet ? missions(state.wallet).filter(m => m.done && !m.claimed).length + weeklyGoals(withOutbox()).filter(g => g.done && !g.claimed).length : 0);
function renderMissions() {
  const box = $('panel-missions');
  if (!state.wallet) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  const ms = missions(state.wallet);
  const st = state.words ? stats(myWords(), state.progress) : null;
  const list = (items, extra = null) => {
    const claimedN = items.filter(m => m.claimed).length;
    return el('div', { class: 'q-card list' }, [
      extra,
      ...items.filter(m => !m.claimed).sort((a, b) => b.done - a.done).map(missionRow),
      claimedN ? el('details', { class: 'mission-done' }, [el('summary', { text: t('missionsDone', { n: claimedN }) }), ...items.filter(m => m.claimed).map(missionRow)]) : null
    ].filter(Boolean));
  };
  const daily = list(ms.filter(m => !m.bonus), streakGoalLine());
  const bonus = list(ms.filter(m => m.bonus));
  put(
    box,
    section(t('missions'), daily),
    section(t('missionsBonus'), bonus, { sub: t('missionsBonusSub') }),
    el('div', { id: 'level-section' }, [section(t('levelTitle'), levelSection(), { sub: t('levelSub') })]),
    section(t('weekly'), weeklyCard()),
    section(t('badgesTitle'), badgesCard(st), { sub: t('allTime', { v: xp(xpAllTime(withOutbox())) }) }),
    section(t('ranks'), ranksCard(rankOf(poolBalance(state.wallet)).index))
  );
}

// ---- The shop: streak protection, the ×2 boost, and Quadra Plus ------------------------------

// With money, or (xp) with points.
async function buy(item, { points = false } = {}) {
  const w = withOutbox();
  const price = points ? SHOP[item].xp : SHOP[item].price;
  if (points ? xpBalance(w) < price : poolBalance(w) < price) return toast(t(points ? 'shopPoints' : 'shopFunds'));
  const cost = points ? xp(price) : nt(price);
  const ok = await ask({ lang: locale, icon: item === 'freeze' ? '🛡️' : '⚡', title: t(`shop_${item}`), body: t(`shopAsk_${item}`, { v: cost }), ok: points ? t('shopUseXp', { v: cost }) : t('shopBuy', { v: cost }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = points ? redeemEntry(w, item, randomId()) : shopEntry(item, randomId(), Date.now(), t(`shop_${item}`));
  if (!entry) return toast(t('shopPoints'));
  payEntry(entry);
  toast(t(`shopDone_${item}`), 'good');
  refresh();
}
function boostLeft() {
  const end = boostUntil(withOutbox());
  return end ? Math.max(1, Math.ceil((end - Date.now()) / 60_000)) : 0;
}
// Under today's word points: the boost running, or one to buy.
function boostLine() {
  const left = boostLeft();
  return left
    ? el('p', { class: 'boost-on', text: t('boostOn', { n: left }) })
    : el('button', { class: 'boost-buy', type: 'button', onclick: () => buy('boost', { points: xpBalance(withOutbox()) >= SHOP.boost.xp }) }, [el('span', { text: t('boostPitch') }), el('strong', { class: 'num', text: xpBalance(withOutbox()) >= SHOP.boost.xp ? xp(SHOP.boost.xp) : nt(SHOP.boost.price) })]);
}
function shopCard() {
  const f = freezes(withOutbox());
  const left = boostLeft();
  const member = plusMember(state.wallet);
  // An item, and under its name the two ways to pay (or why not).
  const row = (icon, title, sub, action) => el('div', { class: 'shop-row' }, [el('span', { class: 'shop-icon', 'aria-hidden': 'true', text: icon }), el('div', { class: 'shop-text' }, [el('strong', { text: title }), el('small', { text: sub }), action])]);
  const price = item => payButtons(SHOP[item].price, SHOP[item].xp, () => buy(item), () => buy(item, { points: true }));
  return el('div', { class: 'q-card list shop' }, [
    row('🛡️', t('shop_freeze'), f.held ? t('freezeHeld', { n: f.held }) : t('freezeSub'), f.held >= SHOP.freeze.hold ? el('span', { class: 'claimed', text: t('freezeFull') }) : price('freeze')),
    row('⚡', t('shop_boost'), left ? t('boostOn', { n: left }) : t('boostSub'), price('boost')),
    el('div', { class: 'shop-plus' }, [plusCard(q, { compact: true }), el('small', { class: 'muted', text: member ? t('plusRewardsOn') : t('plusRewards') })])
  ]);
}
// Protection cards used by themselves: the days missed since the streak's last day.
function useFreezes() {
  if (!state.wallet || !state.loaded) return;
  const due = freezeDue(withOutbox()).filter(e => !outbox.read().some(x => x.id === e.id));
  if (!due.length) return;
  outbox.write([...outbox.read(), ...due]);
  sync();
  toast(t('freezeUsed', { n: due.length, streak: streakDays(withOutbox()) }), 'good');
}
// The word of the day: the same for everyone today; tap to hear it.
function wordOfDayCard() {
  const w = state.words && wordOfDay(state.words);
  if (!w) return null;
  const p = state.progress[w.key];
  return el('div', { class: 'q-card pad wotd' }, [
    el('div', { class: 'wotd-top' }, [el('small', { class: 'wotd-label', text: t('wotd') }), el('small', { class: 'muted', text: t(p ? `state_${stateOf(p)}` : 'state_new') })]),
    el('div', { class: 'word-line' }, [el('strong', { class: 'word', text: w.word }), speakButton(w)]),
    el('small', { class: 'muted', text: [w.ph ? `/${w.ph}/` : '', w.pos, t('level', { n: w.level })].filter(Boolean).join(' · ') }),
    el('p', { class: 'meaning', text: shortMeaning(w.zh) })
  ]);
}

// This week's goals, claimed like missions.
function weeklyCard() {
  const goals = weeklyGoals(withOutbox());
  return el('div', { class: 'q-card list' }, [
    el('p', { class: 'streak-goal muted' }, [document.createTextNode(t('weeklyCard'))]),
    ...goals.map(g => {
      const action = g.claimed
        ? el('span', { class: 'claimed', text: t('claimed') })
        : g.done
          ? el('button', { class: 'q-btn primary small', type: 'button', text: t('claim', { v: xp(g.xp) }), onclick: () => claimGoal(g.id) })
          : null;
      const shown = g.id === 'earn1000' ? `${g.progress.toLocaleString('en-US')} / ${xp(g.goal)}` : `${g.progress}/${g.goal}`;
      return el('div', { class: `mission${g.claimed ? ' done' : ''}` }, [
        el('span', { class: 'mission-icon', text: WEEKLY_ICON[g.id] }),
        el('div', { class: 'mission-text' }, [el('strong', { text: t(`weekly_${g.id}`) }), el('div', { class: 'mission-bar' }, [bar(g.progress, g.goal, 'accent'), el('small', { class: 'num muted', text: `${shown} · ${xp(g.xp)}` })])]),
        action
      ]);
    })
  ]);
}
const WEEKLY_ICON = { days5: '📆', earn1000: '💵', missions10: '🎯', games10: '🕹️' };
function claimGoal(id) {
  const entry = claimWeekly(withOutbox(), id);
  if (!entry || outbox.read().some(x => x.id === entry.id)) return;
  payEntry(entry);
  toast(t('claimedToast', { v: xp(entry.xp) }), 'good');
  refresh();
}

// The day's soft cap on words and games: where today stands.
// Points that run out soon (a year after the month they were earned).
function expiringLine() {
  const x = xpExpiring(withOutbox());
  if (!x) return null;
  const d = new Date(x.at - 1 + 8 * 3_600_000);
  return el('small', { class: 'cap-line low', text: t('xpExpiring', { v: xp(x.amount), date: `${d.getUTCMonth() + 1}/${d.getUTCDate()}` }) });
}

function capLine() {
  const w = withOutbox();
  const c = capStage(capToday(w, Date.now(), batch?.xp || 0), xpRate(w) * (boosted() ? 2 : 1));
  return el('small', { class: `cap-line ${c.stage}` }, [document.createTextNode(c.stage === 'full' ? t('capFull', { v: xp(c.left) }) : c.stage === 'half' ? t('capHalf', { v: xp(c.left) }) : t('capLow'))]);
}

// ---- The streak: what it's worth now, and what's next ----------------------------------------
function streakLine() {
  const w = withOutbox();
  const n = streakDays(w);
  const today = streakToday(w);
  const next = STREAK.milestones.find(m => m > longestStreakOf(w));
  const gift = next ? AVATARS.find(a => a.streak === next) : null;
  return el('div', { class: `streak-line${n ? ' on' : ''}` }, [
    el('span', { class: 'num', text: n ? t('streakNow', { n, v: Math.round(streakBonus(n) * 100) }) : t('streakNone') }),
    today.kept ? el('small', { class: 'muted', text: t('streakKept') }) : repairable(w, activeDaySet(w)) ? el('small', { class: 'muted', text: t('streakMissed') }) : el('small', { class: 'muted', text: t('streakGoal', { n: today.n, goal: today.goal }) }),
    gift ? el('small', { class: 'muted', text: t('streakNext', { n: next, gift: `${gift.glyph} 🛡️` }) }) : null
  ]);
}
// Today and the streak: daily missions claimed, of the 3 that keep it.
function streakGoalLine() {
  const w = withOutbox();
  const s = streakToday(w);
  const missed = repairable(w, activeDaySet(w));
  return el('div', { class: `streak-goal${s.kept ? ' kept' : ''}` }, [
    el('strong', { class: 'num', text: s.kept ? t('streakKept') : t('streakGoal', { n: s.n, goal: s.goal }) }),
    s.kept ? null : bar(s.n, s.goal, 'accent'),
    missed ? el('button', { class: 'q-btn small repair-btn', type: 'button', text: t('repairBtn', { v: xp(SHOP.repair.xp) }), onclick: () => repairStreak(missed) }) : null
  ]);
}
// Yesterday bought back with points, so the streak runs on.
async function repairStreak(day) {
  const w = withOutbox();
  if (xpBalance(w) < SHOP.repair.xp) return toast(t('shopPoints'));
  const before = streakDays({ ...w, entries: [...w.entries, { id: `vocab:xs:repair:${day}`, t: Date.now(), app: 'vocab', kind: 'redeem', amount: 0, note: '0' }] });
  const ok = await ask({ lang: locale, icon: '🩹', title: t('repairAsk'), body: t('repairAskBody', { n: before }), ok: t('shopUseXp', { v: xp(SHOP.repair.xp) }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = redeemEntry(w, 'repair', day);
  if (!entry) return toast(t('shopPoints'));
  payEntry(entry);
  toast(t('repairDone'), 'good');
  refresh();
}
// The milestones (7, 30, 100 days), reached by the longest streak ever.
function streakRoad() {
  const best = longestStreakOf(withOutbox());
  return el(
    'div',
    { class: 'lv-road' },
    [...STREAK.milestones.map(m => {
      const a = AVATARS.find(x => x.streak === m);
      return el('div', { class: `lv-step${best >= m ? ' got' : ''}` }, [el('span', { class: 'lv-gift', 'aria-hidden': 'true', text: `${a.glyph}🛡️` }), el('strong', { class: 'num', text: t('daysN', { n: m }) }), el('small', { class: 'muted', text: best >= m ? t('streakGot') : t('streakToGo', { n: m - streakDays(withOutbox()) }) })]);
    }), el('div', { class: 'lv-step' }, [el('span', { class: 'lv-gift', 'aria-hidden': 'true', text: '🔥' }), el('strong', { class: 'num', text: `+${Math.round(STREAK.max * 100)}%` }), el('small', { class: 'muted', text: t('streakMaxAt', { n: Math.round(STREAK.max / STREAK.perDay) }) })])]
  );
}

// ---- Level and avatars: what points are for ------------------------------------------------
//
// The next level rewards (an avatar at its levels, a streak card every ten
// from 5), then every avatar: worn, wear it, its level, its price in points,
// or Plus's. The one worn shows on the account button in every Quadra app.
const wornId = () => ('avatar' in pendingSettings ? pendingSettings.avatar.value?.id : setting(state.wallet, 'avatar', null)?.id) ?? null;
function levelSection() {
  const w = withOutbox();
  const lv = xpLevel(xpAllTime(w), locale);
  // The next few levels that bring something.
  const next = [];
  for (let L = lv.level + 1; next.length < 4 && L <= lv.level + 60; L++) {
    const avatar = AVATARS.find(a => a.level === L);
    const frame = FRAMES.find(f => f.level === L);
    const card = levelCards(L) > levelCards(L - 1);
    if (avatar || card || frame) next.push({ L, avatar, card, frame });
  }
  const road = el(
    'div',
    { class: 'lv-road' },
    next.map(n =>
      el('div', { class: 'lv-step' }, [
        el('span', { class: 'lv-gift', 'aria-hidden': 'true', text: [n.avatar?.glyph, n.frame ? '⭕' : '', n.card ? '🛡️' : ''].filter(Boolean).join('') }),
        el('strong', { class: 'num', text: `Lv ${n.L}` }),
        el('small', { class: 'muted', text: xp(Math.max(0, xpForLevel(n.L) - xpAllTime(w))) })
      ])
    )
  );
  const have = xpBalance(w);
  const worn = wornId();
  const tile = a => {
    const owned = avatarOwned(w, a.id);
    const on = owned && worn === a.id;
    const label = on ? t('avatarOn') : owned ? t('avatarWear') : a.plus ? 'Plus' : a.streak ? `🔥 ${t('daysN', { n: a.streak })}` : a.level ? `Lv ${a.level}` : xp(a.xp);
    const cls = `av-tile${on ? ' on' : ''}${owned ? '' : ' locked'}${!owned && a.xp && have >= a.xp ? ' can' : ''}`;
    return el('button', { class: cls, type: 'button', 'aria-pressed': String(on), onclick: () => pickAvatar(a) }, [el('span', { class: 'av-glyph', 'aria-hidden': 'true', text: a.glyph }), el('small', { class: 'num', text: label })]);
  };
  return el('div', { class: 'q-card pad lv-card' }, [
    el('small', { class: 'lv-h', text: t('streakTitle', { n: streakDays(w), best: longestStreakOf(w) }) }),
    streakRoad(),
    el('small', { class: 'lv-h', text: t('levelNextGifts') }),
    next.length ? road : el('p', { class: 'muted', text: t('topRank') }),
    el('small', { class: 'lv-h', text: t('avatarsTitle', { v: xp(have) }) }),
    el('div', { class: 'av-grid' }, AVATARS.map(tile)),
    el('small', { class: 'lv-h', text: t('framesTitle') }),
    el('div', { class: 'av-grid' }, FRAMES.map(f => {
      const owned = frameOwned(w, f.id);
      const on = owned && wornFrame() === f.id;
      const glyph = AVATARS.find(a => a.id === worn)?.glyph || '🙂';
      const label = on ? t('avatarOn') : owned ? t('avatarWear') : f.level ? `Lv ${f.level}` : xp(f.xp);
      const cls = `av-tile${on ? ' on' : ''}${owned ? '' : ' locked'}${!owned && f.xp && have >= f.xp ? ' can' : ''}`;
      return el('button', { class: cls, type: 'button', 'aria-pressed': String(on), 'aria-label': t(`frame_${f.id}`), onclick: () => pickFrame(f) }, [
        el('span', { class: `fr-preview q-framed q-frame-${f.id}`, 'aria-hidden': 'true', text: glyph }),
        el('small', { class: 'num', text: label })
      ]);
    }))
  ]);
}
const wornFrame = () => ('frame' in pendingSettings ? pendingSettings.frame.value?.id : setting(state.wallet, 'frame', null)?.id) ?? null;
async function pickFrame(f) {
  const w = withOutbox();
  if (frameOwned(w, f.id)) return wearFrame(f.id === wornFrame() ? null : f.id);
  if (f.level) return toast(t('avatarAtLevel', { n: f.level }));
  if (xpBalance(w) < f.xp) return toast(t('shopPoints'));
  const ok = await ask({ lang: locale, icon: '⭕', title: t('frameBuyTitle', { name: t(`frame_${f.id}`) }), body: t('frameBuyBody'), ok: t('shopUseXp', { v: xp(f.xp) }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = redeemEntry(w, 'frame', f.id);
  if (!entry) return toast(t('shopPoints'));
  outbox.write([...outbox.read(), entry]);
  wearFrame(f.id);
}
function wearFrame(id) {
  pendingSettings = { ...pendingSettings, ...settingPatch('frame', id ? { id } : null).settings };
  sync();
  toast(id ? t('frameWorn') : t('frameOff'), 'good');
  refresh();
}
async function pickAvatar(a) {
  const w = withOutbox();
  if (avatarOwned(w, a.id)) return wearAvatar(a.id === wornId() ? null : a.id);
  if (a.plus) return openPlus(q);
  if (a.streak) return toast(t('avatarAtStreak', { n: a.streak }));
  if (a.level) return toast(t('avatarAtLevel', { n: a.level }));
  if (avatarBought(w, a.id)) return;
  if (xpBalance(w) < a.xp) return toast(t('shopPoints'));
  const ok = await ask({ lang: locale, icon: a.glyph, title: t('avatarBuyTitle'), body: t('avatarBuyBody'), ok: t('shopUseXp', { v: xp(a.xp) }), cancel: t('shopCancel') });
  if (!ok) return;
  const entry = redeemEntry(w, 'avatar', a.id);
  if (!entry) return toast(t('shopPoints'));
  outbox.write([...outbox.read(), entry]);
  wearAvatar(a.id);
}
// Wear one (or none: the person again); every app shows it once written.
function wearAvatar(id) {
  pendingSettings = { ...pendingSettings, ...settingPatch('avatar', id ? { id } : null).settings };
  sync();
  toast(id ? t('avatarWorn') : t('avatarOff'), 'good');
  refresh();
}

// A streak milestone reached: once, what it brings.
const STREAK_KEY = 'quadra.rewards.streakm';
function checkStreakMilestone() {
  const best = longestStreakOf(withOutbox());
  const reached = STREAK.milestones.filter(m => best >= m).at(-1) || 0;
  let seen = 0;
  try {
    seen = Number(localStorage.getItem(STREAK_KEY) ?? -1);
    localStorage.setItem(STREAK_KEY, String(reached));
  } catch {}
  // The first time on this device only remembers where you are.
  if (seen < 0 || reached <= seen) return false;
  const a = AVATARS.find(x => x.streak === reached);
  tell({ lang: locale, icon: '🔥', title: t('streakMilestone', { n: reached }), points: [[a.glyph, t('giftAvatar'), t('giftAvatarLine')], ['🛡️', t('giftCard'), t('giftCardLine')]] });
  return true;
}

// A new level: once, what it brings (an avatar, a streak card).
const LEVEL_KEY = 'quadra.rewards.level';
function checkLevelUp() {
  if (!state.wallet) return;
  if (checkStreakMilestone()) return;
  const lv = xpLevel(xpAllTime(withOutbox()), locale);
  let seen = 0;
  try {
    seen = Number(localStorage.getItem(LEVEL_KEY)) || 0;
    localStorage.setItem(LEVEL_KEY, String(lv.level));
  } catch {}
  // The first time on this device only remembers where you are.
  if (!seen || lv.level <= seen) return;
  const gifts = [];
  for (let L = seen + 1; L <= lv.level; L++) {
    const a = AVATARS.find(x => x.level === L);
    if (a) gifts.push([a.glyph, t('giftAvatar'), t('giftAvatarLine')]);
    if (levelCards(L) > levelCards(L - 1)) gifts.push(['🛡️', t('giftCard'), t('giftCardLine')]);
  }
  tell({ lang: locale, icon: '🎉', title: t('levelUp', { n: lv.level, title: lv.title }), body: gifts.length ? '' : t('levelUpNext', { v: xp(lv.toNext) }), points: gifts });
}

// Badges: milestones read from the record, the earned ones first.
function badgesCard(st) {
  const list = badges({ wallet: withOutbox(), mastered: st?.all.mastered || 0, bests: bests(), games: GAMES });
  const got = list.filter(b => b.earned).length;
  const sorted = [...list].sort((a, b) => b.earned - a.earned);
  return el('div', { class: 'q-card pad' }, [
    el('div', { class: 'badge-strip-head' }, [el('strong', { class: 'num', text: t('badgesCount', { n: got, of: list.length }) }), bar(got, list.length, 'accent')]),
    el('div', { class: 'badge-strip' }, sorted.map(b => el('span', { class: `badge-dot${b.earned ? ' on' : ''}`, title: `${t(`badge_${b.id}`)}：${t(`badgeHow_${b.id}`)}`, text: b.icon }))),
    el('details', { class: 'badge-more' }, [
      el('summary', { text: t('badgesSee') }),
      el('div', { class: 'badge-grid' }, sorted.map(b => el('div', { class: `badge${b.earned ? ' on' : ''}` }, [el('span', { class: 'badge-icon', text: b.icon }), el('strong', { text: t(`badge_${b.id}`) }), el('small', { text: t(`badgeHow_${b.id}`) })])))
    ])
  ]);
}

const MISSION_ICON = { words20: '📚', words50: '📖', master3: '🏅', hard10: '🎧', perfect: '💯', game1: '🎮', games3: '🕹️', challenge: '📅', invest: '📈', quotes: '🔍', match: '🏟️', matches3: '📺', orbit: '🪐', tour: '🧭', parlay3: '🎫', scratch: '🎟️', lotto: '🎱' };

function ranksCard(current) {
  return el('details', { class: 'q-card list ranks' }, [
    el('summary', { class: 'rank-row current' }, [el('span', { class: 'rank-icon sm', text: RANKS[current].icon }), el('strong', { text: t(`rank_${RANKS[current].id}`) }), el('small', { class: 'muted', text: t('ranksSee') })]),
    ...RANKS.map((rk, i) =>
      el('div', { class: `rank-row${i === current ? ' current' : i < current ? ' passed' : ''}` }, [el('span', { class: 'rank-icon sm', text: rk.icon }), el('strong', { text: t(`rank_${rk.id}`) }), el('small', { class: 'num muted', text: rk.min ? nt(rk.min) : '—' })])
    )
  ]);
}

function goMission(m) {
  if (m.id === 'challenge') return showTab('games'), games?.open(daily().game);
  if (m.app === 'vocab') return showTab(['game1', 'games3'].includes(m.id) ? 'games' : 'words');
  if (m.app === 'stock') return q.go('stock');
  if (m.app === 'match') return q.go('match');
  if (m.app === 'odds') return q.go('odds', ['scratch', 'lotto'].includes(m.id) ? 'lottery' : '');
  if (m.app === 'orbit') return q.go('orbit');
  // The tour: the first app not opened today.
  const day = taipeiDay();
  const next = ['stock', 'match'].find(a => !(state.wallet?.apps?.[a]?.last && taipeiDay(state.wallet.apps[a].last) === day));
  if (next) q.go(next);
}
function claim(id) {
  const entry = claimEntry(state.wallet, id);
  if (!entry || outbox.read().some(x => x.id === entry.id)) return;
  payEntry(entry);
  toast(t('claimedToast', { v: xp(entry.xp) }), 'good');
  refresh();
}

// ---- Help ---------------------------------------------------------------------------------

// A sheet over the app (the ? in the top-right, or another app's help link):
// one app's topics, the others a chip away.
let helpSheet = null;
function openHelp(app = state.help.app, topic = null) {
  state.help = { app, topic };
  if (!helpSheet?.open) {
    helpSheet?.remove();
    helpSheet = el('dialog', { class: 'q-sheet help-sheet', 'aria-label': t('helpTitle') });
    helpSheet.addEventListener('click', e => e.target === helpSheet && helpSheet.close());
    helpSheet.addEventListener('close', () => {
      helpSheet.remove();
      try {
        history.replaceState(null, '', `#${state.tab}`);
      } catch {}
    });
    document.body.append(helpSheet);
    helpSheet.showModal();
  }
  renderHelp();
}
function renderHelp() {
  const { app, topic } = state.help;
  try {
    history.replaceState(null, '', `#help=${app}${topic ? `:${topic}` : ''}`);
  } catch {}
  const chips = el(
    'div',
    { class: 'q-chips' },
    HELP_ORDER.map(a => el('button', { class: 'q-chip', type: 'button', 'aria-pressed': String(app === a), text: a === 'pass' ? 'Quadra Pass' : APPS[a].short, onclick: () => ((state.help = { app: a, topic: null }), renderHelp(), (helpSheet.scrollTop = 0)) }))
  );
  const topics = helpFor(app, locale);
  const cards = topics.map(([id, title, paras]) =>
    el('article', { class: `q-card pad help-card${topic === id ? ' focus' : ''}`, id: `help-${id}` }, [el('h3', { text: title }), ...paras.map(p => el('p', { text: p }))])
  );
  const open = app !== 'pass' && app !== 'vocab' ? el('button', { class: 'q-btn primary block', type: 'button', text: t('openApp', { app: APPS[app].name }), onclick: () => q.go(app) }) : null;
  const head = el('div', { class: 'q-sheet-head' }, [el('h2', { text: t('helpTitle') }), el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: () => helpSheet.close() })]);
  put(helpSheet, head, chips, el('div', { class: 'help-list' }, cards), open);
  if (topic) setTimeout(() => $(`help-${topic}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}

// ---- Tabs and start -------------------------------------------------------------------------

let games = null;
const TAB_ICONS = { home: 'home', words: 'book', games: 'gamepad', missions: 'target' };
const tabNav = tabBar({ tabs: TABS.map(id => ({ id, label: t(`tab_${id}`), icon: TAB_ICONS[id] })), onSelect: (tab, { again }) => !again && showTab(tab) });
function renderTabs() {
  tabNav.select(state.tab);
  tabNav.badge('missions', readyToClaim());
}
function showTab(tab) {
  if (state.tab === 'games' && tab !== 'games') games?.stop();
  state.tab = tab;
  renderTabs();
  refresh();
}
function refresh() {
  checkLevelUp();
  if (state.tab === 'home') renderHome();
  if (state.tab === 'words' && !(state.round && !state.round.answered && document.activeElement?.tagName === 'INPUT')) renderWords();
  if (state.tab === 'games') {
    games ||= mountGames($('panel-games'), gameContext);
    games.render();
  }
  if (state.tab === 'missions') renderMissions();
  tabNav.badge('missions', readyToClaim());
  const s = $('status');
  if (s) s.textContent = state.wallet ? t('statusLine', { v: xp(earned().total) }) : '';
}

// What the games need from the app: text, points, the words, and counting
// a round's points.
const gameContext = {
  t,
  locale,
  xp,
  today: () => earned().game,
  words: () => {
    const seen = myWords().filter(w => state.progress[w.key]?.b);
    const pool = seen.length >= 30 ? seen : myWords().filter(w => inLevels(w, myLevels()));
    return pool.map(w => ({ key: w.key, word: w.word, meaning: shortMeaning(w.zh).split('、')[0], level: w.level, pos: w.pos }));
  },
  bests,
  daily,
  pay(game, amount) {
    const d = daily();
    // A round's points, ×1.5 for Plus (the best is the round's own score).
    const rate = xpRate(withOutbox());
    const points = Math.max(0, Math.round(dampXp(amount * rate, capToday(withOutbox(), Date.now(), batch?.xp || 0), rate)));
    act.game++;
    recordAffinity('vocab', ['vocab:games', `vocab:game:${game}`], 1);
    const best = recordBest(game, Math.round(amount));
    // A finished round counts for the streak whatever it scored.
    outbox.write([...outbox.read(), { id: `vocab:g:${randomId()}`, t: Date.now(), app: 'vocab', kind: 'game', amount: 0, xp: points, note: game }]);
    // Today's challenge: its first round that scores adds the bonus.
    let bonus = 0;
    if (game === d.game && !d.done && points > 0) {
      bonus = d.bonus;
      outbox.write([...outbox.read(), { id: dailyId(d.day), t: Date.now(), app: 'vocab', kind: 'game', amount: 0, xp: bonus, note: `daily:${game}` }]);
    }
    sync();
    return { paid: points + bonus, bonus, best };
  }
};

window.__fxStarted = true;
const gated = installGate('vocab', locale);
watchUpdates({ current: VERSION, key: 'quadraRewards', cachePrefix: 'quadra-rewards-', busy: () => Boolean(state.round && !state.round.done) || Boolean(games?.busy()) });
// The same top-right in every Quadra app; help opens here, over the app.
topActions(q, { help: () => openHelp('vocab') });
renderTabs();
q.on('wallet', w => {
  state.wallet = w;
  useFreezes();
  quietRefresh();
  checkNotices();
});

// Notices (the kit's: a banner on screen, a system notice in the background
// once turned on in the account sheet): a mission or weekly goal newly
// ready to claim, and a streak that ends tonight.
let readySeen = null;
function checkNotices() {
  if (!state.wallet || !state.loaded) return;
  const w = withOutbox();
  const ready = [
    ...missions(w).filter(m => m.done && !m.claimed).map(m => [`m:${taipeiDay()}:${m.id}`, t(`mission_${m.id}`), m.xp]),
    ...weeklyGoals(w).filter(g => g.done && !g.claimed).map(g => [`wk:${g.week}:${g.id}`, t(`weekly_${g.id}`), g.xp])
  ];
  // What was ready when the app opened is on the home screen already.
  const fresh = readySeen ? ready.filter(([id]) => !readySeen.has(id)) : [];
  readySeen = new Set([...(readySeen || []), ...ready.map(([id]) => id)]);
  for (const [id, title, pay] of fresh) notify(q, { title: t('noticeReady', { v: xp(pay) }), body: title, tag: id, hash: 'home', kind: 'ready' });
  const risk = streakAtRisk(w);
  if (risk) notify(q, { title: t('noticeStreak', { n: risk }), body: t('noticeStreakBody'), tag: `streak:${taipeiDay()}`, hash: 'missions', kind: 'streak' });
}
setInterval(checkNotices, 10 * 60_000);

// While the app is closed: 20:00 Taipei, a reminder that the streak ends
// tonight (today, if nothing's been played yet; the next two evenings, in
// case the app isn't opened).
function syncPush() {
  const w = state.wallet;
  if (!w) return;
  const now = Date.now();
  const n = streakDays(w, now);
  const played = streakToday(w, now).kept;
  const eight = day => Date.parse(`${taipeiDay(now + day * 86_400_000)}T20:00:00+08:00`);
  const items = [];
  if (!played && n > 0 && eight(0) > now) items.push({ at: eight(0), title: t('noticeStreak', { n }), body: t('noticeStreakBody'), tag: `streak:${taipeiDay(now)}`, hash: 'missions', kind: 'streak' });
  for (const day of [1, 2]) items.push({ at: eight(day), title: t('noticeStreakSoon'), body: t('noticeStreakBody'), tag: `streak:${taipeiDay(now + day * 86_400_000)}`, hash: 'missions', kind: 'streak' });
  schedulePush(q, items);
}
q.on('wallet', () => setTimeout(syncPush, 2000));
q.on('active', live => live && sync());

async function boot() {
  const words = loadWordList().catch(() => null);
  const first = await q.start();
  state.wallet = first.wallet || q.wallet;
  await words;
  const theirs = await decodePayload(first?.payload);
  // A copy on the pass that can't be read is never saved over.
  if (first?.payload && !theirs) state.unreadable = true;
  absorb(theirs);
  for (const item of first?.inbox || []) absorb(await decodePayload(item.payload));
  // Quadra Words' progress on this device (left in place as a backup): onto
  // the pass, per word the newest.
  try {
    const local = JSON.parse(localStorage.getItem('vocab_progress_v1') || 'null');
    if (local && typeof local === 'object') {
      const before = JSON.stringify(state.progress);
      absorb({ progress: migrateWords({ progress: local, exportedAt: Date.now() }) });
      if (JSON.stringify(state.progress) !== before) dirty = true;
    }
  } catch {}
  state.loaded = true;
  $('loading').hidden = true;
  useFreezes();
  checkNotices();
  openFromHash(true);
  // The pass gets the (possibly migrated) progress and anything left to send.
  if (first?.payload && !first.payload.startsWith('z3:')) dirty = true;
  await sync();
  for (const item of first?.inbox || []) q.dropInbox(item.id).catch(() => {});
}
if (!gated) boot();
setTimeout(() => ($('loading').hidden = true), 8000);
// Where the address points: a tab (#missions), the level and avatars
// (#level), or a guide (#help=…). At start, and whenever it changes while the
// app is open (a link, a notice's tap), not only for help.
function openFromHash(start = false) {
  const hash = location.hash.slice(1);
  const help = parseHelpHash(hash);
  if (help) {
    if (start) showTab('home');
    return openHelp(help.app, help.topic);
  }
  const tab = hash === 'level' ? 'missions' : TABS.includes(hash) ? hash : start ? 'home' : null;
  if (!tab) return;
  if (tab !== state.tab || start) showTab(tab);
  if (hash === 'level') setTimeout(() => $('level-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
