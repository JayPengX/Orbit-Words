// 關燈: tap a light to switch it and its four neighbours; turn them all off.
// Three boards; each solved scores 10, plus up to 8 for few extra taps.
import { lightsPuzzle, lightsPress } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

export default function lights(api) {
  const n = 5;
  const PRESSES = [3, 5, 7];
  let board = 0;
  let grid = lightsPuzzle(n, PRESSES[0]);
  let taps = 0;
  let score = 0;
  const cells = Array.from({ length: n * n }, (_, i) => api.el('button', { class: 'lo-cell', type: 'button', 'aria-label': String(i + 1) }));
  const title = api.el('p', { class: 'arc-hint' });
  const paint = () => {
    cells.forEach((c, i) => c.classList.toggle('on', grid[i]));
    title.textContent = api.L(`第 ${board + 1}/3 盤 · 按了 ${taps} 下`, `Board ${board + 1}/3 · ${taps} taps`);
    api.set({ score, info: api.L(`第 ${board + 1}/3 盤`, `Board ${board + 1}/3`) });
  };
  cells.forEach((c, i) =>
    c.addEventListener('click', () => {
      if (api.ended) return;
      grid = lightsPress(grid, n, i);
      taps++;
      if (!grid.some(Boolean)) {
        score += 10 + Math.max(0, 8 - (taps - PRESSES[board]));
        board++;
        if (board >= PRESSES.length) {
          paint();
          return api.end(score, api.L('三盤都關好了！', 'All three boards dark!'));
        }
        grid = lightsPuzzle(n, PRESSES[board]);
        taps = 0;
      }
      paint();
    })
  );
  paint();
  return api.el('div', { class: 'arc-col' }, [title, api.el('div', { class: 'lo-grid' }, cells), row(api, [quitButton(api, () => score)])]);
}
