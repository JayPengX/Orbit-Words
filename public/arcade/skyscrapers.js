// 摩天樓: a 4×4 (then 5×5) city: each row and column has one building of every
// height; a clue is how many buildings you see from that side (tall ones hide
// the short behind). Two cities.
import { latin, numberGrid, quitButton, row } from './kit.js';

const seen = line => {
  let top = 0;
  let n = 0;
  for (const h of line) if (h > top) (top = h, n++);
  return n;
};
export function skyClues(g, n) {
  const R = r => g.slice(r * n, r * n + n);
  const C = c => Array.from({ length: n }, (_, r) => g[r * n + c]);
  return {
    top: Array.from({ length: n }, (_, c) => seen(C(c))),
    bottom: Array.from({ length: n }, (_, c) => seen(C(c).reverse())),
    left: Array.from({ length: n }, (_, r) => seen(R(r))),
    right: Array.from({ length: n }, (_, r) => seen(R(r).reverse()))
  };
}
export function skyOk(g, n, clues) {
  if (g.some(v => !v)) return false;
  for (let k = 0; k < n; k++) {
    if (new Set(g.slice(k * n, k * n + n)).size !== n) return false;
    if (new Set(Array.from({ length: n }, (_, r) => g[r * n + k])).size !== n) return false;
  }
  const c = skyClues(g, n);
  return ['top', 'bottom', 'left', 'right'].every(s => c[s].every((v, i) => v === clues[s][i]));
}
export default function skyscrapers(api) {
  const SIZES = [4, 5];
  let city = 0;
  let score = 0;
  const box = api.el('div', { class: 'arc-col' });
  const build = () => {
    const n = SIZES[city];
    const sol = latin(n, api.rand).flat();
    const clues = skyClues(sol, n);
    const given = sol.map(() => api.rand() < (n === 4 ? 0.12 : 0.2));
    const values = sol.map((v, i) => (given[i] ? v : 0));
    const grid = numberGrid(api, { n, values, given, onChange: v => {
      if (!skyOk(v, n, clues)) return;
      score += n === 4 ? 18 : 26;
      city++;
      if (city >= SIZES.length) return api.end(score, api.L('兩座城市都蓋好了！', 'Both cities built!'));
      build();
    } });
    const side = (list, cls) => api.el('div', { class: `sky-clues ${cls}`, style: `--n:${n}` }, list.map(v => api.el('span', { text: String(v) })));
    box.replaceChildren(
      api.el('p', { class: 'arc-hint', text: api.L(`第 ${city + 1}/2 座 · 數字是從那一邊看得到幾棟`, `City ${city + 1}/2 · a clue is how many you see from there`) }),
      api.el('div', { class: 'sky', style: `--n:${n}` }, [side(clues.top, 'top'), side(clues.left, 'left'), grid.board, side(clues.right, 'right'), side(clues.bottom, 'bottom')]),
      grid.pad,
      row(api, [quitButton(api, () => score)])
    );
    api.set({ score, info: api.L(`第 ${city + 1}/2 座`, `City ${city + 1}/2`) });
  };
  build();
  return box;
}
