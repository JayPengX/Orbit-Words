// 五子連珠 (Color Lines): move a ball to any empty square it can reach; five or
// more in a line (any direction) clear and score. Otherwise three new balls
// appear. It ends when the board fills.
import { quitButton, row } from './kit.js';

const N = 9;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];
export function reach(g, from, to) {
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const i = q.shift();
    if (i === to) return true;
    const x = i % N;
    for (const j of [i - N, i + N, x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1]) if (j >= 0 && j < N * N && !seen.has(j) && g[j] < 0) (seen.add(j), q.push(j));
  }
  return false;
}
export function fives(g, at) {
  const c = g[at];
  const out = new Set();
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [at];
    for (const s of [1, -1]) {
      let r = Math.floor(at / N) + dr * s;
      let k = (at % N) + dc * s;
      while (r >= 0 && k >= 0 && r < N && k < N && g[r * N + k] === c) (line.push(r * N + k), (r += dr * s), (k += dc * s));
    }
    if (line.length >= 5) line.forEach(i => out.add(i));
  }
  return out;
}
export default function lines(api) {
  const g = Array(N * N).fill(-1);
  let sel = -1;
  let score = 0;
  const cells = g.map((_, i) => api.el('button', { class: 'ln-cell', type: 'button', onclick: () => tap(i) }));
  const drop = n => {
    const placed = [];
    for (let k = 0; k < n; k++) {
      const empty = g.map((v, i) => (v < 0 ? i : -1)).filter(i => i >= 0);
      if (!empty.length) break;
      const i = empty[Math.floor(api.rand() * empty.length)];
      g[i] = Math.floor(api.rand() * COLORS.length);
      placed.push(i);
    }
    for (const i of placed) {
      const f = fives(g, i);
      if (f.size) (f.forEach(j => (g[j] = -1)), (score += f.size * 2));
    }
  };
  const paint = () => {
    cells.forEach((c, i) => {
      c.replaceChildren(g[i] >= 0 ? api.el('i', { style: `background:${COLORS[g[i]]}` }) : '');
      c.className = `ln-cell${i === sel ? ' sel' : ''}`;
    });
    api.set({ score, info: api.L(`空格 ${g.filter(v => v < 0).length}`, `${g.filter(v => v < 0).length} free`) });
  };
  function tap(i) {
    if (api.ended) return;
    if (g[i] >= 0) return ((sel = i), paint());
    if (sel < 0 || !reach(g, sel, i)) return;
    g[i] = g[sel];
    g[sel] = -1;
    sel = -1;
    const f = fives(g, i);
    if (f.size) (f.forEach(j => (g[j] = -1)), (score += f.size * 2));
    else drop(3);
    paint();
    if (g.every(v => v >= 0)) api.end(score, api.L('盤面滿了。', 'The board is full.'));
  }
  drop(5);
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點一顆球，再點它走得到的空格；五顆同色連成一線就消掉', 'Tap a ball, then a free square it can reach; five in a line clear') }), api.el('div', { class: 'ln-board' }, cells), row(api, [quitButton(api, () => score)])]);
}
