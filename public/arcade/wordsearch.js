// 找單字: English words from your list hidden in a 10×10 grid (across,
// down, diagonally). The clues are their meanings: find the word, tap its
// first letter and then its last. Three grids of eight words. Score: 3 a
// word, +8 a grid cleared.
import { wordSearch, lineCells } from '../lib/long.mjs';
import { shuffle } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

const GRIDS = 3;
export default function wordsearch(api) {
  const pool = shuffle(api.words().filter(w => /^[a-z]{3,10}$/i.test(w.word)), api.rand);
  let k = 0;
  let used = 0;
  let score = 0;
  let ws = null;
  let found = new Set();
  let first = -1;
  const board = api.el('div', { class: 'ws-grid' });
  const clues = api.el('ul', { class: 'ws-clues' });
  const title = api.el('p', { class: 'arc-hint' });
  const next = () => {
    const list = pool.slice(used, used + 8);
    used += 8;
    ws = wordSearch(list.map(w => w.word), 10, api.rand);
    ws.meaning = Object.fromEntries(list.map(w => [w.word, w.meaning]));
    found = new Set();
    first = -1;
    paint();
  };
  const paint = () => {
    const hit = new Set([...found].flatMap(w => ws.words.find(x => x.word === w).cells));
    board.replaceChildren(...ws.grid.map((ch, i) => api.el('button', { class: `ws-cell${hit.has(i) ? ' hit' : ''}${i === first ? ' first' : ''}`, type: 'button', text: ch, onclick: () => tap(i) })));
    clues.replaceChildren(...ws.words.map(w => api.el('li', { class: found.has(w.word) ? 'done' : '' }, [api.el('span', { text: ws.meaning[w.word] || '' }), api.el('b', { text: found.has(w.word) ? w.word : `${w.word.length} ${api.L('個字母', 'letters')}` })])));
    title.textContent = api.L(`第 ${k + 1}/${GRIDS} 盤 · 找到 ${found.size}/${ws.words.length}`, `Grid ${k + 1}/${GRIDS} · ${found.size}/${ws.words.length} found`);
    api.set({ score, info: api.L(`第 ${k + 1}/${GRIDS} 盤`, `Grid ${k + 1}/${GRIDS}`) });
  };
  const tap = i => {
    if (api.ended) return;
    if (first < 0) {
      first = i;
      return paint();
    }
    const line = lineCells(10, first, i);
    first = -1;
    const w = line && ws.words.find(x => !found.has(x.word) && (x.cells.join() === line.join() || [...x.cells].reverse().join() === line.join()));
    if (w) {
      found.add(w.word);
      score += 3;
      if (found.size === ws.words.length) {
        score += 8;
        k++;
        if (k >= GRIDS || used >= pool.length) {
          paint();
          return api.end(score, api.L('三盤都找完了！', 'All three grids done!'));
        }
        return api.later(next, 700);
      }
    }
    paint();
  };
  if (pool.length < 8) return api.el('p', { class: 'arc-hint', text: api.L('先到「背單字」練習一些字，這裡才有字可以找。', 'Practise some words first: this game hides your words.') });
  next();
  return api.el('div', { class: 'arc-col ws' }, [title, board, clues, row(api, [quitButton(api, () => score)])]);
}
