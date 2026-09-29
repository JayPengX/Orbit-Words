// 魔方陣: put 1 to 9 in the square so every row, column and diagonal adds up to 15.
// Three squares, each with a different pair of numbers given.
import { numberGrid, quitButton, row } from './kit.js';

const BASE = [2, 7, 6, 9, 5, 1, 4, 3, 8];
const turn = g => [g[6], g[3], g[0], g[7], g[4], g[1], g[8], g[5], g[2]];
const flip = g => [g[2], g[1], g[0], g[5], g[4], g[3], g[8], g[7], g[6]];
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const magicOk = g => new Set(g).size === 9 && g.every(v => v >= 1 && v <= 9) && LINES.every(l => l.reduce((s, i) => s + g[i], 0) === 15);
export default function magicsq(api) {
  let round = 0;
  let score = 0;
  let started = Date.now();
  const box = api.el('div', { class: 'arc-col' });
  const build = () => {
    let sol = BASE;
    for (let k = Math.floor(api.rand() * 4); k > 0; k--) sol = turn(sol);
    if (api.rand() < 0.5) sol = flip(sol);
    // Two corner-or-edge numbers given (never the 5 in the middle: too big a hint).
    const pick = [0, 1, 2, 3, 5, 6, 7, 8].sort(() => api.rand() - 0.5).slice(0, round < 2 ? 2 : 1);
    const given = sol.map((_, i) => pick.includes(i));
    const values = sol.map((v, i) => (given[i] ? v : 0));
    const sums = api.el('p', { class: 'arc-hint small' });
    const grid = numberGrid(api, { n: 3, values, given, max: 9, cls: 'magic', onChange: v => {
      sums.textContent = LINES.slice(0, 3).map(l => l.reduce((s, i) => s + v[i], 0)).join(' · ');
      if (!magicOk(v)) return;
      score += Math.max(6, 16 - Math.floor((Date.now() - started) / 15000) * 2);
      round++;
      started = Date.now();
      if (round >= 3) return api.end(score, api.L('三個魔方陣都完成！', 'Three magic squares!'));
      build();
    } });
    box.replaceChildren(api.el('p', { class: 'arc-hint', text: api.L(`第 ${round + 1}/3 個 · 每一排、每一行、兩條對角線加起來都是 15`, `Square ${round + 1}/3 · every row, column and diagonal makes 15`) }), grid.board, sums, grid.pad, row(api, [quitButton(api, () => score)]));
    api.set({ score, info: api.L(`第 ${round + 1}/3 個`, `Square ${round + 1}/3`) });
  };
  build();
  return box;
}
