// 瞄準: 30 seconds; tap each target before it shrinks away. Smaller and
// quicker ones are worth more. Score: points (a miss costs 1).
import { countdown, startButton } from './kit.js';

export default function aim(api) {
  const field = api.el('div', { class: 'arc-field' });
  let score = 0;
  let hits = 0;
  let running = false;
  let left = () => 30;
  const info = () => api.L(`${left()} 秒 · 命中 ${hits}`, `${left()}s · ${hits} hits`);
  const spawn = () => {
    if (!running || api.ended) return;
    const size = Math.max(28, 64 - hits * 1.2);
    const t = api.el('button', { class: 'arc-target', type: 'button', 'aria-label': 'target', style: `width:${size}px;height:${size}px;left:${4 + api.rand() * 88}%;top:${6 + api.rand() * 84}%` });
    const born = performance.now();
    t.addEventListener('pointerdown', e => {
      e.stopPropagation();
      e.preventDefault();
      const ms = performance.now() - born;
      hits++;
      score += ms < 500 ? 3 : ms < 900 ? 2 : 1;
      t.remove();
      api.set({ score, info: info() });
      spawn();
    });
    field.append(t);
    api.later(() => {
      if (t.isConnected) {
        t.remove();
        spawn();
      }
    }, Math.max(700, 1500 - hits * 15));
  };
  field.addEventListener('pointerdown', () => {
    if (!running) return;
    score = Math.max(0, score - 1);
    api.set({ score, info: info() });
  });
  const start = startButton(api, null, () => {
    running = true;
    left = countdown(api, 30, () => api.set({ score, info: info() }), () => ((running = false), api.end(score)));
    spawn();
    api.later(spawn, 400);
  });
  return api.el('div', { class: 'arc-col' }, [field, start]);
}
