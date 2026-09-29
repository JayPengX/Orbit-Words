// 噴射背包 (Jetpack): hold to fly up, let go to drop. Dodge the zappers, grab
// coins. Score: metres flown ÷ 10, plus coins.
import { canvasGame, hudText } from './kit.js';

export default function jetpack(api) {
  const W = 320;
  const H = 420;
  const me = { x: 70, y: H / 2, vy: 0 };
  let hold = false;
  let boost = 0;
  let dist = 0;
  let coins = 0;
  let zaps = [];
  let bits = [];
  let next = 300;
  const score = () => Math.floor(dist / 100) + coins;
  const stage = canvasGame(api, W, H, {
    hint: api.L('按住往上飛，放開往下掉', 'Hold to fly up, let go to fall'),
    step(dt) {
      const speed = 0.16 + Math.min(0.14, dist / 60000);
      dist += speed * dt;
      boost -= dt;
      me.vy += (hold || boost > 0 ? -0.0016 : 0.0013) * dt;
      me.vy = Math.max(-0.4, Math.min(0.45, me.vy));
      me.y += me.vy * dt;
      if (me.y < 20) (me.y = 20), (me.vy = 0);
      if (me.y > H - 24) (me.y = H - 24), (me.vy = 0);
      next -= speed * dt;
      if (next <= 0) {
        const len = 70 + api.rand() * 70;
        const vertical = api.rand() < 0.5;
        zaps.push({ x: W + 20, y: 30 + api.rand() * (H - 60 - (vertical ? len : 0)), len, vertical });
        const cy = 40 + api.rand() * (H - 80);
        for (let k = 0; k < 5; k++) bits.push({ x: W + 120 + k * 22, y: cy });
        next = 220 + api.rand() * 120;
      }
      for (const z of zaps) z.x -= speed * dt;
      for (const b of bits) b.x -= speed * dt;
      for (const z of zaps) {
        const [x1, y1, x2, y2] = z.vertical ? [z.x - 5, z.y, z.x + 5, z.y + z.len] : [z.x, z.y - 5, z.x + z.len, z.y + 5];
        if (me.x + 11 > x1 && me.x - 11 < x2 && me.y + 13 > y1 && me.y - 13 < y2) return api.end(score(), api.L(`飛了 ${Math.floor(dist / 10)} 公尺。`, `Flew ${Math.floor(dist / 10)} m.`));
      }
      bits = bits.filter(b => {
        if (Math.hypot(b.x - me.x, b.y - me.y) < 18) return (coins++, false);
        return b.x > -10;
      });
      zaps = zaps.filter(z => z.x + z.len > -20);
      api.set({ score: score(), info: api.L(`${Math.floor(dist / 10)} 公尺 · 🪙 ${coins}`, `${Math.floor(dist / 10)} m · 🪙 ${coins}`) });
    },
    draw(c) {
      c.fillStyle = '#1e293b';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#334155';
      for (let x = -((dist * 0.5) % 80); x < W; x += 80) c.fillRect(x, 0, 40, H);
      c.fillStyle = '#475569';
      c.fillRect(0, H - 12, W, 12);
      c.fillRect(0, 0, W, 8);
      for (const z of zaps) {
        c.strokeStyle = '#facc15';
        c.lineWidth = 6;
        c.shadowColor = '#fde047';
        c.shadowBlur = 12;
        c.beginPath();
        if (z.vertical) (c.moveTo(z.x, z.y), c.lineTo(z.x, z.y + z.len));
        else (c.moveTo(z.x, z.y), c.lineTo(z.x + z.len, z.y));
        c.stroke();
        c.shadowBlur = 0;
      }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '16px system-ui';
      for (const b of bits) c.fillText('🪙', b.x, b.y);
      if (hold || boost > 0) {
        c.fillStyle = '#fb923c';
        c.beginPath();
        c.moveTo(me.x - 12, me.y + 8);
        c.lineTo(me.x - 6, me.y + 26 + api.rand() * 8);
        c.lineTo(me.x, me.y + 8);
        c.fill();
      }
      c.font = '26px system-ui';
      c.fillText('🧑‍🚀', me.x, me.y);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      hudText(c, W, `${Math.floor(dist / 10)} m`, `🪙 ${coins}`);
    },
    input(kind, x) {
      if ((kind === 'down' || kind === 'start') && x != null) hold = true;
      else if (kind === 'up' && x != null) hold = false;
      else if (['action', 'up', 'start'].includes(kind)) boost = 260;
    }
  });
  // Letting go outside the game counts too.
  const release = () => (hold = false);
  window.addEventListener('pointerup', release);
  api.cleanup(() => window.removeEventListener('pointerup', release));
  return stage;
}
