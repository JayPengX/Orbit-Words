// 數織: fill the cells so each row and column has the runs its numbers say.
// Two 5 × 5 pictures; each solved scores 15, plus up to 5 for speed.
import { nonoPuzzle, nonoClues, nonoSolved } from '../lib/arcade.mjs';
import { quitButton, row } from './kit.js';

export default function nonogram(api) {
  const n = 5;
  let k = 0;
  let sol = nonoPuzzle(n, api.rand);
  let marks = Array(n * n).fill(false);
  let crosses = Array(n * n).fill(false);
  let cross = false;
  let score = 0;
  let since = Date.now();
  const box = api.el('div', { class: 'ng-grid' });
  const title = api.el('p', { class: 'arc-hint' });
  const modeBtn = api.el('button', { class: 'q-chip', type: 'button', 'aria-pressed': 'false', text: api.L('✕ 標記空格', '✕ Mark blanks') });
  modeBtn.addEventListener('click', () => {
    cross = !cross;
    modeBtn.setAttribute('aria-pressed', String(cross));
  });
  const paint = () => {
    const kids = [api.el('span', { class: 'ng-corner' })];
    for (let c = 0; c < n; c++) kids.push(api.el('span', { class: 'ng-clue col', text: nonoClues([...Array(n).keys()].map(r => sol[r * n + c])).join('\n') }));
    for (let r = 0; r < n; r++) {
      kids.push(api.el('span', { class: 'ng-clue row', text: nonoClues(sol.slice(r * n, r * n + n)).join(' ') }));
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        kids.push(
          api.el('button', {
            class: `ng-cell${marks[i] ? ' on' : ''}${crosses[i] ? ' x' : ''}`,
            type: 'button',
            text: crosses[i] ? '✕' : '',
            onclick: () => {
              if (api.ended) return;
              if (cross) (crosses[i] = !crosses[i]), (marks[i] = false);
              else (marks[i] = !marks[i]), (crosses[i] = false);
              if (nonoSolved(sol, marks, n)) {
                score += 15 + Math.max(0, 5 - Math.floor((Date.now() - since) / 20_000));
                k++;
                if (k >= 2) {
                  paint();
                  return api.end(score, api.L('兩張都完成！', 'Both pictures done!'));
                }
                sol = nonoPuzzle(n, api.rand);
                marks = Array(n * n).fill(false);
                crosses = Array(n * n).fill(false);
                since = Date.now();
              }
              paint();
            }
          })
        );
      }
    }
    box.replaceChildren(...kids);
    title.textContent = api.L(`第 ${k + 1}/2 張`, `Picture ${k + 1}/2`);
    api.set({ score, info: api.L(`第 ${k + 1}/2 張`, `Picture ${k + 1}/2`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box, row(api, [modeBtn, quitButton(api, () => score)])]);
}
