// 推箱子: push every box onto a goal (you can only push, one box at a time).
// Three levels; each solved scores 10, plus up to 3 for few moves.
import { SOKOBAN, sokoParse, sokoMove, sokoDone } from '../lib/arcade.mjs';
import { dpad, quitButton, row } from './kit.js';

const BEST = [10, 12, 13];
export default function sokoban(api) {
  let k = 0;
  let s = sokoParse(SOKOBAN[0]);
  let history = [];
  let score = 0;
  const box = api.el('div', { class: 'sk-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const paint = () => {
    box.style.gridTemplateColumns = `repeat(${s.w}, 1fr)`;
    const kids = [];
    for (let i = 0; i < s.w * s.h; i++) {
      const wall = s.walls.has(i);
      const goal = s.goals.has(i);
      const b = s.boxes.has(i);
      kids.push(api.el('span', { class: `sk-cell${wall ? ' wall' : ''}${goal ? ' goal' : ''}`, text: i === s.player ? '🧑' : b ? (goal ? '✅' : '📦') : '' }));
    }
    box.replaceChildren(...kids);
    title.textContent = api.L(`第 ${k + 1}/3 關 · ${s.moves} 步`, `Level ${k + 1}/3 · ${s.moves} moves`);
    api.set({ score, info: api.L(`第 ${k + 1}/3 關`, `Level ${k + 1}/3`) });
  };
  const go = dir => {
    if (api.ended || !['up', 'down', 'left', 'right'].includes(dir)) return;
    const next = sokoMove(s, dir);
    if (next === s) return;
    history.push(s);
    s = next;
    if (sokoDone(s)) {
      score += 10 + Math.max(0, 3 - Math.floor((s.moves - BEST[k]) / 5));
      k++;
      if (k >= SOKOBAN.length) {
        paint();
        return api.end(score, api.L('三關全破！', 'All three levels solved!'));
      }
      s = sokoParse(SOKOBAN[k]);
      history = [];
    }
    paint();
  };
  api.onKey(go);
  api.swipe(box, go);
  paint();
  return api.el('div', { class: 'arc-col' }, [
    title,
    box,
    dpad(api, go),
    row(api, [
      api.el('button', { class: 'q-btn small', type: 'button', text: api.L('↶ 上一步', '↶ Undo'), onclick: () => history.length && ((s = history.pop()), paint()) }),
      api.el('button', { class: 'q-btn small', type: 'button', text: api.L('重來', 'Restart'), onclick: () => ((s = sokoParse(SOKOBAN[k])), (history = []), paint()) }),
      quitButton(api, () => score)
    ])
  ]);
}
