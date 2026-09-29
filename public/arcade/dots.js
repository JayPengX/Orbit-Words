// 連點: drag through touching dots of one colour (two or more) to clear them; new
// dots fall in. 60 seconds.
import { countdown, startButton } from './kit.js';

const N = 6;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
export default function dots(api) {
  const pick = () => Math.floor(api.rand() * COLORS.length);
  const g = Array.from({ length: N * N }, pick);
  let path = [];
  let score = 0;
  let started = false;
  let left = () => 60;
  const cells = g.map((_, i) => api.el('span', { class: 'dt-cell', 'data-i': String(i) }, [api.el('i')]));
  const board = api.el('div', { class: 'dt-board' }, cells);
  const paint = () => {
    cells.forEach((c, i) => {
      c.firstChild.style.background = COLORS[g[i]];
      c.classList.toggle('on', path.includes(i));
    });
    api.set({ score, info: started ? api.L(`${left()} 秒`, `${left()}s`) : '' });
  };
  const at = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dt-cell');
    return el && board.contains(el) ? Number(el.dataset.i) : -1;
  };
  const near = (a, b) => Math.abs(a - b) === N || (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N));
  board.style.touchAction = 'none';
  board.addEventListener('pointerdown', e => {
    if (!started || api.ended) return;
    const i = at(e);
    if (i >= 0) (path = [i]), paint();
  });
  board.addEventListener('pointermove', e => {
    if (!path.length) return;
    const i = at(e);
    if (i < 0 || path.includes(i)) {
      // Back over the dot before the last: step back.
      if (i >= 0 && path.at(-2) === i) (path.pop(), paint());
      return;
    }
    if (g[i] === g[path[0]] && near(i, path.at(-1))) (path.push(i), paint());
  });
  const finish = () => {
    if (path.length >= 2) {
      score += path.length + (path.length >= 5 ? path.length - 4 : 0);
      const hit = new Set(path);
      for (let c = 0; c < N; c++) {
        const col = [];
        for (let r = N - 1; r >= 0; r--) if (!hit.has(r * N + c)) col.push(g[r * N + c]);
        while (col.length < N) col.push(pick());
        col.forEach((v, k) => (g[(N - 1 - k) * N + c] = v));
      }
    }
    path = [];
    paint();
  };
  board.addEventListener('pointerup', finish);
  board.addEventListener('pointercancel', finish);
  paint();
  const start = startButton(api, null, () => {
    started = true;
    left = countdown(api, 60, paint, () => api.end(score, api.L(`連了 ${score} 分。`, `${score} points.`)));
  });
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('手指滑過相鄰的同色點（兩個以上）', 'Drag through touching dots of one colour') }), board, start]);
}
