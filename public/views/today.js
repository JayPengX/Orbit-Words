// 今天: the day's goal and streak, what's waiting (due, missed, new) with a
// round a tap away, studying new words, the missed words as flash cards,
// and the word of the day.
import { el, put, section } from '../ui.js';
import { pageHead, dayLine, heroEyebrow, heroTag, tag, heroBar, statsRow, row, rowCard, miniBar, ico, SIZES } from './chrome.js';
import { state, t, hooks, settingsChanged, locale, levelName, joined, hintOf, metaLine, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { LEVELS, stats, toStudy, stateOf, shortMeaning, wordOfDay } from '../lib/words.mjs';
import { xpOf, xpText, levelOf, DAILY_GOAL, todayCount, goalStatus, streakOf, bestStreak, lastDays } from '../lib/practice.mjs';
import { catCounts, flashDeck, recentMisses } from '../lib/review.mjs';
import { startRound, startStudy, startFlash } from './session.js';
import { openWord, starButton } from './sheet.js';

export function renderToday(box) {
  const fix = [weakRow(), missedRow()].filter(Boolean);
  put(box, pageHead(t('tab_today'), dayLine()), goalHero(), waitingStats(), section(t('studyTitle'), rowCard([studyRow()])), fix.length ? section(t('fixTitle'), rowCard(fix)) : null, wordOfDayCard());
}

const chosenLevels = () => LEVELS.filter(l => state.levels.includes(l));
const waiting = () => {
  const st = stats(state.words, state.progress);
  const chosen = chosenLevels();
  return { due: chosen.reduce((s, l) => s + st[l].due, 0), fresh: chosen.reduce((s, l) => s + st[l].total - st[l].seen, 0), mastered: chosen.reduce((s, l) => s + st[l].mastered, 0) };
};

// The round's two buttons, shared with 練習: start it, and how many words it holds.
export function roundActions() {
  const { due } = waiting();
  const chosen = chosenLevels();
  const next = SIZES[(SIZES.indexOf(state.size) + 1) % SIZES.length];
  const start = el('button', { class: 'q-hc-btn q-press', type: 'button', disabled: !chosen.length, onclick: () => startRound() }, [due ? t('startDue', { n: Math.min(due, state.size) }) : t('startRound')]);
  const size = el('button', { class: 'q-hc-btn ghost q-press', type: 'button', 'aria-label': t('roundSize'), onclick: () => ((state.size = next), settingsChanged(), hooks.render()) });
  size.innerHTML = ico('swap');
  size.append(el('span', { text: t('wordsN', { n: state.size }) }));
  size.title = t('roundSizeBtn', { n: state.size });
  return el('div', { class: 'q-hc-row round-row' }, [start, size]);
}

// Today's goal: the count, the streak, the level, and the round.
function goalHero() {
  const lv = levelOf(xpOf(state.progress), locale);
  const today = todayCount(state.days);
  const streak = streakOf(state.days);
  const { left, keeps } = goalStatus(state.days);
  const chosen = chosenLevels();
  const big = el('strong', { class: 'q-hc-big' }, [String(Math.min(today, DAILY_GOAL)), el('span', { class: 'dim', text: ` / ${DAILY_GOAL}` })]);
  return el('div', { class: 'q-hero-card words-hero' }, [
    heroEyebrow('target', chosen.length ? joined(chosen.map(levelName)) : t('pickLevel')),
    big,
    heroBar(today, DAILY_GOAL),
    el('p', { class: 'q-hc-sub', text: today >= DAILY_GOAL ? t('goalDone') : keeps ? t('goalKeep', { n: left, d: keeps }) : t('goalLeft', { n: left }) }),
    el('div', { class: 'q-hc-row' }, [heroTag('flame', t('daysN', { n: streak })), heroTag('', `Lv ${lv.level} ${lv.title}`), heroTag('', xpText(xpOf(state.progress)))]),
    el('div', { class: 'week-dots', role: 'img', 'aria-label': t('weekDots') }, lastDays(state.days, 7).map(d => el('span', { class: `week-dot${d.kept ? ' kept' : d.answers ? ' some' : ''}`, title: `${d.day.slice(5)} · ${d.answers}` }))),
    roundActions()
  ]);
}

// What's waiting in the chosen levels.
function waitingStats() {
  const { due, fresh, mastered } = waiting();
  return el('div', { class: 'q-section' }, [statsRow([{ label: t('stDue'), value: due.toLocaleString(), icon: 'clock', color: 'var(--q-orange)', tint: due > 0 }, { label: t('stLeft'), value: fresh.toLocaleString(), icon: 'book', color: 'var(--q-blue)' }, { label: t('stMastered'), value: mastered.toLocaleString(), icon: 'check', color: 'var(--q-green)' }])]);
}

// New words as cards, a batch at a time, then a quiz on the batch.
function studyRow() {
  const n = state.study.length;
  const full = n >= state.size;
  const next = toStudy(state.words, state.progress, { levels: state.levels, n: 1, skip: new Set(state.study) }).length > 0;
  return row({
    icon: 'pencil',
    color: 'var(--q-accent)',
    title: full ? t('studyQuiz', { n }) : !next ? t('studyNone') : n ? t('studyMore') : t('studyStart'),
    sub: full ? t('studyReady') : t('studyLeft', { n: state.size - n }),
    value: `${Math.min(n, state.size)} / ${state.size}`,
    body: miniBar(n, state.size),
    disabled: !full && (!next || !state.levels.length),
    onClick: full ? () => startRound({ from: 'study' }) : startStudy
  });
}

// Today's weak words: a quick round on what was missed in the last 3 days.
function weakRow() {
  const list = recentMisses(state.words, state.progress, { n: state.size });
  if (!list.length) return null;
  return row({ icon: 'target', color: 'var(--q-red)', title: t('weakCardTitle', { n: list.length }), sub: t('weakCardSub'), onClick: () => startRound({ list }) });
}

// The words missed last time, as flash cards: a look before they come back.
function missedRow() {
  const n = catCounts(state.words, state.progress, { marks: state.marks }).wrong;
  if (!n) return null;
  const deck = () => flashDeck(state.words, state.progress, 'wrong', { n: 20, marks: state.marks });
  return row({ icon: 'history', color: 'var(--q-indigo)', title: t('missedCardTitle', { n }), sub: t('missedCardSub'), onClick: () => startFlash(deck(), t('cat_wrong')) });
}

// The word of the day: the same for everyone today; a tap opens its sheet.
function wordOfDayCard() {
  const w = wordOfDay(state.words);
  if (!w) return null;
  const tip = hintOf(w.key)?.tip;
  const st = stateOf(state.progress[w.key]);
  return section(
    t('wotd'),
    el('div', { class: 'q-ambient wotd', role: 'button', tabindex: '0', onclick: e => !e.target.closest('button') && openWord(w) }, [
      el('div', { class: 'wotd-top' }, [tag(t(`state_${st}`), st === 'mastered' ? 'green' : st === 'new' ? '' : 'tint'), starButton(w, hooks.render)]),
      el('div', { class: 'word-line' }, [wordEl(w), speakButton(w)]),
      el('small', { class: 'muted', text: metaLine(w) }),
      el('p', { class: 'meaning', text: shortMeaning(w.zh) }),
      tip ? el('p', { class: 'tip-line muted', text: tip }) : null
    ])
  );
}
