// 複習: the words to go back over, a category at a time (答錯, 該複習,
// 學習中, 收藏), searched and sorted, with flash cards of the weakest and a
// round on the ones due. Each row opens the word's sheet.
import { el, put, segmented, chips, searchField, diffLine, pagedList } from '../ui.js';
import { state, t, hooks, dueText } from '../shell.js';
import { speakButton } from '../audio.js';
import { shortMeaning, spellDiff, stateOf } from '../lib/words.mjs';
import { CATS, SORTS, catCounts, reviewList, flashDeck, wordInfo, isMarked } from '../lib/review.mjs';
import { startFlash, startRound } from './session.js';
import { openWord } from './sheet.js';

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
  put(box, cats, el('p', { class: 'section-sub cat-sub', text: t(`catHint_${view.cat}`) }), n ? flashCard(n) : emptyCard(), tools, listBox);
}

// Flash cards of the category's weakest words; a round on what's due.
function flashCard(n) {
  const size = Math.min(n, 50);
  return el('div', { class: 'q-card pad flash-launch' }, [
    el('div', { class: 'flash-top' }, [el('span', { class: 'nudge-icon', text: '🎴' }), el('div', {}, [el('strong', { text: t('flashTitle') }), el('small', { class: 'muted', text: t('flashSub') })])]),
    n > 10 ? el('div', { class: 'size-row' }, [el('span', { class: 'muted', text: t('deckSize') }), segmented(DECKS.filter(d => d < n).concat(n <= 50 ? [n] : []).map(d => ({ id: d, label: d === n ? t('allN', { n }) : String(d) })), Math.min(view.deck, size), d => ((view.deck = d), hooks.render()))]) : null,
    el('div', { class: 'two-btn' }, [
      el('button', { class: 'q-btn primary', type: 'button', text: t('flashStart'), onclick: () => startFlash(flashDeck(state.words, state.progress, view.cat, { n: Math.min(view.deck, size), marks: state.marks }), t(`cat_${view.cat}`)) }),
      el('button', { class: 'q-btn', type: 'button', text: t('testThese'), onclick: () => startRound({ from: 'flash', list: flashDeck(state.words, state.progress, view.cat, { n: Math.min(view.deck, size), marks: state.marks }) }) })
    ])
  ]);
}
const emptyCard = () => el('div', { class: 'q-card pad empty-card' }, [el('span', { class: 'empty-icon', text: view.cat === 'marked' ? '☆' : '✓' }), el('p', { class: 'muted', text: t(`catEmpty_${view.cat}`) })]);

function list() {
  const items = reviewList(state.words, state.progress, view.cat, { marks: state.marks, sort: view.sort, query: view.query });
  if (!items.length && view.query) return el('p', { class: 'empty muted', text: t('noMatch') });
  return pagedList(items, wordRow, { more: t('showMore') });
}

// A word in a list: its sound, the word and meaning (and how it was last
// misspelt), and where it stands.
export function wordRow(w) {
  const p = state.progress[w.key];
  const info = wordInfo(p);
  const spelt = p?.o === 2 && p.x?.[0];
  const side = info.state === 'new' ? t('state_new') : info.dueIn != null && info.dueIn <= 0 ? dueText(info.dueIn) : t(`state_${stateOf(p)}`);
  return el('button', { class: 'word-row', type: 'button', onclick: () => openWord(w) }, [
    speakButton(w),
    el('div', { class: 'word-row-main' }, [
      el('div', { class: 'word-row-top' }, [el('strong', { text: w.word }), isMarked(state.marks, w.key) ? el('span', { class: 'mini-star', text: '★' }) : null]),
      spelt ? el('small', { class: 'row-diff' }, [el('s', { class: 'muted', text: spelt }), ' → ', diffLine(spellDiff(spelt, w.word), 'small')]) : el('small', { class: 'muted', text: shortMeaning(w.zh) })
    ]),
    el('small', { class: `pill ${info.state}${info.dueIn != null && info.dueIn <= 0 ? ' due' : ''}`, text: side })
  ]);
}
