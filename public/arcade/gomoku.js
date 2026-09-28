// 五子棋: 9 × 9 against Quadra; five in a row wins. Win 35; otherwise 1 for
// every 4 stones you played.
import { gmFive, gmBest } from '../lib/arcade.mjs';

export default function gomoku(api) {
  const n = 9;
  let b = Array(n * n).fill(0);
  let busy = false;
  let mine = 0;
  let last = -1;
  const box = api.el('div', { class: 'gm-grid' });
  const title = api.el('p', { class: 'arc-hint', text: api.L('你是黑子，先下', 'You are black and go first') });
  const paint = () => {
    box.replaceChildren(
      ...b.map((v, i) =>
        api.el('button', { class: `gm-cell${i === last ? ' last' : ''}`, type: 'button', onclick: () => {
          if (busy || v || api.ended) return;
          b[i] = 1;
          mine++;
          last = i;
          if (gmFive(b, n, i)) return paint(), api.end(35, api.L('五連！你贏了！', 'Five in a row: you win!'));
          if (b.every(Boolean)) return paint(), api.end(15, api.L('下滿了，平手。', 'Board full: a draw.'));
          busy = true;
          paint();
          api.later(() => {
            const j = gmBest(b, n, 2);
            b[j] = 2;
            last = j;
            busy = false;
            paint();
            if (gmFive(b, n, j)) api.end(Math.floor(mine / 4), api.L('Quadra 五連了。', 'Quadra got five in a row.'));
          }, 300);
        } }, v ? [api.el('span', { class: `gm-stone ${v === 1 ? 'black' : 'white'}` })] : [])
      )
    );
    api.set({ score: 0, info: busy ? api.L('Quadra 思考中…', 'Quadra is thinking…') : api.L('輪到你', 'Your move') });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box]);
}
