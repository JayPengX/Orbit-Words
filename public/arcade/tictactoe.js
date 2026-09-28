// 井字棋: five games against Quadra (it plays well, but not perfectly). You
// start the odd games. Score: 8 a win, 3 a draw.
import { tttWinner, tttBest } from '../lib/arcade.mjs';

export default function tictactoe(api) {
  let game = 0;
  let b = Array(9).fill('');
  let score = 0;
  let tally = { w: 0, d: 0, l: 0 };
  let busy = false;
  const box = api.el('div', { class: 'tt-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const quadra = () => {
    const free = b.flatMap((v, i) => (v ? [] : [i]));
    // Mostly the best move; now and then a slip.
    return api.rand() < 0.22 ? free[Math.floor(api.rand() * free.length)] : tttBest(b, 'O');
  };
  const finish = w => {
    if (w === 'X') (score += 8), tally.w++;
    else if (w === 'draw') (score += 3), tally.d++;
    else tally.l++;
    paint(w);
    game++;
    if (game >= 5) return api.later(() => api.end(score, api.L(`${tally.w} 勝 ${tally.d} 和 ${tally.l} 敗。`, `${tally.w} won, ${tally.d} drawn, ${tally.l} lost.`)), 700);
    api.later(() => {
      b = Array(9).fill('');
      busy = false;
      if (game % 2) b[quadra()] = 'O';
      paint();
    }, 900);
  };
  const paint = (result = null) => {
    box.replaceChildren(
      ...b.map((v, i) =>
        api.el('button', {
          class: `tt-cell ${v === 'X' ? 'x' : v === 'O' ? 'o' : ''}`,
          type: 'button',
          text: v === 'X' ? '✕' : v === 'O' ? '◯' : '',
          onclick: () => {
            if (busy || v || api.ended) return;
            b[i] = 'X';
            let w = tttWinner(b);
            if (w) return (busy = true), finish(w);
            b[quadra()] = 'O';
            w = tttWinner(b);
            if (w) return (busy = true), finish(w);
            paint();
          }
        })
      )
    );
    const r = result === 'X' ? api.L('你贏了！', 'You win!') : result === 'O' ? api.L('Quadra 贏了', 'Quadra wins') : result === 'draw' ? api.L('平手', 'Draw') : '';
    title.textContent = `${api.L(`第 ${game + 1}/5 盤`, `Game ${game + 1}/5`)} · ${tally.w}-${tally.d}-${tally.l} ${r}`;
    api.set({ score, info: `${tally.w}-${tally.d}-${tally.l}` });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, api.el('p', { class: 'arc-hint small', text: api.L('你是 ✕', 'You are ✕') })]);
}
