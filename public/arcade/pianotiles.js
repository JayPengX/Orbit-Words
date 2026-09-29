// 別踩白塊 (Piano tiles): tap the black tiles from the bottom up as they
// scroll down. Tap white, or let a black one slip past, and it's over. It
// keeps getting faster. Score: tiles.
import { canvasGame } from './kit.js';

export default function pianotiles(api) {
  const W = 320;
  const H = 440;
  const CW = W / 4;
  const RH = H / 4;
  let rows = [];
  let off = 0;
  let tiles = 0;
  let speed = 0.22;
  let bad = null;
  const add = () => rows.push({ col: Math.floor(api.rand() * 4), hit: false });
  for (let k = 0; k < 6; k++) add();
  // Row k sits at y = H - (k + 1) * RH + off (row 0 at the bottom).
  const rowY = k => H - (k + 1) * RH + off;
  const stage = canvasGame(api, W, H, {
    hint: api.L('由下往上點黑塊', 'Tap the black tiles, bottom first'),
    step(dt) {
      if (bad) return;
      speed = 0.22 + Math.min(0.5, tiles * 0.004);
      off += speed * dt;
      while (rowY(0) > H) {
        if (!rows[0].hit) {
          bad = { col: rows[0].col, y: H - RH };
          off -= speed * dt * 3;
          return api.end(tiles, api.L(`${tiles} 塊，漏掉一塊。`, `${tiles} tiles, then one got away.`));
        }
        rows.shift();
        off -= RH;
        add();
      }
    },
    draw(c) {
      c.fillStyle = '#fff';
      c.fillRect(0, 0, W, H);
      rows.forEach((r, k) => {
        const y = rowY(k);
        c.fillStyle = r.hit ? '#cbd5e1' : '#0f172a';
        c.fillRect(r.col * CW + 1, y + 1, CW - 2, RH - 2);
      });
      if (bad) {
        c.fillStyle = '#ef4444';
        c.fillRect(bad.col * CW, bad.y, CW, RH);
      }
      c.strokeStyle = '#e2e8f0';
      for (let k = 1; k < 4; k++) (c.beginPath(), c.moveTo(k * CW, 0), c.lineTo(k * CW, H), c.stroke());
      c.fillStyle = '#ef4444';
      c.font = '900 28px system-ui';
      c.textAlign = 'center';
      c.fillText(String(tiles), W / 2, 36);
      c.textAlign = 'left';
    },
    input(kind, x, y) {
      if ((kind !== 'down' && kind !== 'start') || x == null || bad || api.ended) return;
      const col = Math.floor(x / CW);
      const k = rows.findIndex(r => !r.hit);
      if (k < 0) return;
      const ry = rowY(k);
      if (col === rows[k].col && y >= ry - RH * 0.4 && y <= ry + RH) {
        rows[k].hit = true;
        tiles++;
        api.set({ score: tiles });
        return;
      }
      if (kind === 'start') return;
      bad = { col, y: Math.floor((y - off) / RH) * RH + (off % RH) };
      api.end(tiles, api.L(`${tiles} 塊，踩到白塊。`, `${tiles} tiles, then a white one.`));
    }
  });
  return stage;
}
