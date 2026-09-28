// 心算快打: 60 seconds of sums, four answers each; harder as you go.
// Score: right answers (a wrong one −1).
import { mathQuestion, mathChoices } from '../lib/arcade.mjs';
import { countdown, startButton } from './kit.js';

export default function math(api) {
  let score = 0;
  let right = 0;
  let left = () => 60;
  const q = api.el('p', { class: 'mt-q num' });
  const opts = api.el('div', { class: 'mt-opts' });
  const info = () => api.L(`${left()} 秒 · 答對 ${right}`, `${left()}s · ${right} right`);
  const ask = () => {
    const m = mathQuestion(Math.min(1, right / 20), api.rand);
    q.textContent = `${m.text} = ?`;
    opts.replaceChildren(
      ...mathChoices(m.answer, api.rand).map(v =>
        api.el('button', { class: 'mt-opt num', type: 'button', text: String(v), onclick: e => {
          if (api.ended) return;
          if (v === m.answer) (score++, right++);
          else score = Math.max(0, score - 1);
          e.currentTarget.classList.add(v === m.answer ? 'ok' : 'bad');
          api.set({ score, info: info() });
          api.later(ask, 160);
        } })
      )
    );
  };
  const start = startButton(api, null, () => {
    left = countdown(api, 60, () => api.set({ score, info: info() }), () => api.end(score, api.L(`答對 ${right} 題。`, `${right} right.`)));
    ask();
  });
  return api.el('div', { class: 'arc-col' }, [q, opts, start]);
}
