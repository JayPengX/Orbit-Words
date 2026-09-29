// 二元數獨 (Takuzu): fill 6×6 with ● and ○: no three alike in a row or column,
// and each row and column half of each. Two boards; tap to cycle.
import { quitButton, row } from './kit.js';

const N = 6;
export function takuzuOk(g) {
  for (let k = 0; k < N; k++) {
    const rowv = g.slice(k * N, k * N + N);
    const colv = Array.from({ length: N }, (_, r) => g[r * N + k]);
    for (const line of [rowv, colv]) {
      if (line.filter(v => v === 1).length > N / 2 || line.filter(v => v === 2).length > N / 2) return false;
      for (let i = 0; i + 2 < N; i++) if (line[i] && line[i] === line[i + 1] && line[i] === line[i + 2]) return false;
    }
  }
  return true;
}
function solution(rand) {
  const g = Array(N * N).fill(0);
  const fill = i => {
    if (i === N * N) return true;
    for (const v of rand() < 0.5 ? [1, 2] : [2, 1]) {
      g[i] = v;
      if (takuzuOk(g) && fill(i + 1)) return true;
    }
    g[i] = 0;
    return false;
  };
  fill(0);
  return g;
}
export default function takuzu(api) {
  const BOARDS = 2;
  let board = 0;
  let score = 0;
  let mistakes = 0;
  let sol;
  let g;
  let given;
  const start = () => {
    sol = solution(api.rand);
    given = sol.map(() => api.rand() < 0.42);
    g = sol.map((v, i) => (given[i] ? v : 0));
  };
  start();
  const cells = Array.from({ length: N * N }, (_, i) => api.el('button', { class: 'gcell tk', type: 'button', onclick: () => tap(i) }));
  const paint = () => {
    cells.forEach((c, i) => {
      c.textContent = g[i] === 1 ? '●' : g[i] === 2 ? '○' : '';
      c.className = `gcell tk${given[i] ? ' given' : ''}`;
    });
    api.set({ score, info: api.L(`第 ${board + 1}/${BOARDS} 盤`, `Board ${board + 1}/${BOARDS}`) });
  };
  function tap(i) {
    if (given[i] || api.ended) return;
    g[i] = (g[i] + 1) % 3;
    if (g[i] && !takuzuOk(g)) {
      mistakes++;
      cells[i].classList.add('bad');
    }
    if (g.every(Boolean) && takuzuOk(g)) {
      score += Math.max(8, 22 - mistakes * 2);
      mistakes = 0;
      board++;
      if (board >= BOARDS) {
        paint();
        return api.end(score, api.L('兩盤都完成！', 'Both boards done!'));
      }
      start();
    }
    paint();
    if (g[i] && !takuzuOk(g)) cells[i].classList.add('bad');
  }
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點格子輪流換 ● ○ 空白', 'Tap to cycle ● ○ blank') }), api.el('div', { class: 'gboard', style: `grid-template-columns: repeat(${N}, 1fr)` }, cells), row(api, [quitButton(api, () => score)])]);
}
