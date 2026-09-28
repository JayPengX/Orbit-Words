// 打地鼠: 40 seconds; hit the moles (a golden one is 3), not the bunnies (−2).
// Score: points.
import { countdown, startButton } from './kit.js';

export default function whack(api) {
  const holes = Array.from({ length: 9 }, (_, i) => api.el('button', { class: 'arc-hole', type: 'button', 'aria-label': `${i + 1}` }));
  const up = new Map();
  let score = 0;
  let running = false;
  const show = () => {
    if (!running || api.ended) return;
    const free = holes.map((_, i) => i).filter(i => !up.has(i));
    if (free.length) {
      const i = free[Math.floor(api.rand() * free.length)];
      const r = api.rand();
      const kind = r < 0.15 ? 'bunny' : r < 0.25 ? 'gold' : 'mole';
      up.set(i, kind);
      holes[i].textContent = kind === 'bunny' ? '🐰' : kind === 'gold' ? '🌟' : '🐹';
      holes[i].classList.add('up');
      const stay = Math.max(450, 1000 - score * 12);
      api.later(() => {
        if (up.get(i) === kind) hide(i);
      }, stay);
    }
    api.later(show, Math.max(260, 700 - score * 10));
  };
  const hide = i => {
    up.delete(i);
    holes[i].textContent = '';
    holes[i].classList.remove('up', 'hit', 'bad');
  };
  holes.forEach((h, i) =>
    h.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!running || !up.has(i)) return;
      const kind = up.get(i);
      score = Math.max(0, score + (kind === 'bunny' ? -2 : kind === 'gold' ? 3 : 1));
      h.classList.add(kind === 'bunny' ? 'bad' : 'hit');
      up.delete(i);
      api.later(() => hide(i), 160);
      api.set({ score, info: info() });
    })
  );
  let left = () => 40;
  const info = () => api.L(`${left()} 秒`, `${left()}s`);
  const grid = api.el('div', { class: 'arc-holes' }, holes);
  const start = startButton(api, null, () => {
    running = true;
    left = countdown(api, 40, () => api.set({ score, info: info() }), () => ((running = false), api.end(score)));
    show();
  });
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('🐹 +1　🌟 +3　🐰 −2', '🐹 +1   🌟 +3   🐰 −2') }), grid, start]);
}
