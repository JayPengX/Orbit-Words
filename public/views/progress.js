// 進度: how far (the words mastered, the level and points, the best
// streak), how well (accuracy, time, days), what's been done and what's
// coming (one chart, two ways), each level by state, and how long words
// stay remembered: the model's fit, and the words forgotten most (a sheet;
// in the page when wide).
import * as kitUI from '#kit/ui.mjs';
import * as kit from '#kit/orbit.mjs';
import { el, put, segmented } from '../ui.js';
import { bar, stats, section, row, rowCard, tag, columns } from './chrome.js';
import { state, t, joined, percent, levelName, locale } from '../shell.js';
import { speakButton } from '../audio.js';
import { stats as wordStats, hardest, shortMeaning, personalFactor } from '../lib/words.mjs';
import { periodOf, lastDays, bestStreak, daysPractised, xpOf, xpText, levelOf, DAILY_GOAL } from '../lib/practice.mjs';
import { totals, forecast, levelBreakdown, memorySpread } from '../lib/review.mjs';
import { openWord } from './sheet.js';

const view = { chart: 'past', picked: false };

export function renderProgress(box) {
  const a = wordStats(state.words, state.progress).all;
  const lv = levelOf(xpOf(state.progress), locale);
  // The answer to 進度: how many words are held. Open on the page, not in a card.
  const top = el('section', { class: 'q-focus' }, [
    el('span', { class: 'q-focus-label', text: t('stMastered') }),
    el('b', { class: 'q-focus-value' }, [a.mastered.toLocaleString(), el('span', { class: 'dim', text: ` / ${a.total.toLocaleString()}` })]),
    bar(a.mastered, a.total, 'q-focus-bar'),
    el('span', { class: 'q-focus-sub', text: `Lv ${lv.level} ${lv.title} · ${xpText(xpOf(state.progress))}` })
  ]);
  const wide = kit.screenFit?.().wide;
  const [well, activity, levels, memory] = [howWell(), section(t('activityTitle'), chartCard()), section(t('levelsTitle'), levelsCard()), section(t('memoryTitle'), memoryCard({ inline: wide }))];
  // Wide (Jay 2026-11-06, iPad: one column long beside two short ones): the
  // words held and the four numbers in one row, then the chart, the levels
  // and the memory side by side (the kit's flowColumns), in the phone's order.
  // Under them the words forgotten most, in the page (Jay 2026-11-14, his
  // laptop: the page's lower half empty while they sat behind a row).
  const parts = [top, well, activity, levels, memory].filter(Boolean);
  if (!wide) return put(box, ...parts);
  const hard = hardBand();
  if (!kitUI.flowColumns) return put(box, ...columns([[top, well, activity], [levels, memory]], [[top, well], [activity], [levels, memory]]), hard);
  well?.classList.add('span2');
  // (Three across on a computer: one row, the cards one height, never three ragged ends.)
  const row = kit.screenFit?.().w3 ? el('div', { class: 'prog-row' }, [activity, levels, memory]) : el('div', { class: 'q-flow tab-flow' }, [activity, levels, memory]);
  put(box, el('div', { class: 'wide-lead' }, [top, well].filter(Boolean)), row, hard);
  kitUI.flowColumns(box);
}

// Accuracy and time: every answer, and the last 7 days.
function howWell() {
  const all = totals(state.progress);
  // No stat tiles before the first answer: four dashes say nothing.
  if (!all.answers) return null;
  const week = periodOf(state.days, state.log, 7);
  // (A quiet week: the answers in all and the day last practised, never two
  // dashes beside numbers that plainly exist (Jay 2026-11-14).)
  const last = lastPractised();
  const tiles = week.answers
    ? [
        { label: t('stAccuracyWeek'), value: percent(week.accuracy) },
        { label: t('stPerAnswer'), value: week.perAnswer == null ? '—' : t('secN', { n: week.perAnswer.toFixed(1) }) }
      ]
    : [
        { label: t('stAnswersAll'), value: all.answers.toLocaleString() },
        { label: t('stLastDay'), value: last ? shortDay(last) : '—' }
      ];
  return el('div', { class: 'q-section' }, [stats([{ label: t('stAccuracyAll'), value: percent(all.accuracy) }, ...tiles, { label: t('stDaysPractised'), value: daysPractised(state.days).toLocaleString() }])]);
}
// The last day with any answers ('YYYY-MM-DD'), or ''.
const lastPractised = () => Object.keys(state.days || {}).filter(d => state.days[d] > 0).sort().at(-1) || '';
const shortDay = d => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

// One chart: the last 14 days' answers (the goal dashed; the best streak), or the reviews
// falling due in the next 7 days (today's with what's overdue).
function chartCard() {
  // (Nothing in the last 14 days: the reviews coming open first, until one is picked.)
  if (!view.picked) view.chart = lastDays(state.days, 14).some(d => d.answers) ? 'past' : 'next';
  const past = view.chart === 'past';
  const items = past
    ? lastDays(state.days, 14).map(d => ({ n: d.answers, hot: d.kept, short: String(Number(d.day.slice(8))), name: d.day.slice(5) }))
    : forecast(state.progress, 7).map(f => ({ n: f.n, hot: f.day === 0, short: f.day === 0 ? t('todayShort') : `+${f.day}`, name: f.day === 0 ? t('todayShort') : `+${f.day}` }));
  const pick = segmented([{ id: 'past', label: t('chartPast') }, { id: 'next', label: t('chartNext') }], view.chart, id => ((view.chart = id), (view.picked = true), box.replaceWith(chartCard())), 'chart-seg');
  const quiet = past && items.every(x => !x.n);
  // (Quiet for two weeks but practised before: says so, and when; never 還沒有作答紀錄 beside 69% (Jay 2026-11-14).)
  const last = lastPractised();
  const none = last ? kitUI.empty({ icon: 'chart', title: t('chartQuiet'), body: t('lastOn', { d: shortDay(last) }) }) : kitUI.empty({ icon: 'chart', title: t('chartNone') });
  const box = el('div', { class: 'q-card chart-card' }, [pick, quiet ? none : bars(items, past ? DAILY_GOAL : 0), past ? el('p', { class: 'chart-note', text: [t('bestStreak', { n: bestStreak(state.days) }), t('goalLine', { n: DAILY_GOAL })].join(' · ') }) : null]);
  return box;
}
// A row of bars; the largest and the last say their number.
function bars(items, goal) {
  const max = Math.max(goal, ...items.map(x => x.n), 1);
  const top = Math.max(...items.map(x => x.n));
  return el('div', { class: 'bars', role: 'img', 'aria-label': items.map(x => `${x.name} ${x.n}`).join(', ') }, [
    goal ? el('div', { class: 'goal-line', style: `bottom:calc(18px + (100% - 36px) * ${goal / max})`, title: t('goalLine', { n: goal }) }) : null,
    ...items.map((x, i) =>
      el('div', { class: 'bar-col', title: `${x.name} · ${x.n}` }, [
        el('small', { class: 'bar-val num', text: x.n && (x.n === top || i === items.length - 1) ? String(x.n) : '' }),
        el('div', { class: 'bar-track' }, [x.n ? el('i', { class: x.hot ? 'hot' : '', style: `height:${(x.n / max) * 100}%` }) : null]),
        el('small', { class: 'bar-label', text: x.short })
      ])
    )
  ]);
}

// Each level as one bar: mastered (darkest), learning, not yet.
function levelsCard() {
  const rows = levelBreakdown(state.words, state.progress);
  const seg = (n, total, cls) => (n ? el('i', { class: cls, style: `flex-grow:${n / total}` }) : null);
  return el('div', { class: 'q-card levels-card' }, [
    ...rows.map(r =>
      el('div', { class: 'lv-row' }, [
        el('span', { class: 'lv-name', text: levelName(r.level) }),
        el('div', { class: 'stack', role: 'img', 'aria-label': `${levelName(r.level)}: ${t('stMastered')} ${r.mastered}, ${t('stLearning')} ${r.learning}, ${t('stLeft')} ${r.new}` }, [seg(r.mastered, r.total, 'mastered'), seg(r.learning, r.total, 'learning'), seg(r.new, r.total, 'new')]),
        el('span', { class: 'lv-num num', text: r.mastered.toLocaleString() })
      ])
    ),
    el('div', { class: 'legend' }, [['mastered', t('stMastered')], ['learning', t('stLearning')], ['new', t('stLeft')]].map(([c, l]) => el('span', {}, [el('i', { class: c }), l])))
  ]);
}

// How long learnt words stay remembered, how this person's memory compares
// (the model's fit), and the words that slip most.
function memoryCard({ inline = false } = {}) {
  const spread = memorySpread(state.progress);
  const total = spread.reduce((s, n) => s + n, 0);
  const factor = personalFactor(state.cal);
  const names = [t('mem0'), t('mem1'), t('mem2'), t('mem3')];
  const fit = el('p', { class: 'chart-note', text: state.cal.length < 30 ? t('fitSoon', { n: 30 - state.cal.length }) : factor >= 1.05 ? t('fitBetter', { f: factor }) : factor <= 0.95 ? t('fitWorse', { f: factor }) : t('fitAverage') });
  const hard = hardest(state.words, state.progress, 8);
  return [
    el('div', { class: 'q-card memory-card' }, [
      total ? el('div', { class: 'mem-rows' }, spread.map((n, i) => el('div', { class: 'mem-row' }, [el('span', { text: names[i] }), bar(n, total, `mem-track m${i}`), el('span', { class: 'num', text: n.toLocaleString() })]))) : el('p', { class: 'none', text: t('memoryEmpty') }),
      fit
    ]),
    !inline && hard.length ? rowCard([row({ title: t('hardTitle'), value: hard.length, onClick: () => openHardest(hard) })], 'after') : null
  ];
}

// Wide: the words forgotten most in the page, two lists side by side.
function hardBand() {
  const hard = hardest(state.words, state.progress, 8);
  if (!hard.length) return null;
  const half = Math.ceil(hard.length / 2);
  const lists = hard.length > 3 ? [hard.slice(0, half), hard.slice(half)] : [hard];
  return section(t('hardTitle'), el('div', { class: 'hard-band' }, lists.map(l => el('div', { class: 'q-rowcard words' }, l.map(hardRow)))));
}

// The words forgotten most, each with what it was mistaken for.
let dialog = null;
export function hardRow(w) {
  const p = state.progress[w.key];
  const mixed = (p.c || []).map(k => state.byKey.get(k)?.word).filter(Boolean);
  return el('button', { class: 'q-ritem wr', type: 'button', onclick: () => openWord(w) }, [speakButton(w), el('span', { class: 'wr-main' }, [el('strong', { lang: 'en', class: 'q-fit', text: w.word }), el('small', { class: 'muted' }, [el('span', { lang: 'zh-Hant', text: shortMeaning(w.zh) }), mixed.length ? ` · ${t('mixedWith', { words: joined(mixed) })}` : null])]), el('small', { class: 'wr-side', text: t('lapsesN', { n: p.l }) })]);
}
export function openHardest(list) {
  dialog?.remove();
  dialog = kitUI.sheet({ title: t('hardTitle'), body: [el('div', { class: 'q-rowcard words' }, list.map(hardRow))], closeLabel: t('close') }).el;
}
