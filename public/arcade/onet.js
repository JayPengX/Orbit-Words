// 連連看: tap two matching tiles that can be joined by a line with at most two
// turns, through empty squares (the edge counts as empty). Clear the board.
import { countdown, quitButton, row } from './kit.js';

const W = 6;
const H = 8;
const TILES = ['🐼', '🦊', '🐸', '🐙', '🦁', '🐷', '🐵', '🐔', '🦄', '🐝', '🐢', '🐳'];
// On a board padded by one empty square all round.
export function linkable(g, a, b, w = W, h = H) {
  if (a === b || g[a] !== g[b]) return false;
  const W2 = w + 2;
  const P = i => (Math.floor(i / w) + 1) * W2 + (i % w) + 1;
  const empty = new Set();
  for (let r = 0; r < h + 2; r++) for (let c = 0; c < W2; c++) if (r === 0 || c === 0 || r === h + 1 || c === w + 1) empty.add(r * W2 + c);
  g.forEach((v, i) => v < 0 && empty.add(P(i)));
  const s = P(a);
  const t = P(b);
  // Breadth-first over (square, direction), counting turns.
  const best = new Map();
  const q = [];
  for (let d = 0; d < 4; d++) q.push([s, d, 0]);
  const step = [-W2, 1, W2, -1];
  while (q.length) {
    const [i, d, turns] = q.shift();
    for (let nd = 0; nd < 4; nd++) {
      const nt = turns + (nd === d ? 0 : 1);
      if (nt > 2) continue;
      const j = i + step[nd];
      const r = Math.floor(j / W2);
      const c = j % W2;
      if (r < 0 || r > h + 1 || c < 0 || c > w + 1 || (nd % 2 && Math.floor(i / W2) !== r)) continue;
      if (j === t) return true;
      if (!empty.has(j)) continue;
      const key = j * 4 + nd;
      if ((best.get(key) ?? 9) <= nt) continue;
      best.set(key, nt);
      q.push([j, nd, nt]);
    }
  }
  return false;
}
export default function onet(api) {
  const pairs = (W * H) / 2;
  const g = [];
  for (let k = 0; k < pairs; k++) g.push(k % TILES.length, k % TILES.length);
  g.sort(() => api.rand() - 0.5);
  let sel = -1;
  let score = 0;
  let left = () => 180;
  const cells = g.map((_, i) => api.el('button', { class: 'on-cell', type: 'button', onclick: () => tap(i) }));
  const paint = () => {
    cells.forEach((c, i) => {
      c.textContent = g[i] >= 0 ? TILES[g[i]] : '';
      c.className = `on-cell${g[i] < 0 ? ' gone' : ''}${i === sel ? ' sel' : ''}`;
    });
    api.set({ score, info: api.L(`${left()} 秒 · 剩 ${g.filter(v => v >= 0).length / 2} 對`, `${left()}s · ${g.filter(v => v >= 0).length / 2} pairs`) });
  };
  const anyPair = () => g.some((v, i) => v >= 0 && g.some((w, j) => j > i && w === v && linkable(g, i, j)));
  const shuffleLeft = () => {
    const idx = g.map((v, i) => (v >= 0 ? i : -1)).filter(i => i >= 0);
    const vals = idx.map(i => g[i]).sort(() => api.rand() - 0.5);
    idx.forEach((i, k) => (g[i] = vals[k]));
  };
  function tap(i) {
    if (api.ended || g[i] < 0) return;
    if (sel < 0 || sel === i || g[sel] !== g[i]) return ((sel = sel === i ? -1 : i), paint());
    if (!linkable(g, sel, i)) return ((sel = i), paint());
    g[sel] = -1;
    g[i] = -1;
    sel = -1;
    score += 1;
    if (g.every(v => v < 0)) {
      score += Math.round(left() / 12);
      paint();
      return api.end(score, api.L('全部連完！', 'Board cleared!'));
    }
    let tries = 0;
    while (!anyPair() && tries++ < 20) shuffleLeft();
    paint();
  }
  left = countdown(api, 180, paint, () => api.end(score, api.L(`連了 ${score} 對。`, `${score} pairs.`)));
  while (!anyPair()) shuffleLeft();
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'on-board' }, cells), row(api, [quitButton(api, () => score)])]);
}
