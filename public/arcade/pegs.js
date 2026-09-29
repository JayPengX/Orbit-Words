// 孔明棋: jump a peg over its neighbour into an empty hole; the jumped one goes.
// The classic cross of 33 holes, the centre empty. Score: pegs taken (and a big
// bonus for one left, in the middle bigger still).
import { quitButton, row } from './kit.js';

const N = 7;
const inBoard = (r, c) => r >= 0 && r < N && c >= 0 && c < N && ((r >= 2 && r <= 4) || (c >= 2 && c <= 4));
export default function pegs(api) {
  const peg = Array.from({ length: N * N }, (_, i) => inBoard(Math.floor(i / N), i % N));
  peg[24] = false;
  let sel = -1;
  let taken = 0;
  const moves = from => {
    const r = Math.floor(from / N);
    const c = from % N;
    return [[0, 1], [0, -1], [1, 0], [-1, 0]]
      .map(([dr, dc]) => [r + dr, c + dc, r + 2 * dr, c + 2 * dc])
      .filter(([r1, c1, r2, c2]) => inBoard(r2, c2) && peg[r1 * N + c1] && !peg[r2 * N + c2])
      .map(([r1, c1, r2, c2]) => ({ over: r1 * N + c1, to: r2 * N + c2 }));
  };
  const anyMove = () => peg.some((p, i) => p && moves(i).length);
  const score = () => taken + (32 - taken === 1 ? (peg[24] ? 14 : 8) : 0);
  const cells = peg.map((_, i) => api.el('button', { class: 'pg-hole', type: 'button', disabled: inBoard(Math.floor(i / N), i % N) ? null : true, onclick: () => tap(i) }));
  const paint = () => {
    const targets = sel >= 0 ? new Set(moves(sel).map(m => m.to)) : new Set();
    cells.forEach((c, i) => (c.className = `pg-hole${inBoard(Math.floor(i / N), i % N) ? '' : ' off'}${peg[i] ? ' peg' : ''}${i === sel ? ' sel' : ''}${targets.has(i) ? ' can' : ''}`));
    api.set({ score: score(), info: api.L(`剩 ${32 - taken} 顆`, `${32 - taken} left`) });
  };
  function tap(i) {
    if (api.ended) return;
    if (peg[i]) sel = sel === i ? -1 : i;
    else if (sel >= 0) {
      const m = moves(sel).find(x => x.to === i);
      if (m) {
        peg[sel] = false;
        peg[m.over] = false;
        peg[i] = true;
        taken++;
        sel = m && moves(i).length ? i : -1;
        if (!anyMove()) {
          paint();
          return api.end(score(), 32 - taken === 1 ? api.L('只剩一顆，完美！', 'One peg left: perfect!') : api.L(`剩 ${32 - taken} 顆，沒步可走了。`, `${32 - taken} left, no moves.`));
        }
      }
    }
    paint();
  }
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點一顆棋，再點它可以跳到的空洞', 'Tap a peg, then the hole it can jump to') }), api.el('div', { class: 'pg-board' }, cells), row(api, [quitButton(api, score)])]);
}
