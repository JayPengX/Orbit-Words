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
import { ico, tile, tag, hero, heroBtn, big, section, iconText } from './chrome.js';
import { speak, speakButton, prefetch } from '../audio.js';
import { LEVELS, pickRound, spread, toStudy, smartType, retryType, markKnown, makeQuestion, grade, sameWord, spellDiff, stateOf, shortMeaning, clozeText, keyOf, personalFactor, recordReview } from '../lib/words.mjs';
import { answerXp, xpText, logAnswer, logResult } from '../lib/practice.mjs';
import { openWord, starButton, missNote, tipBox, speltRow } from './sheet.js';

const buzz = () => globalThis.orbitHaptic?.();
export const busy = () => Boolean(state.session && !(state.session.kind === 'round' && state.session.done));
const end = () => ((state.session = null), hooks.sync(), hooks.render());

export function renderSession(box) {
  const s = state.session;
  if (s.kind === 'round') return renderRound(box, s);
  if (s.kind === 'study') return renderStudy(box, s);
  return renderFlash(box, s);
}

// The top of anything running: ✕ (ends it), how far along, and a number on the right.
function head(onClose, value, max, right, label = t('close')) {
  const close = el('button', { class: 'q-close', type: 'button', 'aria-label': label, onclick: onClose });
  close.innerHTML = ico('x');
  return el('div', { class: 'run-head' }, [close, el('div', { class: 'run-bar' }, [el('i', { style: `width:${max ? (Math.min(value, max) / max) * 100 : 0}%` })]), el('strong', { class: 'run-right num', text: right })]);
}

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
  // (Its answer moves once, on the drawing right after: a star tapped later redraws it still.)
  r.justAnswered = true;
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
  r.results.push({ word, correct, type: r.q.type, after: stateOf(res.p), pay, typed, mixed: other, mastered: res.firstMastery, check: r.check, unknown: typed === UNKNOWN, written: !r.q.choices, ms });
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

// The word as a card's headline: the word, its sound beside it, the line under it.
const wordHead = word => el('div', { class: 'card-word' }, [el('div', { class: 'word-line' }, [wordEl(word, 'big'), speakButton(word)]), el('small', { class: 'muted', text: metaLine(word) })]);
const meaningHead = (word, extra = '') => el('div', { class: 'card-word' }, [el('p', { class: 'meaning big', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: [word.pos, extra].filter(Boolean).join(' · ') })]);
const soundHead = (word, line) => el('div', { class: 'card-word' }, [speakButton(word, true), line]);

function questionView(r) {
  const { q: question } = r;
  const word = question.word;
  const done = r.answered;
  const last = done ? r.results.at(-1) : null;
  const just = done && r.justAnswered;
  r.justAnswered = false;
  // The question: one card (what's asked, then the word, the meaning or the sound), the answers under it.
  const card = el('div', { class: `q-card ask-card type-${question.type}` });
  const ask = el('p', { class: 'ask', text: t(`ask_${question.type}`) });
  let answers = null;
  if (question.choices) {
    put(card, ask, question.type === 'meaning' ? wordHead(word) : question.type === 'word' ? meaningHead(word) : soundHead(word, el('small', { class: 'muted', text: t('tapToHear') })));
    answers = el(
      'div',
      { class: `choices${question.type === 'meaning' ? ' long' : ''}` },
      question.choices.map((c, i) => {
        const cls = done ? (c.key === question.answer ? ' right' : last.typed === c.key ? ' wrong' : ' dim') : '';
        return el('button', { class: `choice${cls}`, type: 'button', disabled: done, onclick: () => answer(c.key === question.answer, c.key) }, [el('span', { class: 'choice-n num', text: String(i + 1) }), el('span', { class: `choice-text${question.type === 'meaning' ? '' : ' q-fit'}`, text: c.text })]);
      })
    );
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
    put(card, ask, meaningHead(word, t('letters', { n: word.word.replace(/\s/g, '').length })), slots);
    answers = el('div', { class: 'letters' }, [tiles, !done && built.length ? el('button', { class: 'q-btn small plain', type: 'button', text: t('undo'), onclick: () => ((r.built = built.slice(0, -1)), hooks.render()) }) : null]);
  } else {
    // Typed: a cloze (the word with letters missing) or dictation (heard).
    const cloze = question.type === 'cloze';
    const input = el('input', { class: 'spell-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', value: r.typed, disabled: done, 'aria-label': t(`ask_${question.type}`) });
    input.addEventListener('input', () => (r.typed = input.value));
    const top = cloze
      ? el('div', { class: 'card-word' }, [el('p', { class: 'cloze num q-fit', style: `--len:${word.word.length}`, text: clozeText(word.word, question.gaps) }), el('p', { class: 'meaning', text: shortMeaning(word.zh) }), el('small', { class: 'muted', text: word.pos })])
      : soundHead(word, el('p', { class: 'meaning', text: shortMeaning(word.zh) }));
    put(card, ask, top, cloze ? null : el('small', { class: 'muted', text: t('letters', { n: word.word.length }) }), done && !last.correct ? el('p', { class: 'diff-wrap q-fit', style: `--len:${Math.max(String(last.typed || '').length, word.word.length)}` }, [diffLine(spellDiff(last.typed, word.word))]) : null);
    answers = el('form', { class: 'spell-form', onsubmit: e => (e.preventDefault(), input.value.trim() && answer(sameWord(input.value, word.word), input.value)) }, [input, el('button', { class: 'q-btn primary', type: 'submit', disabled: done, text: t('check') })]);
  }
  if (!done) {
    // A new word's check: 不認識 rather than a guess (a lucky pick put an unknown word away for weeks).
    const unknown = r.check && question.choices ? el('button', { class: 'q-btn small plain', type: 'button', text: t('dontKnow'), onclick: () => answer(false, UNKNOWN) }) : null;
    return el('div', { class: 'question' }, [card, answers, el('div', { class: 'aside' }, [unknown, el('button', { class: 'q-btn small plain muted-btn', type: 'button', text: t('tooEasy'), onclick: tooEasy })])]);
  }
  return el('div', { class: `question answered${just ? ' just' : ''}` }, [card, answers, feedback(last)]);
}

// The verdict, under the answers: right or not, the points, the word in
// full, what it was taken for, the line to remember it by; 下一題 pinned.
function feedback(res) {
  const word = res.word;
  const r = state.session;
  const status = res.mastered ? t('fbMastered') : res.correct ? t('fbRight') : t('fbWrong');
  const next = el('button', { class: 'q-btn primary large block', type: 'button', text: r.i + 1 >= r.list.length ? t('seeResult') : t('next'), onclick: advance });
  setTimeout(() => next.focus({ preventScroll: true }), 0);
  return el('div', { class: `q-card verdict ${res.correct ? 'good' : 'bad'}` }, [
    el('div', { class: 'verdict-top' }, [tile(res.correct ? 'check' : 'x', res.correct ? 'var(--q-green)' : 'var(--q-red)', 'sm'), el('strong', { text: status }), res.pay ? el('small', { class: 'muted', text: xpText(res.pay, { sign: true }) }) : null, tag(t(`state_${res.after}`)), starButton(word, hooks.render)]),
    // The word's on screen already for a meaning question: its meaning only.
    res.type === 'meaning' ? null : el('div', { class: 'word-line' }, [wordEl(word, 'v-word'), speakButton(word)]),
    el('p', { class: 'meaning', text: word.zh }),
    // What it was mistaken for, side by side: the difference is the lesson.
    res.mixed ? el('button', { class: 'mixed', type: 'button', onclick: () => openWord(res.mixed) }, [el('small', { class: 'muted', text: t(res.written ? 'youWrote' : 'youPicked') }), el('strong', { text: res.mixed.word }), el('span', { class: 'muted', text: shortMeaning(res.mixed.zh) })]) : null,
    res.correct ? null : tipBox(word),
    el('div', { class: 'next-bar' }, [next])
  ]);
}

// The round's end: the score as the hero, then each word (a tap: its sheet).
function roundSummary(r) {
  const asked = r.results.filter(x => x.type !== 'known');
  const right = asked.filter(x => x.correct).length;
  const mastered = r.results.filter(x => x.mastered).length;
  const top = hero('target', t('roundDone'), null, [
    big(String(right), ` / ${asked.length}`),
    el('div', { class: 'hero-tags' }, [el('span', { class: 'hero-tag', text: xpText(r.earned, { sign: true }) }), mastered ? iconText('hero-tag', 'check', t('masteredN', { n: mastered })) : null]),
    el('div', { class: 'q-hc-row' }, [heroBtn(t('again'), () => startRound(), { icon: 'play' }), heroBtn(t('done'), end, { ghost: true })])
  ]);
  const rows = r.results.map(x =>
    el('button', { class: 'q-ritem chevron', type: 'button', onclick: () => openWord(x.word) }, [
      tile(x.correct ? 'check' : 'x', x.correct ? 'var(--q-green)' : 'var(--q-red)', 'sm'),
      el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: x.word.word }), el('small', { text: [shortMeaning(x.word.zh), x.mixed ? t('mixedWith', { words: x.mixed.word }) : ''].filter(Boolean).join(' · ') })]),
      el('small', { class: 'wr-side', text: t(`state_${x.after}`) })
    ])
  );
  return el('div', { class: 'round-end' }, [top, section(t('roundWords'), el('div', { class: 'q-rowcard results' }, rows))]);
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
  // (Enter on a focused button is that button's own press: the 下一題 button
  // has the focus after an answer, and taking Enter here too went on twice,
  // past the next question unasked.)
  if (s.answered && e.key === 'Enter' && !e.target.closest?.('button')) return advance();
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
// A card to learn from: the level and ★ on top, the word and its sound, the rest under.
const bigCard = (word, kids, props = {}) =>
  el('div', { class: 'q-card word-card', ...props }, [el('div', { class: 'card-top' }, [el('small', { class: 'muted', text: levelName(word.level) }), starButton(word, hooks.render)]), el('div', { class: 'card-word' }, [el('div', { class: 'word-line' }, [wordEl(word, 'big')]), el('small', { class: 'muted', text: [word.ph ? `/${word.ph}/` : '', word.pos].filter(Boolean).join(' · ') }), speakButton(word, true)]), ...kids]);
const navBtn = (icon, text, onclick, { primary = false, disabled = false, after = false } = {}) => {
  const i = el('i', { class: 'gl', 'aria-hidden': 'true' });
  i.innerHTML = ico(icon);
  return el('button', { class: `q-btn large${primary ? ' primary' : ''}`, type: 'button', disabled, onclick }, after ? [text, i] : [i, text]);
};
function renderStudy(box, s) {
  const word = s.list[s.i];
  const inBatch = Math.min(state.study.length, state.size);
  const card = bigCard(word, [el('p', { class: 'meaning full', text: word.zh }), tipBox(word)]);
  const nav = el('div', { class: 'card-nav' }, [navBtn('left', t('studyPrev'), () => studyStep(-1), { disabled: s.i === 0 }), navBtn('check', t('studyGot'), studyGot, { primary: true })]);
  put(box, head(() => ((state.session = null), hooks.render()), inBatch, state.size, `${inBatch} / ${state.size}`), card, nav, el('div', { class: 'aside' }, [el('button', { class: 'q-btn small plain muted-btn', type: 'button', text: t('tooEasy'), onclick: studyKnown })]));
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
  const why = missNote(word, p, { small: false });
  const back = s.flipped
    ? [
        el('p', { class: 'meaning full', text: word.zh }),
        (p?.x || []).length ? el('div', { class: 'spelt' }, [el('small', { class: 'muted', text: t('youSpelt') }), ...p.x.slice(0, 2).map(x => speltRow(x, word))]) : null,
        mixed.length ? el('div', { class: 'flash-mixed' }, [el('small', { class: 'muted', text: t('mixedYours') }), ...mixed.slice(0, 3).map(o => el('button', { class: 'mixed', type: 'button', onclick: e => (e.stopPropagation(), openWord(o)) }, [el('strong', { text: o.word }), el('span', { class: 'muted', text: shortMeaning(o.zh) })]))]) : null,
        tipBox(word)
      ]
    : [why ? el('div', { class: 'flash-why' }, [el('small', { class: 'muted', text: t('lastMiss') }), why]) : null, iconText('flip-hint', 'flip', t('tapToFlip'))];
  const card = bigCard(word, back, { class: `q-card word-card flash-card${s.flipped ? ' flipped' : ''}`, role: 'button', tabindex: '0', 'aria-label': t('tapToFlip') });
  swipeable(card);
  const all = s.seen.size >= s.deck.length;
  const nav = el('div', { class: 'card-nav' }, [navBtn('left', t('flashPrev'), () => flashStep(-1), { disabled: s.i === 0 }), navBtn('right', t('flashNext'), () => flashStep(1), { disabled: s.i + 1 >= s.deck.length, after: true })]);
  const test = el('button', { class: `q-btn large block flash-test${all ? ' primary' : ' tinted'}`, type: 'button', disabled: !all, text: all ? t('flashTest', { n: s.deck.length }) : t('flashSeeAll', { n: s.deck.length - s.seen.size }), onclick: () => startRound({ from: 'flash', list: s.deck }) });
  put(box, head(end, s.i + 1, s.deck.length, `${s.i + 1} / ${s.deck.length}`), card, nav, test);
}
