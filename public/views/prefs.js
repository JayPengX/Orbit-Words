// The round's choices, in a sheet from 今天's hero (and #practice): how
// many words a round holds, which levels, which way to learn, and how fast
// the words are said. Each change is saved at once (shell.js settingsChanged).
import { el, put, segmented } from '../ui.js';
import { state, t, hooks, levelName, settingsChanged, locale } from '../shell.js';
import { speak, RATES } from '../audio.js';
import { LEVELS, MODES, stats, wordOfDay } from '../lib/words.mjs';
import { row, rowCard, checkDot, ico, bar } from './chrome.js';

export const SIZES = [10, 20, 30];
const MODE_ICON = { smart: 'spark', meaning: 'book', word: 'list', listen: 'sound', letters: 'grid', cloze: 'search', spell: 'pencil' };
const MODE_COLOR = { smart: 'var(--q-accent)', meaning: 'var(--q-blue)', word: 'var(--q-indigo)', listen: 'var(--q-orange)', letters: 'var(--q-teal)', cloze: 'var(--q-purple)', spell: 'var(--q-green)' };
export const LEVEL_COLOR = ['', 'var(--q-green)', 'var(--q-mint)', 'var(--q-blue)', 'var(--q-indigo)', 'var(--q-purple)', 'var(--q-pink)'];

// 第 1–3 級, 第 2 級, 第 1、3、5 級 (Levels 1–3 …).
export function levelsText(levels) {
  const run = levels.length > 1 && levels.every((l, i) => !i || l === levels[i - 1] + 1);
  const span = levels.length === 1 ? String(levels[0]) : run ? `${levels[0]}–${levels.at(-1)}` : levels.join(locale === 'en' ? ', ' : '、');
  return t(levels.length === 1 ? 'level' : 'levelsN', { n: span });
}

let dialog = null;
export function openPrefs() {
  if (!dialog) {
    dialog = el('dialog', { class: 'q-sheet prefs-sheet', 'aria-label': t('prefsTitle') });
    dialog.addEventListener('click', e => e.target === dialog && dialog.close());
    document.body.append(dialog);
  }
  draw();
  if (!dialog.open) dialog.showModal();
}
const changed = () => (settingsChanged(), hooks.render(), draw());

function draw() {
  const st = stats(state.words, state.progress);
  const close = el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), onclick: () => dialog.close() });
  close.innerHTML = ico('x');
  const size = segmented(SIZES.map(n => ({ id: n, label: t('wordsN', { n }) })), state.size, n => ((state.size = n), changed()), 'size-seg');
  const levels = rowCard(
    LEVELS.map(l => {
      const on = state.levels.includes(l);
      return row({
        icon: String(l),
        color: LEVEL_COLOR[l],
        soft: !on,
        title: levelName(l),
        sub: t(`levelHint${l}`),
        body: bar(st[l].mastered, st[l].total, 'mini-bar'),
        trailing: checkDot(on),
        pressed: on,
        chevron: false,
        onClick: () => {
          state.levels = on ? state.levels.filter(x => x !== l) : [...state.levels, l].sort((a, b) => a - b);
          changed();
        }
      });
    })
  );
  const modes = rowCard(MODES.map(m => row({ icon: MODE_ICON[m], color: MODE_COLOR[m], title: t(`mode_${m}`), sub: t(`modeHint_${m}`), trailing: checkDot(state.mode === m), pressed: state.mode === m, chevron: false, onClick: () => ((state.mode = m), changed()) })));
  // The sound's speed, tried on the word of the day.
  const rate = RATES.includes(state.opt.rate) ? state.opt.rate : 1;
  const sound = rowCard([
    el('div', { class: 'q-ritem rate' }, [
      segmented(RATES.map(r => ({ id: r, label: `${r}×` })), rate, r => {
        state.opt = { ...state.opt, rate: r };
        changed();
        speak(wordOfDay(state.words));
      }),
      el('button', { class: 'q-btn small tinted', type: 'button', onclick: () => speak(wordOfDay(state.words)) }, [t('rateTry')])
    ])
  ]);
  put(dialog, el('div', { class: 'q-sheet-head' }, [el('span'), el('h2', { text: t('prefsTitle') }), close]), el('h3', { class: 'q-sheet-h', text: t('roundSize') }), size, el('h3', { class: 'q-sheet-h', text: t('levels') }), levels, el('h3', { class: 'q-sheet-h', text: t('modes') }), modes, el('h3', { class: 'q-sheet-h', text: t('rateLabel') }), sound);
}
