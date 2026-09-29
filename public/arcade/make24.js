// 24 點: combine four numbers with + − × ÷ (each once) to make 24. Tap a number,
// an operation, then another number; the two become one. Two minutes.
import { countdown, row, startButton } from './kit.js';

const OPS = ['+', '−', '×', '÷'];
const apply = (a, op, b) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : b === 0 ? NaN : a / b);
// Can these numbers make 24?
export function solvable(nums) {
  if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-6;
  for (let i = 0; i < nums.length; i++)
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest = nums.filter((_, k) => k !== i && k !== j);
      for (const op of OPS) {
        const v = apply(nums[i], op, nums[j]);
        if (Number.isFinite(v) && solvable([...rest, v])) return true;
      }
    }
  return false;
}
const show = v => (Number.isInteger(v) ? String(v) : `${Math.round(v * 100) / 100}`);
export default function make24(api) {
  let score = 0;
  let solved = 0;
  let left = () => 120;
  let hand;
  let start;
  let pick = null;
  let op = null;
  const deal = () => {
    do start = Array.from({ length: 4 }, () => 1 + Math.floor(api.rand() * (solved < 3 ? 9 : 13)));
    while (!solvable(start));
    hand = start.map((v, i) => ({ v, id: i }));
    pick = op = null;
    paint();
  };
  const nums = api.el('div', { class: 'm24-nums' });
  const ops = api.el('div', { class: 'm24-ops' }, OPS.map(o => api.el('button', { class: 'q-btn m24-op', type: 'button', text: o, onclick: () => pick !== null && ((op = o), paint()) })));
  function tap(k) {
    if (api.ended || !hand) return;
    if (pick === null || op === null) {
      pick = pick === k ? null : k;
      op = null;
    } else if (k !== pick) {
      const v = apply(hand[pick].v, op, hand[k].v);
      if (!Number.isFinite(v)) return;
      hand = hand.filter((_, i) => i !== pick && i !== k).concat({ v, id: Math.random() });
      pick = hand.length - 1;
      op = null;
      if (hand.length === 1) {
        if (Math.abs(v - 24) < 1e-6) {
          solved++;
          score += 5;
          paint();
          nums.firstChild?.classList.add('ok');
          return api.later(deal, 500);
        }
        nums.classList.add('bad');
        api.later(() => (nums.classList.remove('bad'), reset()), 500);
      }
    }
    paint();
  }
  const reset = () => {
    hand = start.map((v, i) => ({ v, id: i }));
    pick = op = null;
    paint();
  };
  function paint() {
    nums.replaceChildren(...(hand || []).map((h, k) => api.el('button', { class: `m24-num${k === pick ? ' on' : ''}`, type: 'button', text: show(h.v), onclick: () => tap(k) })));
    [...ops.children].forEach(b => b.classList.toggle('on', b.textContent === op));
    api.set({ score, info: hand ? api.L(`${left()} 秒 · 做出 ${solved} 題`, `${left()}s · ${solved} made`) : '' });
  }
  const again = api.el('button', { class: 'q-btn', type: 'button', text: api.L('重來', 'Reset'), onclick: () => hand && reset() });
  const skip = api.el('button', { class: 'q-btn', type: 'button', text: api.L('跳過（−1）', 'Skip (−1)'), onclick: () => hand && ((score = Math.max(0, score - 1)), deal()) });
  const go = startButton(api, null, () => {
    left = countdown(api, 120, paint, () => api.end(score, api.L(`做出 ${solved} 題 24。`, `Made 24 ${solved} times.`)));
    deal();
  });
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('點數字 → 運算 → 另一個數字', 'Number → operation → number') }), nums, ops, row(api, [again, skip]), go]);
}
