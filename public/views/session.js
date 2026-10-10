// What runs over a tab: a round of questions, studying new words as cards,
// and flash cards to review a list. Each lives in state.session and is
// drawn in the tab it started from (`home`); the tab bar stays.
//
//   round   questions on a list of words, each graded by the memory model
//           (lib/words.mjs); a word missed comes back at the end, written.
//   study   new words one card at a time (word, sound, meaning, a line to
//           remember it by); a full batch unlocks a quiz on just those.
//   flash   cards to flip through (a review category or bookmarks), swiped
//           or tapped; looking doesn't count, the test on the deck after does.
import { el, put, toast, diffLine } from '../ui.js';
import { state, t, hooks, hintOf, metaLine, levelName, wordEl } from '../shell.js';
import { speak, speakButton, prefetch } from '../audio.js';
import { LEVELS, pickRound, spread, toStudy, smartType, retryType, markKnown, makeQuestion, grade, sameWord, spellDiff, stateOf, shortMeaning, clozeText, keyOf, personalFactor, recordReview } from '../lib/words.mjs';
import { answerXp, xpText, logAnswer, logResult } from '../lib/practice.mjs';
import { openWord, starButton, missNote } from './sheet.js';

const buzz = () => globalThis.quadraHaptic?.();
export const busy = () => Boolean(state.session && !(state.session.kind === 'round' && state.session.done));
const end = () => ((state.session = null), hooks.sync(), hooks.render());

export function renderSession(box) {
  const s = state.session;
  if (s.kind === 'round') return renderRound(box, s);
  if (s.kind === 'study') return renderStudy(box, s);
  return renderFlash(box, s);
}

const head = (onClose, value, max, right, label = t('close')) =>
  el('div', { class: 'round-head' }, [
    el('button', { class: 'q-close', type: 'button', 'aria-label': label, text: '×', onclick: onClose }),
    el('div', { class: 'round-bar' }, [el('i', { style: `width:${max ? (Math.min(value, max) / max) * 100 : 0}%` })]),
    el('strong', { class: 'num round-earn', text: right })
  ]);
const tipBox = word => {
  const tip = hintOf(word.key)?.tip;
  return tip ? el('div', { class: 'tip' }, [el('small', { class: 'tip-label', text: t('tipLabel') }), el('p', { text: tip })]) : null;
};

// ---- A round ---------------------------------------------------------------------------
//
// `list`: given words (a flash deck's test), else the usual round.
// `from`: 'study' (the studied batch), 'flash' (a deck), or none.
export function startRound({ from = null, list = null } = {}) {
  let words;
  if (from === 'study') words = pickRound(state.study.map(k => state.byKey.get(k)).filter(Boolean), {}, { levels: LEVELS, size: state.study.length });
  // A deck in its own order, shuffled, look-alikes apart (spread).
  else if (list) words = spread([...list].sort(() => Math.random() - 0.5));
  else words = pickRound(state.words, state.progress, { levels: state.levels, size: state.size, skip: new Set(state.study), factor: personalFactor(state.cal) });
  if (!words.length) return toast(t('nothingLeft'));
  state.session = { kind: 'round', home: state.tab, list: words, i: 0, results: [], earned: 0, q: null, answered: false, from };
  nextQuestion();
}
function nextQuestion() {
  const r = state.session;
  const word = r.list[r.i];
  const used = {};
  for (const x of r.results) used[x.type] = (used[x.type] || 0) + 1;
  const p = state.progress[word.key];
  // A new word in a round (not a batch just studied or a deck) is checked
  // first: its meaning picked from four, 不認識 beside them (no guessing).
  // At a glance it's known and out of the way for weeks; only what's missed
  // or slow is learnt. (It was a cloze with half its letters gone: a word
  // known well but not spelt from memory failed, and took the longest.)
  r.check = !r.from && !p?.b && !r.retry?.has(word.key) && ['smart', 'cloze', 'spell'].includes(state.mode);
  // A word missed this round comes back the other way round (retryType): picked wrong, from the other side; misspelt, dictated.
  const type = r.retry?.has(word.key) ? retryType(r.retry.get(word.key), word) : r.check && state.mode === 'smart' ? 'meaning' : state.mode === 'smart' ? smartType(p, Math.random, word, used) : state.mode;
  r.q = makeQuestion(word, type, state.words, { p, common: hintOf(word.key)?.common || [] });
  r.answered = false;
  r.typed = '';
  r.built = [];
  r.shownAt = Date.now();
  hooks.render();
  // Only when the question is the sound (by ear, dictation): straight away,
  // inside the tap that led here (iOS plays sound only then). Else 🔊 plays it.
  if (['listen', 'spell'].includes(type)) speak(word);
  prefetch(r.list[r.i + 1]);
}

// One answer: graded, logged for the day, and a mix-up remembered both ways
// (a wrong choice, or a typed word that's another word on the list); a
// wrong spelling that's no word is kept to show where it goes wrong.
const UNKNOWN = '\u0000unknown';
function answer(correct, typed = '') {
  const r = state.session;
  if (!r || r.kind !== 'round' || r.answered) return;
  r.answered = true;
  buzz();
  const word = r.q.word;
  const ms = Date.now() - r.shownAt;
  const other = !correct && typed && typed !== UNKNOWN && keyOf(typed) !== word.key ? state.byKey.get(keyOf(typed)) || null : null;
  const spelt = !correct && !other && !r.q.choices && typed !== UNKNOWN ? typed : '';
  // How long it took counts: a quick right answer is known better than a slow one.
  const how = typed === UNKNOWN ? 'u' : '';
  const res = grade(state.progress[word.key], correct, { chose: other?.key, typed: spelt, type: r.q.type, ms, word: word.word, check: r.check, factor: personalFactor(state.cal), how });
  state.cal = recordReview(state.cal, state.progress[word.key], correct);
  state.progress = { ...state.progress, [word.key]: res.p };
  if (other) {
    const o = state.progress[other.key] || { b: 0, d: 0, n: 0, r: 0, t: 0 };
    state.progress = { ...state.progress, [other.key]: { ...o, c: [word.key, ...(o.c || []).filter(k => k !== word.key)].slice(0, 4) } };
  }
  state.days = logAnswer(state.days);
  state.log = logResult(state.log, correct, ms);
  const pay = answerXp({ correct, firstMastery: res.firstMastery });
  r.earned += pay;
  r.results.push({ word, correct, type: r.q.type, after: stateOf(res.p), pay, typed, mixed: other, mastered: res.firstMastery, check: r.check, unknown: typed === UNKNOWN, ms });
  // A missed word comes back once at the end of the round, to fix it while it's fresh.
  if (!correct && !r.retry?.has(word.key)) {
    r.retry ||= new Map();
    r.retry.set(word.key, r.q.type);
    r.list = [...r.list, word];
  }
  hooks.changed();
  hooks.render();
}
// 太簡單: the word is known; it's put away and the round moves on.
function tooEasy() {
  const r = state.session;
  if (!r || r.answered) return;
  const word = r.q.word;
  state.progress = { ...state.progress, [word.key]: markKnown(state.progress[word.key]) };
  r.results.push({ word, correct: true, type: 'known', after: 'mastered', pay: 0, typed: '' });
  r.list = [...r.list.slice(0, r.i + 1), ...r.list.slice(r.i + 1).filter(w => w.key !== word.key)];
  hooks.changed();
  advance();
}
export function advance() {
  const r = state.session;
  if (!r || r.kind !== 'round') return;
  if (r.i + 1 >= r.list.length) {
    r.done = true;
    // The batch is quizzed: from now on its words are scheduled like any other.
    if (r.from === 'study') {
      const asked = new Set(r.list.map(w => w.key));
      state.study = state.study.filter(k => !asked.has(k));
      hooks.changed();
    }
    hooks.sync();
    return hooks.render();
  }
  r.i++;
  nextQuestion();
}

function renderRound(box, r) {
  if (r.done) return put(box, roundSummary(r));
  put(box, head(end, r.i, r.list.length, xpText(r.earned, { sign: true }), t('endRound')), questionView(r));
  box.querySelector('input')?.focus({ preventScroll: true });
}

function wordHead(word, { meaning = false } = {}) {
  return el('div', { class: 'word-head' }, [el('div', { class: 'word-line' }, [wordEl(word), speakButton(word)]), el('small', { class: 'muted', text: metaLine(word) }), meaning ? el('p', { class: 'meaning', text: word.zh }) : null]);
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
    // A new word's check: 不認識 rather than a guess (a lucky pick put an unknown word away for weeks).
    const unknown = r.check && !done ? el('button', { class: 'q-btn small ghost unknown-btn', type: 'button', text: t('dontKnow'), onclick: () => answer(false, UNKNOWN) }) : null;
    put(card, prompt, top, choices, unknown);
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
            else hooks.render();
          }
        })
      )
    );
    // The meaning only: hearing it would make it dictation with the letters given.
    put(card, prompt, meaningHead(word, t('letters', { n: word.word.replace(/\s/g, '').length })), slots, tiles, !done && built.length ? el('button', { class: 'q-btn small ghost', type: 'button', text: t('undo'), onclick: () => ((r.built = built.slice(0, -1)), hooks.render()) }) : null);
  } else {
    // Typed: a cloze (the word with letters missing) or dictation (heard).
    const cloze = question.type === 'cloze';
    const input = el('input', { class: 'spell-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', value: r.typed, disabled: done, 'aria-label': t(`ask_${question.type}`) });
    input.addEventListener('input', () => (r.typed = input.value));
    const form = el('form', { class: 'spell-form', onsubmit: e => (e.preventDefault(), input.value.trim() && answer(sameWord(input.value, word.word), input.value)) }, [input, el('button', { class: 'q-btn primary', type: 'submit', disabled: done, text: t('check') })]);
    const top = cloze
      ? el('div', { class: 'word-head center' }, [el('p', { class: 'cloze num', text: clozeText(word.word, question.gaps) }), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: word.pos })])
      : el('div', { class: 'word-head center' }, [speakButton(word, true), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: t('letters', { n: word.word.length }) })]);
    put(card, prompt, top, form, done && !last.correct ? el('p', { class: 'diff-wrap' }, [diffLine(spellDiff(last.typed, word.word))]) : null);
  }
  if (!done) return el('div', {}, [card, el('button', { class: 'q-btn small ghost too-easy', type: 'button', text: t('tooEasy'), onclick: tooEasy })]);
  return el('div', { class: 'answered' }, [card, feedback(last)]);
}

function feedback(res) {
  const word = res.word;
  const r = state.session;
  const status = res.mastered ? t('fbMastered') : res.correct ? t('fbRight') : t('fbWrong');
  const next = el('button', { class: 'q-btn primary block', type: 'button', text: r.i + 1 >= r.list.length ? t('seeResult') : t('next'), onclick: advance });
  setTimeout(() => next.focus({ preventScroll: true }), 0);
  return el('div', { class: `q-card pad feedback ${res.correct ? 'good' : 'bad'}` }, [
    el('div', { class: 'fb-top' }, [el('strong', { text: status }), el('div', { class: 'fb-right' }, [res.pay ? el('span', { class: 'fb-pay num', text: xpText(res.pay, { sign: true }) }) : null, starButton(word, hooks.render)])]),
    // The word's on screen already for a meaning question: its meaning only.
    res.type === 'meaning' ? el('p', { class: 'meaning', text: word.zh }) : wordHead(word, { meaning: true }),
    // What it was mistaken for, side by side: the difference is the lesson.
    res.mixed ? el('div', { class: 'mixed' }, [el('small', { class: 'muted', text: t('youPicked') }), el('div', { class: 'word-line' }, [el('strong', { text: res.mixed.word }), speakButton(res.mixed)]), el('small', { class: 'muted', text: shortMeaning(res.mixed.zh) })]) : null,
    // A line to remember it by, when it was missed.
    res.correct ? null : tipBox(word),
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
      el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('done'), onclick: end }), el('button', { class: 'q-btn primary', type: 'button', text: t('again'), onclick: () => startRound() })])
    ]),
    el(
      'div',
      { class: 'q-card list result-list' },
      r.results.map(x =>
        el('button', { class: 'result-row', type: 'button', onclick: () => openWord(x.word) }, [
          el('span', { class: `dot ${x.correct ? 'good' : 'bad'}`, text: x.correct ? '✓' : '✗' }),
          el('div', {}, [el('strong', { text: x.word.word }), el('small', { class: 'muted', text: [shortMeaning(x.word.zh), x.mixed ? t('mixedWith', { words: x.mixed.word }) : ''].filter(Boolean).join(' · ') })]),
          el('small', { class: `pill ${x.after}`, text: t(`state_${x.after}`) })
        ])
      )
    )
  ]);
}

// Keys 1-4 pick a choice, Enter goes on; in flash cards, the arrows move and
// the space bar flips.
document.addEventListener('keydown', e => {
  const s = state.session;
  if (!s || e.target.tagName === 'INPUT' || document.querySelector('dialog[open]')) return;
  if (s.kind === 'flash') {
    if (e.key === 'ArrowRight') flashStep(1);
    else if (e.key === 'ArrowLeft') flashStep(-1);
    else if (e.key === ' ') (e.preventDefault(), flip());
    return;
  }
  if (s.kind !== 'round' || s.done) return;
  if (s.answered && e.key === 'Enter') return advance();
  const i = Number(e.key) - 1;
  if (!s.answered && s.q.choices && i >= 0 && i < s.q.choices.length) answer(s.q.choices[i].key === s.q.answer, s.q.choices[i].key);
});

// ---- Studying new words -------------------------------------------------------------------
//
// New words as cards to memorise (the word, its sound, its meaning), one
// batch (a round's size) at a time; a full batch is quizzed, and from the
// quiz on its words are scheduled like any other.
export function startStudy() {
  const list = toStudy(state.words, state.progress, { levels: state.levels, n: Math.max(0, state.size - state.study.length), skip: new Set(state.study) });
  if (!list.length) return toast(t('studyNone'));
  state.session = { kind: 'study', home: state.tab, list, i: 0 };
  hooks.render();
  speak(list[0]);
  prefetch(list[1]);
}
function studyStep(delta) {
  const s = state.session;
  s.i = Math.max(0, Math.min(s.list.length - 1, s.i + delta));
  hooks.render();
  speak(s.list[s.i]);
  prefetch(s.list[s.i + 1]);
}
// 記住了: into the batch; the last one ends the session.
function studyGot() {
  const s = state.session;
  const word = s.list[s.i];
  buzz();
  if (!state.study.includes(word.key)) state.study = [...state.study, word.key];
  hooks.changed();
  if (s.i + 1 >= s.list.length || state.study.length >= state.size) {
    state.session = null;
    hooks.render();
    return toast(state.study.length >= state.size ? t('studyReady') : t('studySaved'), 'good');
  }
  studyStep(1);
}
// 太簡單: known already, out of the way; not in the batch.
function studyKnown() {
  const s = state.session;
  const word = s.list[s.i];
  state.progress = { ...state.progress, [word.key]: markKnown(state.progress[word.key]) };
  state.study = state.study.filter(k => k !== word.key);
  s.list = s.list.filter(w => w.key !== word.key);
  hooks.changed();
  if (!s.list.length) {
    state.session = null;
    return hooks.render();
  }
  s.i = Math.min(s.i, s.list.length - 1);
  hooks.render();
  speak(s.list[s.i]);
}
function renderStudy(box, s) {
  const word = s.list[s.i];
  const inBatch = Math.min(state.study.length, state.size);
  const card = el('div', { class: 'q-card pad study-word' }, [
    el('div', { class: 'card-corner' }, [starButton(word, hooks.render)]),
    el('div', { class: 'word-line' }, [wordEl(word, true), speakButton(word, true)]),
    el('small', { class: 'muted', text: metaLine(word) }),
    el('p', { class: 'meaning study-meaning', text: word.zh }),
    tipBox(word)
  ]);
  const nav = el('div', { class: 'two-btn study-nav' }, [
    el('button', { class: 'q-btn', type: 'button', disabled: s.i === 0, text: `‹ ${t('studyPrev')}`, onclick: () => studyStep(-1) }),
    el('button', { class: 'q-btn primary', type: 'button', text: `${t('studyGot')} ›`, onclick: studyGot })
  ]);
  put(box, head(() => ((state.session = null), hooks.render()), inBatch, state.size, `${inBatch} / ${state.size}`), card, nav, el('button', { class: 'q-btn small ghost too-easy', type: 'button', text: t('tooEasy'), onclick: studyKnown }));
}

// ---- Flash cards --------------------------------------------------------------------------
//
// A deck to flip through: the word and its sound on the front; a tap turns
// it over (the meaning, a line to remember it by, how it was misspelt, what
// it's mixed up with). Swipe or ‹ › to move. Looking at cards changes no
// word's schedule: once every card has been seen, the deck can be tested
// (a round on just these words), and that does.
export function startFlash(deck, label = '') {
  if (!deck.length) return toast(t('flashEmpty'));
  state.session = { kind: 'flash', home: state.tab, deck, i: 0, flipped: false, seen: new Set([deck[0].key]), label };
  hooks.render();
  speak(deck[0]);
  prefetch(deck[1]);
}
function flashStep(delta) {
  const s = state.session;
  const i = Math.max(0, Math.min(s.deck.length - 1, s.i + delta));
  if (i === s.i) return;
  buzz();
  s.i = i;
  s.flipped = false;
  s.seen.add(s.deck[i].key);
  hooks.render();
  speak(s.deck[i]);
  prefetch(s.deck[i + 1]);
}
function flip() {
  const s = state.session;
  s.flipped = !s.flipped;
  buzz();
  hooks.render();
}
// A sideways swipe on the card moves; a tap flips it.
function swipeable(card) {
  let x0 = null;
  let y0 = 0;
  card.addEventListener('pointerdown', e => ((x0 = e.clientX), (y0 = e.clientY)));
  card.addEventListener('pointerup', e => {
    if (x0 == null) return;
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    x0 = null;
    if (e.target.closest('button')) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) flashStep(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) flip();
  });
  card.addEventListener('pointercancel', () => (x0 = null));
}
function renderFlash(box, s) {
  const word = s.deck[s.i];
  const p = state.progress[word.key];
  // Its back: the meaning, then everything about how it's gone wrong (each
  // misspelling and where it differs, each word it was taken for with that
  // word's meaning, a tap to it), and the line to remember it by. Its front:
  // how it went wrong last time (so the card says why it's in the deck).
  const mixed = (p?.c || []).map(k => state.byKey.get(k)).filter(Boolean);
  const back = s.flipped
    ? [
        el('p', { class: 'meaning study-meaning', text: word.zh }),
        (p?.x || []).length ? el('div', { class: 'spelt center' }, [el('small', { class: 'muted', text: t('youSpelt') }), ...p.x.slice(0, 2).map(x => el('div', { class: 'spelt-row' }, [el('s', { class: 'muted', text: x }), el('span', { class: 'muted', text: '→' }), diffLine(spellDiff(x, word.word))]))]) : null,
        mixed.length ? el('div', { class: 'flash-mixed' }, [el('small', { class: 'muted', text: t('mixedYours') }), ...mixed.slice(0, 3).map(o => el('button', { class: 'mixed-row', type: 'button', onclick: e => (e.stopPropagation(), openWord(o)) }, [el('strong', { text: o.word }), el('span', { class: 'muted', text: shortMeaning(o.zh) })]))]) : null,
        tipBox(word)
      ]
    : [missNote(word, p, { small: false }) ? el('div', { class: 'flash-why' }, [el('small', { class: 'muted', text: t('lastMiss') }), missNote(word, p, { small: false })]) : null, el('small', { class: 'flip-hint muted', text: t('tapToFlip') })];
  const card = el('div', { class: `q-card pad study-word flash-card${s.flipped ? ' flipped' : ''}`, role: 'button', tabindex: '0', 'aria-label': t('tapToFlip') }, [
    el('div', { class: 'card-corner' }, [el('small', { class: 'pill', text: levelName(word.level) }), starButton(word, hooks.render)]),
    el('div', { class: 'word-line' }, [wordEl(word, true), speakButton(word, true)]),
    el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos].filter(Boolean).join(' · ') }),
    ...back
  ]);
  swipeable(card);
  const all = s.seen.size >= s.deck.length;
  const nav = el('div', { class: 'two-btn study-nav' }, [
    el('button', { class: 'q-btn', type: 'button', disabled: s.i === 0, text: `‹ ${t('flashPrev')}`, onclick: () => flashStep(-1) }),
    el('button', { class: 'q-btn', type: 'button', disabled: s.i + 1 >= s.deck.length, text: `${t('flashNext')} ›`, onclick: () => flashStep(1) })
  ]);
  const test = el('button', { class: `q-btn block${all ? ' primary' : ''}`, type: 'button', disabled: !all, text: t('flashTest', { n: s.deck.length }), onclick: () => startRound({ from: 'flash', list: s.deck }) });
  put(box, head(end, s.i + 1, s.deck.length, `${s.i + 1} / ${s.deck.length}`), card, nav, el('div', { class: 'flash-test' }, [test, el('small', { class: 'muted', text: all ? t('flashTestHint') : t('flashSeeAll', { n: s.deck.length - s.seen.size }) })]));
}
