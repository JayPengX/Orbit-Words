// 今天: the day's goal and streak, what's waiting (due, missed, new) with a
// round a tap away, studying new words, the missed words as flash cards,
// and the word of the day.
import { el, put, section, bar, segmented } from '../ui.js';
import { state, t, hooks, locale, levelName, joined, hintOf, metaLine, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { LEVELS, stats, toStudy, stateOf, shortMeaning, wordOfDay } from '../lib/words.mjs';
import { xpOf, xpText, levelOf, DAILY_GOAL, todayCount, streakOf, bestStreak, lastDays } from '../lib/practice.mjs';
import { catCounts, flashDeck } from '../lib/review.mjs';
import { startRound, startStudy, startFlash } from './session.js';
import { openWord, starButton } from './sheet.js';

export function renderToday(box) {
  put(box, goalCard(), startCard(), studyCard(), missedCard(), wordOfDayCard());
}

// The goal, the streak, the level.
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

// What's waiting in the chosen levels, and the round.
export function startCard() {
  const st = stats(state.words, state.progress);
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const fresh = chosen.reduce((s, l) => s + st[l].total - st[l].seen, 0);
  const mastered = chosen.reduce((s, l) => s + st[l].mastered, 0);
  const tile = (n, label, cls = '') => el('div', { class: `wait-tile ${cls}`.trim() }, [el('strong', { class: 'num', text: n.toLocaleString() }), el('small', { text: label })]);
  return el('div', { class: 'q-card pad start-card' }, [
    el('div', { class: 'start-top' }, [el('h2', { text: t('wordsTitle') }), el('p', { class: 'muted', text: chosen.length ? joined(chosen.map(levelName)) : t('pickLevel') })]),
    el('div', { class: 'wait-row' }, [tile(due, t('stDue'), due ? 'hot' : ''), tile(fresh, t('stLeft')), tile(mastered, t('stMastered'))]),
    el('div', { class: 'size-row' }, [el('span', { class: 'muted', text: t('roundSize') }), segmented([10, 20, 30].map(n => ({ id: n, label: t('wordsN', { n }) })), state.size, n => ((state.size = n), hooks.render()))]),
    el('button', { class: 'q-btn primary block big-start', type: 'button', disabled: !chosen.length, text: due ? t('startDue', { n: Math.min(due, state.size) }) : t('startRound'), onclick: () => startRound() })
  ]);
}

// New words as cards, a batch at a time, then a quiz on the batch.
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
        ? el('button', { class: 'q-btn primary block', type: 'button', text: t('studyQuiz', { n }), onclick: () => startRound({ from: 'study' }) })
        : el('button', { class: 'q-btn block', type: 'button', disabled: !next || !state.levels.length, text: !next ? t('studyNone') : n ? t('studyMore') : t('studyStart'), onclick: startStudy })
    ]),
    { sub: t('studySub', { n: state.size }) }
  );
}

// The words missed last time, as flash cards: a look before they come back.
function missedCard() {
  const n = catCounts(state.words, state.progress, { marks: state.marks }).wrong;
  if (!n) return null;
  const deck = () => flashDeck(state.words, state.progress, 'wrong', { n: 20, marks: state.marks });
  return el('button', { class: 'q-card pad nudge-card', type: 'button', onclick: () => startFlash(deck(), t('cat_wrong')) }, [
    el('span', { class: 'nudge-icon', text: '🎴' }),
    el('div', {}, [el('strong', { text: t('missedCardTitle', { n }) }), el('small', { class: 'muted', text: t('missedCardSub') })]),
    el('span', { class: 'chev', text: '›' })
  ]);
}

// The word of the day: the same for everyone today; a tap opens its sheet.
function wordOfDayCard() {
  const w = wordOfDay(state.words);
  if (!w) return null;
  const tip = hintOf(w.key)?.tip;
  return el('div', { class: 'q-card pad wotd', role: 'button', tabindex: '0', onclick: e => !e.target.closest('button') && openWord(w) }, [
    el('div', { class: 'wotd-top' }, [el('small', { class: 'wotd-label', text: t('wotd') }), el('div', { class: 'wotd-right' }, [el('small', { class: 'muted', text: t(`state_${stateOf(state.progress[w.key])}`) }), starButton(w, hooks.render)])]),
    el('div', { class: 'word-line' }, [wordEl(w), speakButton(w)]),
    el('small', { class: 'muted', text: metaLine(w) }),
    el('p', { class: 'meaning', text: shortMeaning(w.zh) }),
    tip ? el('p', { class: 'tip-line muted', text: `💡 ${tip}` }) : null
  ]);
}
