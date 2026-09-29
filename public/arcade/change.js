// 找零錢: how much change? Paying for a Taiwan convenience-store basket. 60 seconds.
import { quiz } from './kit.js';

const ITEMS = [['🍙', '飯糰', 'Rice ball', 35], ['🧋', '珍奶', 'Bubble tea', 65], ['🍱', '便當', 'Bento', 95], ['🥤', '汽水', 'Soda', 29], ['🍞', '麵包', 'Bread', 42], ['☕', '拿鐵', 'Latte', 55], ['🍫', '巧克力', 'Chocolate', 38], ['🧃', '果汁', 'Juice', 25], ['🍜', '泡麵', 'Noodles', 47], ['🍦', '霜淇淋', 'Ice cream', 30]];
export default function change(api) {
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const n = 1 + Math.floor(api.rand() * (level > 0.5 ? 4 : 2)) + (level > 0.3 ? 1 : 0);
      const basket = Array.from({ length: n }, () => ITEMS[Math.floor(api.rand() * ITEMS.length)]);
      const total = basket.reduce((s, x) => s + x[3], 0);
      const paid = [100, 200, 500, 1000].find(v => v >= total + (api.rand() < 0.3 ? 100 : 1)) ?? 1000;
      const right = paid - total;
      const decoys = [right + 10, right - 10, right + 1, right - 5, right + 100, 1000 - total].filter(v => v > 0 && v !== right);
      const picks = [right, ...[...new Set(decoys)].sort(() => api.rand() - 0.5).slice(0, 3)];
      const order = picks.map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      const prompt = api.el('div', { class: 'ch-prompt' }, [
        api.el('div', { class: 'ch-basket', text: basket.map(x => x[0]).join(' ') }),
        api.el('small', { text: basket.map(x => `${api.L(x[1], x[2])} ${x[3]}`).join(' + ') }),
        api.el('span', { text: api.L(`付 NT$${paid}，找多少？`, `Paid NT$${paid}: change?`) })
      ]);
      return { prompt, choices: order.map(o => `NT$${o[1]}`), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
