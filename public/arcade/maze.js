// 迷宮: get from the top-left to the flag. Three mazes, bigger each time, in
// two minutes; each scores 10, plus up to 3 for speed.
import { makeMaze, mazeStep } from '../lib/arcade.mjs';
import { dpad, countdown } from './kit.js';

export default function maze(api) {
  const SIZES = [7, 9, 11];
  let k = 0;
  let m = makeMaze(SIZES[0], SIZES[0], api.rand);
  let at = 0;
  let score = 0;
  let since = Date.now();
  const S = 300;
  const { canvas, ctx: c } = api.canvas(S, S);
  canvas.classList.add('arc-canvas', 'mz-canvas');
  let left = () => 120;
  const draw = () => {
    const n = m.w;
    const cs = S / n;
    c.fillStyle = '#f8fafc';
    c.fillRect(0, 0, S, S);
    c.strokeStyle = '#1e293b';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    m.walls.forEach(([t, r, b, l], i) => {
      const x = (i % n) * cs;
      const y = Math.floor(i / n) * cs;
      if (t) c.moveTo(x, y), c.lineTo(x + cs, y);
      if (r) c.moveTo(x + cs, y), c.lineTo(x + cs, y + cs);
      if (b) c.moveTo(x, y + cs), c.lineTo(x + cs, y + cs);
      if (l) c.moveTo(x, y), c.lineTo(x, y + cs);
    });
    c.stroke();
    c.font = `${cs * 0.7}px system-ui`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🏁', (n - 0.5) * cs, (n - 0.5) * cs);
    c.fillText('🐭', ((at % n) + 0.5) * cs, (Math.floor(at / n) + 0.5) * cs);
    api.set({ score, info: api.L(`第 ${k + 1}/3 個 · ${left()} 秒`, `Maze ${k + 1}/3 · ${left()}s`) });
  };
  const go = dir => {
    if (api.ended || !['up', 'down', 'left', 'right'].includes(dir)) return;
    at = mazeStep(m, at, dir);
    if (at === m.w * m.h - 1) {
      score += 10 + Math.max(0, 3 - Math.floor((Date.now() - since) / 12_000));
      k++;
      if (k >= SIZES.length) {
        draw();
        return api.end(score, api.L('三個迷宮都走出來了！', 'Out of all three mazes!'));
      }
      m = makeMaze(SIZES[k], SIZES[k], api.rand);
      at = 0;
      since = Date.now();
    }
    draw();
  };
  left = countdown(api, 120, () => !api.ended && draw(), () => api.end(score, api.L('時間到！', 'Time’s up!')));
  api.onKey(go);
  api.swipe(canvas, go);
  draw();
  return api.el('div', { class: 'arc-col' }, [canvas, dpad(api, go)]);
}
