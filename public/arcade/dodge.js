// 閃隕石: drag the ship to dodge falling rocks for as long as you can (60 s
// at most). Score: seconds survived.
import { canvasGame, hudText, clamp } from './kit.js';

export default function dodge(api) {
  const W = 320;
  const H = 420;
  const ship = { x: W / 2, y: H - 40 };
  let rocks = [];
  let t = 0;
  let spawn = 0;
  let target = W / 2;
  const stage = canvasGame(api, W, H, {
    hint: api.L('左右拖動閃開', 'Drag to dodge'),
    step(dt) {
      t += dt;
      ship.x += clamp(target - ship.x, -0.5 * dt, 0.5 * dt);
      spawn -= dt;
      if (spawn <= 0) {
        rocks.push({ x: api.rand() * W, y: -20, r: 8 + api.rand() * 14, vy: 0.12 + api.rand() * 0.1 + t / 200_000 });
        spawn = Math.max(140, 520 - t / 90);
      }
      for (const r of rocks) {
        r.y += r.vy * dt;
        if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + 11) return api.end(Math.floor(t / 1000));
      }
      rocks = rocks.filter(r => r.y < H + 30);
      const s = Math.floor(t / 1000);
      api.set({ score: s, info: api.L(`${60 - s} 秒`, `${60 - s}s left`) });
      if (t >= 60_000) api.end(60);
    },
    draw(c) {
      c.fillStyle = '#020617';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 53 + t * 0.05 * ((i % 3) + 1)) % H, 1.5, 1.5);
      for (const r of rocks) {
        c.fillStyle = '#a16207';
        c.beginPath();
        c.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#78350f';
        c.beginPath();
        c.arc(r.x - r.r / 3, r.y - r.r / 4, r.r / 3.5, 0, Math.PI * 2);
        c.fill();
      }
      c.font = '26px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🚀', ship.x, ship.y);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      hudText(c, W, `${Math.floor(t / 1000)}s`, '');
    },
    input(kind, x) {
      if (x != null && ['down', 'move', 'start'].includes(kind)) target = clamp(x, 12, W - 12);
      if (kind === 'left') target = clamp(ship.x - 50, 12, W - 12);
      if (kind === 'right') target = clamp(ship.x + 50, 12, W - 12);
    }
  });
  return stage;
}
