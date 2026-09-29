// 不等式數獨 (Futoshiki): every row and column 1…n once, and each < or > between
// neighbours holds. A 4×4, then a 5×5.
import { latin, numberGrid, quitButton, row } from './kit.js';

export function futoOk(g, n, signs) {
  if (g.some(v => !v)) return false;
  for (let k = 0; k < n; k++) {
    if (new Set(g.slice(k * n, k * n + n)).size !== n) return false;
    if (new Set(Array.from({ length: n }, (_, r) => g[r * n + k])).size !== n) return false;
  }
  return signs.every(s => (g[s.a] < g[s.b]) === s.less);
}
export default function futoshiki(api) {
  const SIZES = [4, 5];
  let round = 0;
  let score = 0;
  const box = api.el('div', { class: 'arc-col' });
  const build = () => {
    const n = SIZES[round];
    const sol = latin(n, api.rand).flat();
    // Signs between neighbours (right and down), about a third of them.
    const signs = [];
    for (let i = 0; i < n * n; i++) {
      if (i % n < n - 1 && api.rand() < 0.36) signs.push({ a: i, b: i + 1, dir: 'h', less: sol[i] < sol[i + 1] });
      if (i + n < n * n && api.rand() < 0.36) signs.push({ a: i, b: i + n, dir: 'v', less: sol[i] < sol[i + n] });
    }
    const given = sol.map(() => api.rand() < 0.14);
    const values = sol.map((v, i) => (given[i] ? v : 0));
    const grid = numberGrid(api, {
      n,
      values,
      given,
      cls: 'futo',
      decorate: (i, c) => {
        for (const s of signs.filter(x => x.a === i)) c.append(api.el('i', { class: `fs ${s.dir}`, text: s.dir === 'h' ? (s.less ? '<' : '>') : s.less ? '∧' : '∨' }));
      },
      onChange: v => {
        if (!futoOk(v, n, signs)) return;
        score += n === 4 ? 18 : 26;
        round++;
        if (round >= SIZES.length) return api.end(score, api.L('兩盤都解開了！', 'Both solved!'));
        build();
      }
    });
    box.replaceChildren(api.el('p', { class: 'arc-hint', text: api.L(`第 ${round + 1}/2 盤 · 每列每行 1 到 ${n} 各一次，符號要成立`, `Board ${round + 1}/2 · 1 to ${n} once per row and column; the signs hold`) }), grid.board, grid.pad, row(api, [quitButton(api, () => score)]));
    api.set({ score, info: api.L(`第 ${round + 1}/2 盤`, `Board ${round + 1}/2`) });
  };
  build();
  return box;
}
