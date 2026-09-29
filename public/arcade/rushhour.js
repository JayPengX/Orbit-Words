// 華容道 (Rush Hour): slide the cars (each only along its length) to get the red
// car out of the gap on the right. Three jams, each checked solvable by a solver;
// fewer moves score more.
import { quitButton, row } from './kit.js';

const N = 6;
// A car: { r, c, len, h (horizontal) }; car 0 is red, on row 2, horizontal.
const cellsOf = car => Array.from({ length: car.len }, (_, k) => (car.r + (car.h ? 0 : k)) * N + car.c + (car.h ? k : 0));
const key = cars => cars.map(c => (c.h ? c.c : c.r)).join(',');
function occupied(cars, skip = -1) {
  const o = new Set();
  cars.forEach((car, i) => i !== skip && cellsOf(car).forEach(x => o.add(x)));
  return o;
}
// Every position a car can slide to (not counting where it is).
function slides(cars, i) {
  const car = cars[i];
  const o = occupied(cars, i);
  const out = [];
  for (const d of [-1, 1]) {
    for (let s = 1; ; s++) {
      const moved = { ...car, r: car.r + (car.h ? 0 : d * s), c: car.c + (car.h ? d * s : 0) };
      if (moved.r < 0 || moved.c < 0 || moved.r + (car.h ? 0 : car.len - 1) >= N || moved.c + (car.h ? car.len - 1 : 0) >= N || cellsOf(moved).some(x => o.has(x))) break;
      out.push(moved);
    }
  }
  return out;
}
// The fewest moves to free the red car (a slide of any length is one move), or -1.
export function solve(cars, limit = 60000) {
  const seen = new Set([key(cars)]);
  let frontier = [cars];
  for (let depth = 0; frontier.length && seen.size < limit; depth++) {
    const next = [];
    for (const s of frontier) {
      if (s[0].c + s[0].len === N || slides(s, 0).some(m => m.c + m.len === N)) return depth + (s[0].c + s[0].len === N ? 0 : 1);
      s.forEach((_, i) =>
        slides(s, i).forEach(m => {
          const t = s.map((c, k) => (k === i ? m : c));
          const kk = key(t);
          if (!seen.has(kk)) (seen.add(kk), next.push(t));
        })
      );
    }
    frontier = next;
  }
  return -1;
}
export function jam(rand, want, budget = 900) {
  // The hardest one found within the time budget (a phone can't search for long).
  const until = Date.now() + budget;
  let best = null;
  for (let attempt = 0; attempt < 400 && Date.now() < until; attempt++) {
    const cars = [{ r: 2, c: Math.floor(rand() * 2), len: 2, h: true }];
    for (let k = 0; k < 40 && cars.length < 7 + Math.floor(want / 3); k++) {
      const h = rand() < 0.5;
      const len = rand() < 0.3 ? 3 : 2;
      const car = { r: Math.floor(rand() * (h ? N : N - len + 1)), c: Math.floor(rand() * (h ? N - len + 1 : N)), len, h };
      if (h && car.r === 2) continue;
      const o = occupied(cars);
      if (cellsOf(car).some(x => o.has(x))) continue;
      cars.push(car);
    }
    const moves = solve(cars, 20000);
    if (moves >= want && moves <= want + 6) return { cars, moves };
    if (moves > 0 && (!best || moves > best.moves)) best = { cars, moves };
  }
  return best;
}
export default function rushhour(api) {
  const WANT = [4, 6, 9];
  const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#64748b', '#ec4899', '#0ea5e9', '#84cc16', '#78350f'];
  let level = 0;
  let score = 0;
  let moves = 0;
  let cars;
  let best;
  let sel = -1;
  const board = api.el('div', { class: 'rh-board' });
  const newLevel = () => {
    const j = jam(api.rand, WANT[level]) || jam(api.rand, 2);
    cars = j.cars;
    best = j.moves;
    moves = 0;
    sel = -1;
  };
  const paint = () => {
    const targets = sel >= 0 ? slides(cars, sel) : [];
    const spots = new Map();
    targets.forEach(m => cellsOf(m).forEach(x => !cellsOf(cars[sel]).includes(x) && spots.set(x, m)));
    board.replaceChildren(
      ...Array.from({ length: N * N }, (_, i) => api.el('button', { class: `rh-cell${spots.has(i) ? ' can' : ''}`, type: 'button', style: `grid-row:${Math.floor(i / N) + 1};grid-column:${(i % N) + 1}`, onclick: () => spots.has(i) && go(spots.get(i)) })),
      ...cars.map((car, i) => api.el('button', { class: `rh-car${i === 0 ? ' red' : ''}${i === sel ? ' sel' : ''}`, type: 'button', style: `grid-row:${car.r + 1} / span ${car.h ? 1 : car.len};grid-column:${car.c + 1} / span ${car.h ? car.len : 1};background:${COLORS[i % COLORS.length]}`, onclick: () => ((sel = sel === i ? -1 : i), paint()) }, i === 0 ? [document.createTextNode('🚗')] : [])),
      api.el('span', { class: 'rh-exit', text: '→' })
    );
    api.set({ score, info: api.L(`第 ${level + 1}/3 關 · ${moves} 步（最少 ${best}）`, `Jam ${level + 1}/3 · ${moves} moves (best ${best})`) });
  };
  function go(m) {
    if (api.ended) return;
    cars[sel] = m;
    moves++;
    if (sel === 0 && m.c + m.len === N) {
      score += Math.max(6, 18 - Math.max(0, moves - best) * 2);
      level++;
      if (level >= WANT.length) {
        paint();
        return api.end(score, api.L('三關都開出去了！', 'Out of all three jams!'));
      }
      newLevel();
    }
    paint();
  }
  newLevel();
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點一台車，再點綠色的格子把它滑過去；讓紅車從右邊出口開出去', 'Tap a car, then a green square to slide it; get the red car out on the right') }), board, row(api, [quitButton(api, () => score)])]);
}
