// 乒乓: first to 7 against Quadra. Score: your points (a win adds 5).
import { canvasGame, clamp } from './kit.js';

export default function pong(api) {
  const W = 320;
  const H = 440;
  const PW = 70;
  let me = W / 2;
  let target = W / 2;
  let cpu = W / 2;
  let ball;
  let mine = 0;
  let theirs = 0;
  let pause = 600;
  const serve = toMe => {
    const sp = 0.26 + (mine + theirs) * 0.008;
    ball = { x: W / 2, y: H / 2, vx: (api.rand() - 0.5) * 0.3, vy: toMe ? sp : -sp };
    pause = 700;
  };
  serve(true);
  const point = who => {
    if (who === 'me') mine++;
    else theirs++;
    api.set({ score: mine, info: `${mine} : ${theirs}` });
    if (mine >= 7 || theirs >= 7) return api.end(mine + (mine >= 7 ? 5 : 0), mine >= 7 ? api.L(`你贏了 ${mine} : ${theirs}！`, `You won ${mine}–${theirs}!`) : api.L(`輸了 ${mine} : ${theirs}。`, `Lost ${mine}–${theirs}.`));
    serve(who !== 'me');
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('左右拖動你的球拍（下方）', 'Drag your paddle (bottom)'),
    step(dt) {
      me += clamp(target - me, -0.7 * dt, 0.7 * dt);
      const aim = ball.vy < 0 ? ball.x : W / 2;
      cpu += clamp(aim - cpu, -0.2 * dt, 0.2 * dt);
      if (pause > 0) return void (pause -= dt);
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x < 6 || ball.x > W - 6) (ball.vx *= -1), (ball.x = clamp(ball.x, 6, W - 6));
      const hitPaddle = (px, py, dir) => {
        if (Math.abs(ball.y - py) < 8 && Math.abs(ball.x - px) < PW / 2 + 6 && Math.sign(ball.vy) === dir) {
          const off = (ball.x - px) / (PW / 2);
          const sp = Math.min(0.6, Math.hypot(ball.vx, ball.vy) * 1.04);
          ball.vx = sp * off * 0.75;
          ball.vy = -dir * Math.sqrt(Math.max(0.01, sp * sp - ball.vx * ball.vx));
        }
      };
      hitPaddle(me, H - 30, 1);
      hitPaddle(cpu, 30, -1);
      if (ball.y > H + 10) point('cpu');
      else if (ball.y < -10) point('me');
    },
    draw(c) {
      c.fillStyle = '#064e3b';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.setLineDash([8, 8]);
      c.beginPath();
      c.moveTo(0, H / 2);
      c.lineTo(W, H / 2);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.font = '800 60px system-ui';
      c.textAlign = 'center';
      c.fillText(String(theirs), W / 2, H / 2 - 30);
      c.fillText(String(mine), W / 2, H / 2 + 80);
      c.fillStyle = '#fca5a5';
      c.fillRect(cpu - PW / 2, 24, PW, 10);
      c.fillStyle = '#86efac';
      c.fillRect(me - PW / 2, H - 34, PW, 10);
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
      c.fill();
      c.textAlign = 'left';
    },
    input(kind, x) {
      if (x != null && ['down', 'move', 'start'].includes(kind)) target = clamp(x, PW / 2, W - PW / 2);
      if (kind === 'left') target = clamp(me - 60, PW / 2, W - PW / 2);
      if (kind === 'right') target = clamp(me + 60, PW / 2, W - PW / 2);
    }
  });
  api.set({ score: 0, info: '0 : 0' });
  return stage;
}
