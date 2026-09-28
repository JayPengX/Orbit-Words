// 方格記憶: some squares light up; tap the same ones. Each level adds one; three
// wrong taps in all end it. Score: 3.5 × the levels cleared.
import { shuffle } from '../lib/arcade.mjs';
import { startButton } from './kit.js';

export default function gridmem(api) {
  let level = 0;
  let lives = 3;
  let target = new Set();
  let found = new Set();
  let taking = false;
  const n = () => (level < 4 ? 4 : level < 9 ? 5 : 6);
  const grid = api.el('div', { class: 'gmm-grid' });
  const info = () => api.L(`第 ${level + 1} 關 · ${'❤️'.repeat(lives)}`, `Level ${level + 1} · ${'❤️'.repeat(lives)}`);
  const deal = () => {
    const size = n();
    target = new Set(shuffle([...Array(size * size).keys()], api.rand).slice(0, 3 + level));
    found = new Set();
    taking = false;
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    const cells = Array.from({ length: size * size }, (_, i) => api.el('button', { class: `gmm-cell${target.has(i) ? ' lit' : ''}`, type: 'button', 'aria-label': String(i + 1), onclick: e => tap(i, e.currentTarget) }));
    grid.replaceChildren(...cells);
    api.set({ score: level * 3.5, info: info() });
    api.later(() => {
      cells.forEach(c => c.classList.remove('lit'));
      taking = true;
    }, 1000 + level * 120);
  };
  const tap = (i, cell) => {
    if (!taking || api.ended || found.has(i)) return;
    if (target.has(i)) {
      found.add(i);
      cell.classList.add('ok');
      if (found.size === target.size) {
        taking = false;
        level++;
        api.set({ score: level * 3.5, info: info() });
        api.later(deal, 500);
      }
    } else {
      cell.classList.add('bad');
      lives--;
      api.set({ score: level * 3.5, info: info() });
      if (lives <= 0) {
        taking = false;
        return api.end(level * 3.5, api.L(`過了 ${level} 關。`, `Cleared ${level} levels.`));
      }
    }
  };
  const start = startButton(api, null, deal);
  return api.el('div', { class: 'arc-col' }, [grid, start]);
}
