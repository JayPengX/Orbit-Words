// A word's sheet: everything about one word, from any list (a tap on a
// row). The word and its sound, the whole meaning, a line to remember it
// by, the words it's mixed up with (yours, then the usual ones; a tap opens
// theirs), how you've misspelt it, how it's going (answers, accuracy, the
// chance you still know it, when it's next asked), a bookmark, and "I know
// it" to put it away.
import * as kitUI from '#kit/ui.mjs';
import { el, put, diffLine } from '../ui.js';
import { state, t, hooks, hintOf, metaLine, percent, dueText, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { tag, ico } from './chrome.js';
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
  // A list's row (small): the count in the tag ("拼錯 ×2") and a misspelling as
  // the word itself with the letters missed marked (the row's title already
  // says the word; the typed one beside it ran out of the row). A card: the
  // tag, the typed one struck, the word under it, each on its own line.
  const tag = key => el('span', { class: 'miss-tag', text: `${t(key)}${small && misses > 1 ? ` ×${misses}` : ''}` });
  const count = !small && misses > 1 ? el('span', { class: 'miss-count', text: t('missesN', { n: misses }) }) : null;
  let body;
  if (how === 's' && spelt) body = small ? [tag('missSpelt'), diffLine(spellDiff(spelt, word.word), 'small q-fit')] : [tag('missSpelt'), el('s', { class: 'muted', text: spelt }), el('span', { class: 'miss-to' }, [document.createTextNode('→ '), diffLine(spellDiff(spelt, word.word), 'small')])];
  else if ((how === 'm' || how === 'w' || how === 'e') && other) body = [tag(how === 'e' ? 'missHeard' : 'missMixed'), el('strong', { class: small ? 'q-fit' : null, text: other.word }), el('span', { class: 'muted miss-mean', text: ` ${shortMeaning(other.zh)}` })];
  else if (how === 'u') body = [tag('missUnknown'), el('span', { class: 'muted miss-mean', text: shortMeaning(word.zh) })];
  else body = [tag(how === 'e' ? 'missEar' : 'missWrong'), el('span', { class: 'muted miss-mean', text: shortMeaning(word.zh) })];
  return el(small ? 'small' : 'p', { class: 'miss-note' }, [...body, count]);
}

let dialog = null;
let shell = null;
let box = null;
let lead = null;
const buzz = () => globalThis.orbitHaptic?.();

export function openWord(word) {
  if (!word) return;
  if (!dialog?.isConnected) {
    box = el('div', { class: 'word-body' });
    lead = el('span', { class: 'sheet-lead' });
    shell = kitUI.sheet({ title: '', lead, body: [box], cls: 'word-sheet', detent: 'large', closeLabel: t('close'), onClose: () => (dialog = null) });
    dialog = shell.el;
  }
  draw(word);
}
export const closeWord = () => dialog?.open && shell.close();

export function starButton(word, after = () => {}) {
  const on = isMarked(state.marks, word.key);
  const b = el('button', {
    class: `star${on ? ' on' : ''}`,
    type: 'button',
    'aria-pressed': String(on),
    'aria-label': on ? t('unmark') : t('mark'),
    onclick: e => {
      e.stopPropagation();
      buzz();
      state.marks = toggleMark(state.marks, word.key);
      hooks.changed();
      after();
    }
  });
  b.innerHTML = ico('star');
  return b;
}

const block = (label, body) => el('section', { class: 'sheet-block' }, [el('h3', { class: 'q-sheet-h', text: label }), ...[].concat(body)]);
function wordChips(keys, label) {
  const list = keys.map(k => state.byKey.get(k)).filter(Boolean);
  if (!list.length) return null;
  return block(label, el('div', { class: 'link-chips' }, list.map(w => el('button', { class: 'link-chip q-press', type: 'button', onclick: () => (buzz(), draw(w), dialog.scrollTo?.(0, 0)) }, [el('strong', { text: w.word }), el('small', { text: shortMeaning(w.zh) })]))));
}
// A misspelling: what was typed, struck, then the word with the letters missed marked.
export const speltRow = (s, word) => el('div', { class: 'spelt-row' }, [el('s', { class: 'muted', text: s }), el('span', { class: 'muted', text: '→' }), diffLine(spellDiff(s, word.word))]);
// The line to remember a word by (data/hints.json), when there is one.
export function tipBox(word) {
  const tip = hintOf(word.key)?.tip;
  if (!tip) return null;
  const mark = el('i', { class: 'gl', 'aria-hidden': 'true' });
  mark.innerHTML = ico('spark');
  return el('div', { class: 'tip' }, [mark, el('p', { text: tip })]);
}

function draw(word) {
  const p = state.progress[word.key];
  const info = wordInfo(p, Date.now(), personalFactor(state.cal));
  const hint = hintOf(word.key);
  const redraw = () => (draw(word), hooks.render());
  // Where it stands: plain words; only an overdue word earns a tag.
  const head = el('div', { class: 'sheet-state' }, [el('span', { class: 'muted', text: [t(`state_${info.state}`), p?.o === 2 ? t('lastMissed') : '', info.dueIn != null && info.dueIn > 0 ? dueText(info.dueIn) : ''].filter(Boolean).join(' · ') }), info.dueIn != null && info.dueIn <= 0 ? tag(dueText(info.dueIn), 'orange') : null]);
  lead.replaceChildren(starButton(word, redraw));
  const top = el('div', { class: 'sheet-word' }, [el('div', { class: 'word-line' }, [wordEl(word), speakButton(word)]), el('small', { class: 'muted', text: metaLine(word) }), el('p', { class: 'meaning', text: word.zh })]);
  const spelt = (p?.x || []).length ? block(t('youSpelt'), el('div', { class: 'q-card spelt' }, p.x.map(s => speltRow(s, word)))) : null;
  const numbers = info.answers
    ? el('div', { class: 'sheet-stats' }, [
        [String(info.answers), t('stAnswers')],
        [percent(info.accuracy), t('stAccuracy')],
        [percent(info.recall), t('stRecall')],
        [info.stability ? t('daysShort', { n: info.stability >= 10 ? Math.round(info.stability) : Math.round(info.stability * 10) / 10 }) : '—', t('stStability')]
      ].map(([v, l]) => el('div', {}, [el('strong', { class: 'num', text: v }), el('small', { text: l })])))
    : el('p', { class: 'none', text: t('neverAsked') });
  const known =
    info.state !== 'mastered'
      ? el('button', {
          class: 'q-btn block tinted',
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
  put(
    box,
    head,
    top,
    tipBox(word),
    spelt,
    wordChips(p?.c || [], t('mixedYours')),
    wordChips((hint?.common || []).filter(k => !(p?.c || []).includes(k)), t('mixedCommon')),
    block(t('howItGoes'), [numbers, info.lapses ? el('p', { class: 'lapses muted', text: t('lapsesLine', { n: info.lapses }) }) : null]),
    known
  );
}
