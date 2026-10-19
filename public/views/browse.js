// 單字: the whole list (6,000-odd words), searched in English or Chinese,
// by level (the chips) and by where each stands (the menu in the list's
// head). Each row opens the word's sheet.
import { el, put, chips, searchField, pagedList } from '../ui.js';
import { state, t, hooks, levelName } from '../shell.js';
import { LEVELS } from '../lib/words.mjs';
import { STATES, browse } from '../lib/review.mjs';
import { wordRow } from './review.js';
import { section, menuButton } from './chrome.js';

const view = { level: 0, state: 'all', query: '' };

export function renderBrowse(box) {
  const total = state.words.length;
  const listBox = el('div');
  const head = el('h2');
  const draw = () => {
    const items = browse(state.words, state.progress, { ...view, marks: state.marks });
    head.textContent = items.length === total ? t('listAll') : t('wordsCount', { n: items.length.toLocaleString() });
    put(listBox, pagedList(items, wordRow, { more: t('showMore'), empty: t('noMatch') }));
  };
  const list = section('', listBox, menuButton(STATES.map(s => ({ id: s, label: t(`filter_${s}`) })), view.state, s => ((view.state = s), hooks.render())));
  list.querySelector('h2').replaceWith(head);
  draw();
  put(
    box,
    searchField(view.query, t('searchWords', { n: total.toLocaleString() }), q => ((view.query = q), draw())),
    chips([{ id: 0, label: t('allLevels') }, ...LEVELS.map(l => ({ id: l, label: levelName(l) }))], view.level, l => ((view.level = l), hooks.render()), 'level-chips'),
    list
  );
}
