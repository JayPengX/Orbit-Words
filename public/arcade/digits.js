// 數字記憶: a number shows for a moment; type it back. Each one right is a
// digit longer; three misses end it. Score: 4 for each length past 2 you
// reach (3 digits 4, 12 digits 40).
import { startButton } from './kit.js';

export default function digits(api) {
  let len = 3;
  let misses = 0;
  let best = 2;
  let current = '';
  const show = api.el('p', { class: 'dg-show num' });
  const input = api.el('input', { class: 'dg-input num', type: 'text', inputmode: 'numeric', autocomplete: 'off', hidden: '' });
  const ok = api.el('button', { class: 'q-btn primary', type: 'button', hidden: '', text: api.L('確定', 'OK') });
  const score = () => Math.max(0, (best - 2) * 4);
  const round = () => {
    current = Array.from({ length: len }, (_, i) => String(Math.floor(api.rand() * (i ? 10 : 9)) + (i ? 0 : 1))).join('');
    show.textContent = current;
    show.hidden = false;
    input.hidden = true;
    ok.hidden = true;
    api.set({ score: score(), info: api.L(`${len} 位數 · 失誤 ${misses}/3`, `${len} digits · ${misses}/3 misses`) });
    api.later(() => {
      show.hidden = true;
      input.value = '';
      input.hidden = false;
      ok.hidden = false;
      input.focus();
    }, 900 + len * 450);
  };
  const check = () => {
    if (api.ended || input.hidden) return;
    const right = input.value.replace(/\D/g, '') === current;
    if (right) (best = Math.max(best, len)), len++;
    else misses++;
    show.hidden = false;
    show.textContent = right ? '✓' : `✗ ${current}`;
    input.hidden = true;
    ok.hidden = true;
    if (misses >= 3) return api.end(score(), api.L(`最長記住 ${best} 位數。`, `Longest: ${best} digits.`));
    api.later(round, 900);
  };
  ok.addEventListener('click', check);
  input.addEventListener('keydown', e => e.key === 'Enter' && check());
  const start = startButton(api, null, round);
  api.set({ score: 0, info: '' });
  return api.el('div', { class: 'arc-col' }, [show, input, ok, start]);
}
