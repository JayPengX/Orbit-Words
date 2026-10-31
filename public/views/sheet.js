// A word's sheet: everything about one word, from any list (a tap on a
// row). The word and its sound, the whole meaning, the words it's mixed up with (yours, then the usual ones; a tap opens
// theirs), how you've misspelt it, how it's going (the chance you still
// know it, answers right, when it's next asked), and a bookmark. Whether a
// word is known is the memory model's call alone, from the answers: there's
// no "I know it" to put a word away by hand (Jay 2026-10-31).
import * as kitUI from '#kit/ui.mjs';
import { el, put, diffLine } from '../ui.js';
import { state, t, hooks, hintOf, moreOf, metaLine, percent, wordEl } from '../shell.js';
import { speakButton } from '../audio.js';
import { ico, row, rowCard, bar } from './chrome.js';
import { shortMeaning, spellDiff, personalFactor, senses } from '../lib/words.mjs';
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
  else if ((how === 'm' || how === 'w' || how === 'e') && other) body = [tag(how === 'e' ? 'missHeard' : 'missMixed'), el('strong', { class: small ? 'q-fit' : null, text: other.word }), el('span', { lang: 'zh-Hant', class: 'muted miss-mean', text: ` ${shortMeaning(other.zh)}` })];
  else if (how === 'u') body = [tag('missUnknown'), el('span', { lang: 'zh-Hant', class: 'muted miss-mean', text: shortMeaning(word.zh) })];
  else body = [tag(how === 'e' ? 'missEar' : 'missWrong'), el('span', { lang: 'zh-Hant', class: 'muted miss-mean', text: shortMeaning(word.zh) })];
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
// Drawn again when something it shows arrives late (data/more.json).
let current = null;
export const redrawWord = () => dialog?.open && current && draw(current);

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
  return block(label, rowCard(list.map(w => row({ title: w.word, sub: shortMeaning(w.zh), cls: 'link-row', onClick: () => (buzz(), draw(w), dialog.scrollTo?.(0, 0)) }))));
}
// A misspelling: what was typed, struck, then the word with the letters missed marked.
export const speltRow = (s, word) => el('div', { class: 'spelt-row' }, [el('s', { class: 'muted', text: s }), el('span', { class: 'muted', text: '→' }), diffLine(spellDiff(s, word.word))]);

// The whole meaning, a sense a row: its part of speech, then the Chinese.
export function senseList(word) {
  const list = senses(word.zh);
  if (!list.some(x => x.pos)) return el('p', { lang: 'zh-Hant', class: 'meaning', text: word.zh });
  return el('ol', { class: 'senses' }, list.map(x => el('li', {}, [el('span', { lang: 'en', class: 'sense-pos', text: x.pos }), el('span', { lang: 'zh-Hant', class: 'sense-zh', text: x.text })])));
}
// The example sentence, the word in it marked (any of its forms), and its Chinese.
function exampleLine(en, forms) {
  const words = [...forms].filter(Boolean).sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = words.length ? new RegExp(`\\b(${words.join('|')})\\b`, 'i') : null;
  const m = re && en.match(re);
  if (!m) return el('p', { lang: 'en', class: 'ex-en', text: en });
  return el('p', { lang: 'en', class: 'ex-en' }, [document.createTextNode(en.slice(0, m.index)), el('strong', { text: m[0] }), document.createTextNode(en.slice(m.index + m[0].length))]);
}
function moreBlocks(word) {
  const more = moreOf(word.key);
  if (!more) return [];
  const example = more.en ? block(t('exampleTitle'), el('div', { class: 'q-card example' }, [exampleLine(more.en, [word.word, ...more.forms]), el('p', { lang: 'zh-Hant', class: 'ex-zh muted', text: more.zh })])) : null;
  const forms = more.forms.length ? block(t('formsTitle'), el('p', { lang: 'en', class: 'forms' }, more.forms.map(f => el('span', { text: f })))) : null;
  return [example, forms];
}

function draw(word) {
  current = word;
  const p = state.progress[word.key];
  const info = wordInfo(p, Date.now(), personalFactor(state.cal));
  const hint = hintOf(word.key);
  const redraw = () => (draw(word), hooks.render());
  // Where it stands: plain words; only an overdue word earns a tag.
  // (When it's next asked is said once, in 學習紀錄: here it read 過期 18 天 over a 下次複習 今天.)
  const head = el('div', { class: 'sheet-state' }, [el('span', { class: 'muted', text: [t(`state_${info.state}`), p?.o === 2 ? t('lastMissed') : ''].filter(Boolean).join(' · ') })]);
  lead.replaceChildren(starButton(word, redraw));
  const top = el('div', { class: 'sheet-word' }, [el('div', { class: 'word-line' }, [wordEl(word), speakButton(word)]), el('small', { lang: 'en', class: 'muted', text: metaLine(word) }), senseList(word)]);
  const spelt = (p?.x || []).length ? block(t('youSpelt'), el('div', { class: 'q-card spelt' }, p.x.map(s => speltRow(s, word)))) : null;
  // 學習紀錄: the chance it's known now (its bar), answers right, when it's
  // next asked; a line under says who decides (the answers, not a button).
  const next = info.dueIn == null ? '' : info.dueIn < 0 ? t('overdueN', { n: -info.dueIn }) : info.dueIn === 0 ? t('nextToday') : info.dueIn === 1 ? t('nextTomorrow') : t('nextInN', { n: info.dueIn });
  const record = info.answers
    ? [
        rowCard([
          // (Not right after a miss: the model starts it again from the answer just seen, 100%, which read as a reward for the miss.)
          p?.o === 2 ? null : row({ title: t('stRecall'), value: percent(info.recall), body: info.recall != null ? bar(Math.round(info.recall * 100), 100, 'mini-bar recall-bar') : null }),
          row({ title: t('stRight'), value: t('rightOfN', { r: info.right, n: info.answers }) }),
          next ? row({ title: t('stNext'), value: next, cls: info.dueIn < 0 ? 'late' : '' }) : null,
          info.lapses ? row({ title: t('stLapses'), value: t('timesN', { n: info.lapses }) }) : null
        ], 'record-card'),
        el('p', { class: 'record-note muted', text: t('recordNote') })
      ]
    : el('p', { class: 'none', text: t('neverAsked') });
  put(
    box,
    head,
    top,
    ...moreBlocks(word),
    spelt,
    wordChips(p?.c || [], t('mixedYours')),
    wordChips((hint?.common || []).filter(k => !(p?.c || []).includes(k)), t('mixedCommon')),
    block(t('howItGoes'), record),
    el('p', { class: 'credit muted', text: t('dictCredit') })
  );
}
