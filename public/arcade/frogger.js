// 過馬路 (Frogger): hop across the road and the river to the far bank. Cars
// flatten you; in the river, ride the logs. A new row reached scores 1, the
// far bank 5. Three lives.
import { canvasGame, dpad, hudText } from './kit.js';

const COLS = 9;
const ROWS = 12;
const S = 36;
export default function frogger(api) {
  const W = COLS * S;
  const H = ROWS * S;
  // Lanes from the top: 0 bank, 1-4 river, 5 middle, 6-10 road, 11 start.
  const lanes = [];
  let level = 0;
  const build = () => {
    lanes.length = 0;
    for (let r = 0; r < ROWS; r++) {
      const river = r >= 1 && r <= 4;
      const road = r >= 6 && r <= 10;
      if (!river && !road) {
        lanes.push({ kind: r === 0 ? 'goal' : 'safe', things: [] });
        continue;
      }
      const dir = r % 2 ? 1 : -1;
      const speed = (0.03 + api.rand() * 0.04 + level * 0.012) * dir;
      const len = river ? 2 + Math.floor(api.rand() * 2) : 1 + (r === 8 ? 1 : 0);
      const n = river ? 3 : 2 + Math.floor(api.rand() * 2);
      const gap = W / n + len * S;
      const things = Array.from({ length: n }, (_, k) => ({ x: k * gap + api.rand() * 30, w: len * S }));
      lanes.push({ kind: river ? 'river' : 'road', speed, things, span: n * gap, icon: river ? '' : ['🚗', '🚕', '🚙', '🚌', '🚓'][r % 5] });
    }
  };
  build();
  const frog = { c: 4, r: ROWS - 1, x: 4 * S };
  let best = ROWS - 1;
  let score = 0;
  let lives = 3;
  let dead = 0;
  const info = () => api.set({ score, info: api.L(`♥ ${lives} · 第 ${level + 1} 關`, `♥ ${lives} · Level ${level + 1}`) });
  const reset = () => {
    frog.r = ROWS - 1;
    frog.x = 4 * S;
    best = ROWS - 1;
  };
  const die = () => {
    lives--;
    dead = 600;
    info();
    if (lives <= 0) return api.end(score, api.L(`過了 ${level} 次馬路。`, `Crossed ${level} times.`));
    reset();
  };
  const wrapX = (x, span) => ((x % span) + span) % span - S * 3;
  const stage = canvasGame(api, W, H, {
    hint: api.L('點青蛙前後左右或用方向鍵跳', 'Tap beside the frog or use the arrows'),
    step(dt) {
      if (dead > 0) return void (dead -= dt);
      for (const l of lanes) for (const t of l.things || []) t.x += l.speed * dt;
      const lane = lanes[frog.r];
      const on = t => {
        const x = wrapX(t.x, lane.span);
        return frog.x + S * 0.5 > x && frog.x + S * 0.5 < x + t.w;
      };
      if (lane.kind === 'road' && lane.things.some(t => {
        const x = wrapX(t.x, lane.span);
        return frog.x + S * 0.8 > x + 3 && frog.x + S * 0.2 < x + t.w - 3;
      })) return die();
      if (lane.kind === 'river') {
        if (!lane.things.some(on)) return die();
        frog.x += lane.speed * dt;
        if (frog.x < -S / 2 || frog.x > W - S / 2) return die();
      }
    },
    draw(c) {
      lanes.forEach((l, r) => {
        c.fillStyle = l.kind === 'river' ? '#0ea5e9' : l.kind === 'road' ? '#334155' : l.kind === 'goal' ? '#15803d' : '#65a30d';
        c.fillRect(0, r * S, W, S);
        if (l.kind === 'road') {
          c.fillStyle = 'rgba(255,255,255,0.25)';
          for (let x = 0; x < W; x += 30) c.fillRect(x, r * S + S - 2, 16, 2);
        }
        c.font = '26px system-ui';
        c.textBaseline = 'middle';
        for (const t of l.things) {
          const x = wrapX(t.x, l.span);
          if (l.kind === 'river') {
            c.fillStyle = '#92400e';
            c.beginPath();
            c.roundRect(x + 2, r * S + 6, t.w - 4, S - 12, 10);
            c.fill();
          } else {
            c.save();
            c.translate(x + t.w / 2, r * S + S / 2);
            if (l.speed > 0) c.scale(-1, 1);
            c.textAlign = 'center';
            c.fillText(t.w > S ? '🚚' : l.icon, 0, 1);
            c.restore();
          }
        }
      });
      c.textAlign = 'center';
      c.font = '26px system-ui';
      c.globalAlpha = dead > 0 ? 0.4 : 1;
      c.fillText('🐸', frog.x + S / 2, frog.r * S + S / 2 + 1);
      c.globalAlpha = 1;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      hudText(c, W, String(score), `♥ ${lives}`);
    },
    input(kind, x, y) {
      if (dead > 0 || api.ended) return;
      let d = kind;
      if (y != null && kind !== 'down') return;
      if (kind === 'down' && y != null) {
        const fy = frog.r * S + S / 2;
        const fx = frog.x + S / 2;
        d = Math.abs(y - fy) > Math.abs(x - fx) ? (y < fy ? 'up' : 'down') : x < fx ? 'left' : 'right';
      } else if (kind === 'start' || kind === 'move' || kind === 'action') return;
      if (d === 'up') frog.r--;
      if (d === 'down') frog.r = Math.min(ROWS - 1, frog.r + 1);
      if (d === 'left') frog.x = Math.max(0, frog.x - S);
      if (d === 'right') frog.x = Math.min(W - S, frog.x + S);
      if (frog.r < best) {
        best = frog.r;
        score++;
      }
      if (frog.r === 0) {
        score += 5;
        level++;
        build();
        reset();
      }
      info();
    }
  });
  return api.el('div', { class: 'arc-col' }, [stage, dpad(api, d => stage.press(d))]);
}
