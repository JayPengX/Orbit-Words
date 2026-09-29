// 消方塊: tap a group of two or more same-coloured blocks to clear it; the rest fall
// down and slide left. Bigger groups score far more ((n-2)²); clearing all, a bonus.
import { quitButton, row } from './kit.js';

const W = 8;
const H = 9;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
export function sameGroup(g, i) {
  const c = g[i];
  if (c < 0) return [];
  const seen = new Set([i]);
  const q = [i];
  while (q.length) {
    const k = q.pop();
    const x = k % W;
    for (const j of [k - W, k + W, x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1]) if (j >= 0 && j < W * H && !seen.has(j) && g[j] === c) (seen.add(j), q.push(j));
  }
  return [...seen];
}
function settle(g) {
  const cols = Array.from({ length: W }, (_, x) => Array.from({ length: H }, (_, y) => g[y * W + x]).filter(v => v >= 0)).filter(c => c.length);
  const out = Array(W * H).fill(-1);
  cols.forEach((col, x) => col.forEach((v, k) => (out[(H - col.length + k) * W + x] = v)));
  return out;
}
export default function samegame(api) {
  let g = Array.from({ length: W * H }, () => Math.floor(api.rand() * COLORS.length));
  let score = 0;
  const cells = g.map((_, i) => api.el('button', { class: 'sg-cell', type: 'button', onclick: () => tap(i) }));
  const paint = () => {
    cells.forEach((c, i) => {
      c.style.background = g[i] >= 0 ? COLORS[g[i]] : 'transparent';
      c.classList.toggle('empty', g[i] < 0);
    });
    api.set({ score, info: api.L(`剩 ${g.filter(v => v >= 0).length} 塊`, `${g.filter(v => v >= 0).length} left`) });
  };
  const movesLeft = () => g.some((v, i) => v >= 0 && sameGroup(g, i).length > 1);
  function tap(i) {
    if (api.ended) return;
    const grp = sameGroup(g, i);
    if (grp.length < 2) return;
    for (const k of grp) g[k] = -1;
    score += (grp.length - 2) ** 2 + grp.length;
    g = settle(g);
    paint();
    if (!movesLeft()) {
      const left = g.filter(v => v >= 0).length;
      if (!left) score += 40;
      api.end(score, left ? api.L(`剩 ${left} 塊，沒得消了。`, `${left} left, nothing to clear.`) : api.L('全部清光！', 'All clear!'));
    }
  }
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點兩塊以上連在一起的同色方塊', 'Tap two or more touching blocks of a colour') }), api.el('div', { class: 'sg-board' }, cells), row(api, [quitButton(api, () => score)])]);
}
