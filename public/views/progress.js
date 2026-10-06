// 進度: how far, how well, what's coming. The four counts; accuracy and
// time (all answers, the last 7 days); each level by state; the last 14
// days' answers; reviews due in the next 7 days; how long learnt words stay
// remembered; how this person's memory compares (the model's fit); and the
// words forgotten most.
import { el, put, section, stat } from '../ui.js';
import { state, t, joined, percent, levelName } from '../shell.js';
import { speakButton } from '../audio.js';
import { stats, hardest, shortMeaning, personalFactor } from '../lib/words.mjs';
import { periodOf, lastDays, bestStreak, daysPractised, DAILY_GOAL } from '../lib/practice.mjs';
import { totals, forecast, levelBreakdown, memorySpread } from '../lib/review.mjs';
import { openWord } from './sheet.js';

export function renderProgress(box) {
  const st = stats(state.words, state.progress);
  const a = st.all;
  put(
    box,
    section(t('progress'), el('div', { class: 'q-card pad stat-row' }, [stat(t('stMastered'), a.mastered.toLocaleString()), stat(t('stLearning'), a.learning.toLocaleString()), stat(t('stDue'), a.due.toLocaleString()), stat(t('stLeft'), (a.total - a.seen).toLocaleString())])),
    howWell(),
    section(t('levelsTitle'), levelsCard()),
    section(t('activityTitle'), activityCard()),
    section(t('forecastTitle'), forecastCard(), { sub: t('forecastSub') }),
    section(t('memoryTitle'), memoryCard()),
    hardestCard()
  );
}

// Accuracy and time: every answer, and the last 7 days.
function howWell() {
  const all = totals(state.progress);
  const week = periodOf(state.days, state.log, 7);
  const sec = week.perAnswer == null ? '—' : t('secN', { n: week.perAnswer.toFixed(1) });
  return el('div', { class: 'q-card pad stat-row four' }, [stat(t('stAccuracyAll'), percent(all.accuracy)), stat(t('stAccuracyWeek'), percent(week.accuracy)), stat(t('stPerAnswer'), sec), stat(t('stDaysPractised'), daysPractised(state.days).toLocaleString())]);
}

// Each level: mastered, learning, new, as one bar (darkest = mastered),
// and how many are mastered.
function levelsCard() {
  const rows = levelBreakdown(state.words, state.progress);
  const seg = (n, total, cls, label) => (n ? el('i', { class: `seg ${cls}`, style: `flex-grow:${n / total}`, title: `${label} ${n.toLocaleString()}` }) : null);
  return el('div', { class: 'q-card pad levels-card' }, [
    ...rows.map(r =>
      el('div', { class: 'lv-row' }, [
        el('span', { class: 'lv-name', text: levelName(r.level) }),
        el('div', { class: 'stack', role: 'img', 'aria-label': `${levelName(r.level)}: ${t('stMastered')} ${r.mastered}, ${t('stLearning')} ${r.learning}, ${t('stLeft')} ${r.new}` }, [seg(r.mastered, r.total, 'mastered', t('stMastered')), seg(r.learning, r.total, 'learning', t('stLearning')), seg(r.new, r.total, 'new', t('stLeft'))]),
        el('span', { class: 'lv-num num', text: r.mastered.toLocaleString() })
      ])
    ),
    el('div', { class: 'legend' }, [['mastered', t('stMastered')], ['learning', t('stLearning')], ['new', t('stLeft')]].map(([c, l]) => el('span', {}, [el('i', { class: `key ${c}` }), l])))
  ]);
}

// A row of bars (one series, so no legend: the section names it). Each bar
// says its value on hover; the largest and the last are labelled.
function bars(items, { goal = 0, label }) {
  const max = Math.max(goal, ...items.map(x => x.n), 1);
  const top = Math.max(...items.map(x => x.n));
  return el('div', { class: 'bars', role: 'img', 'aria-label': items.map(x => `${label(x)} ${x.n}`).join(', ') }, [
    goal ? el('div', { class: 'goal-line', style: `bottom:calc(16px + (100% - 32px) * ${goal / max})`, title: t('goalLine', { n: goal }) }) : null,
    ...items.map((x, i) =>
      el('div', { class: 'bar-col', title: `${label(x)} · ${x.n}` }, [
        el('small', { class: 'bar-val num', text: x.n && (x.n === top || i === items.length - 1) ? String(x.n) : '' }),
        el('div', { class: 'bar-track' }, [x.n ? el('i', { class: `bar${x.hot ? ' hot' : ''}`, style: `height:${(x.n / max) * 100}%` }) : null]),
        el('small', { class: 'bar-label', text: x.short })
      ])
    )
  ]);
}

function activityCard() {
  const days = lastDays(state.days, 14);
  const items = days.map(d => ({ n: d.answers, hot: d.kept, short: String(Number(d.day.slice(8))), day: d.day }));
  return el('div', { class: 'q-card pad chart-card' }, [bars(items, { goal: DAILY_GOAL, label: x => x.day.slice(5) }), el('small', { class: 'muted', text: t('activityFoot', { goal: DAILY_GOAL, best: bestStreak(state.days) }) })]);
}

function forecastCard() {
  const items = forecast(state.progress, 7).map(f => ({ n: f.n, hot: f.day === 0, short: f.day === 0 ? t('todayShort') : `+${f.day}` }));
  return el('div', { class: 'q-card pad chart-card' }, [bars(items, { label: x => x.short })]);
}

// How long learnt words stay remembered (their stability), and the fit.
function memoryCard() {
  const spread = memorySpread(state.progress);
  const total = spread.reduce((s, n) => s + n, 0);
  const factor = personalFactor(state.cal);
  const names = [t('mem0'), t('mem1'), t('mem2'), t('mem3')];
  return el('div', { class: 'q-card pad memory-card' }, [
    total
      ? el(
          'div',
          { class: 'mem-rows' },
          spread.map((n, i) => el('div', { class: 'mem-row' }, [el('span', { text: names[i] }), el('div', { class: 'mem-track' }, [el('i', { class: `mem-bar m${i}`, style: `width:${(n / total) * 100}%` })]), el('span', { class: 'num', text: n.toLocaleString() })]))
        )
      : el('p', { class: 'muted small', text: t('memoryEmpty') }),
    el('p', { class: 'muted small mem-fit', text: state.cal.length < 30 ? t('fitSoon', { n: 30 - state.cal.length }) : factor >= 1.05 ? t('fitBetter', { f: factor }) : factor <= 0.95 ? t('fitWorse', { f: factor }) : t('fitAverage') })
  ]);
}

// The words that slip most, each with what it was mistaken for.
function hardestCard() {
  const list = hardest(state.words, state.progress, 8);
  if (!list.length) return null;
  return section(
    t('hardTitle'),
    el(
      'div',
      { class: 'q-card list hard-list' },
      list.map(w => {
        const p = state.progress[w.key];
        const mixed = (p.c || []).map(k => state.byKey.get(k)?.word).filter(Boolean);
        return el('button', { class: 'word-row', type: 'button', onclick: () => openWord(w) }, [speakButton(w), el('div', { class: 'word-row-main' }, [el('strong', { text: w.word }), el('small', { class: 'muted', text: [shortMeaning(w.zh), mixed.length ? t('mixedWith', { words: joined(mixed) }) : ''].filter(Boolean).join(' · ') })]), el('small', { class: 'pill', text: t('lapsesN', { n: p.l }) })]);
      })
    ),
    { sub: t('hardSub') }
  );
}
