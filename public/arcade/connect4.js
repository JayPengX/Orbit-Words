// 四子棋: drop discs to get four in a row before Quadra does. Win 35, a draw
// 15, a loss 1 for every 3 discs you played.
import { C4, c4Drop, c4Winner, c4Best } from '../lib/arcade.mjs';

export default function connect4(api) {
  let b = Array(C4.w * C4.h).fill(0);
  let busy = false;
  let mine = 0;
  const box = api.el('div', { class: 'c4-grid' });
  const title = api.el('p', { class: 'arc-hint', text: api.L('你是紅色，點一欄落子', 'You are red: tap a column') });
  const over = w => {
    paint();
    if (w === 1) return api.end(35, api.L('四連線，你贏了！', 'Four in a row: you win!'));
    if (w === 'draw') return api.end(15, api.L('平手！', 'A draw!'));
    api.end(Math.floor(mine / 3), api.L('Quadra 連成四個了。', 'Quadra got four in a row.'));
  };
  const play = col => {
    if (busy || api.ended) return;
    const next = c4Drop(b, col, 1);
    if (!next) return;
    b = next;
    mine++;
    let w = c4Winner(b);
    if (w) return over(w);
    busy = true;
    paint();
    api.later(() => {
      b = c4Drop(b, c4Best(b, 2, 4), 2) || b;
      busy = false;
      w = c4Winner(b);
      if (w) return over(w);
      paint();
    }, 350);
  };
  const paint = () => {
    box.replaceChildren(...b.map((v, i) => api.el('button', { class: `c4-cell${v === 1 ? ' me' : v === 2 ? ' them' : ''}`, type: 'button', 'aria-label': `column ${(i % C4.w) + 1}`, onclick: () => play(i % C4.w) })));
    api.set({ score: 0, info: busy ? api.L('Quadra 思考中…', 'Quadra is thinking…') : api.L('輪到你', 'Your move') });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box]);
}
