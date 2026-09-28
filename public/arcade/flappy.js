// 飛飛鳥: tap to flap through the gaps. Score: pipes passed.
import { canvasGame, hudText } from './kit.js';

export default function flappy(api) {
  const W = 320;
  const H = 420;
  const bird = { x: 80, y: H / 2, vy: 0 };
  let pipes = [];
  let score = 0;
  let dist = 0;
  const gap = () => Math.max(110, 150 - score * 2);
  const flap = () => (bird.vy = -0.42);
  const stage = canvasGame(api, W, H, {
    hint: api.L('點一下往上飛', 'Tap to flap'),
    step(dt) {
      bird.vy += 0.0014 * dt;
      bird.y += bird.vy * dt;
      dist += dt;
      const speed = 0.15 + Math.min(0.08, score * 0.003);
      if (!pipes.length || pipes.at(-1).x < W - 170) pipes.push({ x: W + 10, top: 50 + api.rand() * (H - 140 - gap()), gap: gap(), passed: false });
      for (const p of pipes) {
        p.x -= speed * dt;
        if (!p.passed && p.x + 50 < bird.x) {
          p.passed = true;
          score++;
          api.set({ score });
        }
        const inX = bird.x + 12 > p.x && bird.x - 12 < p.x + 50;
        if (inX && (bird.y - 12 < p.top || bird.y + 12 > p.top + p.gap)) return api.end(score);
      }
      pipes = pipes.filter(p => p.x > -60);
      if (bird.y > H - 20 || bird.y < 0) api.end(score);
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#38bdf8');
      g.addColorStop(1, '#bae6fd');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#16a34a';
      for (const p of pipes) {
        c.fillRect(p.x, 0, 50, p.top);
        c.fillRect(p.x, p.top + p.gap, 50, H);
        c.fillStyle = '#15803d';
        c.fillRect(p.x - 4, p.top - 14, 58, 14);
        c.fillRect(p.x - 4, p.top + p.gap, 58, 14);
        c.fillStyle = '#16a34a';
      }
      c.fillStyle = '#a16207';
      c.fillRect(0, H - 20, W, 20);
      c.save();
      c.translate(bird.x, bird.y);
      c.rotate(Math.max(-0.5, Math.min(1, bird.vy * 2)));
      c.font = '28px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🐤', 0, 0);
      c.restore();
      hudText(c, W, String(score), '');
    },
    input(kind) {
      if (kind === 'down' || kind === 'start' || kind === 'up' || kind === 'action') flap();
    }
  });
  return stage;
}
