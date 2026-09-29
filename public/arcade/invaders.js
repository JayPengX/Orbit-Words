// 小蜜蜂 (Invaders): drag or use the arrows to move; the ship fires by itself.
// Clear the rows before they reach you, and don't get hit. A ship shot down
// scores 1; a cleared wave adds 5 and brings a faster one.
import { canvasGame, clamp, dpad, hudText } from './kit.js';

export default function invaders(api) {
  const W = 320;
  const H = 420;
  const ship = { x: W / 2, y: H - 30 };
  let target = W / 2;
  let wave = 0;
  let score = 0;
  let foes = [];
  let shots = [];
  let bombs = [];
  let dir = 1;
  let fire = 0;
  let drop = 0;
  const ICONS = ['👾', '👽', '🛸', '🐙'];
  const newWave = () => {
    foes = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) foes.push({ x: 40 + c * 38, y: 50 + r * 32, icon: ICONS[(r + wave) % 4] });
    dir = 1;
  };
  newWave();
  const stage = canvasGame(api, W, H, {
    hint: api.L('拖動或按方向鍵移動，會自動發射', 'Drag or use arrows; it fires by itself'),
    step(dt) {
      ship.x += clamp(target - ship.x, -0.35 * dt, 0.35 * dt);
      fire -= dt;
      if (fire <= 0) {
        shots.push({ x: ship.x, y: ship.y - 16 });
        fire = 420;
      }
      const speed = (0.025 + wave * 0.012) * (1 + (28 - foes.length) / 20);
      let edge = false;
      for (const f of foes) {
        f.x += dir * speed * dt;
        if (f.x < 14 || f.x > W - 14) edge = true;
      }
      if (edge) {
        dir = -dir;
        for (const f of foes) (f.y += 14), (f.x = clamp(f.x, 14, W - 14));
      }
      drop -= dt;
      if (drop <= 0 && foes.length) {
        const f = foes[Math.floor(api.rand() * foes.length)];
        bombs.push({ x: f.x, y: f.y + 10 });
        drop = Math.max(350, 1100 - wave * 150);
      }
      for (const s of shots) s.y -= 0.45 * dt;
      for (const b of bombs) b.y += (0.16 + wave * 0.02) * dt;
      for (const s of shots) {
        const k = foes.findIndex(f => Math.abs(f.x - s.x) < 14 && Math.abs(f.y - s.y) < 13);
        if (k >= 0) {
          foes.splice(k, 1);
          s.y = -99;
          score++;
          api.set({ score, info: api.L(`第 ${wave + 1} 波`, `Wave ${wave + 1}`) });
        }
      }
      shots = shots.filter(s => s.y > 0);
      bombs = bombs.filter(b => b.y < H);
      if (bombs.some(b => Math.abs(b.x - ship.x) < 13 && Math.abs(b.y - ship.y) < 12) || foes.some(f => f.y > ship.y - 26)) return api.end(score, api.L(`打到第 ${wave + 1} 波。`, `Reached wave ${wave + 1}.`));
      if (!foes.length) {
        score += 5;
        wave++;
        bombs = [];
        newWave();
        api.set({ score, info: api.L(`第 ${wave + 1} 波`, `Wave ${wave + 1}`) });
      }
    },
    draw(c) {
      c.fillStyle = '#0b1020';
      c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 30; i++) c.fillRect((i * 83) % W, (i * 47) % H, 1.5, 1.5);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = '24px system-ui';
      for (const f of foes) c.fillText(f.icon, f.x, f.y);
      c.fillText('🚀', ship.x, ship.y);
      c.fillStyle = '#fde047';
      for (const s of shots) c.fillRect(s.x - 1.5, s.y - 6, 3, 10);
      c.fillStyle = '#f87171';
      for (const b of bombs) c.fillRect(b.x - 2, b.y - 5, 4, 10);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      hudText(c, W, String(score), api.L(`第 ${wave + 1} 波`, `Wave ${wave + 1}`));
    },
    input(kind, x) {
      if (x != null && ['down', 'move', 'start'].includes(kind)) target = clamp(x, 14, W - 14);
      if (kind === 'left') target = clamp(ship.x - 60, 14, W - 14);
      if (kind === 'right') target = clamp(ship.x + 60, 14, W - 14);
    }
  });
  return api.el('div', { class: 'arc-col' }, [stage, dpad(api, d => stage.press(d))]);
}
