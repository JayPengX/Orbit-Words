// 撲克方塊 (Poker squares): 25 cards come one at a time; put each in the 5×5
// grid. Every row and column is then scored as a poker hand.
import { cardEl, deck } from './kit.js';

const HANDS = [
  [100, '同花大順', 'Royal flush'],
  [75, '同花順', 'Straight flush'],
  [50, '四條', 'Four of a kind'],
  [25, '葫蘆', 'Full house'],
  [20, '同花', 'Flush'],
  [15, '順子', 'Straight'],
  [10, '三條', 'Three of a kind'],
  [5, '兩對', 'Two pair'],
  [2, '一對', 'One pair'],
  [0, '散牌', 'Nothing']
];
// A five-card hand's row in HANDS.
export function pokerHand(cards) {
  const rs = cards.map(c => c.r).sort((a, b) => a - b);
  const tally = {};
  for (const r of rs) tally[r] = (tally[r] || 0) + 1;
  const counts = Object.values(tally).sort((a, b) => b - a);
  const flush = cards.every(c => c.s === cards[0].s);
  const royal = rs.join() === '1,10,11,12,13';
  const straight = counts.length === 5 && (rs[4] - rs[0] === 4 || royal);
  if (straight && flush) return royal ? 0 : 1;
  if (counts[0] === 4) return 2;
  if (counts[0] === 3 && counts[1] === 2) return 3;
  if (flush) return 4;
  if (straight) return 5;
  if (counts[0] === 3) return 6;
  if (counts[0] === 2 && counts[1] === 2) return 7;
  if (counts[0] === 2) return 8;
  return 9;
}
export default function pokersq(api) {
  const d = deck(api.rand).slice(0, 25);
  const grid = Array(25).fill(null);
  let at = 0;
  const lines = [...Array(5).keys()].flatMap(k => [[0, 1, 2, 3, 4].map(c => k * 5 + c), [0, 1, 2, 3, 4].map(r => r * 5 + k)]);
  const total = () => lines.reduce((s, l) => (l.every(i => grid[i]) ? s + HANDS[pokerHand(l.map(i => grid[i]))][0] : s), 0);
  const board = api.el('div', { class: 'ps-board' });
  const now = api.el('div', { class: 'ps-now' });
  const label = l => {
    if (!l.every(i => grid[i])) return '';
    const h = HANDS[pokerHand(l.map(i => grid[i]))];
    return h[0] ? `${api.L(h[1], h[2])} ${h[0]}` : '—';
  };
  const paint = () => {
    const cells = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const i = r * 5 + c;
        cells.push(grid[i] ? cardEl(api, grid[i], { cls: 'fl' }) : api.el('button', { class: 'pc-slot fl ps-empty', type: 'button', onclick: () => put(i) }));
      }
      cells.push(api.el('span', { class: 'ps-line', text: label(lines[r * 2]) }));
    }
    for (let c = 0; c < 5; c++) cells.push(api.el('span', { class: 'ps-line col', text: label(lines[c * 2 + 1]) }));
    board.replaceChildren(...cells);
    now.replaceChildren(at < 25 ? cardEl(api, d[at], { cls: 'fl' }) : api.el('span'), api.el('span', { class: 'arc-hint small', text: at < 25 ? api.L(`第 ${at + 1}/25 張：點空格放下`, `Card ${at + 1}/25: tap a space`) : '' }));
    api.set({ score: total(), info: api.L(`已放 ${at}/25`, `${at}/25 placed`) });
  };
  function put(i) {
    if (api.ended || grid[i] || at >= 25) return;
    grid[i] = d[at++];
    paint();
    if (at === 25) api.end(total(), api.L(`十條牌型共 ${total()} 分。`, `${total()} points from the ten hands.`));
  }
  paint();
  return api.el('div', { class: 'arc-col' }, [now, api.el('div', { class: 'felt cg' }, [board]), api.el('p', { class: 'arc-hint small', text: api.L('同花順 75 · 四條 50 · 葫蘆 25 · 同花 20 · 順子 15 · 三條 10 · 兩對 5 · 一對 2', 'Str. flush 75 · Four 50 · Full house 25 · Flush 20 · Straight 15 · Three 10 · Two pair 5 · Pair 2') })]);
}
