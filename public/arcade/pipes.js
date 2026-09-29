// 水管: turn the pipes so water from the tap reaches every one. Two boards.
import { quitButton, row } from './kit.js';

const DIRS = [[-1, 0, 1, 4], [0, 1, 2, 8], [1, 0, 4, 1], [0, -1, 8, 2]]; // dr, dc, my bit, its bit
const turn = m => ((m << 1) | (m >> 3)) & 15;
function layout(n, rand) {
  const mask = Array(n * n).fill(0);
  const seen = new Set([Math.floor((n * n) / 2)]);
  const stack = [Math.floor((n * n) / 2)];
  while (stack.length) {
    const i = stack[stack.length - 1];
    const next = DIRS.map(([dr, dc, a, b]) => [Math.floor(i / n) + dr, (i % n) + dc, a, b]).filter(([r, c]) => r >= 0 && c >= 0 && r < n && c < n && !seen.has(r * n + c));
    if (!next.length || rand() < 0.25) {
      if (!next.length) stack.pop();
      else stack.splice(Math.floor(rand() * stack.length), 0, stack.pop());
      continue;
    }
    const [r, c, a, b] = next[Math.floor(rand() * next.length)];
    mask[i] |= a;
    mask[r * n + c] |= b;
    seen.add(r * n + c);
    stack.push(r * n + c);
  }
  return mask;
}
export function flowing(mask, n, src) {
  const on = new Set([src]);
  const q = [src];
  while (q.length) {
    const i = q.shift();
    for (const [dr, dc, a, b] of DIRS) {
      const r = Math.floor(i / n) + dr;
      const c = (i % n) + dc;
      const j = r * n + c;
      if (r < 0 || c < 0 || r >= n || c >= n || on.has(j)) continue;
      if (mask[i] & a && mask[j] & b) (on.add(j), q.push(j));
    }
  }
  return on;
}
function pipeSvg(m, wet, src) {
  const seg = { 1: 'M50 50V0', 2: 'M50 50H100', 4: 'M50 50V100', 8: 'M50 50H0' };
  const d = [1, 2, 4, 8].filter(b => m & b).map(b => seg[b]).join('');
  return `<svg viewBox="0 0 100 100"><path d="${d}" stroke="${wet ? '#0ea5e9' : '#94a3b8'}" stroke-width="22" stroke-linecap="round" fill="none"/>${src ? '<circle cx="50" cy="50" r="20" fill="#0369a1"/>' : '<circle cx="50" cy="50" r="11" fill="' + (wet ? '#0ea5e9' : '#94a3b8') + '"/>'}</svg>`;
}
export default function pipes(api) {
  const SIZES = [5, 6];
  let board = 0;
  let score = 0;
  let taps = 0;
  const box = api.el('div', { class: 'arc-col' });
  const build = () => {
    const n = SIZES[board];
    const src = Math.floor((n * n) / 2);
    const mask = layout(n, api.rand);
    for (let i = 0; i < mask.length; i++) for (let k = Math.floor(api.rand() * 4); k > 0; k--) mask[i] = turn(mask[i]);
    taps = 0;
    const cells = mask.map((_, i) => api.el('button', { class: 'pp-cell', type: 'button', onclick: () => {
      if (api.ended) return;
      mask[i] = turn(mask[i]);
      taps++;
      paint();
      if (flowing(mask, n, src).size === n * n) {
        score += Math.max(10, 24 - Math.max(0, taps - n * n) / 2);
        board++;
        if (board >= SIZES.length) return api.end(Math.round(score), api.L('水都流到了！', 'Water everywhere!'));
        build();
      }
    } }));
    const paint = () => {
      const wet = flowing(mask, n, src);
      cells.forEach((c, i) => (c.innerHTML = pipeSvg(mask[i], wet.has(i), i === src)));
      api.set({ score: Math.round(score), info: api.L(`第 ${board + 1}/2 盤 · ${wet.size}/${n * n}`, `Board ${board + 1}/2 · ${wet.size}/${n * n}`) });
    };
    box.replaceChildren(api.el('p', { class: 'arc-hint', text: api.L('點水管轉 90°，讓水從中間流到每一格', 'Tap a pipe to turn it; get water from the middle to every one') }), api.el('div', { class: 'pp-board', style: `grid-template-columns: repeat(${n}, 1fr)` }, cells), row(api, [quitButton(api, () => Math.round(score))]));
    paint();
  };
  build();
  return box;
}
