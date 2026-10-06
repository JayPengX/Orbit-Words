// 單字: the whole list (6,000-odd words), by level and state, searched in
// English or Chinese. Each row opens the word's sheet.
import { el, put, chips, searchField, pagedList } from '../ui.js';
import { state, t, hooks, levelName } from '../shell.js';
import { LEVELS } from '../lib/words.mjs';
import { STATES, browse } from '../lib/review.mjs';
import { wordRow } from './review.js';

const view = { level: 0, state: 'all', query: '' };

export function renderBrowse(box) {
  const listBox = el('div', { class: 'review-list' });
  const count = el('p', { class: 'section-sub list-count num' });
  const drawList = () => {
    const items = browse(state.words, state.progress, { ...view, marks: state.marks });
    count.textContent = t('wordsCount', { n: items.length.toLocaleString() });
    put(listBox, pagedList(items, wordRow, { more: t('showMore'), empty: t('noMatch') }));
  };
  const search = searchField(view.query, t('searchWords'), q => ((view.query = q), drawList()));
  put(
    box,
    el('div', { class: 'list-tools sticky-tools' }, [
      search,
      chips([{ id: 0, label: t('allLevels') }, ...LEVELS.map(l => ({ id: l, label: levelName(l) }))], view.level, l => ((view.level = l), hooks.render()), 'small'),
      chips(STATES.map(s => ({ id: s, label: t(`filter_${s}`) })), view.state, s => ((view.state = s), hooks.render()), 'small')
    ]),
    count,
    listBox
  );
  drawList();
}
