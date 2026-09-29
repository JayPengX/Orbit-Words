// 找規律: what comes next? Number patterns, harder as you go. 60 seconds.
import { quiz } from './kit.js';

function sequence(level, rand) {
  const r = n => Math.floor(rand() * n);
  const kinds = level < 0.3 ? ['add', 'sub', 'mul'] : level < 0.6 ? ['add', 'mul', 'square', 'alt', 'grow'] : ['mul', 'square', 'alt', 'grow', 'fib', 'double'];
  const kind = kinds[r(kinds.length)];
  const a = 1 + r(9);
  const d = 2 + r(7);
  const make = {
    add: i => a + d * i,
    sub: i => 60 + a - d * i,
    mul: i => a * (2 + (d % 2)) ** i,
    square: i => (i + a) ** 2,
    alt: i => (i % 2 ? a + d * Math.floor(i / 2) : 50 - d * (i / 2)),
    grow: i => a + (i * (i + 1) * d) / 2,
    double: i => a * 2 ** i - i,
    fib: null
  };
  if (kind === 'fib') {
    const s = [a, a + 1 + r(3)];
    while (s.length < 6) s.push(s.at(-1) + s.at(-2));
    return s;
  }
  return Array.from({ length: 6 }, (_, i) => make[kind](i));
}
export default function patterns(api) {
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const s = sequence(level, api.rand);
      const next = s[5];
      const step = Math.max(1, Math.abs(s[5] - s[4]));
      const decoys = [...new Set([next + step, next - 1, next + 2, s[4] + (s[4] - s[3]), next * 2].filter(v => v !== next))].slice(0, 3);
      const order = [next, ...decoys].map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      return { prompt: api.el('span', { class: 'num', text: `${s.slice(0, 5).join(', ')}, ?` }), choices: order.map(o => o[1]), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
