// 比大小: which side is bigger? Sums, products and fractions; 45 seconds.
// Score: right answers (a wrong one −1), with harder pairs worth 2.
import { countdown, startButton } from './kit.js';

export default function compare(api) {
  let score = 0;
  let right = 0;
  let left = () => 45;
  const a = api.el('button', { class: 'cp-side num', type: 'button' });
  const b = api.el('button', { class: 'cp-side num', type: 'button' });
  const info = () => api.L(`${left()} 秒 · 答對 ${right}`, `${left()}s · ${right} right`);
  const r = n => 1 + Math.floor(api.rand() * n);
  const make = hard => {
    const kind = Math.floor(api.rand() * (hard ? 3 : 2));
    if (kind === 0) {
      const [x, y] = [r(40), r(40)];
      return { text: `${x} + ${y}`, v: x + y };
    }
    if (kind === 1) {
      const [x, y] = [r(12), r(12)];
      return { text: `${x} × ${y}`, v: x * y };
    }
    const [x, y] = [r(9), r(9) + 1];
    return { text: `${x}/${y}`, v: x / y };
  };
  const ask = () => {
    const hard = right >= 8;
    let l = make(hard);
    let m = make(hard);
    while (Math.abs(l.v - m.v) < 1e-9) m = make(hard);
    const worth = hard ? 2 : 1;
    for (const [side, me, other] of [[a, l, m], [b, m, l]]) {
      side.textContent = me.text;
      side.onclick = () => {
        if (api.ended) return;
        if (me.v > other.v) (score += worth, right++);
        else score = Math.max(0, score - 1);
        api.set({ score, info: info() });
        ask();
      };
    }
  };
  const start = startButton(api, null, () => {
    left = countdown(api, 45, () => api.set({ score, info: info() }), () => api.end(score, api.L(`答對 ${right} 題。`, `${right} right.`)));
    ask();
  });
  a.textContent = '?';
  b.textContent = '?';
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點比較大的那一邊', 'Tap the bigger side') }), api.el('div', { class: 'cp-row' }, [a, api.el('span', { class: 'cp-vs', text: 'vs' }), b]), start]);
}
