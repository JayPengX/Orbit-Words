// 射氣球 (Balloons): pop the balloons before they float away. Gold ones are
// worth 3; bombs cost 3. 45 seconds.
import { countdown, startButton } from './kit.js';

export default function balloons(api) {
  let score = 0;
  let popped = 0;
  let left = () => 45;
  const sky = api.el('div', { class: 'bl-sky' });
  const info = () => api.set({ score, info: api.L(`${left()} 秒 · 射破 ${popped}`, `${left()}s · ${popped} popped`) });
  const spawn = () => {
    if (api.ended) return;
    const r = api.rand();
    const kind = r < 0.12 ? 'bomb' : r < 0.22 ? 'gold' : 'red';
    const hue = Math.floor(api.rand() * 360);
    const secs = Math.max(2.2, 4.6 - (45 - left()) * 0.05) * (0.85 + api.rand() * 0.3);
    const b = api.el('button', { class: `bl ${kind}`, type: 'button', style: `left: ${5 + api.rand() * 78}%; --h: ${hue}; animation-duration: ${secs}s`, text: kind === 'bomb' ? '💣' : '' });
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (api.ended || b.classList.contains('pop')) return;
      b.classList.add('pop');
      if (kind === 'bomb') score = Math.max(0, score - 3);
      else (score += kind === 'gold' ? 3 : 1, popped++);
      info();
      api.later(() => b.remove(), 200);
    });
    b.addEventListener('animationend', () => b.remove());
    sky.append(b);
    api.later(spawn, Math.max(260, 700 - (45 - left()) * 10) * (0.7 + api.rand() * 0.6));
  };
  const go = startButton(api, null, () => {
    left = countdown(api, 45, info, () => api.end(score, api.L(`射破 ${popped} 個。`, `${popped} popped.`)));
    spawn();
  });
  info();
  return api.el('div', { class: 'arc-col' }, [sky, go]);
}
