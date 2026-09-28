// 找不同色: one tile is a slightly different shade; tap it. The grid grows and
// the difference shrinks. 60 seconds; a wrong tap costs 3 seconds.
// Score: tiles found.
import { oddGap, oddSize } from '../lib/arcade.mjs';
import { startButton } from './kit.js';

export default function oddcolor(api) {
  let level = 0;
  let timeLeft = 60;
  const grid = api.el('div', { class: 'oc-grid' });
  const info = () => api.L(`${timeLeft} 秒 · 第 ${level + 1} 關`, `${timeLeft}s · level ${level + 1}`);
  const deal = () => {
    const n = oddSize(level);
    const hue = Math.floor(api.rand() * 360);
    const light = 45 + api.rand() * 15;
    const odd = Math.floor(api.rand() * n * n);
    grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    grid.replaceChildren(
      ...Array.from({ length: n * n }, (_, i) =>
        api.el('button', { class: 'oc-cell', type: 'button', 'aria-label': String(i + 1), style: `background:hsl(${hue}, 65%, ${i === odd ? light + oddGap(level) / 2.5 : light}%)`, onclick: () => {
          if (api.ended) return;
          if (i === odd) {
            level++;
            deal();
          } else timeLeft = Math.max(0, timeLeft - 3);
          api.set({ score: level, info: info() });
        } })
      )
    );
  };
  const start = startButton(api, null, () => {
    deal();
    api.every(() => {
      if (api.ended) return;
      timeLeft--;
      api.set({ score: level, info: info() });
      if (timeLeft <= 0) api.end(level, api.L(`找到 ${level} 個。`, `Found ${level}.`));
    }, 1000);
  });
  return api.el('div', { class: 'arc-col' }, [grid, start]);
}
