// 分數比大小: which fraction is bigger? 60 seconds.
import { quiz } from './kit.js';

const frac = (n, d) => api => api.el('span', { class: 'frac' }, [api.el('b', { text: String(n) }), api.el('i'), api.el('b', { text: String(d) })]);
export default function fractions(api) {
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const top = 6 + Math.round(level * 14);
      const pick = () => {
        const d = 2 + Math.floor(api.rand() * top);
        return [1 + Math.floor(api.rand() * (d - 1)), d];
      };
      let a = pick();
      let b = pick();
      // Now and then equal ones (2/3 and 4/6).
      if (api.rand() < 0.15) {
        const k = 2 + Math.floor(api.rand() * 3);
        b = [a[0] * k, a[1] * k];
      }
      while (a[0] * b[1] !== b[0] * a[1] && Math.abs(a[0] / a[1] - b[0] / b[1]) < 0.02) b = pick();
      const diff = a[0] * b[1] - b[0] * a[1];
      return { prompt: api.el('span', { class: 'frac-row' }, [frac(...a)(api), api.el('small', { text: api.L('哪個大？', 'Which is bigger?') }), frac(...b)(api)]), choices: [api.L('左邊', 'Left'), api.L('右邊', 'Right'), api.L('一樣大', 'Equal')], answer: diff > 0 ? 0 : diff < 0 ? 1 : 2, wide: false };
    }
  });
}
