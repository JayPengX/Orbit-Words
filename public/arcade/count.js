// 數點點: dots flash for a moment; how many were there? Ten rounds. Score: 1
// for each right answer, +0.5 when quick.
import { shuffle } from '../lib/arcade.mjs';
import { startButton } from './kit.js';

export default function count(api) {
  let round = 0;
  let score = 0;
  const field = api.el('div', { class: 'ct-field' });
  const opts = api.el('div', { class: 'mt-opts' });
  const ask = () => {
    const n = 5 + Math.floor(api.rand() * (6 + round));
    field.replaceChildren(...Array.from({ length: n }, () => api.el('span', { class: 'ct-dot', style: `left:${4 + api.rand() * 88}%;top:${4 + api.rand() * 88}%;background:hsl(${Math.floor(api.rand() * 360)},70%,55%)` })));
    opts.replaceChildren();
    api.later(() => {
      field.replaceChildren(api.el('span', { class: 'ct-q', text: '?' }));
      const asked = performance.now();
      const choices = shuffle([n, n - 1, n + 1, n + (api.rand() < 0.5 ? 2 : -2)], api.rand);
      opts.replaceChildren(...choices.map(v => api.el('button', { class: 'mt-opt num', type: 'button', text: String(v), onclick: e => {
        if (api.ended || opts.dataset.done) return;
        opts.dataset.done = '1';
        const ok = v === n;
        if (ok) score += performance.now() - asked < 2500 ? 1.5 : 1;
        e.currentTarget.classList.add(ok ? 'ok' : 'bad');
        field.replaceChildren(api.el('span', { class: 'ct-q', text: ok ? '✓' : `${n}` }));
        round++;
        api.set({ score, info: `${round}/10` });
        if (round >= 10) return api.later(() => api.end(score), 500);
        api.later(() => (delete opts.dataset.done, ask()), 700);
      } })));
    }, Math.max(700, 1300 - round * 50));
  };
  const start = startButton(api, null, ask);
  api.set({ score: 0, info: '0/10' });
  return api.el('div', { class: 'arc-col' }, [field, opts, start]);
}
