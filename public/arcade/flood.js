// 顏色填滿: pick colours to grow the top-left region until the whole board
// is one colour, in 22 moves or fewer. Win: 20 + 2 per move left; otherwise
// 15 × the share filled.
import { floodBoard, floodFill, floodDone, floodShare } from '../lib/arcade.mjs';
import { COLORS } from './kit.js';

export default function flood(api) {
  const n = 12;
  const MAX = 22;
  let grid = floodBoard(n, COLORS.length, api.rand);
  let moves = 0;
  const box = api.el('div', { class: 'fl-grid' });
  const cells = Array.from({ length: n * n }, () => api.el('span', { class: 'fl-cell' }));
  box.append(...cells);
  const title = api.el('p', { class: 'arc-hint' });
  const paint = () => {
    cells.forEach((c, i) => (c.style.background = COLORS[grid[i]]));
    title.textContent = api.L(`${moves}/${MAX} 步 · 已填 ${Math.round(floodShare(grid) * 100)}%`, `${moves}/${MAX} moves · ${Math.round(floodShare(grid) * 100)}% filled`);
    api.set({ score: floodDone(grid) ? 20 + 2 * (MAX - moves) : Math.floor(floodShare(grid) * 15), info: `${moves}/${MAX}` });
  };
  const pick = c => {
    if (api.ended || c === grid[0]) return;
    grid = floodFill(grid, n, c);
    moves++;
    paint();
    if (floodDone(grid)) return api.end(20 + 2 * (MAX - moves), api.L(`${moves} 步完成！`, `Done in ${moves} moves!`));
    if (moves >= MAX) api.end(Math.floor(floodShare(grid) * 15), api.L(`步數用完，填了 ${Math.round(floodShare(grid) * 100)}%。`, `Out of moves at ${Math.round(floodShare(grid) * 100)}%.`));
  };
  const palette = api.el('div', { class: 'fl-palette' }, COLORS.map((col, c) => api.el('button', { class: 'fl-color', type: 'button', style: `background:${col}`, 'aria-label': `colour ${c + 1}`, onclick: () => pick(c) })));
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, palette]);
}
