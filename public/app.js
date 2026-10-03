// Quadra Hub: a related add-on of Quadra. Words to learn (the high-school
// list, levels 1 to 6), the Quadra Pass and Quadra Plus to
// manage, the truth about how Quadra's money moves, and every app a tap
// away, with its guide. It uses no money: the word progress is its own
// payload on the pass, and the only wallet setting it writes is a member's
// avatar and frame.
import { quadraSession, tabBar, topActions, installGate, watchUpdates, settingPatch, schedulePush, notify, APPS } from '#kit/quadra.mjs';
import { LEVELS, MODES, loadWords, pickRound, toStudy, smartType, markKnown, makeQuestion, grade, sameWord, spellDiff, stats, stateOf, packProgress, unpackProgress, mergeProgress, shortMeaning, wordOfDay, clozeText, hardest, keyOf, personalFactor, recordReview, mergeCal } from './lib/words.mjs';
import { xpOf, answerXp, xpText, levelOf, DAILY_GOAL, logAnswer, mergeDays, todayCount, streakOf, bestStreak, streakAtRisk, lastDays, taipeiDay } from './lib/practice.mjs';
import { HELP_ORDER, helpFor, parseHelpHash } from './lib/help.mjs';
import { pickVoice } from './lib/voice.mjs';
import { detectLocale, makeT } from './lib/i18n.mjs';
import { el, put, section, toast, bar, stat } from './ui.js';
import { renderPass, renderTruth, renderApps } from './hub-ui.js';

const locale = detectLocale();
const t = makeT(locale);
document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
const $ = id => document.getElementById(id);
const TABS = ['words', 'pass', 'truth', 'apps'];
const VERSION = document.querySelector('meta[name="build-version"]')?.content || 'dev';

const state = {
  tab: 'words',
  wallet: null,
  words: null,
  progress: {},
  days: {},
  levels: [1, 2, 3],
  mode: 'smart',
  size: 10,
  loaded: false,
  round: null,
  // New words studied as cards, waiting for their quiz (keys).
  study: [],
  // Reviews for fitting the memory model to this person (words.mjs personalFactor).
  cal: [],
  studying: null,
  help: { app: 'pass', topic: null }
};

const q = quadraSession('vocab', { lang: locale });

// ---- Saved progress (the pass's Hub payload, gzipped) -------------------------------------

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
const encodePayload = async () => `z3:${await gzipB64(JSON.stringify(packProgress({ progress: state.progress, levels: state.levels, mode: state.mode, days: state.days, study: state.study, cal: state.cal })))}`;

// Another copy of the progress (the pass's, or one a merge brought in): per word the newest.
function absorb(decoded) {
  if (!decoded) return;
  state.progress = mergeProgress(state.progress, decoded.progress);
  state.days = mergeDays(state.days, decoded.days);
  if (decoded.levels && !state.levelsTouched) state.levels = decoded.levels;
  if (decoded.mode) state.mode = decoded.mode;
  state.study = [...new Set([...state.study, ...decoded.study])];
  state.cal = mergeCal(state.cal, decoded.cal);
}

// ---- Sync: the payload and a member's looks, one write at a time ----------------------------
let chain = Promise.resolve();
let dirty = false;
let timer = 0;
// Looks chosen here, waiting for the next write.
let pendingSettings = {};
function sync({ soon = false } = {}) {
  clearTimeout(timer);
  if (soon) return (timer = setTimeout(() => sync(), 1500));
  chain = chain.then(push).catch(() => {});
  return chain;
}
async function push() {
  if (!q.active || !state.loaded) return;
  const settings = pendingSettings;
  pendingSettings = {};
  if (!dirty && !Object.keys(settings).length) return;
  const payload = dirty && !state.unreadable ? await encodePayload() : undefined;
  dirty = false;
  try {
    const res = await q.write({ payload, ...(Object.keys(settings).length ? { wallet: { settings } } : {}) });
    if (res?.wallet) state.wallet = res.wallet;
  } catch (error) {
    if (payload) dirty = true;
    pendingSettings = { ...settings, ...pendingSettings };
    throw error;
  }
}
const changed = () => ((dirty = true), sync({ soon: true }));
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && sync());

// ---- Words ----------------------------------------------------------------------------------

async function loadWordList() {
  state.words = loadWords(await fetch(`./data/words.json?v=${VERSION}`).then(r => r.json()));
  state.byKey = new Map(state.words.map(w => [w.key, w]));
}
// A level's name: 第 3 級.
const levelName = l => t('level', { n: l });
const joined = items => items.join(locale === 'en' ? ', ' : '、');

// Pronunciation: every word has a recording in Microsoft's neural voice
// (data/audio, en-US Jenny). One <audio> element is reused, so once a tap
// has played it (iOS only lets sound start from a tap) later words play
// from code too, and each word is started right in the tap that asks for it
// (never after a delay, which iOS would silence). Without the clip
// (offline, a missing file): the device's best English voice (lib/voice.mjs).
const clip = typeof Audio === 'function' ? new Audio() : null;
if (clip) clip.preload = 'auto';
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
function voiceSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  if (!voices.length) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voices);
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-US';
  u.rate = 0.95;
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speak(word) {
  if (!clip) return voiceSpeak(word.word);
  try {
    clip.pause();
  } catch {}
  let fell = false;
  const fallback = () => {
    if (fell) return;
    fell = true;
    voiceSpeak(word.word);
  };
  clip.onerror = fallback;
  clip.src = `./data/audio/${encodeURIComponent(word.word)}.mp3`;
  clip.play().catch(e => e?.name !== 'AbortError' && fallback());
}
const speakButton = (word, big = false) => el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), text: '🔊', onclick: e => (e.stopPropagation(), speak(word)) });

const MODE_ICON = { smart: '✨', meaning: '🔤', word: '🀄', listen: '🎧', letters: '🧩', cloze: '🕳️', spell: '✍️' };

function renderWords() {
  const box = $('panel-words');
  if (!state.words) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.round) return renderRound(box);
  if (state.studying) return renderStudy(box);
  const st = stats(state.words, state.progress);
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const levelCard = l =>
    el('button', { class: `level-card${state.levels.includes(l) ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.levels.includes(l)), onclick: () => toggleLevel(l) }, [
      el('div', { class: 'level-top' }, [el('strong', { text: levelName(l) }), el('small', { text: t(`levelHint${l}`) })]),
      bar(st[l].mastered, st[l].total, 'accent'),
      el('div', { class: 'level-foot' }, [el('span', { class: 'num', text: `${st[l].mastered.toLocaleString()} / ${st[l].total.toLocaleString()}` }), st[l].due ? el('span', { class: 'due', text: t('dueN', { n: st[l].due }) }) : null])
    ]);
  const modes = el(
    'div',
    { class: 'mode-grid' },
    MODES.map(m =>
      el('button', { class: `mode${state.mode === m ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.mode === m), onclick: () => ((state.mode = m), changed(), renderWords()) }, [
        el('span', { class: 'mode-icon', text: MODE_ICON[m] }),
        el('strong', { text: t(`mode_${m}`) }),
        el('small', { text: t(`modeHint_${m}`) })
      ])
    )
  );
  put(
    box,
    goalCard(),
    el('div', { class: 'q-card pad start-card' }, [
      el('div', { class: 'start-top' }, [el('h2', { text: t('wordsTitle') }), el('p', { class: 'muted', text: chosen.length ? t('wordsSub', { due, levels: joined(chosen.map(levelName)) }) : t('pickLevel') })]),
      el('div', { class: 'size-row' }, [
        el('span', { class: 'muted', text: t('roundSize') }),
        el('div', { class: 'segmented', role: 'group' }, [10, 20, 30].map(n => el('button', { type: 'button', 'aria-pressed': String(state.size === n), text: t('wordsN', { n }), onclick: () => ((state.size = n), renderWords()) })))
      ]),
      el('button', { class: 'q-btn primary block big-start', type: 'button', disabled: !chosen.length, text: t('startRound'), onclick: () => startRound() })
    ]),
    studyCard(),
    section(t('levels'), el('div', { class: 'level-grid' }, LEVELS.map(levelCard))),
    section(t('modes'), modes, { sub: t('modesSub') }),
    section(t('progress'), progressCard(st)),
    hardestCard(),
    wordOfDayCard()
  );
}

// Today: the goal, the streak, the level.
function goalCard() {
  const lv = levelOf(xpOf(state.progress), locale);
  const today = todayCount(state.days);
  const streak = streakOf(state.days);
  return el('div', { class: 'q-card pad goal-card' }, [
    el('div', { class: 'goal-top' }, [
      el('span', { class: 'xp-badge num', text: String(lv.level) }),
      el('div', { class: 'goal-name' }, [el('small', { text: t('levelWord') }), el('strong', { text: lv.title })]),
      el('div', { class: 'goal-streak' }, [el('small', { text: t('streakWord') }), el('strong', { class: `num${streak ? ' on' : ''}`, text: t('daysN', { n: streak }) })])
    ]),
    el('div', { class: 'goal-row' }, [el('span', { text: today >= DAILY_GOAL ? t('goalDone') : t('goalLeft', { n: DAILY_GOAL - today }) }), el('strong', { class: 'num', text: `${Math.min(today, DAILY_GOAL)} / ${DAILY_GOAL}` })]),
    bar(today, DAILY_GOAL, 'accent'),
    el('div', { class: 'week-dots', role: 'img', 'aria-label': t('weekDots') }, lastDays(state.days, 7).map(d => el('span', { class: `week-dot${d.kept ? ' kept' : d.answers ? ' some' : ''}`, title: `${d.day.slice(5)} · ${d.answers}` }))),
    el('small', { class: 'muted goal-foot', text: `${xpText(xpOf(state.progress))} · ${t('levelNext', { v: xpText(lv.toNext), n: lv.level + 1 })} · ${t('bestStreak', { n: bestStreak(state.days) })}` })
  ]);
}

function progressCard(st) {
  const a = st.all;
  return el('div', { class: 'q-card pad stat-row' }, [stat(t('stMastered'), a.mastered.toLocaleString()), stat(t('stLearning'), a.learning.toLocaleString()), stat(t('stDue'), a.due.toLocaleString()), stat(t('stLeft'), (a.total - a.seen).toLocaleString())]);
}
// The words that slip most, each with what it was mistaken for.
function hardestCard() {
  const list = hardest(state.words, state.progress);
  if (!list.length) return null;
  return section(
    t('hardTitle'),
    el(
      'div',
      { class: 'q-card list hard-list' },
      list.map(w => {
        const p = state.progress[w.key];
        const mixed = (p.c || []).map(k => state.byKey.get(k)?.word).filter(Boolean);
        return el('div', { class: 'result-row' }, [speakButton(w), el('div', {}, [el('strong', { text: w.word }), el('small', { class: 'muted', text: [shortMeaning(w.zh), mixed.length ? t('mixedWith', { words: joined(mixed) }) : ''].filter(Boolean).join(' · ') })]), el('small', { class: 'pill', text: t('lapsesN', { n: p.l }) })]);
      })
    ),
    { sub: t('hardSub') }
  );
}
// The word of the day: the same for everyone today; tap to hear it.
function wordOfDayCard() {
  const w = wordOfDay(state.words);
  if (!w) return null;
  return el('div', { class: 'q-card pad wotd' }, [
    el('div', { class: 'wotd-top' }, [el('small', { class: 'wotd-label', text: t('wotd') }), el('small', { class: 'muted', text: t(`state_${stateOf(state.progress[w.key])}`) })]),
    el('div', { class: 'word-line' }, [el('strong', { class: 'word', text: w.word }), speakButton(w)]),
    el('small', { class: 'muted', text: [w.ph ? `/${w.ph}/` : '', w.pos, levelName(w.level)].filter(Boolean).join(' · ') }),
    el('p', { class: 'meaning', text: shortMeaning(w.zh) })
  ]);
}

function toggleLevel(l) {
  state.levelsTouched = true;
  state.levels = state.levels.includes(l) ? state.levels.filter(x => x !== l) : [...state.levels, l].sort((a, b) => a - b);
  changed();
  renderWords();
}

// ---- Studying new words -------------------------------------------------------------------
//
// New words as cards to memorise (the word, its sound, its meaning), one
// batch (a round's size) at a time; a full batch is quizzed, and from the
// quiz on its words are scheduled like any other.
function studyCard() {
  const n = state.study.length;
  const full = n >= state.size;
  const next = toStudy(state.words, state.progress, { levels: state.levels, n: 1, skip: new Set(state.study) }).length > 0;
  return section(
    t('studyTitle'),
    el('div', { class: 'q-card pad study-card' }, [
      el('div', { class: 'goal-row' }, [el('span', { text: full ? t('studyReady') : t('studyLeft', { n: state.size - n }) }), el('strong', { class: 'num', text: `${Math.min(n, state.size)} / ${state.size}` })]),
      bar(n, state.size, 'accent'),
      full
        ? el('button', { class: 'q-btn primary block', type: 'button', text: t('studyQuiz', { n }), onclick: () => startRound({ quiz: true }) })
        : el('button', { class: 'q-btn block', type: 'button', disabled: !next || !state.levels.length, text: !next ? t('studyNone') : n ? t('studyMore') : t('studyStart'), onclick: startStudy })
    ]),
    { sub: t('studySub', { n: state.size }) }
  );
}
function startStudy() {
  const list = toStudy(state.words, state.progress, { levels: state.levels, n: Math.max(0, state.size - state.study.length), skip: new Set(state.study) });
  if (!list.length) return toast(t('studyNone'));
  state.studying = { list, i: 0 };
  renderWords();
  speak(list[0]);
}
function studyStep(delta) {
  const s = state.studying;
  s.i = Math.max(0, Math.min(s.list.length - 1, s.i + delta));
  renderWords();
  speak(s.list[s.i]);
}
// 記住了: into the batch; the last one ends the session.
function studyGot() {
  const s = state.studying;
  const word = s.list[s.i];
  if (!state.study.includes(word.key)) state.study = [...state.study, word.key];
  changed();
  if (s.i + 1 >= s.list.length || state.study.length >= state.size) {
    state.studying = null;
    renderWords();
    return toast(state.study.length >= state.size ? t('studyReady') : t('studySaved'), 'good');
  }
  studyStep(1);
}
// 太簡單: known already, out of the way; not in the batch.
function studyKnown() {
  const s = state.studying;
  const word = s.list[s.i];
  state.progress = { ...state.progress, [word.key]: markKnown(state.progress[word.key]) };
  state.study = state.study.filter(k => k !== word.key);
  s.list = s.list.filter(w => w.key !== word.key);
  changed();
  if (!s.list.length) {
    state.studying = null;
    return renderWords();
  }
  s.i = Math.min(s.i, s.list.length - 1);
  renderWords();
  speak(s.list[s.i]);
}
function renderStudy(box) {
  const s = state.studying;
  const word = s.list[s.i];
  const inBatch = state.study.length;
  const head = el('div', { class: 'round-head' }, [
    el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: () => ((state.studying = null), renderWords()) }),
    el('div', { class: 'round-bar' }, [el('i', { style: `width:${(Math.min(inBatch, state.size) / state.size) * 100}%` })]),
    el('strong', { class: 'num round-earn', text: `${Math.min(inBatch, state.size)} / ${state.size}` })
  ]);
  const card = el('div', { class: 'q-card pad study-word' }, [
    el('div', { class: 'word-line' }, [el('strong', { class: 'word big', text: word.word }), speakButton(word, true)]),
    el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos, levelName(word.level)].filter(Boolean).join(' · ') }),
    el('p', { class: 'meaning study-meaning', text: word.zh })
  ]);
  const nav = el('div', { class: 'two-btn study-nav' }, [
    el('button', { class: 'q-btn', type: 'button', disabled: s.i === 0, text: `‹ ${t('studyPrev')}`, onclick: () => studyStep(-1) }),
    el('button', { class: 'q-btn primary', type: 'button', text: `${t('studyGot')} ›`, onclick: studyGot })
  ]);
  put(box, head, card, nav, el('button', { class: 'q-btn small ghost too-easy', type: 'button', text: t('tooEasy'), onclick: studyKnown }));
}

// ---- A round ---------------------------------------------------------------------------

function startRound({ quiz = false } = {}) {
  // A quiz: the studied batch, look-alikes apart; else the usual round.
  const list = quiz ? pickRound(state.study.map(k => state.byKey.get(k)).filter(Boolean), {}, { levels: LEVELS, size: state.study.length }) : pickRound(state.words, state.progress, { levels: state.levels, size: state.size, skip: new Set(state.study), factor: personalFactor(state.cal) });
  if (!list.length) return toast(t('nothingLeft'));
  state.round = { list, i: 0, results: [], earned: 0, q: null, answered: false, quiz };
  nextQuestion();
}
function nextQuestion() {
  const r = state.round;
  const word = r.list[r.i];
  const used = {};
  for (const x of r.results) used[x.type] = (used[x.type] || 0) + 1;
  const p = state.progress[word.key];
  // A new word in a round (not a batch just studied) is checked first: a
  // cloze with half its letters gone. Right without hesitating, it's known
  // and out of the way for weeks; only what's missed is learnt.
  r.check = !r.quiz && !p?.b && !r.retry?.has(word.key) && ['smart', 'cloze', 'spell'].includes(state.mode);
  // A word missed this round comes back the hard way: written, not picked.
  const type = r.retry?.has(word.key) ? (/\s/.test(word.word) ? 'cloze' : 'spell') : r.check && state.mode === 'smart' ? 'cloze' : state.mode === 'smart' ? smartType(p, Math.random, word, used) : state.mode;
  r.q = makeQuestion(word, type, state.words, { p: r.check ? { b: 3 } : p });
  r.answered = false;
  r.typed = '';
  r.built = [];
  r.shownAt = Date.now();
  renderWords();
  // Only when the question is the sound (by ear, dictation): straight away,
  // inside the tap that led here (iOS plays sound only then). Else 🔊 plays it.
  if (['listen', 'spell'].includes(type)) speak(word);
}

// One answer: graded, logged for the day, and a mix-up remembered both ways
// (a wrong choice, or a typed word that's another word on the list).
function answer(correct, typed = '') {
  const r = state.round;
  if (!r || r.answered) return;
  r.answered = true;
  const word = r.q.word;
  const other = !correct && typed && keyOf(typed) !== word.key ? state.byKey.get(keyOf(typed)) || null : null;
  // How long it took counts: a quick right answer is known better than a slow one.
  const res = grade(state.progress[word.key], correct, { chose: other?.key, type: r.q.type, ms: Date.now() - r.shownAt, word: word.word, check: r.check, factor: personalFactor(state.cal) });
  state.cal = recordReview(state.cal, state.progress[word.key], correct);
  state.progress = { ...state.progress, [word.key]: res.p };
  if (other) {
    const o = state.progress[other.key] || { b: 0, d: 0, n: 0, r: 0, t: 0 };
    state.progress = { ...state.progress, [other.key]: { ...o, c: [word.key, ...(o.c || []).filter(k => k !== word.key)].slice(0, 4) } };
  }
  state.days = logAnswer(state.days);
  const pay = answerXp({ correct, firstMastery: res.firstMastery });
  r.earned += pay;
  r.results.push({ word, correct, type: r.q.type, after: stateOf(res.p), pay, typed, mixed: other, mastered: res.firstMastery });
  // A missed word comes back once at the end of the round, to fix it while it's fresh.
  if (!correct && !r.retry?.has(word.key)) {
    r.retry ||= new Set();
    r.retry.add(word.key);
    r.list = [...r.list, word];
  }
  changed();
  renderWords();
}
// 太簡單: the word is known; it's put away and the round moves on.
function tooEasy() {
  const r = state.round;
  if (!r || r.answered) return;
  const word = r.q.word;
  state.progress = { ...state.progress, [word.key]: markKnown(state.progress[word.key]) };
  r.results.push({ word, correct: true, type: 'known', after: 'mastered', pay: 0, typed: '' });
  r.list = [...r.list.slice(0, r.i + 1), ...r.list.slice(r.i + 1).filter(w => w.key !== word.key)];
  changed();
  advance();
}
function advance() {
  const r = state.round;
  if (r.i + 1 >= r.list.length) {
    r.done = true;
    // The batch is quizzed: from now on its words are scheduled like any other.
    if (r.quiz) {
      const asked = new Set(r.list.map(w => w.key));
      state.study = state.study.filter(k => !asked.has(k));
      changed();
    }
    sync();
    return renderWords();
  }
  r.i++;
  nextQuestion();
}
function endRound() {
  state.round = null;
  sync();
  renderWords();
}

function renderRound(box) {
  const r = state.round;
  if (r.done) return put(box, roundSummary(r));
  const head = el('div', { class: 'round-head' }, [
    el('button', { class: 'q-close', type: 'button', 'aria-label': t('endRound'), text: '×', onclick: endRound }),
    el('div', { class: 'round-bar' }, [el('i', { style: `width:${(r.i / r.list.length) * 100}%` })]),
    el('strong', { class: 'num round-earn', text: xpText(r.earned, { sign: true }) })
  ]);
  put(box, head, questionView(r));
  box.querySelector('input')?.focus({ preventScroll: true });
}

function wordHead(word, { meaning = false } = {}) {
  return el('div', { class: 'word-head' }, [
    el('div', { class: 'word-line' }, [el('strong', { class: 'word', text: word.word }), speakButton(word)]),
    el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos, levelName(word.level)].filter(Boolean).join(' · ') }),
    meaning ? el('p', { class: 'meaning', text: word.zh }) : null
  ]);
}
const meaningHead = (word, extra = '') => el('div', { class: 'word-head' }, [el('p', { class: 'meaning big', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: [word.pos, extra].filter(Boolean).join(' · ') })]);

function questionView(r) {
  const { q: question } = r;
  const word = question.word;
  const done = r.answered;
  const last = done ? r.results.at(-1) : null;
  const card = el('div', { class: `q-card pad question type-${question.type}` });
  const prompt = el('p', { class: 'q-prompt', text: t(`ask_${question.type}`) });
  if (question.choices) {
    const top = question.type === 'meaning' ? wordHead(word) : question.type === 'word' ? meaningHead(word) : el('div', { class: 'word-head center' }, [speakButton(word, true), el('small', { class: 'muted', text: t('tapToHear') })]);
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
    // One row whatever the length: the slots and tiles shrink to fit (--n).
    const fit = `--n:${word.word.length}`;
    const slots = el('div', { class: 'slots', style: fit }, [...word.word].map((ch, i) => el('span', { class: `slot${built[i] ? ' filled' : ''}${done ? (last.correct ? ' right' : ' wrong') : ''}`, text: built[i]?.ch ?? (ch === ' ' ? '␣' : '') })));
    const tiles = el(
      'div',
      { class: 'tiles', style: fit },
      question.letters.map((ch, i) =>
        el('button', {
          class: 'tile',
          type: 'button',
          disabled: done || used.has(i),
          text: ch === ' ' ? '␣' : ch,
          onclick: () => {
            r.built = [...built, { ch, i }];
            const spelt = r.built.map(b => b.ch).join('');
            if (r.built.length === word.word.length) answer(sameWord(spelt, word.word), spelt);
            else renderWords();
          }
        })
      )
    );
    // The meaning only: hearing it would make it dictation with the letters given.
    put(card, prompt, meaningHead(word, t('letters', { n: word.word.replace(/\s/g, '').length })), slots, tiles, !done && built.length ? el('button', { class: 'q-btn small ghost', type: 'button', text: t('undo'), onclick: () => ((r.built = built.slice(0, -1)), renderWords()) }) : null);
  } else {
    // Typed: a cloze (the word with letters missing) or dictation (heard).
    const cloze = question.type === 'cloze';
    const input = el('input', { class: 'spell-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', value: r.typed, disabled: done, 'aria-label': t(`ask_${question.type}`) });
    input.addEventListener('input', () => (r.typed = input.value));
    const form = el('form', { class: 'spell-form', onsubmit: e => (e.preventDefault(), input.value.trim() && answer(sameWord(input.value, word.word), input.value)) }, [input, el('button', { class: 'q-btn primary', type: 'submit', disabled: done, text: t('check') })]);
    const top = cloze
      ? el('div', { class: 'word-head center' }, [el('p', { class: 'cloze num', text: clozeText(word.word, question.gaps) }), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: word.pos })])
      : el('div', { class: 'word-head center' }, [speakButton(word, true), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: t('letters', { n: word.word.length }) })]);
    put(card, prompt, top, form, done && !last.correct ? el('p', { class: 'diff' }, spellDiff(last.typed, word.word).map(d => el('span', { class: d.ok ? '' : 'bad', text: d.ch }))) : null);
  }
  if (!done) return el('div', {}, [card, el('button', { class: 'q-btn small ghost too-easy', type: 'button', text: t('tooEasy'), onclick: tooEasy })]);
  return el('div', { class: 'answered' }, [card, feedback(last)]);
}

function feedback(res) {
  const word = res.word;
  const status = res.mastered ? t('fbMastered') : res.correct ? t('fbRight') : t('fbWrong');
  const next = el('button', { class: 'q-btn primary block', type: 'button', text: state.round.i + 1 >= state.round.list.length ? t('seeResult') : t('next'), onclick: advance });
  setTimeout(() => next.focus({ preventScroll: true }), 0);
  return el('div', { class: `q-card pad feedback ${res.correct ? 'good' : 'bad'}` }, [
    el('div', { class: 'fb-top' }, [el('strong', { text: status }), res.pay ? el('span', { class: 'fb-pay num', text: xpText(res.pay, { sign: true }) }) : null]),
    // The word's on screen already for a meaning question: its meaning only.
    res.type === 'meaning' ? el('p', { class: 'meaning', text: word.zh }) : wordHead(word, { meaning: true }),
    // What it was mistaken for, side by side: the difference is the lesson.
    res.mixed ? el('div', { class: 'mixed' }, [el('small', { class: 'muted', text: t('youPicked') }), el('div', { class: 'word-line' }, [el('strong', { text: res.mixed.word }), speakButton(res.mixed)]), el('small', { class: 'muted', text: shortMeaning(res.mixed.zh) })]) : null,
    el('small', { class: 'muted', text: t(`state_${res.after}`) }),
    // Pinned above the tab bar: no scrolling down for it.
    el('div', { class: 'next-bar' }, [next])
  ]);
}

function roundSummary(r) {
  const asked = r.results.filter(x => x.type !== 'known');
  const right = asked.filter(x => x.correct).length;
  const mastered = r.results.filter(x => x.mastered).length;
  return el('div', {}, [
    el('div', { class: 'q-card pad summary' }, [
      el('p', { class: 'summary-big num', text: `${right} / ${asked.length}` }),
      el('p', { class: 'muted', text: t('summaryLine', { v: xpText(r.earned), m: mastered }) }),
      el('p', { class: 'muted small', text: right === asked.length ? t('summaryAll') : t('summaryMissed') }),
      el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('backToWords'), onclick: endRound }), el('button', { class: 'q-btn primary', type: 'button', text: t('again'), onclick: () => startRound() })])
    ]),
    el(
      'div',
      { class: 'q-card list result-list' },
      r.results.map(x =>
        el('div', { class: 'result-row' }, [
          el('span', { class: `dot ${x.correct ? 'good' : 'bad'}`, text: x.correct ? '✓' : '✗' }),
          el('div', {}, [el('strong', { text: x.word.word }), el('small', { class: 'muted', text: [shortMeaning(x.word.zh), x.mixed ? t('mixedWith', { words: x.mixed.word }) : ''].filter(Boolean).join(' · ') })]),
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

// ---- Looks: a Plus member's avatar and frame, written as wallet settings --------------------

const wornOf = key => (key in pendingSettings ? pendingSettings[key].value?.id : state.wallet?.settings?.[key]?.value?.id) ?? null;
function wear(key, id) {
  pendingSettings = { ...pendingSettings, ...settingPatch(key, id ? { id } : null).settings };
  sync();
  toast(t(id ? `${key}Worn` : `${key}Off`), 'good');
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
  const cards = helpFor(app, locale).map(([id, title, paras]) => el('article', { class: `q-card pad help-card${topic === id ? ' focus' : ''}`, id: `help-${id}` }, [el('h3', { text: title }), ...paras.map(p => el('p', { text: p }))]));
  const open = app !== 'pass' && app !== 'vocab' ? el('button', { class: 'q-btn primary block', type: 'button', text: t('openApp', { app: APPS[app].name }), onclick: () => q.go(app) }) : null;
  const head = el('div', { class: 'q-sheet-head' }, [el('h2', { text: t('helpTitle') }), el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: () => helpSheet.close() })]);
  put(helpSheet, head, chips, el('div', { class: 'help-list' }, cards), open);
  if (topic) setTimeout(() => $(`help-${topic}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}

// ---- Tabs and start -------------------------------------------------------------------------

const TAB_ICONS = { words: 'book', pass: 'pass', truth: 'eye', apps: 'grid' };
const tabNav = tabBar({ tabs: TABS.map(id => ({ id, label: t(`tab_${id}`), icon: TAB_ICONS[id] })), onSelect: (tab, { again }) => !again && showTab(tab) });
// What the other tabs need from here.
const hub = { q, t, locale, state, wornOf, wear, openHelp };
function showTab(tab) {
  state.tab = tab;
  tabNav.select(tab);
  refresh();
}
function refresh() {
  $('status').textContent = state.loaded ? t('statusLine', { n: Math.min(todayCount(state.days), DAILY_GOAL), goal: DAILY_GOAL, s: streakOf(state.days) }) : '';
  if (state.tab === 'words') return !(state.round && !state.round.answered && document.activeElement?.tagName === 'INPUT') && renderWords();
  const box = $(`panel-${state.tab}`);
  if (!state.wallet) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.tab === 'pass') renderPass(box, hub);
  if (state.tab === 'truth') renderTruth(box, hub);
  if (state.tab === 'apps') renderApps(box, hub);
}
// A redraw that never interrupts a question.
const quietRefresh = () => !(state.tab === 'words' && state.round && !state.round.done) && refresh();

window.__fxStarted = true;
const gated = installGate('vocab', locale);
watchUpdates({ current: VERSION, key: 'quadraHub', cachePrefix: 'quadra-hub-', busy: () => Boolean(state.round && !state.round.done) });
// The same top-right in every Quadra app; help opens here, over the app.
topActions(q, { help: () => openHelp('vocab') });
tabNav.select(state.tab);
q.on('wallet', w => {
  state.wallet = w;
  quietRefresh();
});
q.on('active', live => live && sync());

// Notices (the kit's: a banner on screen, a system notice in the background
// once turned on in the account sheet): a streak that ends tonight, now
// (after 20:00 Taiwan time) and, while the app is closed, at 20:00 today
// (if the goal isn't met yet) and the next two evenings.
function checkStreak() {
  const n = streakAtRisk(state.days);
  const body = t('noticeStreakBody', { goal: DAILY_GOAL });
  if (n && new Date(Date.now() + 8 * 3_600_000).getUTCHours() >= 20) notify(q, { title: t('noticeStreak', { n }), body, tag: `streak:${taipeiDay()}`, hash: 'words', kind: 'streak' });
  const now = Date.now();
  const eight = day => Date.parse(`${taipeiDay(now + day * 86_400_000)}T20:00:00+08:00`);
  const items = [];
  if (n && eight(0) > now) items.push({ at: eight(0), title: t('noticeStreak', { n }), body, tag: `streak:${taipeiDay(now)}`, hash: 'words', kind: 'streak' });
  for (const day of [1, 2]) items.push({ at: eight(day), title: t('noticeStreakSoon'), body, tag: `streak:${taipeiDay(now + day * 86_400_000)}`, hash: 'words', kind: 'streak' });
  schedulePush(q, items);
}

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
  state.loaded = true;
  $('loading').hidden = true;
  openFromHash(true);
  if (first?.inbox?.length) dirty = true;
  await sync();
  for (const item of first?.inbox || []) q.dropInbox(item.id).catch(() => {});
  setTimeout(checkStreak, 2000);
}
if (!gated) boot();
// Where the address points: a tab (#pass), or a guide (#help=…). At start,
// and whenever it changes while the app is open (a link, a notice's tap).
function openFromHash(start = false) {
  const hash = location.hash.slice(1);
  const help = parseHelpHash(hash);
  if (help) {
    if (start) showTab('words');
    return openHelp(help.app, help.topic);
  }
  const tab = TABS.includes(hash) ? hash : start ? 'words' : null;
  if (tab && (tab !== state.tab || start)) showTab(tab);
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
