// 打磚塊: keep the ball up with the paddle, break the bricks; three lives.
// Score: bricks broken (a cleared wall adds 10 and brings a faster one).
import { canvasGame, hudText, clamp } from './kit.js';

export default function breakout(api) {
  const W = 320;
  const H = 400;
  const cols = 8;
  const rows = 5;
  const bw = 36;
  const bh = 14;
  let paddle = { x: W / 2 - 32, w: 64 };
  let ball = null;
  let bricks = [];
  let score = 0;
  let lives = 3;
  let wall = 0;
  const hues = [0, 30, 50, 140, 200];
  const build = () => {
    bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bricks.push({ x: 8 + c * (bw + 2), y: 50 + r * (bh + 3), w: bw, h: bh, r });
  };
  const serve = () => {
    const speed = 0.24 + wall * 0.04;
    ball = { x: W / 2, y: H - 60, vx: speed * (api.rand() < 0.5 ? -0.7 : 0.7), vy: -speed, r: 6 };
  };
  build();
  serve();
  const stage = canvasGame(api, W, H, {
    hint: api.L('手指左右拖動擋板', 'Drag to move the paddle'),
    step(dt) {
      for (let k = 0; k < 2; k++) {
        const d = dt / 2;
        ball.x += ball.vx * d;
        ball.y += ball.vy * d;
        if (ball.x < ball.r || ball.x > W - ball.r) (ball.vx *= -1), (ball.x = clamp(ball.x, ball.r, W - ball.r));
        if (ball.y < ball.r + 30) (ball.vy = Math.abs(ball.vy));
        const py = H - 30;
        if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + 10 && ball.x >= paddle.x - 4 && ball.x <= paddle.x + paddle.w + 4) {
          const off = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const sp = Math.hypot(ball.vx, ball.vy);
          ball.vx = sp * off * 0.8;
          ball.vy = -Math.sqrt(Math.max(0.01, sp * sp - ball.vx * ball.vx));
        }
        const b = bricks.find(q => ball.x + ball.r > q.x && ball.x - ball.r < q.x + q.w && ball.y + ball.r > q.y && ball.y - ball.r < q.y + q.h);
        if (b) {
          bricks = bricks.filter(q => q !== b);
          ball.vy *= -1;
          score++;
          if (!bricks.length) {
            score += 10;
            wall++;
            build();
            serve();
          }
          api.set({ score, info: '❤️'.repeat(lives) });
        }
        if (ball.y > H + 10) {
          lives--;
          api.set({ score, info: '❤️'.repeat(lives) });
          if (lives <= 0) return api.end(score);
          serve();
          return;
        }
      }
    },
    draw(c) {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, H);
      for (const b of bricks) (c.fillStyle = `hsl(${hues[b.r]}, 80%, 58%)`), c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = '#e2e8f0';
      c.beginPath();
      c.roundRect(paddle.x, H - 30, paddle.w, 10, 5);
      c.fill();
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      c.fill();
      hudText(c, W, `🧱 ${score}`, '❤️'.repeat(lives));
    },
    input(kind, x) {
      if ((kind === 'move' || kind === 'down' || kind === 'start') && x != null) paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
      if (kind === 'left') paddle.x = clamp(paddle.x - 30, 0, W - paddle.w);
      if (kind === 'right') paddle.x = clamp(paddle.x + 30, 0, W - paddle.w);
    }
  });
  api.set({ score, info: '❤️'.repeat(lives) });
  return stage;
}
