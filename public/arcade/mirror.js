// 心智旋轉: which one is the same shape turned (not flipped)? 60 seconds.
import { quiz } from './kit.js';

const rot = (cells, n) => cells.map(([r, c]) => [c, n - 1 - r]);
const flip = (cells, n) => cells.map(([r, c]) => [r, n - 1 - c]);
const key = cells => cells.map(([r, c]) => r * 10 + c).sort((a, b) => a - b).join(',');
function grid(api, cells, n) {
  const on = new Set(cells.map(([r, c]) => r * n + c));
  return api.el('span', { class: 'mr-grid', style: `--n:${n}` }, Array.from({ length: n * n }, (_, i) => api.el('i', { class: on.has(i) ? 'on' : '' })));
}
export default function mirror(api) {
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const n = level < 0.4 ? 3 : 4;
      // A random shape with no symmetry (so a flip is never also a turn).
      let cells;
      do {
        const set = new Set();
        while (set.size < n + 1 + Math.floor(api.rand() * 2)) set.add(Math.floor(api.rand() * n * n));
        cells = [...set].map(i => [Math.floor(i / n), i % n]);
      } while ([0, 1, 2, 3].some(k => key(flip(Array.from({ length: k }).reduce(c => rot(c, n), cells), n)) === key(cells)) || key(rot(rot(cells, n), n)) === key(cells));
      const turns = 1 + Math.floor(api.rand() * 3);
      let right = cells;
      for (let i = 0; i < turns; i++) right = rot(right, n);
      // The flips, each turned 0-3 times: never the shape itself (it has no mirror symmetry).
      const seen = new Set([key(right)]);
      const wrongs = [];
      let f = flip(cells, n);
      for (let k = 0; k < 4 && wrongs.length < 3; k++, f = rot(f, n)) if (!seen.has(key(f))) (seen.add(key(f)), wrongs.push(f));
      const order = [right, ...wrongs].map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      return { prompt: grid(api, cells, n), choices: order.map(o => grid(api, o[1], n)), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
