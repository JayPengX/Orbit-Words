// 疊疊樂: stop the sliding block over the tower; what hangs over is cut off.
// Score: blocks stacked (a perfect drop counts 2).
import { canvasGame, hudText } from './kit.js';

export default function stack(api) {
  const W = 320;
  const H = 440;
  const bh = 22;
  let tower = [{ x: 80, w: 160 }];
  let cur = { x: 0, w: 160, dir: 1 };
  let score = 0;
  let flash = 0;
  const drop = () => {
    const top = tower.at(-1);
    const lo = Math.max(top.x, cur.x);
    const hi = Math.min(top.x + top.w, cur.x + cur.w);
    if (hi - lo <= 2) return api.end(score);
    const perfect = Math.abs(cur.x - top.x) < 4;
    const block = perfect ? { x: top.x, w: top.w } : { x: lo, w: hi - lo };
    tower.push(block);
    score += perfect ? 2 : 1;
    if (perfect) flash = 400;
    api.set({ score, info: api.L(`${tower.length - 1} 層`, `${tower.length - 1} high`) });
    cur = { x: tower.length % 2 ? -block.w : W, w: block.w, dir: tower.length % 2 ? 1 : -1 };
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('點一下放下', 'Tap to drop'),
    step(dt) {
      const speed = 0.14 + Math.min(0.22, tower.length * 0.01);
      cur.x += cur.dir * speed * dt;
      if (cur.x > W) cur.dir = -1;
      if (cur.x + cur.w < 0) cur.dir = 1;
      flash = Math.max(0, flash - dt);
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1e1b4b');
      g.addColorStop(1, '#312e81');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      const shown = Math.max(0, tower.length - 14);
      const y = i => H - 20 - (i - shown + 1) * bh;
      tower.forEach((b, i) => {
        if (i < shown) return;
        c.fillStyle = `hsl(${(i * 23) % 360}, 75%, 60%)`;
        c.fillRect(b.x, y(i), b.w, bh - 2);
      });
      c.fillStyle = `hsl(${(tower.length * 23) % 360}, 75%, 60%)`;
      c.fillRect(cur.x, y(tower.length), cur.w, bh - 2);
      if (flash) {
        c.fillStyle = `rgba(255,255,255,${flash / 800})`;
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fde047';
        c.font = '800 22px system-ui';
        c.textAlign = 'center';
        c.fillText(api.L('完美！', 'Perfect!'), W / 2, 70);
        c.textAlign = 'left';
      }
      hudText(c, W, String(score), '');
    },
    input(kind) {
      if (['down', 'up', 'action'].includes(kind)) drop();
    }
  });
  return stage;
}
