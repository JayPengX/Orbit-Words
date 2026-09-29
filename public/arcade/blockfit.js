// 方塊消除 (1010!): place the three pieces on the 8×8 board; a full row or column
// clears. New pieces come when all three are placed. It ends when none fits.
import { quitButton, row } from './kit.js';

const N = 8;
const SHAPES = [[[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6'];
export const fits = (g, shape, at) => shape.every(([r, c]) => {
  const rr = Math.floor(at / N) + r;
  const cc = (at % N) + c;
  return rr < N && cc < N && g[rr * N + cc] < 0;
});
export default function blockfit(api) {
  const g = Array(N * N).fill(-1);
  let hand = [];
  let sel = 0;
  let score = 0;
  const deal = () => (hand = Array.from({ length: 3 }, () => ({ shape: SHAPES[Math.floor(api.rand() * SHAPES.length)], color: Math.floor(api.rand() * COLORS.length) })));
  const cells = g.map((_, i) => api.el('button', { class: 'bf-cell', type: 'button', onclick: () => place(i) }));
  const tray = api.el('div', { class: 'bf-tray' });
  const canPlay = () => hand.some(p => p && g.some((_, i) => fits(g, p.shape, i)));
  const paint = () => {
    cells.forEach((c, i) => (c.style.background = g[i] >= 0 ? COLORS[g[i]] : ''));
    tray.replaceChildren(
      ...hand.map((p, k) => {
        if (!p) return api.el('span', { class: 'bf-piece empty' });
        const h = Math.max(...p.shape.map(s => s[0])) + 1;
        const w = Math.max(...p.shape.map(s => s[1])) + 1;
        const on = new Set(p.shape.map(([r, c]) => r * w + c));
        return api.el('button', { class: `bf-piece${k === sel ? ' sel' : ''}`, type: 'button', style: `grid-template-columns: repeat(${w}, 1fr)`, onclick: () => ((sel = k), paint()) }, Array.from({ length: w * h }, (_, i) => api.el('i', { style: on.has(i) ? `background:${COLORS[p.color]}` : 'visibility:hidden' })));
      })
    );
    api.set({ score, info: api.L('選一塊，點盤面放左上角', 'Pick a piece, tap where its top-left goes') });
  };
  function place(i) {
    if (api.ended) return;
    const p = hand[sel];
    if (!p || !fits(g, p.shape, i)) return;
    for (const [r, c] of p.shape) g[(Math.floor(i / N) + r) * N + (i % N) + c] = p.color;
    score += p.shape.length;
    hand[sel] = null;
    const full = new Set();
    for (let k = 0; k < N; k++) {
      if (Array.from({ length: N }, (_, c) => g[k * N + c]).every(v => v >= 0)) for (let c = 0; c < N; c++) full.add(k * N + c);
      if (Array.from({ length: N }, (_, r) => g[r * N + k]).every(v => v >= 0)) for (let r = 0; r < N; r++) full.add(r * N + k);
    }
    const lines = full.size ? Math.round(full.size / N) : 0;
    full.forEach(j => (g[j] = -1));
    score += lines * 10 * lines;
    if (hand.every(x => !x)) deal();
    sel = hand.findIndex(Boolean);
    paint();
    if (!canPlay()) api.end(score, api.L('放不下了。', 'Nothing fits.'));
  }
  deal();
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'bf-board' }, cells), tray, row(api, [quitButton(api, () => score)])]);
}
