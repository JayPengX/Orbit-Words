// 今天, the home: the day's goal and the round (the hero; its pill opens the
// round's choices), then what else there is to do (new words as cards, the
// weak words, the missed words as flash cards), and the word of the day.
import { el, put } from '../ui.js';
import { pageHead, dayLine, hero, heroPill, heroBtn, big, bar, iconText, section, row, rowCard, tag } from './chrome.js';
import { state, t, hooks, hintOf, metaLine, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { LEVELS, stats, toStudy, stateOf, shortMeaning, wordOfDay } from '../lib/words.mjs';
import { DAILY_GOAL, todayCount, goalStatus, streakOf } from '../lib/practice.mjs';
import { catCounts, flashDeck, recentMisses } from '../lib/review.mjs';
import { startRound, startStudy, startFlash } from './session.js';
import { openWord, starButton } from './sheet.js';
import { openPrefs, levelsText } from './prefs.js';

export function renderToday(box) {
  put(box, pageHead('Orbit Words', dayLine()), goalHero(), section(t('practiceTitle'), rowCard([studyRow(), weakRow(), missedRow()])), wordOfDayCard());
}

// The goal: today's answers of 20, the streak they keep, and the round.
function goalHero() {
  const today = todayCount(state.days);
  const streak = streakOf(state.days);
  const { left, keeps } = goalStatus(state.days);
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const st = stats(state.words, state.progress);
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  return hero('target', t('goalTitle'), heroPill('sliders', chosen.length ? levelsText(chosen) : t('pickLevel'), openPrefs, t('prefsTitle')), [
    big(String(Math.min(today, DAILY_GOAL)), ` / ${DAILY_GOAL}`),
    bar(today, DAILY_GOAL, 'hero-bar'),
    el('div', { class: 'hero-tags' }, [iconText('hero-tag', 'flame', t('daysN', { n: streak })), el('span', { class: 'hero-note', text: !left ? t('goalDone') : keeps ? t('goalKeep', { n: left }) : t('goalLeft', { n: left }) })]),
    el('div', { class: 'q-hc-row' }, [heroBtn(due ? t('startDue', { n: Math.min(due, state.size) }) : t('startRound', { n: state.size }), () => startRound(), { disabled: !chosen.length, icon: 'play' })])
  ]);
}

// New words as cards, a batch at a time; a full batch is quizzed.
function studyRow() {
  const n = state.study.length;
  const full = n >= state.size;
  const next = toStudy(state.words, state.progress, { levels: state.levels, n: 1, skip: new Set(state.study) }).length > 0;
  return row({
    icon: 'pencil',
    color: 'var(--q-accent)',
    title: full ? t('studyQuiz', { n }) : t('studyTitle'),
    body: full ? null : bar(n, state.size, 'mini-bar'),
    tags: full ? [tag(t('studyReady'), 'green')] : !next ? [tag(t('studyNone'))] : null,
    value: full ? '' : `${n} / ${state.size}`,
    disabled: !full && (!next || !state.levels.length),
    onClick: full ? () => startRound({ from: 'study' }) : startStudy
  });
}

// What was missed in the last 3 days, asked again now.
function weakRow() {
  const list = recentMisses(state.words, state.progress, { n: state.size });
  if (!list.length) return null;
  return row({ icon: 'target', color: 'var(--q-red)', title: t('weakTitle'), tags: [tag(t('lastDays3'), 'red')], value: list.length, onClick: () => startRound({ list }) });
}

// The words missed last time, as flash cards first.
function missedRow() {
  const n = catCounts(state.words, state.progress, { marks: state.marks }).wrong;
  if (!n) return null;
  return row({ icon: 'cards', color: 'var(--q-indigo)', title: t('missedTitle'), value: n, onClick: () => startFlash(flashDeck(state.words, state.progress, 'wrong', { n: 20, marks: state.marks }), t('cat_wrong')) });
}

// The same word for everyone today; a tap opens its sheet.
function wordOfDayCard() {
  const w = wordOfDay(state.words);
  if (!w) return null;
  const tip = hintOf(w.key)?.tip;
  const st = stateOf(state.progress[w.key]);
  return section(
    t('wotd'),
    el('div', { class: 'q-ambient wotd q-press', role: 'button', tabindex: '0', onclick: e => !e.target.closest('button') && openWord(w) }, [
      el('div', { class: 'card-top' }, [tag(t(`state_${st}`), st === 'mastered' ? 'green' : st === 'new' ? '' : 'tint'), starButton(w, hooks.render)]),
      el('div', { class: 'word-line' }, [wordEl(w), speakButton(w)]),
      el('small', { class: 'muted', text: metaLine(w) }),
      el('p', { class: 'meaning', text: shortMeaning(w.zh) }),
      tip ? el('p', { class: 'tip-line', text: tip }) : null
    ])
  );
}
