// 練習: the round (the hero), which levels, which way to learn, and how fast
// the words are said.
import { el, put, section, segmented } from '../ui.js';
import { state, t, hooks, levelName, settingsChanged, joined } from '../shell.js';
import { speak, RATES } from '../audio.js';
import { LEVELS, MODES, stats, wordOfDay } from '../lib/words.mjs';
import { roundActions } from './today.js';
import { pageHead, heroEyebrow, heroTag, row, rowCard, miniBar, checkDot, tag, tile } from './chrome.js';

const MODE_ICON = { smart: 'spark', meaning: 'book', word: 'list', listen: 'bell', letters: 'grid', cloze: 'search', spell: 'pencil' };
const MODE_COLOR = { smart: 'var(--q-accent)', meaning: 'var(--q-blue)', word: 'var(--q-indigo)', listen: 'var(--q-orange)', letters: 'var(--q-teal)', cloze: 'var(--q-purple)', spell: 'var(--q-green)' };
const LEVEL_COLOR = ['', 'var(--q-green)', 'var(--q-mint)', 'var(--q-blue)', 'var(--q-indigo)', 'var(--q-purple)', 'var(--q-pink)'];

export function renderPractice(box) {
  const st = stats(state.words, state.progress);
  const chosen = LEVELS.filter(l => state.levels.includes(l));
  const due = chosen.reduce((s, l) => s + st[l].due, 0);
  const fresh = chosen.reduce((s, l) => s + st[l].total - st[l].seen, 0);

  const hero = el('div', { class: 'q-hero-card words-hero' }, [
    heroEyebrow('target', chosen.length ? joined(chosen.map(levelName)) : t('pickLevel')),
    el('strong', { class: 'q-hc-big', text: due.toLocaleString() }),
    el('p', { class: 'q-hc-sub', text: t('stDue') }),
    el('div', { class: 'q-hc-row' }, [heroTag('book', `${t('stLeft')} ${fresh.toLocaleString()}`), heroTag('check', `${t(`mode_${state.mode}`)}`)]),
    roundActions()
  ]);

  const levels = rowCard(
    LEVELS.map(l => {
      const on = state.levels.includes(l);
      return row({
        icon: String(l),
        color: LEVEL_COLOR[l],
        soft: !on,
        title: levelName(l),
        sub: t(`levelHint${l}`),
        tags: st[l].due ? [tag(t('dueN', { n: st[l].due }), 'orange')] : null,
        body: miniBar(st[l].mastered, st[l].total, LEVEL_COLOR[l]),
        value: `${st[l].mastered.toLocaleString()} / ${st[l].total.toLocaleString()}`,
        trailing: checkDot(on),
        pressed: on,
        chevron: false,
        onClick: () => toggleLevel(l)
      });
    })
  );
  const modes = rowCard(
    MODES.map(m =>
      row({ icon: MODE_ICON[m], color: MODE_COLOR[m], title: t(`mode_${m}`), sub: t(`modeHint_${m}`), trailing: checkDot(state.mode === m), pressed: state.mode === m, chevron: false, onClick: () => ((state.mode = m), settingsChanged(), hooks.render()) })
    )
  );
  // The sound's speed, tried on the word of the day.
  const rate = RATES.includes(state.opt.rate) ? state.opt.rate : 1;
  const sound = el('div', { class: 'q-rowcard' }, [
    el('div', { class: 'q-ritem rate-item' }, [
      tile('live', 'var(--q-teal)'),
      el('span', { class: 'q-ritem-text' }, [
        el('span', { class: 'q-ritem-title', text: t('rateLabel') }),
        segmented(
          RATES.map(r => ({ id: r, label: `${r}×` })),
          rate,
          r => {
            state.opt = { ...state.opt, rate: r };
            settingsChanged();
            hooks.render();
            speak(wordOfDay(state.words));
          }
        )
      ])
    ]),
    row({ icon: 'play', color: 'var(--q-accent)', title: t('rateTry'), onClick: () => speak(wordOfDay(state.words)) })
  ]);
  put(box, pageHead(t('tab_practice')), hero, section(t('levels'), levels), section(t('modes'), modes), section(t('soundTitle'), sound));
}

function toggleLevel(l) {
  state.levels = state.levels.includes(l) ? state.levels.filter(x => x !== l) : [...state.levels, l].sort((a, b) => a - b);
  settingsChanged();
  hooks.render();
}
