// 黑白棋: 6 × 6 against Quadra. Place a disc to trap Quadra's between yours
// and flip them; most discs at the end wins. Win: 25 + your lead; a loss:
// a third of your discs.
import { rvStart, rvMoves, rvPlay, rvBest } from '../lib/arcade.mjs';

export default function reversi(api) {
  const n = 6;
  let b = rvStart(n);
  let busy = false;
  const box = api.el('div', { class: 'rv-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const count = who => b.filter(v => v === who).length;
  const end = () => {
    const me = count(1);
    const them = count(2);
    paint();
    if (me > them) api.end(25 + (me - them), api.L(`你贏了 ${me} : ${them}！`, `You won ${me}–${them}!`));
    else if (me === them) api.end(15, api.L(`平手 ${me} : ${them}。`, `A draw, ${me}–${them}.`));
    else api.end(Math.floor(me / 3), api.L(`輸了 ${me} : ${them}。`, `Lost ${me}–${them}.`));
  };
  const quadraTurn = () => {
    if (!rvMoves(b, n, 2).length) {
      busy = false;
      if (!rvMoves(b, n, 1).length) return end();
      return paint(api.L('Quadra 沒有棋可下，換你', 'Quadra has no move: yours again'));
    }
    api.later(() => {
      b = rvPlay(b, n, rvBest(b, n, 2), 2);
      busy = false;
      if (!rvMoves(b, n, 1).length) {
        if (!rvMoves(b, n, 2).length) return end();
        busy = true;
        paint(api.L('你沒有棋可下', 'You have no move'));
        return api.later(quadraTurn, 700);
      }
      paint();
    }, 450);
  };
  const paint = (note = '') => {
    const moves = new Set(busy ? [] : rvMoves(b, n, 1));
    box.replaceChildren(
      ...b.map((v, i) =>
        api.el('button', { class: `rv-cell${moves.has(i) ? ' can' : ''}`, type: 'button', onclick: () => {
          if (busy || api.ended || !moves.has(i)) return;
          b = rvPlay(b, n, i, 1);
          busy = true;
          paint();
          quadraTurn();
        } }, v ? [api.el('span', { class: `rv-disc ${v === 1 ? 'black' : 'white'}` })] : [])
      )
    );
    title.textContent = `⚫ ${count(1)} : ${count(2)} ⚪ ${note}`;
    api.set({ score: 0, info: `${count(1)} : ${count(2)}` });
  };
  paint(api.L('你是黑棋', 'You are black'));
  return api.el('div', { class: 'arc-col' }, [title, box]);
}
