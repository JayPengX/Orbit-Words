// 練習: which levels, which way to learn, how fast the words are said, and
// the round.
import { el, put, section, bar, segmented } from '../ui.js';
import { state, t, hooks, levelName } from '../shell.js';
import { speak, RATES } from '../audio.js';
import { LEVELS, MODES, stats, wordOfDay } from '../lib/words.mjs';
import { startCard } from './today.js';

const MODE_ICON = { smart: '✨', meaning: '🔤', word: '🀄', listen: '🎧', letters: '🧩', cloze: '🕳️', spell: '✍️' };

export function renderPractice(box) {
  const st = stats(state.words, state.progress);
  const levelCard = l =>
    el('button', { class: `level-card${state.levels.includes(l) ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.levels.includes(l)), onclick: () => toggleLevel(l) }, [
      el('div', { class: 'level-top' }, [el('strong', { text: levelName(l) }), el('small', { text: t(`levelHint${l}`) })]),
      bar(st[l].mastered, st[l].total, 'accent'),
      el('div', { class: 'level-foot' }, [el('span', { class: 'num', text: `${st[l].mastered.toLocaleString()} / ${st[l].total.toLocaleString()}` }), st[l].due ? el('span', { class: 'due', text: t('dueN', { n: st[l].due }) }) : null])
    ]);
  const modes = el(
    'div',
    { class: 'mode-grid' },
    MODES.map(m =>
      el('button', { class: `mode${state.mode === m ? ' on' : ''}`, type: 'button', 'aria-pressed': String(state.mode === m), onclick: () => ((state.mode = m), hooks.changed(), hooks.render()) }, [
        el('span', { class: 'mode-icon', text: MODE_ICON[m] }),
        el('strong', { text: t(`mode_${m}`) }),
        el('small', { text: t(`modeHint_${m}`) })
      ])
    )
  );
  // The sound's speed, tried on the word of the day.
  const rate = RATES.includes(state.opt.rate) ? state.opt.rate : 1;
  const sound = el('div', { class: 'q-card pad rate-card' }, [
    el('div', { class: 'rate-row' }, [
      el('span', { text: t('rateLabel') }),
      segmented(
        RATES.map(r => ({ id: r, label: `${r}×` })),
        rate,
        r => {
          state.opt = { ...state.opt, rate: r };
          hooks.changed();
          hooks.render();
          speak(wordOfDay(state.words));
        }
      )
    ]),
    el('button', { class: 'q-btn small block', type: 'button', text: t('rateTry'), onclick: () => speak(wordOfDay(state.words)) })
  ]);
  put(box, section(t('levels'), el('div', { class: 'level-grid' }, LEVELS.map(levelCard))), section(t('modes'), modes, { sub: t('modesSub') }), section(t('soundTitle'), sound), startCard());
}

function toggleLevel(l) {
  state.levelsTouched = true;
  state.levels = state.levels.includes(l) ? state.levels.filter(x => x !== l) : [...state.levels, l].sort((a, b) => a - b);
  hooks.changed();
  hooks.render();
}
