// 估算: the nearest answer to a sum you'd rather not work out. 45 seconds.
import { quiz } from './kit.js';

export default function estimate(api) {
  return quiz(api, {
    seconds: 45,
    ask(level) {
      const big = level > 0.5;
      const a = (big ? 100 : 12) + Math.floor(api.rand() * (big ? 900 : 88));
      const b = 12 + Math.floor(api.rand() * (big ? 88 : 40));
      const op = api.rand() < 0.7 ? '×' : '÷';
      const shown = op === '×' ? `${a} × ${b}` : `${a * b} ÷ ${b}`;
      const value = op === '×' ? a * b : a;
      // Three decoys 25-60% off, so it takes a real estimate but no pen.
      const spread = [0.55, 0.75, 1.3, 1.6, 0.65, 1.45];
      const picks = [value, ...spread.sort(() => api.rand() - 0.5).slice(0, 3).map(k => Math.round(value * k))];
      const order = picks.map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      return { prompt: api.el('span', { class: 'num', text: `${shown} ≈ ?` }), choices: order.map(o => o[1].toLocaleString()), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
