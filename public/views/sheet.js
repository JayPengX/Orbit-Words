// A word's sheet: everything about one word, from any list (a tap on a
// row). The word and its sound, the whole meaning, a line to remember it
// by, the words it's mixed up with (yours, then the usual ones; a tap opens
// theirs), how you've misspelt it, how it's going (answers, accuracy, the
// chance you still know it, when it's next asked), a bookmark, and "I know
// it" to put it away.
import { el, put, diffLine } from '../ui.js';
import { state, t, hooks, hintOf, metaLine, percent, dueText, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { shortMeaning, spellDiff, markKnown, personalFactor } from '../lib/words.mjs';
import { isMarked, toggleMark, wordInfo } from '../lib/review.mjs';

// How a word went wrong the last time, in one line (複習's rows, the flash
// cards): misspelt (crossed out, then where it differs), taken for another
// word (選成 · that word and its meaning), not known, or missed by ear;
// with how many misses all told. Null when it hasn't been missed.
export function missNote(word, p, { small = true } = {}) {
  if (!p || !((p.n || 0) > (p.r || 0))) return null;
  const misses = (p.n || 0) - (p.r || 0);
  const other = p.c?.[0] ? state.byKey.get(p.c[0]) : null;
  const spelt = p.x?.[0];
  const how = p.h || (spelt ? 's' : other ? 'm' : '');
  const count = misses > 1 ? el('span', { class: 'miss-count', text: t('missesN', { n: misses }) }) : null;
  let body;
  if (how === 's' && spelt) body = [el('span', { class: 'miss-tag', text: t('missSpelt') }), el('s', { class: 'muted', text: spelt }), document.createTextNode(' → '), diffLine(spellDiff(spelt, word.word), small ? 'small' : '')];
  else if ((how === 'm' || how === 'w' || how === 'e') && other) body = [el('span', { class: 'miss-tag', text: t(how === 'e' ? 'missHeard' : 'missMixed') }), el('strong', { text: other.word }), el('span', { class: 'muted miss-mean', text: ` ${shortMeaning(other.zh)}` })];
  else if (how === 'u') body = [el('span', { class: 'miss-tag', text: t('missUnknown') }), el('span', { class: 'muted miss-mean', text: shortMeaning(word.zh) })];
  else body = [el('span', { class: 'miss-tag', text: t(how === 'e' ? 'missEar' : 'missWrong') }), el('span', { class: 'muted miss-mean', text: shortMeaning(word.zh) })];
  return el(small ? 'small' : 'p', { class: 'miss-note' }, [...body, count]);
}

let dialog = null;
const buzz = () => globalThis.quadraHaptic?.();

export function openWord(word) {
  if (!word) return;
  if (!dialog) {
    dialog = el('dialog', { class: 'q-sheet word-sheet', 'aria-label': word.word });
    dialog.addEventListener('click', e => e.target === dialog && dialog.close());
    document.body.append(dialog);
  }
  draw(word);
  if (!dialog.open) dialog.showModal();
}
export const closeWord = () => dialog?.open && dialog.close();

export function starButton(word, after = () => {}) {
  const on = isMarked(state.marks, word.key);
  return el('button', {
    class: `star${on ? ' on' : ''}`,
    type: 'button',
    'aria-pressed': String(on),
    'aria-label': on ? t('unmark') : t('mark'),
    text: on ? '★' : '☆',
    onclick: e => {
      e.stopPropagation();
      buzz();
      state.marks = toggleMark(state.marks, word.key);
      hooks.changed();
      after();
    }
  });
}

function wordChips(keys, label) {
  const list = keys.map(k => state.byKey.get(k)).filter(Boolean);
  if (!list.length) return null;
  return el('div', { class: 'sheet-block' }, [
    el('h3', { class: 'q-sheet-h', text: label }),
    el('div', { class: 'link-chips' }, list.map(w => el('button', { class: 'link-chip', type: 'button', onclick: () => (buzz(), draw(w), dialog.scrollTo?.(0, 0)) }, [el('strong', { text: w.word }), el('small', { text: shortMeaning(w.zh) })])))
  ]);
}

function draw(word) {
  const p = state.progress[word.key];
  const info = wordInfo(p, Date.now(), personalFactor(state.cal));
  const hint = hintOf(word.key);
  const redraw = () => (draw(word), hooks.render());
  const head = el('div', { class: 'q-sheet-head' }, [
    el('div', { class: 'sheet-title' }, [el('span', { class: `pill ${info.state}`, text: t(`state_${info.state}`) }), p?.o === 2 ? el('span', { class: 'pill missed', text: t('lastMissed') }) : null, info.dueIn != null ? el('small', { class: 'muted', text: dueText(info.dueIn) }) : null]),
    el('div', { class: 'sheet-actions' }, [starButton(word, redraw), el('button', { class: 'q-close', type: 'button', 'aria-label': t('close'), text: '×', onclick: () => dialog.close() })])
  ]);
  const top = el('div', { class: 'sheet-word' }, [el('div', { class: 'word-line' }, [wordEl(word), speakButton(word)]), el('small', { class: 'muted', text: metaLine(word) })]);
  const meaning = el('p', { class: 'meaning sheet-meaning', text: word.zh });
  const tip = hint?.tip ? el('div', { class: 'tip' }, [el('small', { class: 'tip-label', text: t('tipLabel') }), el('p', { text: hint.tip })]) : null;
  const spelt = (p?.x || []).length
    ? el('div', { class: 'sheet-block' }, [el('h3', { class: 'q-sheet-h', text: t('youSpelt') }), el('div', { class: 'spelt' }, p.x.map(s => el('div', { class: 'spelt-row' }, [el('s', { class: 'muted', text: s }), el('span', { class: 'muted', text: '→' }), diffLine(spellDiff(s, word.word))])))])
    : null;
  const yours = wordChips(p?.c || [], t('mixedYours'));
  const common = wordChips((hint?.common || []).filter(k => !(p?.c || []).includes(k)), t('mixedCommon'));
  const numbers = info.answers
    ? el('div', { class: 'sheet-stats' }, [
        el('div', {}, [el('strong', { class: 'num', text: String(info.answers) }), el('small', { text: t('stAnswers') })]),
        el('div', {}, [el('strong', { class: 'num', text: percent(info.accuracy) }), el('small', { text: t('stAccuracy') })]),
        el('div', {}, [el('strong', { class: 'num', text: percent(info.recall) }), el('small', { text: t('stRecall') })]),
        el('div', {}, [el('strong', { class: 'num', text: info.stability ? t('daysShort', { n: info.stability >= 10 ? Math.round(info.stability) : Math.round(info.stability * 10) / 10 }) : '—' }), el('small', { text: t('stStability') })])
      ])
    : el('p', { class: 'muted small', text: t('neverAsked') });
  const known =
    info.state !== 'mastered'
      ? el('button', {
          class: 'q-btn block',
          type: 'button',
          text: t('iKnowIt'),
          onclick: () => {
            buzz();
            state.progress = { ...state.progress, [word.key]: markKnown(p) };
            state.study = state.study.filter(k => k !== word.key);
            hooks.changed();
            redraw();
          }
        })
      : null;
  put(dialog, head, top, meaning, tip, spelt, yours, common, el('h3', { class: 'q-sheet-h', text: t('howItGoes') }), numbers, info.lapses ? el('p', { class: 'muted small', text: t('lapsesLine', { n: info.lapses }) }) : null, known);
}
