// 今天, the home: the day's goal and the round (the hero; its pill opens the
// round's choices), then what else there is to do (new words as cards, the
// weak words, the missed words as flash cards), and the word of the day.
import * as kitUI from '#kit/ui.mjs';
import { el, put } from '../ui.js';
import { hero, heroPill, heroBtn, big, bar, iconText, section, row, rowCard, tag, tile, ico } from './chrome.js';
import { state, t, hooks, hintOf, metaLine, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { LEVELS, stats, toStudy, stateOf, shortMeaning, wordOfDay, hardest } from '../lib/words.mjs';
import { DAILY_GOAL, todayCount, goalStatus, streakOf, bestStreak, lastDays } from '../lib/practice.mjs';
import { catCounts, flashDeck, recentMisses } from '../lib/review.mjs';
import { startRound, startStudy, startFlash } from './session.js';
import { openWord, starButton } from './sheet.js';
import { openPrefs, levelsText } from './prefs.js';
import { hardRow, openHardest } from './progress.js';

export function renderToday(box) {
  put(box, goalHero(), continueShelf(), streakPanel(), weakShelf(), deckShelf(), recentShelf(), wordOfDayCard());
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
    el('div', { class: 'hero-main' }, [big(String(Math.min(today, DAILY_GOAL)), ` / ${DAILY_GOAL}`), ring(today, DAILY_GOAL)]),
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
  const w = wordOfDay(state.words, Date.now(), state.levels);
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

// ---- The shelves under the hero (each a kit section head and a rail or a panel) -------------------

// Fitness's ring: today's answers of the goal; a check when it's met.
function ring(value, max) {
  const kit = kitUI.progressRing?.(Math.min(1, value / max), { size: 76, stroke: 8, tint: '#fff', label: value >= max ? '✓' : `${Math.round((Math.min(value, max) / max) * 100)}%` });
  if (kit) return kit;
  const r = 34;
  const c = 2 * Math.PI * r;
  const done = value >= max;
  const box = el('div', { class: `goal-ring${done ? ' done' : ''}`, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(Math.min(value, max)) });
  box.innerHTML = `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="rt"/><circle cx="40" cy="40" r="${r}" class="rp" stroke-dasharray="${(c * Math.min(1, value / max)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/></svg><span class="rc">${done ? ico('check') : `${Math.round((Math.min(value, max) / max) * 100)}%`}</span>`;
  return box;
}

// A card of the rail: a colour tile, a big number, its name, one line under.
function goCard({ icon, color, title, value, sub, progress, onClick, disabled = false }) {
  return el('button', { class: 'go-card q-press', type: 'button', disabled: disabled || null, onclick: onClick }, [
    tile(icon, color, 'sm'),
    el('strong', { class: 'go-val num', text: String(value) }),
    el('span', { class: 'go-title', text: title }),
    sub ? el('small', { class: 'go-sub', text: sub }) : null,
    progress ? bar(progress[0], progress[1], 'mini-bar') : null
  ]);
}
const rail = (cards, cls = '') => el('div', { class: `q-rail ${cls}`.trim() }, cards.filter(Boolean));

// 繼續: where to pick up (the new words' batch, what's due, the weak round, the missed words).
function continueShelf() {
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const st = stats(state.words, state.progress);
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const n = state.study.length;
  const full = n >= state.size;
  const next = toStudy(state.words, state.progress, { levels: state.levels, n: 1, skip: new Set(state.study) }).length > 0;
  const weak = recentMisses(state.words, state.progress, { n: state.size });
  const missed = catCounts(state.words, state.progress, { marks: state.marks }).wrong;
  const cards = [
    goCard({ icon: 'pencil', color: 'var(--q-accent)', title: full ? t('studyQuiz', { n }) : t('studyTitle'), value: full ? n : `${n}/${state.size}`, sub: full ? t('studyReady') : !next ? t('studyNone') : '', progress: full ? null : [n, state.size], disabled: !full && (!next || !state.levels.length), onClick: full ? () => startRound({ from: 'study' }) : startStudy }),
    due ? goCard({ icon: 'history', color: 'var(--q-orange)', title: t('dueCard'), value: due, sub: t('dueCardSub'), disabled: !chosen.length, onClick: () => startRound() }) : null,
    weak.length ? goCard({ icon: 'target', color: 'var(--q-red)', title: t('weakTitle'), value: weak.length, sub: t('lastDays3'), onClick: () => startRound({ list: weak }) }) : null,
    missed ? goCard({ icon: 'cards', color: 'var(--q-indigo)', title: t('missedTitle'), value: missed, onClick: () => startFlash(flashDeck(state.words, state.progress, 'wrong', { n: 20, marks: state.marks }), t('cat_wrong')) }) : null
  ];
  return section(t('continueTitle'), rail(cards, 'go-rail'));
}

// 連續天數: the streak and five weeks as a calendar (a day kept is filled).
function streakPanel() {
  const streak = streakOf(state.days);
  const days = lastDays(state.days, 35);
  const lead = new Date(`${days[0].day}T00:00:00Z`).getUTCDay();
  const names = [...t('wkDays')];
  const cells = [...Array.from({ length: lead }, () => el('i', { class: 'cal-pad', 'aria-hidden': 'true' })), ...days.map((d, i) => el('i', { class: `cal-day${d.kept ? ' kept' : d.answers ? ' some' : ''}${i === days.length - 1 ? ' today' : ''}`, title: `${d.day.slice(5)} · ${d.answers}`, text: String(Number(d.day.slice(8))) }))];
  const month = days.at(-1).day;
  const marks = Object.fromEntries(days.map(d => [d.day, d.kept ? 'done' : d.answers ? 'part' : '']).filter(([, m]) => m));
  const kitCal = kitUI.monthCalendar?.({ year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)), marks, today: month, lang: t('wkDays')[0] === 'S' ? 'en' : 'zh' });
  return section(
    t('streakTitle'),
    el('div', { class: 'q-card streak-card' }, [
      el('div', { class: 'streak-top' }, [tile('flame', 'var(--q-orange)'), el('div', { class: 'streak-text' }, [el('strong', { class: 'num', text: t('streakDays', { n: streak }) }), el('small', { text: [t('bestStreak', { n: bestStreak(state.days) }), t('todayN', { n: todayCount(state.days) })].join(' · ') })])]),
      kitCal ?? el('div', { class: 'cal-head' }, names.map(n => el('span', { text: n }))),
      kitCal ? null : el('div', { class: 'cal-grid' }, cells)
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
    el('button', { class: 'deck q-press', type: 'button', onclick: () => startFlash(flashDeck(state.words, state.progress, c, { n: 20, marks: state.marks }), t(`cat_${c}`)) }, [tile(icon, color, 'sm'), el('strong', { class: 'go-val num', text: String(counts[c]) }), el('span', { class: 'go-title', text: t(`cat_${c}`) }), el('small', { class: 'go-sub', text: t('deckN', { n: Math.min(20, counts[c]) }) })])
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
  return section(t('recentTitle'), rail(list.map(w => el('button', { class: 'recent-card q-press', type: 'button', onclick: () => openWord(w) }, [el('strong', { class: 'rc-word', text: w.word }), el('small', { class: 'rc-zh', text: shortMeaning(w.zh).split(/[、,，;；]/)[0] }), tag(t(`state_${stateOf(state.progress[w.key])}`), stateOf(state.progress[w.key]) === 'mastered' ? 'green' : 'tint')])), 'recent-rail'));
}
