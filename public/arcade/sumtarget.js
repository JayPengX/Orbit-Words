// 湊數: tap numbers that add up exactly to the target; they clear and new ones
// drop in. Bigger groups score more. 60 seconds.
import { countdown, startButton } from './kit.js';

const N = 25;
export default function sumtarget(api) {
  const num = () => 1 + Math.floor(api.rand() * 9);
  const grid = Array.from({ length: N }, num);
  let sel = [];
  let score = 0;
  let made = 0;
  let target = 0;
  let left = () => 60;
  let started = false;
  const newTarget = () => (target = 10 + Math.floor(api.rand() * (made < 5 ? 8 : 16)));
  const goal = api.el('p', { class: 'st-goal' });
  const cells = grid.map((_, i) => api.el('button', { class: 'gcell st', type: 'button', onclick: () => tap(i) }));
  const sum = () => sel.reduce((s, i) => s + grid[i], 0);
  const paint = () => {
    cells.forEach((c, i) => ((c.textContent = String(grid[i])), (c.className = `gcell st${sel.includes(i) ? ' sel' : ''}`)));
    goal.replaceChildren(api.el('b', { text: String(target || '—') }), api.el('span', { text: api.L(`　已選 ${sum()}`, `  picked ${sum()}`) }));
    api.set({ score, info: started ? api.L(`${left()} 秒 · 湊出 ${made} 次`, `${left()}s · ${made} made`) : '' });
  };
  function tap(i) {
    if (!started || api.ended) return;
    sel = sel.includes(i) ? sel.filter(k => k !== i) : [...sel, i];
    const s = sum();
    if (s === target) {
      score += sel.length - 1;
      made++;
      for (const k of sel) grid[k] = num();
      sel = [];
      newTarget();
    } else if (s > target) {
      goal.classList.add('bad');
      api.later(() => goal.classList.remove('bad'), 300);
      sel = [];
    }
    paint();
  }
  const go = startButton(api, null, () => {
    started = true;
    newTarget();
    left = countdown(api, 60, paint, () => api.end(score, api.L(`湊出 ${made} 次。`, `Made the target ${made} times.`)));
    paint();
  });
  paint();
  return api.el('div', { class: 'arc-col' }, [goal, api.el('div', { class: 'gboard', style: 'grid-template-columns: repeat(5, 1fr)' }, cells), api.el('p', { class: 'arc-hint', text: api.L('一次用越多個數字分數越高', 'More numbers per sum score more') }), go]);
}
