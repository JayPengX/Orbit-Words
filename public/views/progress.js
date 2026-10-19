// 進度: how far (the words mastered, the level and points, the best
// streak), how well (accuracy, time, days), what's been done and what's
// coming (one chart, two ways), each level by state, and how long words
// stay remembered: the model's fit, and the words forgotten most (a sheet).
import { el, put, segmented } from '../ui.js';
import { hero, big, bar, stats, section, row, rowCard, tag, ico } from './chrome.js';
import { state, t, joined, percent, levelName, locale } from '../shell.js';
import { speakButton } from '../audio.js';
import { stats as wordStats, hardest, shortMeaning, personalFactor } from '../lib/words.mjs';
import { periodOf, lastDays, bestStreak, daysPractised, xpOf, xpText, levelOf, DAILY_GOAL } from '../lib/practice.mjs';
import { totals, forecast, levelBreakdown, memorySpread } from '../lib/review.mjs';
import { openWord } from './sheet.js';

const view = { chart: 'past' };

export function renderProgress(box) {
  const a = wordStats(state.words, state.progress).all;
  const lv = levelOf(xpOf(state.progress), locale);
  const top = hero('chart', t('stMastered'), null, [
    big(a.mastered.toLocaleString(), ` / ${a.total.toLocaleString()}`),
    bar(a.mastered, a.total, 'hero-bar'),
    el('div', { class: 'hero-tags' }, [el('span', { class: 'hero-tag', text: `Lv ${lv.level} ${lv.title}` }), el('span', { class: 'hero-tag', text: xpText(xpOf(state.progress)) })])
  ]);
  put(box, top, howWell(), section(t('activityTitle'), chartCard()), section(t('levelsTitle'), levelsCard()), section(t('memoryTitle'), memoryCard()));
}

// Accuracy and time: every answer, and the last 7 days.
function howWell() {
  const all = totals(state.progress);
  // No stat tiles before the first answer: four dashes say nothing.
  if (!all.answers) return null;
  const week = periodOf(state.days, state.log, 7);
  return el('div', { class: 'q-section' }, [
    stats([
      { label: t('stAccuracyAll'), value: percent(all.accuracy), icon: 'target', color: 'var(--q-green)' },
      { label: t('stAccuracyWeek'), value: percent(week.accuracy), icon: 'chart', color: 'var(--q-teal)' },
      { label: t('stPerAnswer'), value: week.perAnswer == null ? '—' : t('secN', { n: week.perAnswer.toFixed(1) }), icon: 'clock', color: 'var(--q-purple)' },
      { label: t('stDaysPractised'), value: daysPractised(state.days).toLocaleString(), icon: 'calendar', color: 'var(--q-orange)' }
    ])
  ]);
}

// One chart: the last 14 days' answers (the goal dashed; the best streak), or the reviews
// falling due in the next 7 days (today's with what's overdue).
function chartCard() {
  const past = view.chart === 'past';
  const items = past
    ? lastDays(state.days, 14).map(d => ({ n: d.answers, hot: d.kept, short: String(Number(d.day.slice(8))), name: d.day.slice(5) }))
    : forecast(state.progress, 7).map(f => ({ n: f.n, hot: f.day === 0, short: f.day === 0 ? t('todayShort') : `+${f.day}`, name: f.day === 0 ? t('todayShort') : `+${f.day}` }));
  const pick = segmented([{ id: 'past', label: t('chartPast') }, { id: 'next', label: t('chartNext') }], view.chart, id => ((view.chart = id), box.replaceWith(chartCard())), 'chart-seg');
  const box = el('div', { class: 'q-card chart-card' }, [pick, bars(items, past ? DAILY_GOAL : 0), past ? el('div', { class: 'q-tags' }, [tag(t('bestStreak', { n: bestStreak(state.days) }), 'tint'), tag(t('goalLine', { n: DAILY_GOAL }))]) : null]);
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
function memoryCard() {
  const spread = memorySpread(state.progress);
  const total = spread.reduce((s, n) => s + n, 0);
  const factor = personalFactor(state.cal);
  const names = [t('mem0'), t('mem1'), t('mem2'), t('mem3')];
  const fit = state.cal.length < 30 ? tag(t('fitSoon', { n: 30 - state.cal.length })) : factor >= 1.05 ? tag(t('fitBetter', { f: factor }), 'green') : factor <= 0.95 ? tag(t('fitWorse', { f: factor }), 'orange') : tag(t('fitAverage'));
  const hard = hardest(state.words, state.progress, 8);
  return [
    el('div', { class: 'q-card memory-card' }, [
      total ? el('div', { class: 'mem-rows' }, spread.map((n, i) => el('div', { class: 'mem-row' }, [el('span', { text: names[i] }), bar(n, total, `mem-track m${i}`), el('span', { class: 'num', text: n.toLocaleString() })]))) : el('p', { class: 'none', text: t('memoryEmpty') }),
      el('div', { class: 'fit' }, [fit])
    ]),
    hard.length ? rowCard([row({ icon: 'history', color: 'var(--q-red)', title: t('hardTitle'), value: hard.length, onClick: () => openHardest(hard) })], 'after') : null
  ];
}

// The words forgotten most, each with what it was mistaken for.
let dialog = null;
function openHardest(list) {
  dialog?.remove();
  const close = el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), onclick: () => dialog.close() });
  close.innerHTML = ico('x');
  dialog = el('dialog', { class: 'q-sheet', onclick: e => e.target === dialog && dialog.close() }, [
    el('div', { class: 'q-sheet-head' }, [el('span'), el('h2', { text: t('hardTitle') }), close]),
    el(
      'div',
      { class: 'q-rowcard words' },
      list.map(w => {
        const p = state.progress[w.key];
        const mixed = (p.c || []).map(k => state.byKey.get(k)?.word).filter(Boolean);
        return el('button', { class: 'q-ritem wr', type: 'button', onclick: () => openWord(w) }, [speakButton(w), el('span', { class: 'wr-main' }, [el('strong', { text: w.word }), el('small', { class: 'muted wrap', text: [shortMeaning(w.zh), mixed.length ? t('mixedWith', { words: joined(mixed) }) : ''].filter(Boolean).join(' · ') })]), el('small', { class: 'q-tag red', text: t('lapsesN', { n: p.l }) })]);
      })
    )
  ]);
  document.body.append(dialog);
  dialog.showModal();
}
