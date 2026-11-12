// A word's sheet: everything about one word, from any list (a tap on a
// row). The word and its sound, the whole meaning, the words it's mixed up with (yours, then the usual ones; a tap opens
// theirs), how you've misspelt it, how it's going (the chance you still
// know it, answers right, when it's next asked), and a bookmark. Whether a
// word is known is the memory model's call alone, from the answers: there's
// no "I know it" to put a word away by hand (Jay 2026-10-31).
import * as kitUI from '#kit/ui.mjs';
import { packJson } from '#kit/orbit.mjs';
import { el, put, diffLine } from '../ui.js';
import { state, t, hooks, hintOf, moreOf, metaLine, percent, wordEl, locale } from '../shell.js';
import { speakButton } from '../audio.js';
import { ico, row, rowCard, bar } from './chrome.js';
import { shortMeaning, spellDiff, personalFactor, senses } from '../lib/words.mjs';
import { isMarked, toggleMark, wordInfo } from '../lib/review.mjs';
import { cardOf, cardsPath, wordDiff } from '../lib/cards.mjs';

// The family's AI (Jay 11-10), loaded beside the sheet, never in its way:
// a phone that can't load it shows the sheet without 用它造句.
let kitAI = null;
const aiReady = import('#kit/ai.mjs').then(m => (kitAI = m), () => null);

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
// Where a word is drawn: the sheet, or (a wide screen's 複習 and 單字) the
// pane beside the list (wordPane).
const inSheet = { get box() { return box; }, get lead() { return lead; }, top: () => dialog?.scrollTo?.(0, 0) };
let pane = null;
let paneKey = '';

export function openWord(word) {
  if (!word) return;
  if (pane?.el.isConnected && pane.el.offsetParent && !state.session) return drawPane(word);
  if (!dialog?.isConnected) {
    box = el('div', { class: 'word-body' });
    lead = el('span', { class: 'sheet-lead' });
    shell = kitUI.sheet({ title: '', lead, body: [box], cls: 'word-sheet', detent: 'large', closeLabel: t('close'), onClose: () => (dialog = null) });
    dialog = shell.el;
  }
  draw(word, inSheet);
}
export const closeWord = () => dialog?.open && shell.close();
// Drawn again when something it shows arrives late (data/more.json).
let current = null;
export const redrawWord = () => dialog?.open && current && draw(current, inSheet);
// The word drawn again wherever it's open (its cards landed, its sentence checked).
function redrawShown(word) {
  if (dialog?.open && current?.key === word.key) draw(word, inSheet);
  if (pane?.el.isConnected && paneKey === word.key) draw(word, pane);
}

// 例句與記憶法: made once for the whole list by the family's builder
// (/data/words/cards/<letter>.json), a letter read the first time one of
// its words opens and kept on the phone a day (kit packJson); the sheet
// drawn again when it lands. A failed read is asked again at the next open.
const letters = new Map();
function cardFor(word) {
  const path = cardsPath(word.word);
  const got = letters.get(path);
  if (got === undefined) {
    const read = packJson(path, { ttl: 24 * 3_600_000 }).then(
      doc => (letters.set(path, doc || null), doc && redrawShown(word)),
      () => letters.delete(path)
    );
    letters.set(path, read);
    return null;
  }
  if (!got || got instanceof Promise) return null;
  return cardOf(got, word.word, { own: moreOf(word.key)?.en, known: state.byKey });
}

// A wide screen: the word opened beside its list (DESIGN §10: a list and
// what it opens, side by side), the one last opened there, else the list's
// first. Null when there's nothing to show.
export function wordPane(fallback) {
  const word = state.byKey.get(paneKey) || fallback;
  if (!word) return null;
  // Drawn again (a star tapped in it, progress saved): the same word stays
  // where it was read to, never back at its top (Jay 2026-11-07).
  const was = pane?.el.isConnected && paneKey === word.key ? pane.el.scrollTop : 0;
  const b = el('div', { class: 'word-body' });
  const l = el('span', { class: 'sheet-lead' });
  pane = { el: el('aside', { class: 'word-pane word-sheet', 'aria-live': 'polite' }, [el('div', { class: 'pane-head' }, [l]), b]), box: b, lead: l, top: () => pane.el.scrollTo?.(0, 0) };
  drawPane(word, false);
  if (was) {
    const at = pane.el;
    requestAnimationFrame(() => at.scrollTo?.(0, was));
  }
  return pane.el;
}
function drawPane(word, scroll = true) {
  paneKey = word.key;
  draw(word, pane);
  if (scroll) pane.top();
  // The row it came from, marked (and every other one not).
  requestAnimationFrame(() => {
    for (const r of document.querySelectorAll('.wr[data-key]')) r.setAttribute('aria-current', String(r.dataset.key === word.key));
  });
}

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
function wordChips(keys, label, at) {
  const list = keys.map(k => state.byKey.get(k)).filter(Boolean);
  if (!list.length) return null;
  return block(label, rowCard(list.map(w => row({ title: w.word, sub: shortMeaning(w.zh), lang: true, cls: 'link-row', onClick: () => (buzz(), at === pane ? drawPane(w) : (draw(w, at), at.top())) }))));
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
// The examples: Tatoeba's (the dictionary's own), then the AI's two, each
// marked AI; then the memory hook, then the word's forms.
function moreBlocks(word, card) {
  const more = moreOf(word.key);
  const forms = [word.word, ...(more?.forms || [])];
  const list = [...(more?.en ? [{ en: more.en, zh: more.zh }] : []), ...(card?.ex || []).map(e => ({ ...e, ai: true }))];
  const one = e => el('div', { class: 'ex-one' }, [exampleLine(e.en, forms), el('p', { lang: 'zh-Hant', class: 'ex-zh muted' }, [e.ai ? el('span', { class: 'ex-ai', lang: 'en', text: 'AI' }) : null, document.createTextNode(e.zh || '')])]);
  const example = list.length ? block(t(list.length > 1 ? 'examplesTitle' : 'exampleTitle'), el('div', { class: 'q-card example' }, list.map(one))) : null;
  const hook = card?.hook ? block(t('hookTitle'), el('div', { class: 'q-card hook' }, [el('p', { lang: 'zh-Hant', class: 'hook-text', text: card.hook })])) : null;
  const formsBlock = more?.forms.length ? block(t('formsTitle'), el('p', { lang: 'en', class: 'forms' }, more.forms.map(f => el('span', { text: f })))) : null;
  return [example, hook, formsBlock];
}

// 用它造句 (檢查我的句子): a sentence with the word, checked by the AI
// (words-check: natural, right meaning and form), the fewest changes shown
// word by word with one line on why. The last check of each word is kept
// while the app is open, so a redraw keeps it.
const tries = new Map();
function tryBlock(word) {
  const out = el('div', { class: 'try-out', 'aria-live': 'polite' });
  const body = el('div', { class: 'try' }, [el('p', { class: 'muted try-hint', text: t('tryHint', { w: word.word }) }), out]);
  const show = () => {
    const at = tries.get(word.key);
    if (!at) return out.replaceChildren();
    const said = el('p', { lang: 'en', class: 'try-said' }, [el('span', { class: 'muted', text: `${t('trySaid')}　` }), document.createTextNode(at.said)]);
    if (at.busy) return out.replaceChildren(said, kitAI.aiAnswerWait?.({ text: t('tryBusy'), rows: 2, pics: false }) || kitAI.aiThinking(t('tryBusy')));
    const r = at.r;
    if (r.error || !r.out) return out.replaceChildren(said, el('p', { class: 'try-err', text: kitAI.aiSays(r.error, r.left) }));
    const { ok, fixed, why, used } = r.out;
    const good = ok && used !== false;
    const parts = [said];
    if (good) parts.push(el('p', { class: 'try-ok', text: `✓ ${t('tryOk')}` }));
    else {
      if (used === false) parts.push(el('p', { class: 'try-miss', text: t('tryNotUsed', { w: word.word }) }));
      if (fixed && fixed.trim() !== at.said.trim()) parts.push(el('div', { class: 'try-fix' }, [el('span', { class: 'try-fix-h', text: t('tryFix') }), el('p', { lang: 'en', class: 'try-fixed' }, wordDiff(at.said, fixed).flatMap((w, i) => [i ? document.createTextNode(' ') : null, w.changed ? el('strong', { text: w.text }) : document.createTextNode(w.text)]))]));
    }
    if (why) parts.push(el('p', { class: 'try-why', text: why }));
    parts.push(kitAI.aiNote(t('tryNote')));
    out.replaceChildren(...parts);
  };
  const fill = () => {
    if (!kitAI) return body.closest('.sheet-block')?.remove();
    const bar = kitAI.aiBar({
      placeholder: t('tryPlaceholder', { w: word.word }),
      label: t('tryTitle'),
      max: 300,
      onSend: async said => {
        bar.busy(true);
        tries.set(word.key, { said, busy: true });
        show();
        const r = await kitAI.aiCall('words-check', { word: word.word, meaning: shortMeaning(word.zh), sentence: said, lang: locale });
        tries.set(word.key, { said, r });
        bar.busy(false);
        if (!r.error) bar.clear();
        body.isConnected ? show() : redrawShown(word);
      }
    });
    body.insertBefore(bar, out);
    show();
  };
  kitAI ? fill() : aiReady.then(fill);
  return block(t('tryTitle'), body);
}

function draw(word, at) {
  if (at === inSheet) current = word;
  const p = state.progress[word.key];
  const info = wordInfo(p, Date.now(), personalFactor(state.cal));
  const hint = hintOf(word.key);
  const card = cardFor(word);
  const redraw = () => (at === inSheet && draw(word, at), hooks.render());
  // Where it stands: plain words; only an overdue word earns a tag.
  // (When it's next asked is said once, in 學習紀錄: here it read 過期 18 天 over a 下次複習 今天.)
  const head = el('div', { class: 'sheet-state' }, [el('span', { class: 'muted', text: [t(`state_${info.state}`), p?.o === 2 ? t('lastMissed') : ''].filter(Boolean).join(' · ') })]);
  at.lead.replaceChildren(starButton(word, redraw));
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
    at.box,
    head,
    top,
    ...moreBlocks(word, card),
    tryBlock(word),
    spelt,
    wordChips(p?.c || [], t('mixedYours'), at),
    wordChips([...new Set([...(hint?.common || []), ...(card?.confuse || [])])].filter(k => !(p?.c || []).includes(k)).slice(0, 4), t('mixedCommon'), at),
    block(t('howItGoes'), record),
    el('p', { class: 'credit muted', text: t(card?.ex.length ? 'dictCreditAi' : 'dictCredit') })
  );
}
