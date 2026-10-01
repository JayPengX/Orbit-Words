// 小恐龍: tap to jump the cacti and birds; it keeps getting faster.
// Score: obstacles cleared.
import { canvasGame } from './kit.js';

// A T-rex in pixels, facing the way it runs (right): 20 × 16, two running
// frames and a jumping one (legs together).
const BODY = [
  '..........########..',
  '.........##.########',
  '.........###########',
  '.........###########',
  '.........######.....',
  '.........#########..',
  '#.......######......',
  '#......########.....',
  '##....##########....',
  '###..#########.#....',
  '#############.......',
  '.###########........',
  '..#########.........',
  '...#######..........'
];
const LEGS = [
  ['....###..##.........', '....##....##........'],
  ['....##...###........', '.....##...##........'],
  ['....##...##.........', '....##....##........']
];
function sprite(c, x, y, frame) {
  c.fillStyle = '#535353';
  const P = 2;
  [...BODY, ...LEGS[frame]].forEach((row, r) => {
    for (let k = 0; k < row.length; k++) if (row[k] === '#') c.fillRect(x + k * P, y + r * P, P, P);
  });
}
// A saguaro: trunk and an arm each side, as tall and wide as the obstacle.
function cactus(c, o) {
  const top = o.y - o.h;
  c.fillStyle = '#3f7d3a';
  const stems = Math.max(1, Math.round(o.w / 16));
  const sw = o.w / stems;
  for (let i = 0; i < stems; i++) {
    const x = o.x + i * sw + sw * 0.3;
    const w = sw * 0.4;
    c.beginPath();
    c.roundRect(x, top, w, o.h, w / 2);
    c.fill();
    c.beginPath();
    c.roundRect(x - w * 0.8, top + o.h * 0.35, w * 0.55, o.h * 0.3, 2);
    c.roundRect(x + w * 1.25, top + o.h * 0.25, w * 0.55, o.h * 0.3, 2);
    c.fill();
    c.fillRect(x - w * 0.8, top + o.h * 0.6, w * 0.9, w * 0.4);
    c.fillRect(x + w * 0.9, top + o.h * 0.5, w * 0.9, w * 0.4);
  }
}

export default function runner(api) {
  const W = 360;
  const H = 300;
  const ground = H - 50;
  const dino = { x: 40, y: ground, vy: 0 };
  let obs = [];
  let score = 0;
  let t = 0;
  let next = 900;
  const jump = () => {
    if (dino.y >= ground) dino.vy = -0.62;
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('點一下跳', 'Tap to jump'),
    step(dt) {
      t += dt;
      const speed = 0.26 + Math.min(0.28, t / 120_000);
      dino.vy += 0.0021 * dt;
      dino.y = Math.min(ground, dino.y + dino.vy * dt);
      if (dino.y >= ground) dino.vy = 0;
      next -= dt;
      if (next <= 0) {
        const bird = score > 5 && api.rand() < 0.3;
        obs.push({ x: W + 10, w: bird ? 30 : 16 + Math.floor(api.rand() * 2) * 14, h: bird ? 18 : 30 + api.rand() * 14, bird, y: bird ? ground - 26 : ground, passed: false });
        next = 650 + api.rand() * 900 - Math.min(300, t / 400);
      }
      for (const o of obs) {
        o.x -= speed * dt;
        if (!o.passed && o.x + o.w < dino.x) {
          o.passed = true;
          score++;
          api.set({ score });
        }
        const top = o.y - o.h;
        if (dino.x + 26 > o.x + 3 && dino.x + 4 < o.x + o.w - 3 && dino.y > top + 4 && dino.y - 30 < o.y) return api.end(score);
      }
      obs = obs.filter(o => o.x > -40);
    },
    draw(c) {
      c.fillStyle = '#f7f7f5';
      c.fillRect(0, 0, W, H);
      // Clouds and the ground's pebbles drift by at their own speeds.
      c.fillStyle = '#e2e8f0';
      for (let i = 0; i < 3; i++) {
        const x = ((i * 157 - t * 0.02) % (W + 80) + W + 80) % (W + 80) - 40;
        c.beginPath();
        c.ellipse(x, 40 + i * 18, 22, 7, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#535353';
      c.fillRect(0, ground, W, 2);
      for (let i = 0; i < 14; i++) {
        const x = ((i * 53 - t * 0.26) % W + W) % W;
        c.fillRect(x, ground + 6 + (i % 3) * 4, 2 + (i % 2) * 3, 1.5);
      }
      sprite(c, dino.x - 6, dino.y - 32, dino.y < ground ? 2 : Math.floor(t / 110) % 2);
      for (const o of obs) {
        if (o.bird) {
          c.font = '24px system-ui';
          c.textBaseline = 'bottom';
          c.fillText('🦅', o.x, o.y);
        } else cactus(c, o);
      }
      c.fillStyle = '#535353';
      c.font = '800 16px ui-monospace, monospace';
      c.textAlign = 'right';
      c.textBaseline = 'alphabetic';
      c.fillText(String(score).padStart(5, '0'), W - 10, 22);
      c.textAlign = 'left';
    },
    input(kind) {
      if (['down', 'start', 'up', 'action'].includes(kind)) jump();
    }
  });
  return stage;
}
