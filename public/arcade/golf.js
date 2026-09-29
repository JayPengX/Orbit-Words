// 高爾夫接龍 (Golf): seven columns of five. Move a bottom card onto the pile
// if it's one higher or lower (no going round from K to A). Turn the stock
// when stuck. Two deals; a card cleared scores 1, stock left over after a
// clear scores 1 each.
import { cardEl, deck, quitButton, row } from './kit.js';

export default function golf(api) {
  const DEALS = 2;
  let n = 0;
  let score = 0;
  let cols;
  let stock;
  let pile;
  const deal = () => {
    const d = deck(api.rand);
    cols = Array.from({ length: 7 }, () => d.splice(0, 5));
    pile = [d.pop()];
    stock = d;
  };
  deal();
  const left = () => cols.reduce((s, c) => s + c.length, 0);
  const canPlay = c => Math.abs(c.r - pile.at(-1).r) === 1;
  const next = msg => {
    n++;
    if (n >= DEALS) return (paint(), api.end(score, msg));
    deal();
    paint();
  };
  const check = () => {
    if (!left()) {
      score += 5 + stock.length;
      return next(api.L('全部清光！', 'Cleared!'));
    }
    if (!stock.length && !cols.some(c => c.length && canPlay(c.at(-1)))) return next(api.L(`剩 ${left()} 張。`, `${left()} cards left.`));
    paint();
  };
  function play(k) {
    if (api.ended) return;
    const c = cols[k].at(-1);
    if (!canPlay(c)) return;
    pile.push(cols[k].pop());
    score++;
    check();
  }
  const turn = () => {
    if (api.ended || !stock.length) return;
    pile.push(stock.pop());
    check();
  };
  const tab = api.el('div', { class: 'cg-tab', style: 'grid-template-columns: repeat(7, 1fr)' });
  const bottom = api.el('div', { class: 'cg-top golf-bottom' });
  const paint = () => {
    tab.replaceChildren(...cols.map((col, k) => api.el('div', { class: 'cg-pile' }, col.length ? col.map((c, i) => cardEl(api, c, { cls: `fl${i === col.length - 1 && canPlay(c) ? ' can' : ''}`, onclick: i === col.length - 1 ? () => play(k) : null })) : [api.el('span', { class: 'pc-slot fl' })])));
    bottom.replaceChildren(api.el('button', { class: 'pc fl back', type: 'button', onclick: turn }, [api.el('span', { class: 'pc-s', text: String(stock.length) })]), cardEl(api, pile.at(-1), { cls: 'fl' }));
    api.set({ score, info: api.L(`第 ${Math.min(n + 1, DEALS)}/${DEALS} 局 · 桌上 ${left()} 張`, `Deal ${Math.min(n + 1, DEALS)}/${DEALS} · ${left()} on the table`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'arc-col felt cg' }, [tab, bottom]), api.el('p', { class: 'arc-hint small', text: api.L('比下面那張大 1 或小 1 就能放（K 不能接 A）', 'One higher or lower than the pile (K and A don\'t join)') }), row(api, [quitButton(api, () => score)])]);
}
