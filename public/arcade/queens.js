// 六皇后: put six queens on the 6 × 6 board, one in each row and column, none
// on the same diagonal. Two boards (the second with one queen placed for
// you); each solved scores 15, plus up to 5 for speed.
import { queensClash, queensDone } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

const SOLUTIONS = [[1, 3, 5, 0, 2, 4], [2, 5, 1, 4, 0, 3], [3, 0, 4, 1, 5, 2], [4, 2, 0, 5, 3, 1]];
export default function queens(api) {
  const n = 6;
  let k = 0;
  let q = Array(n).fill(null);
  let fixed = -1;
  let score = 0;
  let since = Date.now();
  const box = api.el('div', { class: 'qn-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const setup = () => {
    q = Array(n).fill(null);
    fixed = -1;
    if (k === 1) {
      const sol = SOLUTIONS[Math.floor(api.rand() * SOLUTIONS.length)];
      fixed = Math.floor(api.rand() * n);
      q[fixed] = sol[fixed];
    }
    since = Date.now();
  };
  const paint = () => {
    const bad = queensClash(q);
    const kids = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        kids.push(
          api.el('button', {
            class: `qn-cell${(r + c) % 2 ? ' dark' : ''}${q[r] === c && bad.has(r) ? ' bad' : ''}${r === fixed ? ' fixed' : ''}`,
            type: 'button',
            text: q[r] === c ? '👑' : '',
            onclick: () => {
              if (api.ended || r === fixed) return;
              q = q.map((v, i) => (i === r ? (v === c ? null : c) : v));
              if (queensDone(q)) {
                score += 15 + Math.max(0, 5 - Math.floor((Date.now() - since) / 15_000));
                k++;
                if (k >= 2) {
                  paint();
                  return api.end(score, api.L('兩盤都擺好了！', 'Both boards solved!'));
                }
                setup();
              }
              paint();
            }
          })
        );
    box.replaceChildren(...kids);
    title.textContent = api.L(`第 ${k + 1}/2 盤 · 已放 ${q.filter(v => v != null).length}/6`, `Board ${k + 1}/2 · ${q.filter(v => v != null).length}/6 placed`);
    api.set({ score, info: api.L(`第 ${k + 1}/2 盤`, `Board ${k + 1}/2`) });
  };
  setup();
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, row(api, [quitButton(api, () => score)])]);
}
