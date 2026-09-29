// 拼圖: a picture cut into squares and mixed up; tap two to swap them until it's
// whole. 3×3, then 4×4.
import { quitButton, row } from './kit.js';

const SCENES = [['🏯', '#fde68a', '#f97316'], ['🌋', '#fecaca', '#7c2d12'], ['🐳', '#bae6fd', '#1e3a8a'], ['🌸', '#fbcfe8', '#831843'], ['🚀', '#c7d2fe', '#1e1b4b'], ['🦁', '#fef3c7', '#b45309']];
function picture(rand) {
  const [emoji, a, b] = SCENES[Math.floor(rand() * SCENES.length)];
  const c = document.createElement('canvas');
  c.width = c.height = 360;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 360, 360);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  x.fillStyle = g;
  x.fillRect(0, 0, 360, 360);
  for (let i = 0; i < 14; i++) {
    x.fillStyle = `rgba(255,255,255,${0.08 + rand() * 0.18})`;
    x.beginPath();
    x.arc(rand() * 360, rand() * 360, 14 + rand() * 50, 0, Math.PI * 2);
    x.fill();
  }
  x.font = '220px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(emoji, 180, 196);
  return c.toDataURL();
}
export default function jigsaw(api) {
  const SIZES = [3, 4];
  let round = 0;
  let score = 0;
  let swaps = 0;
  const box = api.el('div', { class: 'arc-col' });
  const build = () => {
    const n = SIZES[round];
    const url = picture(api.rand);
    const order = [...Array(n * n).keys()];
    do order.sort(() => api.rand() - 0.5);
    while (order.every((v, i) => v === i));
    swaps = 0;
    let sel = -1;
    const cells = order.map((_, i) => api.el('button', { class: 'jg-cell', type: 'button', onclick: () => tap(i) }));
    const paint = () => {
      cells.forEach((c, i) => {
        const v = order[i];
        c.style.backgroundImage = `url(${url})`;
        c.style.backgroundSize = `${n * 100}% ${n * 100}%`;
        c.style.backgroundPosition = `${((v % n) / (n - 1)) * 100}% ${(Math.floor(v / n) / (n - 1)) * 100}%`;
        c.classList.toggle('sel', i === sel);
        c.classList.toggle('ok', v === i);
      });
      api.set({ score, info: api.L(`第 ${round + 1}/2 張 · 換了 ${swaps} 次`, `Picture ${round + 1}/2 · ${swaps} swaps`) });
    };
    function tap(i) {
      if (api.ended) return;
      if (sel < 0) return ((sel = i), paint());
      [order[sel], order[i]] = [order[i], order[sel]];
      if (sel !== i) swaps++;
      sel = -1;
      paint();
      if (order.every((v, k) => v === k)) {
        score += Math.max(8, (n === 3 ? 16 : 26) - Math.max(0, swaps - (n * n - 1)));
        round++;
        if (round >= SIZES.length) return api.end(score, api.L('兩張都拼好了！', 'Both pictures whole!'));
        api.later(build, 500);
      }
    }
    box.replaceChildren(api.el('p', { class: 'arc-hint', text: api.L('點兩塊交換位置，拼回完整的圖', 'Tap two pieces to swap them; make the picture whole') }), api.el('div', { class: 'jg-board', style: `grid-template-columns: repeat(${n}, 1fr)` }, cells), row(api, [quitButton(api, () => score)]));
    paint();
  };
  build();
  return box;
}
