// 迷你高爾夫 (Mini golf): drag back from anywhere to aim and set the power
// (like a slingshot), let go to putt. Six holes; a hole scores 7 minus the
// strokes (a hole in one scores 6); six strokes and you move on.
import { canvasGame, hudText } from './kit.js';

const W = 320;
const H = 440;
const R = 7;
const HOLES = [
  { ball: [160, 390], cup: [160, 80], walls: [[70, 220, 180, 16]] },
  { ball: [60, 395], cup: [262, 70], walls: [[0, 290, 220, 16], [100, 170, 220, 16]] },
  { ball: [160, 400], cup: [160, 60], walls: [[0, 210, 132, 16], [188, 210, 132, 16], [120, 120, 80, 14]] },
  { ball: [50, 60], cup: [270, 390], walls: [[100, 0, 16, 300], [204, 140, 16, 300]] },
  { ball: [280, 400], cup: [160, 222], walls: [[100, 160, 120, 12], [100, 280, 120, 12], [100, 160, 12, 132]] },
  { ball: [160, 400], cup: [60, 60], walls: [[0, 120, 240, 16], [80, 260, 240, 16], [150, 330, 16, 50]] }
];
const BORDER = [[-20, -20, W + 40, 20], [-20, H, W + 40, 20], [-20, 0, 20, H], [W, 0, 20, H]];
export default function minigolf(api) {
  let hole = 0;
  let strokes = 0;
  let score = 0;
  let aim = null;
  let sunk = 0;
  const b = { x: 0, y: 0, vx: 0, vy: 0 };
  const place = () => {
    [b.x, b.y] = HOLES[hole].ball;
    b.vx = b.vy = 0;
    strokes = 0;
  };
  place();
  const moving = () => Math.hypot(b.vx, b.vy) > 0.01;
  const info = () => api.set({ score, info: api.L(`第 ${hole + 1}/6 洞 · ${strokes} 桿`, `Hole ${hole + 1}/6 · ${strokes} strokes`) });
  const finish = add => {
    score += add;
    hole++;
    if (hole >= HOLES.length) return api.end(score, api.L('六洞打完！', 'All six holes played!'));
    place();
    info();
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('往後拉瞄準、放開擊球', 'Pull back to aim, let go to putt'),
    step(dt) {
      if (sunk > 0) {
        sunk -= dt;
        if (sunk <= 0) finish(Math.max(0, 7 - strokes));
        return;
      }
      if (!moving()) {
        if (strokes >= 6) finish(0);
        return;
      }
      for (let k = 0; k < 4; k++) {
        b.x += (b.vx * dt) / 4;
        b.y += (b.vy * dt) / 4;
        for (const [x, y, w, h] of [...BORDER, ...HOLES[hole].walls]) {
          const cx = Math.max(x, Math.min(b.x, x + w));
          const cy = Math.max(y, Math.min(b.y, y + h));
          const dx = b.x - cx;
          const dy = b.y - cy;
          const d = Math.hypot(dx, dy);
          if (d >= R) continue;
          const [nx, ny] = d ? [dx / d, dy / d] : [0, -1];
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx = (b.vx - 2 * dot * nx) * 0.8;
            b.vy = (b.vy - 2 * dot * ny) * 0.8;
          }
          b.x = cx + nx * R;
          b.y = cy + ny * R;
        }
      }
      const v = Math.hypot(b.vx, b.vy);
      const slow = Math.max(0, v - 0.00045 * dt) / (v || 1);
      b.vx *= slow;
      b.vy *= slow;
      const [hx, hy] = HOLES[hole].cup;
      const d = Math.hypot(b.x - hx, b.y - hy);
      if (d < 10 && v < 0.55) {
        b.vx = b.vy = 0;
        [b.x, b.y] = [hx, hy];
        sunk = 700;
      } else if (d < 26 && v < 0.3) {
        // The cup pulls a slow ball in a little.
        b.vx += ((hx - b.x) / d) * 0.0004 * dt;
        b.vy += ((hy - b.y) / d) * 0.0004 * dt;
      }
    },
    draw(c) {
      c.fillStyle = '#15803d';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#22c55e';
      c.fillRect(8, 8, W - 16, H - 16);
      c.fillStyle = '#78350f';
      for (const [x, y, w, h] of HOLES[hole].walls) c.fillRect(x, y, w, h);
      const [hx, hy] = HOLES[hole].cup;
      c.fillStyle = '#052e16';
      c.beginPath();
      c.arc(hx, hy, 10, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#f8fafc';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(hx, hy - 34);
      c.stroke();
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.moveTo(hx, hy - 34);
      c.lineTo(hx + 16, hy - 28);
      c.lineTo(hx, hy - 22);
      c.fill();
      if (aim && !moving()) {
        const [dx, dy] = aim.v;
        const p = Math.min(1, Math.hypot(dx, dy) / 150);
        c.strokeStyle = `hsl(${120 - p * 120} 90% 45%)`;
        c.lineWidth = 3;
        c.setLineDash([6, 6]);
        c.beginPath();
        c.moveTo(b.x, b.y);
        c.lineTo(b.x - dx, b.y - dy);
        c.stroke();
        c.setLineDash([]);
      }
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(b.x, b.y, sunk > 0 ? R * (sunk / 700) : R, 0, Math.PI * 2);
      c.fill();
      hudText(c, W, api.L(`第 ${hole + 1} 洞`, `Hole ${hole + 1}`), api.L(`${strokes} 桿`, `${strokes} strokes`));
    },
    input(kind, x, y) {
      if (x == null || moving() || sunk > 0 || api.ended) return;
      if (kind === 'down' || kind === 'start') aim = { from: [x, y], v: [0, 0] };
      else if (kind === 'move' && aim) aim.v = [x - aim.from[0], y - aim.from[1]];
      else if (kind === 'up' && aim) {
        const [dx, dy] = aim.v;
        const len = Math.hypot(dx, dy);
        aim = null;
        if (len < 8) return;
        const power = Math.min(150, len) / 150;
        b.vx = (-dx / len) * power * 0.9;
        b.vy = (-dy / len) * power * 0.9;
        strokes++;
        info();
      }
    }
  });
  info();
  return stage;
}
