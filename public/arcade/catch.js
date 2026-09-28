// 接水果: 45 seconds; catch fruit in the basket (golden fruit 3), dodge bombs (−3).
// Score: fruit caught.
import { canvasGame, hudText, clamp } from './kit.js';

const FRUIT = ['🍎', '🍊', '🍋', '🍉', '🍇', '🍓', '🍑'];
export default function catchGame(api) {
  const W = 320;
  const H = 420;
  let basket = W / 2;
  let target = W / 2;
  let items = [];
  let score = 0;
  let t = 0;
  let spawn = 0;
  let pop = [];
  const stage = canvasGame(api, W, H, {
    hint: api.L('左右拖動籃子', 'Drag the basket'),
    step(dt) {
      t += dt;
      basket += clamp(target - basket, -0.6 * dt, 0.6 * dt);
      spawn -= dt;
      if (spawn <= 0) {
        const r = api.rand();
        items.push({ x: 20 + api.rand() * (W - 40), y: -20, vy: 0.14 + api.rand() * 0.1 + t / 250_000, kind: r < 0.18 ? 'bomb' : r < 0.26 ? 'gold' : 'fruit', f: FRUIT[Math.floor(api.rand() * FRUIT.length)] });
        spawn = Math.max(260, 700 - t / 70);
      }
      for (const it of items) {
        it.y += it.vy * dt;
        if (!it.done && it.y > H - 50 && it.y < H - 20 && Math.abs(it.x - basket) < 34) {
          it.done = true;
          const d = it.kind === 'bomb' ? -3 : it.kind === 'gold' ? 3 : 1;
          score = Math.max(0, score + d);
          pop.push({ x: it.x, y: H - 60, text: d > 0 ? `+${d}` : `${d}`, life: 600, good: d > 0 });
        }
      }
      items = items.filter(it => !it.done && it.y < H + 20);
      pop = pop.filter(p => (p.life -= dt) > 0);
      const left = Math.max(0, 45 - Math.floor(t / 1000));
      api.set({ score, info: api.L(`${left} 秒`, `${left}s`) });
      if (t >= 45_000) api.end(score);
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fef3c7');
      g.addColorStop(1, '#fde68a');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '26px system-ui';
      for (const it of items) c.fillText(it.kind === 'bomb' ? '💣' : it.kind === 'gold' ? '⭐' : it.f, it.x, it.y);
      c.font = '40px system-ui';
      c.fillText('🧺', basket, H - 32);
      c.font = '800 18px system-ui';
      for (const p of pop) (c.fillStyle = p.good ? '#15803d' : '#b91c1c'), c.fillText(p.text, p.x, p.y - (600 - p.life) / 20);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillStyle = '#78350f';
      c.font = '800 16px system-ui';
      c.fillText(`${score}`, 10, 22);
      c.textAlign = 'right';
      c.fillText(`${Math.max(0, 45 - Math.floor(t / 1000))}s`, W - 10, 22);
      c.textAlign = 'left';
      hudText(c, 0, '', '');
    },
    input(kind, x) {
      if (x != null && ['down', 'move', 'start'].includes(kind)) target = clamp(x, 20, W - 20);
      if (kind === 'left') target = clamp(basket - 50, 20, W - 20);
      if (kind === 'right') target = clamp(basket + 50, 20, W - 20);
    }
  });
  return stage;
}
