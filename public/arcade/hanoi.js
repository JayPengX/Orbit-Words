// 河內塔: move the tower to the right-hand peg, one disc at a time, never a
// bigger disc on a smaller one. Four discs, then five; each scores by how
// close to the fewest moves (15 and 20 at best).
import { hanoiStart, hanoiMove, hanoiDone, hanoiPay } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

export default function hanoi(api) {
  const SIZES = [4, 5];
  let k = 0;
  let pegs = hanoiStart(SIZES[0]);
  let moves = 0;
  let held = null;
  let score = 0;
  const box = api.el('div', { class: 'hn-pegs' });
  const title = api.el('p', { class: 'arc-hint' });
  const paint = () => {
    const n = SIZES[k];
    box.replaceChildren(
      ...pegs.map((p, i) =>
        api.el('button', { class: `hn-peg${held === i ? ' held' : ''}`, type: 'button', 'aria-label': `peg ${i + 1}`, onclick: () => tap(i) }, [
          api.el('span', { class: 'hn-pole' }),
          ...p.map((d, j) => api.el('span', { class: `hn-disc${held === i && j === p.length - 1 ? ' up' : ''}`, style: `width:${24 + (d / n) * 70}%;background:hsl(${d * 55}, 75%, 55%)` }))
        ])
      )
    );
    title.textContent = api.L(`${n} 層 · ${moves} 步（最少 ${2 ** n - 1}）`, `${n} discs · ${moves} moves (fewest ${2 ** n - 1})`);
    api.set({ score, info: api.L(`第 ${k + 1}/2 座`, `Tower ${k + 1}/2`) });
  };
  const tap = i => {
    if (api.ended) return;
    if (held == null) {
      if (pegs[i].length) held = i;
    } else {
      const next = hanoiMove(pegs, held, i);
      if (next) {
        pegs = next;
        moves++;
      }
      held = null;
      if (hanoiDone(pegs, SIZES[k])) {
        score += hanoiPay(SIZES[k], moves);
        k++;
        if (k >= SIZES.length) {
          paint();
          return api.end(Math.round(score), api.L('兩座塔都搬完了！', 'Both towers moved!'));
        }
        pegs = hanoiStart(SIZES[k]);
        moves = 0;
      }
    }
    paint();
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, api.el('p', { class: 'arc-hint small', text: api.L('點一根柱子拿起最上面的圓盤，再點另一根放下。', 'Tap a peg to pick up its top disc, then another to put it down.') }), row(api, [quitButton(api, () => Math.round(score))])]);
}
