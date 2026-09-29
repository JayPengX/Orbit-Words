// 倒水排序: pour until every tube holds one colour. Tap a tube, then where to pour:
// only onto the same colour or into an empty tube, and only what fits.
import { quitButton, row } from './kit.js';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6'];
const CAP = 4;
export function pour(tubes, a, b) {
  const from = tubes[a];
  const to = tubes[b];
  if (a === b || !from.length || to.length >= CAP) return 0;
  const top = from.at(-1);
  if (to.length && to.at(-1) !== top) return 0;
  let n = 0;
  while (from.length && from.at(-1) === top && to.length < CAP) (to.push(from.pop()), n++);
  return n;
}
export const sorted = tubes => tubes.every(t => !t.length || (t.length === CAP && t.every(x => x === t[0])));
export default function colorsort(api) {
  const LEVELS = [4, 5, 6];
  let level = 0;
  let score = 0;
  let moves = 0;
  let sel = -1;
  let tubes = [];
  let start = [];
  const box = api.el('div', { class: 'cs-rack' });
  const newLevel = () => {
    const k = LEVELS[level];
    const all = [];
    for (let c = 0; c < k; c++) for (let i = 0; i < CAP; i++) all.push(c);
    do all.sort(() => api.rand() - 0.5);
    while (Array.from({ length: k }, (_, i) => all.slice(i * CAP, i * CAP + CAP)).some(t => t.every(x => x === t[0])));
    tubes = [...Array.from({ length: k }, (_, i) => all.slice(i * CAP, i * CAP + CAP)), [], []];
    start = tubes.map(t => [...t]);
    moves = 0;
    sel = -1;
  };
  const paint = () => {
    box.replaceChildren(
      ...tubes.map((t, i) =>
        api.el('button', { class: `cs-tube${i === sel ? ' sel' : ''}`, type: 'button', onclick: () => tap(i) }, t.map(c => api.el('i', { style: `background:${COLORS[c]}` })))
      )
    );
    api.set({ score, info: api.L(`第 ${level + 1}/3 關 · ${moves} 步`, `Level ${level + 1}/3 · ${moves} moves`) });
  };
  function tap(i) {
    if (api.ended) return;
    if (sel < 0) sel = tubes[i].length ? i : -1;
    else {
      if (pour(tubes, sel, i)) moves++;
      sel = -1;
      if (sorted(tubes)) {
        score += Math.max(6, 18 - Math.max(0, moves - LEVELS[level] * 3));
        level++;
        if (level >= LEVELS.length) {
          paint();
          return api.end(score, api.L('三關都排好了！', 'All three sorted!'));
        }
        newLevel();
      }
    }
    paint();
  }
  newLevel();
  paint();
  const restart = api.el('button', { class: 'q-btn small', type: 'button', text: api.L('重來這關', 'Restart level'), onclick: () => ((tubes = start.map(t => [...t])), (moves = 0), (sel = -1), paint()) });
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點一管，再點要倒進去的那管', 'Tap a tube, then the one to pour into') }), box, row(api, [restart, quitButton(api, () => score)])]);
}
