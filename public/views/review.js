// 複習: the words to go back over, a category at a time (答錯, 該複習,
// 學習中, 收藏), searched and sorted, with flash cards of the weakest and a
// round on the ones due. Each row opens the word's sheet.
import { el, put, segmented, chips, searchField, diffLine, pagedList } from '../ui.js';
import { state, t, hooks, dueText } from '../shell.js';
import { speakButton } from '../audio.js';
import { shortMeaning, spellDiff, stateOf } from '../lib/words.mjs';
import { CATS, SORTS, catCounts, reviewList, flashDeck, wordInfo, isMarked } from '../lib/review.mjs';
import { startFlash, startRound } from './session.js';
import { openWord, missNote } from './sheet.js';
import { pageHead, heroEyebrow, heroTag, tile, ico, SIZES as _S, tag } from './chrome.js';

const view = { cat: 'wrong', sort: 'weak', query: '', deck: 20, picked: false };
export const DECKS = [10, 20, 50];

export function renderReview(box) {
  const counts = catCounts(state.words, state.progress, { marks: state.marks });
  // Open on the first category with something in it, until one is picked.
  if (!view.picked && !counts[view.cat]) view.cat = CATS.find(c => counts[c]) || 'wrong';
  const cats = segmented(
    CATS.map(c => ({ id: c, label: t(`cat_${c}`), count: counts[c] })),
    view.cat,
    c => ((view.cat = c), (view.picked = true), hooks.render()),
    'cat-seg'
  );
  const n = counts[view.cat];
  const listBox = el('div', { class: 'review-list' });
  const drawList = () => put(listBox, list());
  const tools = n
    ? el('div', { class: 'list-tools' }, [
        searchField(view.query, t('searchReview'), q => ((view.query = q), drawList())),
        chips(SORTS.map(s => ({ id: s, label: t(`sort_${s}`) })), view.sort, s => ((view.sort = s), hooks.render()), 'small')
      ])
    : null;
  drawList();
  put(box, pageHead(t('tab_review'), t('wordsCount', { n: n.toLocaleString() })), cats, n ? flashCard(n) : emptyCard(), tools, listBox);
}

// Flash cards of the category's weakest words; a round on what's due.
function flashCard(n) {
  // The deck sizes: 10, 20, 50 under the count, and all of them (up to 50);
  // the one picked, or the nearest there is when the count has moved since.
  const sizes = DECKS.filter(d => d < n).concat(n <= 50 ? [n] : []);
  const size = sizes.includes(view.deck) ? view.deck : sizes.filter(d => d <= view.deck).at(-1) ?? sizes[0];
  const deck = () => flashDeck(state.words, state.progress, view.cat, { n: size, marks: state.marks });
  const nextSize = sizes[(sizes.indexOf(size) + 1) % sizes.length];
  const sizeBtn = n > 10 ? el('button', { class: 'q-hc-btn ghost q-press', type: 'button', 'aria-label': t('deckSize'), onclick: () => ((view.deck = nextSize), hooks.render()) }) : null;
  if (sizeBtn) {
    sizeBtn.innerHTML = ico('swap');
    sizeBtn.append(el('span', { text: size === n ? t('allN', { n }) : String(size) }));
  }
  const open = el('button', { class: 'q-hc-btn q-press', type: 'button', onclick: () => startFlash(deck(), t(`cat_${view.cat}`)) }, [t('flashStart')]);
  const test = el('button', { class: 'q-hc-btn ghost q-press', type: 'button', onclick: () => startRound({ from: 'flash', list: deck() }) }, [t('testThese')]);
  return el('div', { class: 'q-hero-card words-hero' }, [heroEyebrow('history', t(`cat_${view.cat}`)), el('strong', { class: 'q-hc-big', text: n.toLocaleString() }), el('p', { class: 'q-hc-sub', text: t(`catHint_${view.cat}`) }), el('div', { class: 'q-hc-row' }, [open, test, sizeBtn])]);
}
const emptyCard = () => el('div', { class: 'q-ambient empty-card', style: '--amb: var(--q-green)' }, [tile(view.cat === 'marked' ? 'star' : 'check', 'var(--q-green)', 'lg'), el('p', { class: 'muted', text: t(`catEmpty_${view.cat}`) })]);

function list() {
  const items = reviewList(state.words, state.progress, view.cat, { marks: state.marks, sort: view.sort, query: view.query });
  if (!items.length && view.query) return el('p', { class: 'empty muted', text: t('noMatch') });
  return pagedList(items, wordRow, { more: t('showMore'), cls: 'q-rowcard list' });
}

// A word in a list: its sound, the word and meaning (and how it was last
// misspelt), and where it stands.
const stateTone = (info, p) => (info.dueIn != null && info.dueIn <= 0 ? 'orange' : info.state === 'mastered' ? 'green' : info.state === 'learning' ? 'tint' : '');
export function wordRow(w) {
  const p = state.progress[w.key];
  const info = wordInfo(p);
  const side = info.state === 'new' ? t('state_new') : info.dueIn != null && info.dueIn <= 0 ? dueText(info.dueIn) : t(`state_${stateOf(p)}`);
  return el('button', { class: 'word-row q-ritem', type: 'button', onclick: () => openWord(w) }, [
    speakButton(w),
    el('div', { class: 'word-row-main' }, [
      el('div', { class: 'word-row-top' }, [el('strong', { text: w.word }), isMarked(state.marks, w.key) ? el('span', { class: 'mini-star', text: '★' }) : null]),
      // How it went wrong last time where it was missed (misspelt, taken for another word, not known); else its meaning.
      (p?.o === 2 && missNote(w, p)) || el('small', { class: 'muted', text: shortMeaning(w.zh) })
    ]),
    el('small', { class: `q-tag ${stateTone(info, p)}`.trim(), text: side })
  ]);
}
