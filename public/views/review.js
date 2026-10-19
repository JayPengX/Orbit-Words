// 複習: the words to go back over, a category at a time (答錯, 該複習,
// 學習中, 收藏). The hero is the category: its count, flash cards of its
// weakest words and a test on them; under it the words, searched and sorted.
// Each row opens the word's sheet.
import { el, put, segmented, searchField, pagedList } from '../ui.js';
import { state, t, hooks, dueText } from '../shell.js';
import { speakButton } from '../audio.js';
import { shortMeaning, stateOf } from '../lib/words.mjs';
import { CATS, SORTS, catCounts, reviewList, flashDeck, wordInfo, isMarked } from '../lib/review.mjs';
import { startFlash, startRound } from './session.js';
import { openWord, missNote } from './sheet.js';
import { hero, heroPill, heroBtn, big, section, menuButton, tile, ico } from './chrome.js';

const view = { cat: 'wrong', sort: 'weak', query: '', deck: 20, picked: false };
export const DECKS = [10, 20, 50];
const CAT_ICON = { wrong: 'x', due: 'clock', learning: 'spark', marked: 'star' };

export function renderReview(box) {
  const counts = catCounts(state.words, state.progress, { marks: state.marks });
  // Open on the first category with something in it, until one is picked.
  if (!view.picked && !counts[view.cat]) view.cat = CATS.find(c => counts[c]) || 'wrong';
  const n = counts[view.cat];
  const cats = segmented(CATS.map(c => ({ id: c, label: t(`cat_${c}`) })), view.cat, c => ((view.cat = c), (view.picked = true), hooks.render()), 'cat-seg');
  put(box, cats, n ? deckHero(n) : emptyCard(), n ? wordsSection() : null);
}

// The category: its count, its flash cards (10, 20, 50 or all of them, up
// to 50; the pill moves through them) and a test on the same deck.
function deckHero(n) {
  const sizes = DECKS.filter(d => d < n).concat(n <= 50 ? [n] : []);
  const size = sizes.includes(view.deck) ? view.deck : sizes.filter(d => d <= view.deck).at(-1) ?? sizes[0];
  const deck = () => flashDeck(state.words, state.progress, view.cat, { n: size, marks: state.marks });
  const next = sizes[(sizes.indexOf(size) + 1) % sizes.length];
  const pill = sizes.length > 1 ? heroPill('swap', t('cardsN', { n: size }), () => ((view.deck = next), hooks.render()), t('deckSize')) : null;
  return hero(CAT_ICON[view.cat], t(`cat_${view.cat}`), pill, [
    big(n.toLocaleString(), ` ${t('wordsUnit')}`),
    el('div', { class: 'q-hc-row' }, [heroBtn(t('flashStart'), () => startFlash(deck(), t(`cat_${view.cat}`)), { icon: 'cards' }), heroBtn(t('testThese'), () => startRound({ from: 'flash', list: deck() }), { ghost: true })])
  ]);
}
const emptyCard = () => el('div', { class: 'q-ambient empty-card', style: '--amb: var(--q-green)' }, [tile(view.cat === 'marked' ? 'star' : 'check', 'var(--q-green)', 'lg'), el('p', { text: t(`catEmpty_${view.cat}`) })]);

// The words: a search, a sort (the menu in the head), the list a page at a time.
function wordsSection() {
  const listBox = el('div');
  const draw = () => {
    const items = reviewList(state.words, state.progress, view.cat, { marks: state.marks, sort: view.sort, query: view.query });
    put(listBox, pagedList(items, wordRow, { more: t('showMore'), empty: t('noMatch') }));
  };
  draw();
  const sort = menuButton(SORTS.map(s => ({ id: s, label: t(`sort_${s}`) })), view.sort, s => ((view.sort = s), hooks.render()));
  return section(t('theseWords'), [searchField(view.query, t('searchReview'), q => ((view.query = q), draw())), listBox], sort);
}

// A word in a list: its sound, the word and its meaning (or how it went
// wrong last time), and where it stands.
const stateTone = info => (info.dueIn != null && info.dueIn <= 0 ? 'orange' : info.state === 'mastered' ? 'green' : info.state === 'learning' ? 'tint' : '');
export function wordRow(w) {
  const p = state.progress[w.key];
  const info = wordInfo(p);
  const side = info.state === 'new' ? t('state_new') : info.dueIn != null && info.dueIn <= 0 ? dueText(info.dueIn) : t(`state_${stateOf(p)}`);
  const star = isMarked(state.marks, w.key) ? el('i', { class: 'mini-star', 'aria-label': t('mark') }) : null;
  if (star) star.innerHTML = ico('star');
  return el('button', { class: 'q-ritem wr', type: 'button', onclick: () => openWord(w) }, [
    speakButton(w),
    el('span', { class: 'wr-main' }, [el('span', { class: 'wr-top' }, [el('strong', { text: w.word }), star]), (p?.o === 2 && missNote(w, p)) || el('small', { class: 'muted', text: shortMeaning(w.zh) })]),
    el('small', { class: `q-tag ${stateTone(info)}`.trim(), text: side })
  ]);
}
