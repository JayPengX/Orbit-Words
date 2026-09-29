// 三峰接龍 (TriPeaks): clear three peaks by playing uncovered cards one higher
// or lower than the pile (K and A join). Long streaks score extra; each peak
// cleared adds 5. Two deals.
import { cardEl, deck, quitButton, row } from './kit.js';

// The 28 places: [row, x] with x in card widths across a 10-wide board.
export const PEAKS = [
  ...[0, 1, 2].map(p => [0, 3 * p + 1.5]),
  ...Array.from({ length: 6 }, (_, j) => [1, j + Math.floor(j / 2) + 1]),
  ...Array.from({ length: 9 }, (_, k) => [2, k + 0.5]),
  ...Array.from({ length: 10 }, (_, k) => [3, k])
];
// The two places covering place i (none for the bottom row).
export function coverOf(i) {
  if (i < 3) return [3 + 2 * i, 4 + 2 * i];
  if (i < 9) {
    const j = i - 3;
    const k = j + Math.floor(j / 2);
    return [9 + k, 10 + k];
  }
  if (i < 18) return [18 + (i - 9), 19 + (i - 9)];
  return [];
}
export default function tripeaks(api) {
  const DEALS = 2;
  let n = 0;
  let score = 0;
  let cards;
  let gone;
  let stock;
  let pile;
  let streak = 0;
  const deal = () => {
    const d = deck(api.rand);
    cards = d.splice(0, 28);
    pile = [d.pop()];
    stock = d;
    gone = new Set();
    streak = 0;
  };
  deal();
  const open = i => coverOf(i).every(k => gone.has(k));
  const fits = c => [1, 12].includes(Math.abs(c.r - pile.at(-1).r));
  const next = msg => {
    n++;
    if (n >= DEALS) return (paint(), api.end(score, msg));
    deal();
    paint();
  };
  const check = () => {
    if (gone.size === 28) {
      score += 10 + Math.floor(stock.length / 2);
      return next(api.L('三座山都清光！', 'All peaks cleared!'));
    }
    if (!stock.length && !cards.some((c, i) => !gone.has(i) && open(i) && fits(c))) return next(api.L(`剩 ${28 - gone.size} 張。`, `${28 - gone.size} left.`));
    paint();
  };
  function play(i) {
    if (api.ended || gone.has(i) || !open(i) || !fits(cards[i])) return;
    gone.add(i);
    pile.push(cards[i]);
    streak++;
    score += 1 + (streak >= 4 ? 1 : 0);
    if (i < 3) score += 5;
    check();
  }
  const turn = () => {
    if (api.ended || !stock.length) return;
    pile.push(stock.pop());
    streak = 0;
    check();
  };
  const board = api.el('div', { class: 'tp-board' });
  const bottom = api.el('div', { class: 'cg-top golf-bottom' });
  const paint = () => {
    board.replaceChildren(
      ...cards.map((c, i) => {
        if (gone.has(i)) return api.el('span');
        const up = open(i);
        const b = cardEl(api, c, { up, cls: `fl${up && fits(c) ? ' can' : ''}`, onclick: up ? () => play(i) : null });
        b.style.left = `${PEAKS[i][1] * 10}%`;
        b.style.top = `${PEAKS[i][0] * 20.5}%`;
        return b;
      })
    );
    bottom.replaceChildren(api.el('button', { class: 'pc fl back', type: 'button', onclick: turn }, [api.el('span', { class: 'pc-s', text: String(stock.length) })]), cardEl(api, pile.at(-1), { cls: 'fl' }), api.el('span', { class: 'tp-streak', text: streak > 1 ? api.L(`連續 ${streak}`, `${streak} in a row`) : '' }));
    api.set({ score, info: api.L(`第 ${Math.min(n + 1, DEALS)}/${DEALS} 局 · 剩 ${28 - gone.size} 張`, `Deal ${Math.min(n + 1, DEALS)}/${DEALS} · ${28 - gone.size} left`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'arc-col felt cg' }, [board, bottom]), api.el('p', { class: 'arc-hint small', text: api.L('大 1 或小 1 就能接（K 和 A 相連）', 'One higher or lower (K and A join)') }), row(api, [quitButton(api, () => score)])]);
}
