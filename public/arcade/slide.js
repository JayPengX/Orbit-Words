// 數字推盤: slide the tiles into order 1-8. Three puzzles, each more mixed;
// each solved scores 8, plus up to 6 for doing it in few moves.
import { slidePuzzle, slideMove, slideCan, slideSolved } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

export default function slide(api) {
  const n = 3;
  const MIX = [12, 22, 40];
  let k = 0;
  let tiles = slidePuzzle(n, MIX[0]);
  let moves = 0;
  let score = 0;
  const box = api.el('div', { class: 'sl-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const paint = () => {
    box.replaceChildren(
      ...tiles.map((v, i) =>
        api.el('button', {
          class: `sl-tile${v ? '' : ' gap'}${v && slideCan(tiles, n, i) ? ' can' : ''}`,
          type: 'button',
          text: v ? String(v) : '',
          onclick: () => {
            if (!v || api.ended || !slideCan(tiles, n, i)) return;
            tiles = slideMove(tiles, n, i);
            moves++;
            if (slideSolved(tiles)) {
              score += 8 + Math.max(0, 6 - Math.floor(Math.max(0, moves - MIX[k]) / 4));
              k++;
              if (k >= MIX.length) {
                paint();
                return api.end(score, api.L('三盤都排好了！', 'All three solved!'));
              }
              tiles = slidePuzzle(n, MIX[k]);
              moves = 0;
            }
            paint();
          }
        })
      )
    );
    title.textContent = api.L(`第 ${k + 1}/3 盤 · ${moves} 步`, `Puzzle ${k + 1}/3 · ${moves} moves`);
    api.set({ score, info: api.L(`第 ${k + 1}/3 盤`, `Puzzle ${k + 1}/3`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, row(api, [quitButton(api, () => score)])]);
}
