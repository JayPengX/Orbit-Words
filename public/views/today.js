// 今天, the home (Orbit's own look, docs/DESIGN.md §11): today's goal on the
// graphite card (answers of 20, the streak they keep, the levels pill) with
// the one main action, 開始, in the app's colour: the round starts only on
// it; the word of the day under it (something new each day); then where to
// pick up (new words, what's due, the weak round, the missed words) and the
// ways to practise as short lists; the 拼字比賽 paper, the streak, the weak
// words, the decks and the recent words.
import * as kit from '#kit/orbit.mjs';
import * as kitUI from '#kit/ui.mjs';
import { el, put } from '../ui.js';
import { hero, heroPill, heroBtn, big, bar, section, tag, tile, columns, ico } from './chrome.js';
import { state, t, hooks, metaLine, wordEl, locale, settingsChanged } from '../shell.js';
import { speakButton } from '../audio.js';
import { LEVELS, MODES, stats, toStudy, stateOf, shortMeaning, wordOfDay, hardest } from '../lib/words.mjs';
import { DAILY_GOAL, todayCount, goalStatus, streakOf, bestStreak, lastDays } from '../lib/practice.mjs';
import { catCounts, flashDeck, recentMisses } from '../lib/review.mjs';
import { startRound, startStudy, startFlash } from './session.js';
import { contestCard } from './contest.js';
import { openWord, starButton } from './sheet.js';
import { openPrefs, levelsText } from './prefs.js';
import { hardRow, openHardest } from './progress.js';

export function renderToday(box) {
  const [goal, wotd, go, modes, contest, streak, weak, decks, recent] = [goalHero(), wordOfDayCard(), continueList(), modeList(), contestCard(), streakPanel(), weakShelf(), deckShelf(), recentShelf()];
  // Wide: the goal and the word of the day first, where to pick up and the ways beside; then the rest.
  put(box, ...columns([[goal, wotd, go, modes], [contest, streak, weak, decks, recent]], [[goal, wotd], [go, modes], [contest, streak, weak, decks, recent]]));
}

// The goal: today's answers of 20 large, the streak they keep beside it, a
// line under, what's left; then 開始, the one main action (the round it
// starts: what's due first, in the way picked).
function goalHero() {
  const today = todayCount(state.days);
  const streak = streakOf(state.days);
  const { left, keeps } = goalStatus(state.days);
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const st = stats(state.words, state.progress);
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const done = Math.min(today, DAILY_GOAL);
  const flame = el('i', { class: 'gl', html: ico('flame') });
  return hero('target', t('goalTitle'), heroPill('sliders', chosen.length ? levelsText(chosen) : t('pickLevel'), openPrefs, t('prefsTitle')), [
    el('div', { class: 'hero-main' }, [big(String(done), ` / ${DAILY_GOAL}`), el('span', { class: `hero-streak${streak ? ' is-on' : ''}`, 'aria-label': t('streakDays', { n: streak }) }, [flame, el('b', { class: 'num', text: String(streak) }), el('small', { text: t('streakTitle') })])]),
    bar(done, DAILY_GOAL, `hero-bar${done >= DAILY_GOAL ? ' is-done' : ''}`),
    el('p', { class: 'hero-note', text: !left ? t('goalDone') : keeps ? t('goalKeep', { n: left }) : t('goalLeft', { n: left }) }),
    el('div', { class: 'q-hc-row' }, [heroBtn([due ? t('startDue', { n: Math.min(due, state.size) }) : t('startRound', { n: state.size }), state.mode !== 'smart' ? t(`mode_${state.mode}`) : ''].filter(Boolean).join(' · '), () => startRound(), { disabled: !chosen.length, icon: 'play' })])
  ]);
}

// 練習模式 as a short list: each way, what it asks, the one in use ticked; a
// tap starts a round that way at once and keeps it for 開始's round.
const MODE_LOOK = {
  smart: ['spark', 'var(--q-accent)'],
  meaning: ['book', 'var(--q-indigo)'],
  word: ['swap', 'var(--q-blue)'],
  listen: ['sound', 'var(--q-teal)'],
  spell: ['pencil', 'var(--q-orange)'],
  sentence: ['list', 'var(--q-green)'],
  letters: ['grid', 'var(--q-purple)'],
  cloze: ['key', 'var(--q-pink)']
};
function modeList() {
  const ready = state.levels.length > 0;
  const rows = MODES.map(m =>
    el('button', { class: 'q-ritem mode-row', type: 'button', disabled: !ready || null, 'aria-pressed': String(state.mode === m), onclick: () => pickMode(m) }, [
      tile(MODE_LOOK[m][0], MODE_LOOK[m][1], 'sm'),
      el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: t(`mode_${m}`) }), el('small', { text: t(`modeHint_${m}`) })]),
      state.mode === m ? el('i', { class: 'mode-tick', html: ico('check') }) : null
    ])
  );
  return section(t('modes'), el('div', { class: 'q-rowcard' }, rows));
}
function pickMode(m) {
  if (state.mode !== m) (state.mode = m), settingsChanged();
  startRound({ mode: m });
}

// The same word for everyone today; a tap opens its sheet.
function wordOfDayCard() {
  const w = wordOfDay(state.words, Date.now(), state.levels);
  if (!w) return null;
  const st = stateOf(state.progress[w.key]);
  return section(
    t('wotd'),
    el('div', { class: 'q-card wotd q-press', role: 'button', tabindex: '0', onclick: e => !e.target.closest('button') && openWord(w) }, [
      el('div', { class: 'card-top' }, [tag(t(`state_${st}`), st === 'mastered' ? 'green' : st === 'new' ? '' : 'tint'), starButton(w, hooks.render)]),
      el('div', { class: 'word-line' }, [wordEl(w), speakButton(w)]),
      el('small', { lang: 'en', class: 'muted', text: metaLine(w) }),
      el('p', { lang: 'zh-Hant', class: 'meaning', text: shortMeaning(w.zh) })
    ])
  );
}

// ---- The shelves under the hero (each a kit section head and a rail or a panel) -------------------

// Wide, in a column, there's no edge to slide cards to: a grid, every row
// full (4 as two pairs; the recent words cut to whole rows).
function rail(cards, cls = '') {
  let list = cards.filter(Boolean);
  const fit = kit.screenFit?.() || {};
  if (!fit.wide) return el('div', { class: `q-rail ${cls}`.trim() }, list);
  // (As many across as fit at a card's least width, 140: two or three.)
  const room = (Math.min(fit.width, 1180) - 32 - (fit.w3 ? 48 : 24)) / (fit.w3 ? 3 : 2);
  const most = Math.max(2, Math.min(3, Math.floor((room + 10) / 150)));
  if (cls === 'recent-rail' && list.length > most && list.length % most) list = list.slice(0, list.length - (list.length % most));
  const n = list.length <= most ? list.length : list.length === 4 ? 2 : most;
  // (A last card alone on its row runs across it, never a lone half.)
  if (list.length % n === 1 && list.length > 1) list.at(-1).style.gridColumn = '1 / -1';
  return el('div', { class: `card-grid ${cls}`.trim(), style: `--cols:${n}` }, list);
}

// 繼續 as rows: new words to study, what's due, the weak round, the missed words; each its count.
function continueList() {
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const st = stats(state.words, state.progress);
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const n = state.study.length;
  const full = n >= state.size;
  const next = toStudy(state.words, state.progress, { levels: state.levels, n: 1, skip: new Set(state.study) }).length > 0;
  const weak = recentMisses(state.words, state.progress, { n: state.size });
  const missed = catCounts(state.words, state.progress, { marks: state.marks }).wrong;
  const row = (title, sub, value, onclick, disabled = false) =>
    el('button', { class: 'q-ritem chevron', type: 'button', disabled: disabled || null, onclick }, [el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: title }), sub ? el('small', { text: sub }) : null]), el('span', { class: 'q-ritem-value num', text: String(value) })]);
  const rows = [
    row(full ? t('studyQuiz', { n }) : t('studyTitle'), full ? t('studyReady') : !next ? t('studyNone') : '', full ? n : `${n} / ${state.size}`, full ? () => startRound({ from: 'study' }) : startStudy, !full && (!next || !state.levels.length)),
    due ? row(t('dueCard'), t('dueCardSub'), due, () => startRound(), !chosen.length) : null,
    weak.length ? row(t('weakTitle'), t('lastDays3'), weak.length, () => startRound({ list: weak })) : null,
    missed ? row(t('missedTitle'), '', missed, () => startFlash(flashDeck(state.words, state.progress, 'wrong', { n: 20, marks: state.marks }), t('cat_wrong'))) : null
  ];
  return section(t('continueTitle'), el('div', { class: 'q-rowcard' }, rows.filter(Boolean)));
}

// 連續天數: the streak and five weeks as a calendar (a day kept is filled).
function streakPanel() {
  const streak = streakOf(state.days);
  const days = lastDays(state.days, 35);
  const month = days.at(-1).day;
  const marks = Object.fromEntries(days.map(d => [d.day, d.kept ? 'done' : d.answers ? 'part' : '']).filter(([, m]) => m));
  const cal = kitUI.monthCalendar({ last: 35, marks, today: month, lang: locale });
  return section(
    t('streakTitle'),
    el('div', { class: 'q-card streak-card' }, [
      el('div', { class: 'streak-top' }, [el('div', { class: 'streak-text' }, [el('strong', { class: 'num', text: t('streakDays', { n: streak }) }), el('small', { text: [t('bestStreak', { n: bestStreak(state.days) }), t('todayN', { n: todayCount(state.days) })].join(' · ') })])]),
      cal
    ])
  );
}

// 弱點字: the words forgotten most, a few rows (the rest in a sheet).
function weakShelf() {
  const list = hardest(state.words, state.progress, 8);
  if (!list.length) return null;
  const all = el('button', { class: 'q-sh-more', type: 'button', onclick: () => openHardest(list) }, [t('allBtn')]);
  return section(t('weakWords'), el('div', { class: 'q-rowcard words' }, list.slice(0, 4).map(hardRow)), all);
}

// 單字卡: a deck for each way in (missed, due, learning, bookmarked).
const DECKS = [['wrong', 'cards', 'var(--q-indigo)'], ['due', 'history', 'var(--q-orange)'], ['learning', 'pencil', 'var(--q-accent)'], ['marked', 'star', 'var(--q-yellow)']];
function deckShelf() {
  const counts = catCounts(state.words, state.progress, { marks: state.marks });
  const decks = DECKS.filter(([c]) => counts[c] > 0).map(([c, icon, color]) =>
    el('button', { class: 'deck q-press', type: 'button', onclick: () => startFlash(flashDeck(state.words, state.progress, c, { n: 20, marks: state.marks }), t(`cat_${c}`)) }, [el('strong', { class: 'go-val num', text: String(counts[c]) }), el('span', { class: 'go-title', text: t(`cat_${c}`) })])
  );
  return decks.length ? section(t('decksTitle'), rail(decks, 'deck-rail')) : null;
}

// 最近練習的字: the last words answered, each opens its sheet.
function recentShelf() {
  const list = Object.entries(state.progress)
    .filter(([, p]) => p.t)
    .sort((a, b) => b[1].t - a[1].t)
    .slice(0, 10)
    .map(([k]) => state.byKey.get(k))
    .filter(Boolean);
  if (!list.length) return null;
  return section(t('recentTitle'), rail(list.map(w => el('button', { class: 'recent-card q-press', type: 'button', onclick: () => openWord(w) }, [el('strong', { lang: 'en', class: 'rc-word', text: w.word }), el('small', { class: 'rc-sub' }, [el('span', { lang: 'zh-Hant', text: shortMeaning(w.zh).split(/[、,，;；]/)[0] }), ` · ${t(`state_${stateOf(state.progress[w.key])}`)}`])])), 'recent-rail'));
}
