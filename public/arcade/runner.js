// 小恐龍: tap to jump the cacti and birds; it keeps getting faster.
// Score: obstacles cleared.
import { canvasGame, hudText } from './kit.js';

export default function runner(api) {
  const W = 360;
  const H = 200;
  const ground = H - 30;
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
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#64748b';
      c.fillRect(0, ground, W, 2);
      c.font = '30px system-ui';
      c.textBaseline = 'bottom';
      c.fillText('🦖', dino.x, dino.y + 4);
      for (const o of obs) {
        if (o.bird) {
          c.font = '24px system-ui';
          c.fillText('🦅', o.x, o.y);
        } else {
          c.fillStyle = '#16a34a';
          c.beginPath();
          c.roundRect(o.x, o.y - o.h, o.w, o.h, 4);
          c.fill();
        }
      }
      c.fillStyle = '#334155';
      c.font = '800 16px system-ui';
      c.textAlign = 'right';
      c.fillText(String(score), W - 10, 22);
      c.textAlign = 'left';
      hudText(c, 0, '', '');
    },
    input(kind) {
      if (['down', 'start', 'up', 'action'].includes(kind)) jump();
    }
  });
  return stage;
}
