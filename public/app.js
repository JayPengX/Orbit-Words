// Quadra Rewards: where Quadra pays for effort and explains itself. Words
// (the high-school list, levels 1 to 6, six ways to learn), mini games and
// daily missions pay into the Quadra Pass's shared wallet; the wealth ranks
// show where the pool stands; the help centre explains every app.
import {
  quadraSession, accountButton, installGate, watchUpdates, recordAffinity, affinityPatch, setting, settingPatch, taipeiDay, poolBalance, money, randomId, APPS, ECONOMY
} from './lib/quadra.mjs';
import { LEVELS, MODES, loadWords, pickRound, smartType, makeQuestion, grade, payFor, sameWord, spellDiff, stats, stateOf, packProgress, unpackProgress, mergeProgress, migrateWords, shortMeaning } from './lib/words.mjs';
import { CAPS, earnedToday, missions, claimEntry, rankOf, RANKS, streakDays, earnedAllTime } from './lib/earn.mjs';
import { HELP_ORDER, helpFor, parseHelpHash } from './lib/help.mjs';
import { detectLocale, makeT } from './lib/i18n.mjs';
import { mountGames } from './games-ui.js';

const locale = detectLocale();
const t = makeT(locale);
document.documentElement.lang = locale === 'zh' ? 'zh-Hant' : 'en';
const $ = id => document.getElementById(id);
const TABS = ['home', 'words', 'games', 'help'];
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

// ---- Money earned here: entries waiting to go to the pass ------------------------------
//
// A batch of answers, a game round or a claimed mission becomes an entry
// with a fixed id at once, kept on this device (quadra.rewards.out) until
// the pass has it, so nothing is lost offline or paid twice.
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
const earned = () => {
  const e = earnedToday(state.wallet);
  for (const x of outbox.read()) if (taipeiDay(x.t) === taipeiDay() && !walletHas(x.id)) e[x.kind === 'reward' ? 'words' : x.kind] += x.amount;
  e.total = e.words + e.game + e.mission;
  return e;
};
const walletHas = id => (state.wallet?.entries || []).some(e => e.id === id);
const room = kind => Math.max(0, CAPS[kind] - earned()[kind]);

// Activity counts for the missions (act:vocab), added up here.
const act = { answer: 0, master: 0, game: 0 };
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

// The open batch of word pay.
let batch = null;
function addWordPay(amount) {
  if (amount <= 0) return 0;
  const paid = Math.min(amount, room('words') - (batch?.amount || 0));
  if (paid <= 0) return 0;
  batch ||= { id: `vocab:w:${randomId()}`, t: Date.now(), app: 'vocab', kind: 'words', amount: 0, n: 0 };
  batch.amount += paid;
  batch.n++;
  if (batch.n >= 10) closeBatch();
  return paid;
}
function closeBatch() {
  if (!batch?.amount) return (batch = null);
  const { n, ...entry } = batch;
  outbox.write([...outbox.read(), { ...entry, note: locale === 'en' ? `${n} answers` : `${n} 題` }]);
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
  const settings = { ...actPatch(), ...affinityPatch('vocab').settings };
  if (!dirty && !out.length && !Object.keys(settings).length) return;
  const payload = dirty && !state.unreadable ? await encodePayload() : undefined;
  dirty = false;
  try {
    const res = await q.write({ payload, wallet: { entries: out, settings } });
    if (res?.wallet) state.wallet = res.wallet;
    outbox.write(outbox.read().filter(e => !walletHas(e.id)));
  } catch (error) {
    if (payload) dirty = true;
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
  const res = await fetch(`./data/words.json?v=${VERSION}`);
  state.words = loadWords(await res.json());
  state.byKey = new Map(state.words.map(w => [w.key, w]));
}

// Pronunciation: the recorded clip (levels 4-6), else the browser's voice.
let player = null;
function speak(word, { slow = false } = {}) {
  try {
    player?.pause();
  } catch {}
  const voice = () => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word.word);
    u.lang = 'en-US';
    u.rate = slow ? 0.7 : 0.92;
    const v = speechSynthesis.getVoices().find(x => /^en(-|_)US/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^en/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  };
  if (word.level >= 4 && !slow) {
    player = new Audio(`./data/audio/${encodeURIComponent(word.word)}.mp3`);
    player.play().catch(voice);
    player.onerror = voice;
  } else voice();
}
const speakButton = (word, big = false) => el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), text: '🔊', onclick: e => (e.stopPropagation(), speak(word)) });

function renderWords() {
  const box = $('panel-words');
  if (!state.words) return put(box, el('div', { class: 'center-spin' }, [el('div', { class: 'spinner' })]));
  if (state.round) return renderRound(box);
  const st = stats(state.words, state.progress);
  const today = earned();
  const selected = LEVELS.filter(l => state.levels.includes(l));
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
        el('div', {}, [el('h2', { text: t('wordsTitle') }), el('p', { class: 'muted', text: selected.length ? t('wordsSub', { due, levels: selected.join('、') }) : t('pickLevel') })]),
        el('div', { class: 'earn-mini' }, [el('small', { class: 'muted', text: t('todayWords') }), el('strong', { class: 'num', text: `${nt(today.words)} / ${nt(CAPS.words)}` })])
      ]),
      bar(today.words, CAPS.words, 'accent'),
      el('button', { class: 'q-btn primary block big-start', type: 'button', disabled: !selected.length, text: t('startRound'), onclick: startRound })
    ]),
    section(t('levels'), levelCards, { sub: t('levelsSub') }),
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

function toggleLevel(l) {
  state.levelsTouched = true;
  state.levels = state.levels.includes(l) ? state.levels.filter(x => x !== l) : [...state.levels, l].sort();
  dirty = true;
  sync({ soon: true });
  renderWords();
}

// ---- A round ---------------------------------------------------------------------------

function startRound() {
  const list = pickRound(state.words, state.progress, { levels: state.levels, size: 10 });
  if (!list.length) return toast(t('nothingLeft'));
  state.round = { list, i: 0, results: [], earned: 0, q: null, answered: false, started: Date.now() };
  nextQuestion();
  recordAffinity('vocab', ['vocab:words', ...state.levels.map(l => `vocab:level${l}`)], 0.5);
}
function nextQuestion() {
  const r = state.round;
  const word = r.list[r.i];
  const type = state.mode === 'smart' ? smartType(state.progress[word.key]) : state.mode;
  r.q = makeQuestion(word, type, state.words);
  r.answered = false;
  r.typed = '';
  r.built = [];
  r.revealed = false;
  renderWords();
  if (['meaning', 'listen', 'spell', 'letters'].includes(type)) setTimeout(() => speak(word), 250);
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
  const pay = addWordPay(payFor({ correct, type: r.q.type, firstMastery: res.firstMastery }, ECONOMY.vocab));
  if (r.q.type !== 'card') act.answer++;
  if (res.firstMastery) act.master++;
  r.earned += pay;
  r.results.push({ word, correct, type: r.q.type, before, after: stateOf(res.p), pay, typed, mastered: res.firstMastery });
  if (!correct) speak(word);
  renderWords();
  sync({ soon: true });
}
function advance() {
  const r = state.round;
  if (r.i + 1 >= r.list.length) {
    r.done = true;
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
    el('strong', { class: 'num round-earn', text: `+${nt(r.earned)}` })
  ]);
  put(box, head, questionView(r));
  box.querySelector('input')?.focus({ preventScroll: true });
}

function wordHead(word, { meaning = false, reveal = true } = {}) {
  return el('div', { class: 'word-head' }, [
    el('div', { class: 'word-line' }, [el('strong', { class: 'word', text: word.word }), speakButton(word)]),
    el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos, t('level', { n: word.level })].filter(Boolean).join(' · ') }),
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
    const slots = el('div', { class: 'slots' }, [...word.word].map((ch, i) => el('span', { class: `slot${built[i] ? ' filled' : ''}${done ? (last.correct ? ' right' : ' wrong') : ''}`, text: built[i]?.ch ?? (ch === ' ' ? '␣' : '') })));
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
      el('div', { class: 'word-head' }, [el('p', { class: 'meaning big', text: shortMeaning(word.zh) }), speakButton(word)]),
      slots,
      tiles,
      !done && built.length ? el('button', { class: 'q-btn small ghost', type: 'button', text: t('undo'), onclick: () => ((r.built = built.slice(0, -1)), renderWords()) }) : null
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
  if (!done) return el('div', {}, [card]);
  return el('div', {}, [card, feedback(last)]);
}

function feedback(res) {
  const word = res.word;
  const status = res.mastered ? t('fbMastered') : res.correct ? t(res.type === 'card' ? 'fbKnew' : 'fbRight') : t('fbWrong');
  const next = el('button', { class: 'q-btn primary block', type: 'button', text: state.round.i + 1 >= state.round.list.length ? t('seeResult') : t('next'), onclick: advance });
  setTimeout(() => next.focus({ preventScroll: true }), 0);
  return el('div', { class: `q-card pad feedback ${res.correct ? 'good' : 'bad'}` }, [
    el('div', { class: 'fb-top' }, [el('strong', { text: status }), res.pay ? el('span', { class: 'fb-pay num', text: `+${nt(res.pay)}` }) : null]),
    res.type === 'card' ? null : wordHead(word, { meaning: true }),
    el('small', { class: 'muted', text: t(`state_${res.after}`) }),
    next
  ]);
}

function roundSummary(r) {
  const right = r.results.filter(x => x.correct).length;
  const mastered = r.results.filter(x => x.mastered).length;
  return el('div', {}, [
    el('div', { class: 'q-card pad summary' }, [
      el('p', { class: 'summary-big num', text: `${right} / ${r.results.length}` }),
      el('p', { class: 'muted', text: t('summaryLine', { v: nt(r.earned), m: mastered }) }),
      room('words') <= 0 ? el('p', { class: 'note', text: t('capReached') }) : null,
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
  const st = state.words ? stats(state.words, state.progress) : null;
  const rankCard = el('div', { class: 'rank-card' }, [
    el('div', { class: 'rank-top' }, [
      el('span', { class: 'rank-icon', text: r.rank.icon }),
      el('div', {}, [el('small', { text: t('yourRank') }), el('strong', { text: t(`rank_${r.rank.id}`) })]),
      streak ? el('span', { class: 'streak', text: t('streak', { n: streak }) }) : null
    ]),
    el('p', { class: 'rank-balance num', text: nt(balance) }),
    r.next ? bar(r.progress, 1, 'light') : null,
    el('p', { class: 'rank-next', text: r.next ? t('toNext', { v: nt(r.toNext), rank: t(`rank_${r.next.id}`) }) : t('topRank') })
  ]);
  const earnCard = el('div', { class: 'q-card pad earn-card' }, [
    el('div', { class: 'earn-head' }, [el('strong', { text: t('todayEarned') }), el('strong', { class: 'num accent', text: nt(e.total) })]),
    ...['words', 'game', 'mission'].map(k => el('div', { class: 'earn-row' }, [el('span', { text: t(`earn_${k}`) }), bar(e[k], CAPS[k], 'accent'), el('small', { class: 'num', text: `${nt(e[k])} / ${nt(CAPS[k])}` })]))
  ]);
  const missionList = el(
    'div',
    { class: 'q-card list' },
    ms.map(m => {
      const action = m.claimed
        ? el('span', { class: 'claimed', text: t('claimed') })
        : m.done
          ? el('button', { class: 'q-btn primary small', type: 'button', text: t('claim', { v: nt(m.pay) }), onclick: () => claim(m.id) })
          : el('button', { class: 'q-btn small', type: 'button', text: t('go'), onclick: () => goMission(m) });
      return el('div', { class: `mission${m.claimed ? ' done' : ''}` }, [
        el('span', { class: 'mission-icon', text: MISSION_ICON[m.id] }),
        el('div', { class: 'mission-text' }, [el('strong', { text: t(`mission_${m.id}`) }), el('div', { class: 'mission-bar' }, [bar(m.progress, m.goal, 'accent'), el('small', { class: 'num muted', text: `${m.progress}/${m.goal} · ${nt(m.pay)}` })])]),
        action
      ]);
    })
  );
  // Next steps: what's most worth doing now.
  const steps = [];
  const due = st ? LEVELS.filter(l => state.levels.includes(l)).reduce((s, l) => s + st[l].due, 0) : 0;
  if (room('words') > 0) steps.push({ icon: '📚', title: due ? t('stepReview', { n: due }) : t('stepLearn'), sub: t('stepWordsSub', { v: nt(room('words')) }), go: () => showTab('words') });
  const undone = ms.find(m => m.done && !m.claimed);
  if (undone) steps.push({ icon: '🎁', title: t('stepClaim'), sub: t(`mission_${undone.id}`), go: () => claim(undone.id) });
  if (room('game') > 0) steps.push({ icon: '🎮', title: t('stepGame'), sub: t('stepGameSub', { v: nt(room('game')) }), go: () => showTab('games') });
  steps.push({ icon: '📈', title: t('stepInvest'), sub: t('stepInvestSub'), go: () => q.go('stock') });
  const stepRow = el(
    'div',
    { class: 'q-recs' },
    steps.slice(0, 4).map(s => el('button', { class: 'q-rec step', type: 'button', onclick: s.go }, [el('span', { class: 'step-icon', text: s.icon }), el('p', { class: 'q-rec-title', text: s.title }), el('p', { class: 'q-rec-sub', text: s.sub })]))
  );
  put(
    box,
    rankCard,
    section(t('nextSteps'), stepRow),
    section(t('missions'), missionList, { sub: t('missionsSub', { v: nt(CAPS.mission) }) }),
    section(t('todayEarned'), earnCard, { sub: t('allTime', { v: nt(earnedAllTime(state.wallet)) }) }),
    section(t('ranks'), ranksCard(r.index)),
    section(t('growTitle'), el('div', { class: 'q-card pad grow' }, [el('p', { text: t('growText') }), el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('openHelp'), onclick: () => openHelp('vocab', 'rich') }), el('button', { class: 'q-btn primary', type: 'button', text: t('openSecurities'), onclick: () => q.go('stock') })])]))
  );
}
const MISSION_ICON = { words20: '📚', master3: '🏅', game1: '🎮', invest: '📈', match: '🏟️', orbit: '🪐', tour: '🧭' };

function ranksCard(current) {
  return el(
    'div',
    { class: 'q-card list ranks' },
    RANKS.map((rk, i) =>
      el('div', { class: `rank-row${i === current ? ' current' : i < current ? ' passed' : ''}` }, [el('span', { class: 'rank-icon sm', text: rk.icon }), el('strong', { text: t(`rank_${rk.id}`) }), el('small', { class: 'num muted', text: rk.min ? nt(rk.min) : '—' })])
    )
  );
}

function goMission(m) {
  if (m.app === 'vocab') return showTab(m.id === 'game1' ? 'games' : 'words');
  if (m.app === 'stock') return q.go('stock');
  if (m.app === 'match') return q.go('match');
  if (m.app === 'orbit') return q.go('orbit');
  // The tour: the first app not opened today.
  const day = taipeiDay();
  const next = ['stock', 'match'].find(a => !(state.wallet?.apps?.[a]?.last && taipeiDay(state.wallet.apps[a].last) === day));
  if (next) q.go(next);
}
function claim(id) {
  const entry = claimEntry(state.wallet, id);
  if (!entry || outbox.read().some(x => x.id === entry.id)) return toast(t('capReached'));
  payEntry(entry);
  toast(t('claimedToast', { v: nt(entry.amount) }), 'good');
  refresh();
}

// ---- Help ---------------------------------------------------------------------------------

function openHelp(app, topic = null) {
  state.help = { app, topic };
  showTab('help');
}
function renderHelp() {
  const box = $('panel-help');
  const { app, topic } = state.help;
  const chips = el(
    'div',
    { class: 'q-chips' },
    HELP_ORDER.map(a => el('button', { class: 'q-chip', type: 'button', 'aria-pressed': String(app === a), text: a === 'pass' ? 'Quadra Pass' : APPS[a].short, onclick: () => ((state.help = { app: a, topic: null }), renderHelp()) }))
  );
  const topics = helpFor(app, locale);
  const cards = topics.map(([id, title, paras]) =>
    el('article', { class: `q-card pad help-card${topic === id ? ' focus' : ''}`, id: `help-${id}` }, [el('h3', { text: title }), ...paras.map(p => el('p', { text: p }))])
  );
  const open = app !== 'pass' && app !== 'vocab' ? el('button', { class: 'q-btn primary block', type: 'button', text: t('openApp', { app: APPS[app].name }), onclick: () => q.go(app) }) : null;
  put(box, chips, el('div', { class: 'help-list' }, cards), open);
  if (topic) setTimeout(() => $(`help-${topic}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}

// ---- Tabs and start -------------------------------------------------------------------------

let games = null;
function renderTabs() {
  for (const tab of TABS) {
    const b = $(`tab-${tab}`);
    b.setAttribute('aria-selected', String(state.tab === tab));
    b.querySelector('span').textContent = t(`tab_${tab}`);
    $(`panel-${tab}`).hidden = state.tab !== tab;
  }
}
function showTab(tab) {
  if (state.tab === 'games' && tab !== 'games') games?.stop();
  state.tab = tab;
  try {
    history.replaceState(null, '', tab === 'help' ? `#help=${state.help.app}${state.help.topic ? `:${state.help.topic}` : ''}` : `#${tab}`);
  } catch {}
  renderTabs();
  window.scrollTo({ top: 0 });
  refresh();
}
function refresh() {
  if (state.tab === 'home') renderHome();
  if (state.tab === 'words' && !(state.round && !state.round.answered && document.activeElement?.tagName === 'INPUT')) renderWords();
  if (state.tab === 'games') {
    games ||= mountGames($('panel-games'), gameContext);
    games.render();
  }
  if (state.tab === 'help') renderHelp();
  const s = $('status');
  if (s) s.textContent = state.wallet ? t('statusLine', { v: nt(earned().total) }) : '';
}
for (const b of document.querySelectorAll('#tabs .tab')) b.addEventListener('click', () => showTab(b.dataset.tab));

// What the games need from the app: text, money, today's room, the words,
// and paying a round.
const gameContext = {
  t,
  locale,
  nt,
  room: () => room('game'),
  words: () => {
    const seen = (state.words || []).filter(w => state.progress[w.key]?.b);
    const pool = seen.length >= 30 ? seen : (state.words || []).filter(w => state.levels.includes(w.level));
    return pool.map(w => ({ key: w.key, word: w.word, meaning: shortMeaning(w.zh).split('、')[0], level: w.level }));
  },
  pay(game, amount) {
    const paid = Math.max(0, Math.min(Math.round(amount), room('game')));
    act.game++;
    recordAffinity('vocab', ['vocab:games', `vocab:game:${game}`], 1);
    if (paid > 0) payEntry({ id: `vocab:g:${randomId()}`, t: Date.now(), app: 'vocab', kind: 'game', amount: paid, note: game });
    else sync();
    return paid;
  }
};

{
  const phone = matchMedia('(max-width: 720px)');
  const place = () => {
    if (phone.matches) $('mobile-bar').append($('status'), $('account-slot'));
    else {
      document.querySelector('.brand-text').append($('status'));
      document.querySelector('.appbar-inner').append($('account-slot'));
    }
  };
  place();
  phone.addEventListener('change', place);
}

window.__fxStarted = true;
const gated = installGate('vocab', locale);
watchUpdates({ current: VERSION, key: 'quadraRewards', cachePrefix: 'quadra-rewards-', busy: () => Boolean(state.round && !state.round.done) || Boolean(games?.busy()) });
renderTabs();
$('account-slot').append(accountButton(q));
q.on('wallet', w => {
  state.wallet = w;
  quietRefresh();
});
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
  const hash = location.hash.slice(1);
  const help = parseHelpHash(hash);
  if (help) {
    state.help = help;
    showTab('help');
  } else showTab(TABS.includes(hash) ? hash : 'home');
  // The pass gets the (possibly migrated) progress and anything left to send.
  if (first?.payload && !first.payload.startsWith('z3:')) dirty = true;
  await sync();
  for (const item of first?.inbox || []) q.dropInbox(item.id).catch(() => {});
}
if (!gated) boot();
setTimeout(() => ($('loading').hidden = true), 8000);
window.addEventListener('hashchange', () => {
  const help = parseHelpHash(location.hash);
  if (help) openHelp(help.app, help.topic);
});

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});
