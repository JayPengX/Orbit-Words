// 拼字比賽: a timed practice paper (lib/contest.mjs): 聽英拼寫, then
// 詞彙題 (單題, then 題組 sets sharing a bank), on a clock, no answer shown
// until it's handed in; then the points, each part and every miss, side by
// side with the right word. Each answer is graded into the word's memory as
// any other (a test is practice too). One of 今天's modes: its card picks the
// paper's size (短卷, 標準, 長卷), shows the last and best of that size, and
// starts it.
import * as kitUI from '#kit/ui.mjs';
import { el, put, diffLine, pagedList, segmented } from '../ui.js';
import { state, t, hooks, settingsChanged } from '../shell.js';
import { hero, heroBtn, big, section, tile, iconText } from './chrome.js';
import { speak, speakButton, prefetch } from '../audio.js';
import { grade, recordReview, personalFactor, shortMeaning, spellDiff } from '../lib/words.mjs';
import { logAnswer, logResult } from '../lib/practice.mjs';
import { PART_IDS, PAPER_IDS, paperOf, totalOf, minutesOf, vocabSecondsOf, SPELL_SECONDS, makePaper, markSpelling, scorePaper, contestRow, mergeContests, contestStats } from '../lib/contest.mjs';
import { head, startRound } from './session.js';
import { openWord } from './sheet.js';

const buzz = () => globalThis.orbitHaptic?.();
const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

// ---- Its card on 今天 ---------------------------------------------------------------------

// The paper's size, kept with the settings (opt.paper).
const paperId = () => (PAPER_IDS.includes(state.opt.paper) ? state.opt.paper : 'full');
export function contestCard() {
  const id = paperId();
  const shape = paperOf(id);
  const st = contestStats(state.ct, totalOf(shape));
  const sizes = segmented(PAPER_IDS.map(p => ({ id: p, label: t(`paper_${p}`) })), id, p => ((state.opt = { ...state.opt, paper: p }), settingsChanged(), hooks.render()), 'paper-seg');
  return section(
    t('contestTitle'),
    el('div', { class: 'q-card contest-card' }, [
      el('p', { class: 'contest-intro muted', text: t('contestIntro') }),
      sizes,
      el('div', { class: 'contest-top' }, [
        el('strong', { class: 'num', text: t('contestShape', { s: shape.spell, v: shape.single + shape.group }) }),
        el('small', { class: 'muted num', text: [t('minutesN', { n: minutesOf(shape) }), t('pointsOf', { n: totalOf(shape) * 2 }), st ? t('contestScores', { last: st.last, best: st.best }) : ''].filter(Boolean).join(' · ') })
      ]),
      // (詞彙題's sentences are the examples, data/more.json, loaded just after the first screen.)
      el('button', { class: 'q-btn primary large block', type: 'button', disabled: !state.more.size, onclick: startContest }, [t('contestStart')])
    ])
  );
}

// ---- Running it ---------------------------------------------------------------------------

export function startContest() {
  const shape = paperOf(paperId());
  const paper = makePaper(state.words, state.progress, { shape, more: state.more });
  const items = [...paper.spell.map(word => ({ part: 'spell', word })), ...paper.single.map(q => ({ part: 'single', word: q.word, q })), ...paper.group.map(q => ({ part: 'group', word: q.word, q }))];
  state.session = { kind: 'contest', home: state.tab, shape, items, i: 0, answers: [], startedAt: Date.now(), typed: '', ui: null };
  showItem();
  tick();
}

let clock = 0;
let say = 0;
const stop = () => (clearInterval(clock), clearTimeout(say));
const live = () => state.session?.kind === 'contest' && !state.session.done ? state.session : null;

// The second hand: the heard word's seconds, then 詞彙題's clock; at
// zero the word is taken as written, or the paper is handed in.
function tick() {
  clearInterval(clock);
  clock = setInterval(() => {
    const s = live();
    if (!s) return clearInterval(clock);
    const left = secondsLeft(s);
    if (s.ui?.clock?.isConnected) s.ui.clock.textContent = mmss(left);
    if (s.ui?.timeBar?.isConnected) s.ui.timeBar.style.width = `${Math.max(0, (left / SPELL_SECONDS) * 100)}%`;
    if (left > 0) return;
    if (s.items[s.i].part === 'spell') submitSpelling();
    else handIn();
  }, 250);
}
function secondsLeft(s) {
  const now = Date.now();
  if (s.items[s.i]?.part === 'spell') return Math.ceil((s.shownAt + SPELL_SECONDS * 1000 - now) / 1000);
  s.vocabFrom ??= now;
  return Math.ceil((s.vocabFrom + vocabSecondsOf(s.shape) * 1000 - now) / 1000);
}

// A question shown: a heard word is said, and said again a moment later.
function showItem() {
  const s = live();
  if (!s) return;
  const item = s.items[s.i];
  s.shownAt = Date.now();
  clearTimeout(say);
  if (item.part === 'spell') {
    s.typed = '';
    speak(item.word);
    say = setTimeout(() => live() === s && s.items[s.i] === item && speak(item.word), 2600);
    prefetch(s.items[s.i + 1]?.part === 'spell' ? s.items[s.i + 1].word : null);
    // The heard part is drawn once and changed in place: the keyboard stays up.
    if (s.ui?.form?.isConnected) return paintSpelling(s);
  }
  hooks.render();
}

// One answer into the word's memory, the day's count and the paper.
function record(item, correct, { typed = '', chose = '' } = {}) {
  const s = live();
  const ms = Date.now() - s.shownAt;
  const word = item.word;
  const other = chose && chose !== word.key ? chose : null;
  const res = grade(state.progress[word.key], correct, { chose: other, typed: item.part === 'spell' ? typed : '', type: item.part === 'spell' ? 'spell' : 'word', ms, word: word.word, factor: personalFactor(state.cal) });
  state.cal = recordReview(state.cal, state.progress[word.key], correct);
  state.progress = { ...state.progress, [word.key]: res.p };
  state.days = logAnswer(state.days);
  state.log = logResult(state.log, correct, ms);
  s.answers.push({ part: item.part, set: item.q?.set, word, correct, typed, chose: chose || null, mark: item.part === 'spell' ? markSpelling(typed, word.word) : '' });
  hooks.changed();
  next();
}
function next() {
  const s = live();
  buzz();
  if (s.i + 1 >= s.items.length) return handIn(true);
  s.i++;
  showItem();
}
function submitSpelling() {
  const s = live();
  if (!s) return;
  const typed = s.ui?.input?.value ?? s.typed;
  record(s.items[s.i], markSpelling(typed, s.items[s.i].word.word) === 'right', { typed: typed.trim() });
}

// 交卷: what's left unanswered scores nothing (and isn't graded: not seen).
async function handIn(finished = false) {
  const s = live();
  if (!s) return;
  if (!finished && secondsLeft(s) > 0) {
    const left = s.items.length - s.answers.length;
    const ok = await kitUI.confirm({ icon: 'flag', title: t('handInAsk'), body: t('handInLeft', { n: left }), ok: t('handIn'), cancel: t('keepGoing') });
    if (!ok || live() !== s) return;
  }
  stop();
  for (const item of s.items.slice(s.answers.length)) s.answers.push({ part: item.part, word: item.word, correct: false, typed: '', blank: true, mark: item.part === 'spell' ? 'blank' : '' });
  s.score = scorePaper(s.answers, s.shape);
  s.seconds = (Date.now() - s.startedAt) / 1000;
  s.done = true;
  state.ct = mergeContests([contestRow({ at: s.startedAt, score: s.score, seconds: s.seconds })], state.ct);
  hooks.changed();
  hooks.sync();
  hooks.render();
}

// ---- Drawing ------------------------------------------------------------------------------

export function renderContest(box, s) {
  if (s.done) return put(box, results(s));
  const item = s.items[s.i];
  const top = head(() => handIn(), s.i, s.items.length, '', t('handIn'));
  const clockText = top.querySelector('.run-right');
  const label = el('div', { class: 'contest-part' }, [el('strong', { text: t(`part_${item.part}`) }), el('small', { class: 'muted num', text: whereText(s) })]);
  s.ui = { clock: clockText };
  clockText.textContent = mmss(secondsLeft(s));
  if (item.part === 'spell') return put(box, top, label, spellingView(s, label));
  put(box, top, label, choiceView(s, item));
}

function spellingView(s, label) {
  const input = el('input', { class: 'spell-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', 'aria-label': t('part_spell') });
  input.addEventListener('input', () => (s.typed = input.value));
  const timeBar = el('i');
  const replay = el('div', { class: 'contest-say' });
  const form = el('form', { class: 'spell-form', onsubmit: e => (e.preventDefault(), submitSpelling()) }, [input, el('button', { class: 'q-btn primary', type: 'submit', text: t('next') })]);
  Object.assign(s.ui, { input, timeBar, replay, form, label });
  paintSpelling(s);
  setTimeout(() => input.focus({ preventScroll: true }), 0);
  return el('div', { class: 'question' }, [el('div', { class: 'q-card ask-card contest-ask' }, [el('p', { class: 'ask', text: t('ask_spell') }), replay, el('small', { class: 'muted', text: t('saidTwice') }), el('div', { class: 'contest-time' }, [timeBar])]), form]);
}
// The heard part, on to its next word: the same input (the keyboard stays), emptied.
function paintSpelling(s) {
  const item = s.items[s.i];
  const { input, replay, label, timeBar, clock } = s.ui;
  input.value = '';
  replay.replaceChildren(speakButton(item.word, true));
  label.querySelector('small').textContent = whereText(s);
  timeBar.style.width = '100%';
  clock.textContent = mmss(SPELL_SECONDS);
  const bar = clock.closest('.run-head')?.querySelector('.run-bar > i');
  if (bar) bar.style.width = `${(s.i / s.items.length) * 100}%`;
}

// Where in the paper: 12 / 50 in the heard part; 33 / 50 in 詞彙題 (a set: its number too).
function whereText(s) {
  const item = s.items[s.i];
  const heard = item.part === 'spell';
  const n = s.items.slice(0, s.i).filter(x => (x.part === 'spell') === heard).length + 1;
  const of = `${n} / ${heard ? s.shape.spell : s.shape.single + s.shape.group}`;
  return item.part === 'group' ? `${t('setN', { n: item.q.set + 1 })} · ${of}` : of;
}

// 詞彙題: the sentence with its blank, then four options (單題) or the set's bank (題組, the words used dimmed).
function choiceView(s, item) {
  const q = item.q;
  const card = el('div', { class: 'q-card ask-card contest-ask' }, [el('p', { class: 'ask', text: t(`ask_${item.part}`) }), el('p', { lang: 'en', class: 'contest-sentence' }, [q.before, el('span', { class: 'blank', text: '   ' }), q.after])]);
  let options;
  if (item.part === 'group') {
    const taken = new Set(s.answers.filter(a => a.set === q.set && a.chose).map(a => a.chose));
    options = el('div', { class: 'bank' }, q.bank.map(o => el('button', { class: `choice${taken.has(o.key) ? ' dim' : ''}`, type: 'button', lang: 'en', onclick: () => record(item, o.key === item.word.key, { chose: o.key }) }, [o.text])));
  } else {
    options = el(
      'div',
      { class: 'choices' },
      q.choices.map((c, i) => el('button', { class: 'choice', type: 'button', onclick: () => record(item, c.key === item.word.key, { chose: c.key }) }, [el('span', { class: 'choice-n num', text: 'ABCD'[i] }), el('span', { lang: 'en', class: 'choice-text', text: c.text })]))
    );
  }
  return el('div', { class: 'question' }, [card, options]);
}

// The paper handed in: the total as the hero, each part, then every miss.
function results(s) {
  const sc = s.score;
  const missed = s.answers.filter(a => !a.correct);
  const top = hero('trophy', t('contestDone'), null, [
    big(String(sc.points), ` / ${sc.max}`),
    el('div', { class: 'hero-tags' }, [iconText('hero-tag', 'clock', t('timeTaken', { t: mmss(Math.round(s.seconds)) }))]),
    el('div', { class: 'q-hc-row' }, [missed.length ? heroBtn(t('practiseMissed'), () => startRound({ list: [...new Map(missed.map(a => [a.word.key, a.word])).values()].slice(0, 30) }), { icon: 'play' }) : null, heroBtn(t('done'), () => ((state.session = null), hooks.render()), { ghost: !!missed.length })])
  ]);
  const parts = el(
    'div',
    { class: 'q-rowcard' },
    PART_IDS.filter(id => sc[id].n).map(id => el('div', { class: 'q-ritem' }, [el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: t(`part_${id}`) })]), el('span', { class: 'q-ritem-value num', text: `${sc[id].right} / ${sc[id].n}` })]))
  );
  // (Drawn a page at a time: a first try can miss most of 100.)
  const rows = missed.map(a => () => {
    let note;
    if (a.blank || (a.part === 'spell' && !a.typed)) note = el('small', { class: 'muted', text: t('notAnswered') });
    else if (a.part === 'spell') note = el('small', { class: 'miss-note' }, [el('span', { class: 'miss-tag', text: t(a.mark === 'caps' ? 'capsRule' : 'missSpelt') }), diffLine(spellDiff(a.typed, a.word.word), 'small q-fit')]);
    else {
      const other = state.byKey.get(a.chose);
      note = el('small', { class: 'miss-note' }, [el('span', { class: 'miss-tag', text: t('missMixed') }), el('strong', { lang: 'en', text: other?.word || '' }), el('span', { lang: 'zh-Hant', class: 'muted miss-mean', text: ` ${other ? shortMeaning(other.zh) : ''}` })]);
    }
    return el('button', { class: 'q-ritem chevron', type: 'button', onclick: () => openWord(a.word) }, [
      tile(a.blank ? 'clock' : 'x', a.blank ? 'var(--q-label-2)' : 'var(--q-red)', 'sm'),
      el('span', { class: 'q-ritem-text' }, [el('span', { lang: 'en', class: 'q-ritem-title', text: a.word.word }), el('small', { lang: 'zh-Hant', class: 'muted', text: shortMeaning(a.word.zh) }), note]),
      el('small', { class: 'wr-side', text: t(`partShort_${a.part}`) })
    ]);
  });
  return el('div', { class: 'round-end' }, [top, section(t('byPart'), parts), rows.length ? section(t('missedN', { n: rows.length }), pagedList(rows, row => row(), { cls: 'q-rowcard results', more: t('showMore') })) : null]);
}
