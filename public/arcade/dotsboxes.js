// 點格棋 (Dots and boxes) against Quadra: take turns drawing a line; close a
// box to own it and draw again. 4×4 boxes. A box scores 3, winning adds 10.
import { quitButton, row } from './kit.js';

const N = 4;
// Edge ids: 'h r c' (r 0..N, c 0..N-1) and 'v r c' (r 0..N-1, c 0..N).
const edgesOf = (r, c) => [`h${r},${c}`, `h${r + 1},${c}`, `v${r},${c}`, `v${r},${c + 1}`];
const boxesOf = e => {
  const [r, c] = e.slice(1).split(',').map(Number);
  return (e[0] === 'h' ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]]).filter(([a, b]) => a >= 0 && a < N && b >= 0 && b < N);
};
export const ALL_EDGES = [...Array(N + 1).keys()].flatMap(r => [...Array(N).keys()].map(c => `h${r},${c}`)).concat([...Array(N).keys()].flatMap(r => [...Array(N + 1).keys()].map(c => `v${r},${c}`)));
export function sidesAfter(taken, e) {
  return boxesOf(e).map(([r, c]) => edgesOf(r, c).filter(x => x === e || taken.has(x)).length);
}
// Quadra's pick: close a box if it can; else a line that gives nothing away;
// else the one that hands over the fewest boxes.
export function dbPick(taken, rand) {
  const free = ALL_EDGES.filter(e => !taken.has(e));
  const closing = free.filter(e => sidesAfter(taken, e).includes(4));
  if (closing.length) return closing[0];
  const safe = free.filter(e => !sidesAfter(taken, e).includes(3));
  if (safe.length) return safe[Math.floor(rand() * safe.length)];
  // Count how many boxes the opponent could then take in a row.
  const giveaway = e => {
    const t = new Set(taken).add(e);
    let n = 0;
    for (let go = true; go; ) {
      go = false;
      for (const x of ALL_EDGES) if (!t.has(x) && sidesAfter(t, x).includes(4)) {
        t.add(x);
        n += sidesAfter(t, x).filter(s => s === 4).length;
        go = true;
      }
    }
    return n;
  };
  return free.map(e => [giveaway(e), e]).sort((a, b) => a[0] - b[0])[0][1];
}
export default function dotsboxes(api) {
  const taken = new Map();
  const owner = {};
  let turn = 1;
  const count = p => Object.values(owner).filter(v => v === p).length;
  const score = () => count(1) * 3 + (count(1) > N * N / 2 ? 10 : 0);
  const board = api.el('div', { class: 'db-board', style: `grid-template-columns: repeat(${N}, 12px 1fr) 12px` });
  const has = new Set();
  const draw = (e, p) => {
    taken.set(e, p);
    has.add(e);
    let closed = false;
    for (const [r, c] of boxesOf(e)) if (edgesOf(r, c).every(x => has.has(x))) {
      owner[`${r},${c}`] = p;
      closed = true;
    }
    return closed;
  };
  const finish = () => {
    paint();
    const me = count(1);
    const them = count(2);
    api.end(score(), me > them ? api.L(`${me} 比 ${them}，你贏了！`, `${me} to ${them}: you win!`) : me === them ? api.L('平手！', 'A draw!') : api.L(`${me} 比 ${them}，Quadra 贏了。`, `${me} to ${them}: Quadra wins.`));
  };
  const quadra = () => {
    if (api.ended) return;
    if (has.size === ALL_EDGES.length) return finish();
    const e = dbPick(has, api.rand);
    const again = draw(e, 2);
    paint(e);
    if (has.size === ALL_EDGES.length) return finish();
    if (again) return api.later(quadra, 420);
    turn = 1;
    paint(e);
  };
  function mine(e) {
    if (api.ended || turn !== 1 || has.has(e)) return;
    const again = draw(e, 1);
    if (has.size === ALL_EDGES.length) return finish();
    if (!again) {
      turn = 2;
      api.later(quadra, 420);
    }
    paint(e);
  }
  const paint = (lastE = null) => {
    const kids = [];
    for (let R = 0; R <= 2 * N; R++)
      for (let C = 0; C <= 2 * N; C++) {
        if (R % 2 === 0 && C % 2 === 0) kids.push(api.el('span', { class: 'db-dot' }));
        else if (R % 2 === 1 && C % 2 === 1) {
          const o = owner[`${(R - 1) / 2},${(C - 1) / 2}`];
          kids.push(api.el('span', { class: `db-box${o === 1 ? ' me' : o === 2 ? ' them' : ''}`, text: o === 1 ? api.L('你', 'You') : o === 2 ? 'Q' : '' }));
        } else {
          const e = R % 2 === 0 ? `h${R / 2},${(C - 1) / 2}` : `v${(R - 1) / 2},${C / 2}`;
          const p = taken.get(e);
          kids.push(api.el('button', { class: `db-line ${R % 2 === 0 ? 'h' : 'v'}${p === 1 ? ' me' : p === 2 ? ' them' : ''}${e === lastE ? ' last' : ''}`, type: 'button', 'aria-label': e, onclick: () => mine(e) }));
        }
      }
    board.replaceChildren(...kids);
    api.set({ score: score(), info: `${api.L('你', 'You')} ${count(1)} : ${count(2)} Quadra · ${turn === 1 ? api.L('輪到你', 'Your move') : api.L('Quadra 下', 'Quadra’s move')}` });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點兩點之間畫線，圍起一格就再畫一次', 'Tap between dots; close a box to go again') }), board, row(api, [quitButton(api, score)])]);
}
