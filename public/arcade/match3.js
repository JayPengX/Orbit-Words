// 消消樂: swap two neighbouring gems to line up three or more of a kind; they
// clear, the rest fall, new ones drop in (chains count too). 60 seconds.
import { countdown, startButton } from './kit.js';

const N = 7;
const GEMS = ['🍓', '🍋', '🍇', '🥝', '🫐', '🍊'];
export function findRuns(g) {
  const hit = new Set();
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const i = r * N + c;
      if (c <= N - 3 && g[i] === g[i + 1] && g[i] === g[i + 2]) [i, i + 1, i + 2].forEach(k => hit.add(k));
      if (r <= N - 3 && g[i] === g[i + N] && g[i] === g[i + 2 * N]) [i, i + N, i + 2 * N].forEach(k => hit.add(k));
    }
  return hit;
}
export default function match3(api) {
  const pick = () => Math.floor(api.rand() * GEMS.length);
  let g;
  do g = Array.from({ length: N * N }, pick);
  while (findRuns(g).size);
  let sel = -1;
  let score = 0;
  let busy = false;
  let left = () => 60;
  let started = false;
  const cells = g.map((_, i) => api.el('button', { class: 'm3-cell', type: 'button', onclick: () => tap(i) }));
  const paint = (flash = new Set()) => {
    cells.forEach((c, i) => {
      c.textContent = GEMS[g[i]];
      c.className = `m3-cell${i === sel ? ' sel' : ''}${flash.has(i) ? ' pop' : ''}`;
    });
    api.set({ score, info: started ? api.L(`${left()} 秒`, `${left()}s`) : '' });
  };
  const cascade = () => {
    const hit = findRuns(g);
    if (!hit.size) return void (busy = false);
    score += hit.size;
    paint(hit);
    api.later(() => {
      for (let c = 0; c < N; c++) {
        const col = [];
        for (let r = N - 1; r >= 0; r--) if (!hit.has(r * N + c)) col.push(g[r * N + c]);
        while (col.length < N) col.push(pick());
        col.forEach((v, k) => (g[(N - 1 - k) * N + c] = v));
      }
      paint();
      api.later(cascade, 160);
    }, 220);
  };
  function tap(i) {
    if (api.ended || busy || !started) return;
    if (sel < 0) return ((sel = i), paint());
    const near = Math.abs(sel - i) === N || (Math.abs(sel - i) === 1 && Math.floor(sel / N) === Math.floor(i / N));
    if (!near) return ((sel = i), paint());
    [g[sel], g[i]] = [g[i], g[sel]];
    if (!findRuns(g).size) {
      [g[sel], g[i]] = [g[i], g[sel]];
      cells[i].classList.add('no');
      sel = -1;
      return api.later(paint, 200);
    }
    sel = -1;
    busy = true;
    cascade();
  }
  paint();
  const start = startButton(api, null, () => {
    started = true;
    left = countdown(api, 60, () => paint(), () => api.end(score, api.L(`消了 ${score} 顆。`, `${score} cleared.`)));
    paint();
  });
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'm3-board' }, cells), start]);
}
