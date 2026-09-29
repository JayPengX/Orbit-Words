// 射箭 (Archery): the sight drifts; tap to loose the arrow when it's on the
// gold. Mind the wind. Ten arrows, 10 for the centre ring down to 1.
import { canvasGame } from './kit.js';

export default function archery(api) {
  const W = 320;
  const H = 400;
  const C = [W / 2, 190];
  const RING = 15;
  const ARROWS = 10;
  let t = 0;
  let shot = 0;
  let total = 0;
  let wind = 0;
  let hits = [];
  let last = null;
  let wait = 0;
  const newWind = () => (wind = Math.round((api.rand() * 2 - 1) * (2 + shot * 0.6)));
  newWind();
  const sight = () => {
    const a = 34 + shot * 3;
    return [C[0] + Math.sin(t / 530) * a + Math.sin(t / 211) * a * 0.35, C[1] + Math.cos(t / 670) * a * 0.8 + Math.sin(t / 290) * a * 0.3];
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('準心對準紅心時點一下', 'Tap when the sight is on the gold'),
    step(dt) {
      t += dt;
      if (wait > 0) {
        wait -= dt;
        if (wait <= 0 && shot >= ARROWS) api.end(total, api.L(`十箭共 ${total} 環。`, `${total} points from ten arrows.`));
      }
    },
    draw(c) {
      c.fillStyle = '#bae6fd';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#86efac';
      c.fillRect(0, 300, W, H - 300);
      const colors = ['#fde047', '#fde047', '#ef4444', '#ef4444', '#3b82f6', '#3b82f6', '#0f172a', '#0f172a', '#f8fafc', '#f8fafc'];
      for (let k = 9; k >= 0; k--) {
        c.fillStyle = colors[k];
        c.beginPath();
        c.arc(C[0], C[1], RING * (k + 1), 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.25)';
        c.lineWidth = 1;
        c.stroke();
      }
      for (const [x, y] of hits) {
        c.fillStyle = '#7c2d12';
        c.beginPath();
        c.arc(x, y, 3.5, 0, Math.PI * 2);
        c.fill();
      }
      if (wait <= 0 && shot < ARROWS) {
        const [sx, sy] = sight();
        c.strokeStyle = '#111827';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(sx, sy, 12, 0, Math.PI * 2);
        c.moveTo(sx - 20, sy);
        c.lineTo(sx + 20, sy);
        c.moveTo(sx, sy - 20);
        c.lineTo(sx, sy + 20);
        c.stroke();
      }
      c.fillStyle = '#0f172a';
      c.font = '700 14px system-ui';
      c.textAlign = 'center';
      c.fillText(`${api.L('風', 'Wind')} ${wind === 0 ? '—' : `${wind > 0 ? '→' : '←'} ${Math.abs(wind)}`}`, W / 2, H - 20);
      if (last != null && wait > 0) {
        c.font = '900 30px system-ui';
        c.fillStyle = last >= 9 ? '#ca8a04' : '#0f172a';
        c.fillText(last ? String(last) : api.L('脫靶', 'Miss'), W / 2, 50);
      }
      c.textAlign = 'left';
      c.fillStyle = '#0f172a';
      c.font = '800 16px system-ui';
      c.fillText(`${total}`, 10, 22);
      c.textAlign = 'right';
      c.fillText(api.L(`第 ${Math.min(shot + 1, ARROWS)}/${ARROWS} 箭`, `Arrow ${Math.min(shot + 1, ARROWS)}/${ARROWS}`), W - 10, 22);
      c.textAlign = 'left';
    },
    input(kind) {
      if (!['down', 'action'].includes(kind) || wait > 0 || shot >= ARROWS) return;
      const [sx, sy] = sight();
      const x = sx + wind * 4 + (api.rand() - 0.5) * 6;
      const y = sy + (api.rand() - 0.5) * 6;
      const ring = Math.max(0, 10 - Math.floor(Math.hypot(x - C[0], y - C[1]) / RING));
      hits.push([x, y]);
      last = ring;
      total += ring;
      shot++;
      wait = 900;
      newWind();
      api.set({ score: total });
    }
  });
  return stage;
}
