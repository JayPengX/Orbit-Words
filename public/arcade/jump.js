// 跳跳 (Jumper): bounce up from platform to platform; steer with a drag, the
// arrows, or tilt by tapping a side. Don't fall. Score: height climbed ÷ 100.
import { canvasGame, clamp, dpad } from './kit.js';

export default function jump(api) {
  const W = 320;
  const H = 440;
  const me = { x: W / 2, y: H - 80, vy: -0.7 };
  let steer = 0;
  let target = null;
  let top = 0;
  let cam = 0;
  let plats = [];
  for (let y = H - 30; y > -H; y -= 55) plats.push({ x: api.rand() * (W - 60), y, move: 0 });
  plats[0].x = W / 2 - 30;
  const score = () => Math.floor(top / 100);
  const stage = canvasGame(api, W, H, {
    hint: api.L('左右拖動或按方向鍵', 'Drag or use the arrows to steer'),
    step(dt) {
      me.vy += 0.0016 * dt;
      me.y += me.vy * dt;
      if (target != null) me.x += clamp(target - me.x, -0.45 * dt, 0.45 * dt);
      else me.x += steer * 0.32 * dt;
      if (me.x < -10) me.x = W + 10;
      if (me.x > W + 10) me.x = -10;
      if (me.vy > 0) for (const p of plats) if (me.x > p.x - 8 && me.x < p.x + 68 && me.y + 14 > p.y && me.y + 14 < p.y + 12 + me.vy * dt) {
        me.vy = p.spring ? -1.15 : -0.78;
        if (p.weak) p.gone = true;
      }
      for (const p of plats) if (p.move) {
        p.x += p.move * dt;
        if (p.x < 0 || p.x > W - 60) p.move = -p.move;
      }
      if (me.y < H * 0.4 - cam) cam = H * 0.4 - me.y;
      top = Math.max(top, cam);
      plats = plats.filter(p => !p.gone && p.y + cam < H + 20);
      while (plats.at(-1).y + cam > -20) {
        const hard = Math.min(1, top / 6000);
        plats.push({ x: api.rand() * (W - 60), y: plats.at(-1).y - (50 + api.rand() * 30 * (0.5 + hard)), move: api.rand() < 0.2 * hard ? 0.08 : 0, spring: api.rand() < 0.06, weak: api.rand() < 0.15 * hard });
      }
      if (me.y + cam > H + 30) return api.end(score(), api.L(`爬了 ${score() * 10} 公尺。`, `Climbed ${score() * 10} m.`));
      api.set({ score: score() });
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fef9c3');
      g.addColorStop(1, '#fde68a');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(0,0,0,0.05)';
      for (let y = cam % 20; y < H; y += 20) (c.beginPath(), c.moveTo(0, y), c.lineTo(W, y), c.stroke());
      for (const p of plats) {
        c.fillStyle = p.weak ? '#a16207' : p.move ? '#2563eb' : '#16a34a';
        c.beginPath();
        c.roundRect(p.x, p.y + cam, 60, 10, 5);
        c.fill();
        if (p.spring) {
          c.font = '16px system-ui';
          c.textAlign = 'center';
          c.fillText('🌀', p.x + 30, p.y + cam - 4);
        }
      }
      c.font = '28px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🐰', me.x, me.y + cam);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillStyle = '#78350f';
      c.font = '800 16px system-ui';
      c.fillText(`${score() * 10} m`, 10, 22);
    },
    input(kind, x) {
      if (x != null && ['down', 'move', 'start'].includes(kind)) target = x;
      if (kind === 'up' && x != null) target = null;
      if (kind === 'left') (steer = -1), (target = null);
      if (kind === 'right') (steer = 1), (target = null);
      if (kind === 'up' && x == null) steer = 0;
      if (kind === 'down' && x == null) steer = 0;
    }
  });
  return api.el('div', { class: 'arc-col' }, [stage, dpad(api, d => stage.press(d))]);
}
