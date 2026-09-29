// 顛球 (Keep-up): tap the ball to kick it up; where you hit it sends it left
// or right. Don't let it touch the grass. Score: kicks (60 at most).
import { canvasGame, hudText } from './kit.js';

export default function keepy(api) {
  const W = 320;
  const H = 420;
  const R = 26;
  const ball = { x: W / 2, y: 140, vx: 0, vy: 0, spin: 0 };
  let kicks = 0;
  let flash = 0;
  const stage = canvasGame(api, W, H, {
    hint: api.L('點球把它踢起來，別讓它落地', 'Tap the ball to keep it up'),
    step(dt) {
      const g = 0.0011 + Math.min(0.0009, kicks * 0.00002);
      ball.vy += g * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.spin += ball.vx * dt * 0.05;
      if (ball.x < R) (ball.x = R), (ball.vx = Math.abs(ball.vx) * 0.8);
      if (ball.x > W - R) (ball.x = W - R), (ball.vx = -Math.abs(ball.vx) * 0.8);
      if (ball.y < R) (ball.y = R), (ball.vy = Math.abs(ball.vy) * 0.5);
      flash -= dt;
      if (ball.y > H - 30 - R) api.end(kicks, api.L(`連續顛了 ${kicks} 下。`, `${kicks} kicks in a row.`));
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7dd3fc');
      sky.addColorStop(1, '#e0f2fe');
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#16a34a';
      c.fillRect(0, H - 30, W, 30);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ball.spin);
      c.font = `${R * 2}px system-ui`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('⚽', 0, 2);
      c.restore();
      if (flash > 0) {
        c.strokeStyle = `rgba(250,204,21,${flash / 200})`;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(ball.x, ball.y, R + 10, 0, Math.PI * 2);
        c.stroke();
      }
      c.font = '900 64px system-ui';
      c.fillStyle = 'rgba(15,23,42,0.12)';
      c.textAlign = 'center';
      c.fillText(String(kicks), W / 2, H / 2 + 20);
      c.textAlign = 'left';
      hudText(c, W, '', '');
    },
    input(kind, x, y) {
      if (kind !== 'down' && kind !== 'start') return;
      if (x == null) return;
      if (Math.hypot(x - ball.x, y - ball.y) > R + 22) return;
      ball.vy = -0.62 - api.rand() * 0.08;
      ball.vx = Math.max(-0.35, Math.min(0.35, (ball.x - x) * 0.012 + (api.rand() - 0.5) * 0.08));
      kicks++;
      flash = 200;
      api.set({ score: kicks });
      if (kicks >= 60) api.end(60, api.L('顛滿 60 下！', '60 kicks!'));
    }
  });
  return stage;
}
