// 賽車 (Racer): three lanes, traffic coming at you. Change lanes with a tap on
// either side, the arrows or a swipe. Score: cars passed.
import { canvasGame, dpad, hudText } from './kit.js';

export default function racer(api) {
  const W = 300;
  const H = 440;
  const LANE = W / 3;
  let lane = 1;
  let x = LANE * 1.5;
  let cars = [];
  let passed = 0;
  let road = 0;
  let gap = 0;
  let t = 0;
  const ICONS = ['🚗', '🚙', '🚕', '🚌', '🚓', '🛻'];
  const stage = canvasGame(api, W, H, {
    hint: api.L('點左邊或右邊換車道', 'Tap left or right to change lanes'),
    step(dt) {
      t += dt;
      const speed = 0.22 + Math.min(0.3, t / 120000);
      road = (road + speed * dt) % 60;
      x += Math.max(-0.7 * dt, Math.min(0.7 * dt, LANE * (lane + 0.5) - x));
      gap -= speed * dt;
      if (gap <= 0) {
        const free = Math.floor(api.rand() * 3);
        for (let k = 0; k < 3; k++) if (k !== free && api.rand() < 0.45) cars.push({ lane: k, y: -40, icon: ICONS[Math.floor(api.rand() * ICONS.length)] });
        if (!cars.some(c => c.y === -40)) cars.push({ lane: (free + 1) % 3, y: -40, icon: ICONS[0] });
        gap = 150 + api.rand() * 80;
      }
      for (const c of cars) c.y += speed * 0.75 * dt;
      for (const c of cars) if (Math.abs(c.y - (H - 60)) < 40 && Math.abs(LANE * (c.lane + 0.5) - x) < 34) return api.end(passed, api.L(`超了 ${passed} 台車。`, `Passed ${passed} cars.`));
      const before = cars.length;
      cars = cars.filter(c => c.y < H + 40);
      passed += before - cars.length;
      api.set({ score: passed, info: api.L(`${Math.round(speed * 500)} km/h`, `${Math.round(speed * 500)} km/h`) });
    },
    draw(c) {
      c.fillStyle = '#65a30d';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#3f3f46';
      c.fillRect(8, 0, W - 16, H);
      c.fillStyle = '#fafafa';
      for (let k = 1; k < 3; k++) for (let y = -60 + road; y < H; y += 60) c.fillRect(LANE * k - 2, y, 4, 32);
      c.font = '40px system-ui';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      for (const car of cars) {
        c.save();
        c.translate(LANE * (car.lane + 0.5), car.y);
        c.rotate(Math.PI / 2);
        c.fillText(car.icon, 0, 0);
        c.restore();
      }
      c.save();
      c.translate(x, H - 60);
      // The emoji faces left: a quarter turn clockwise points it up the road.
      c.rotate(Math.PI / 2);
      c.fillText('🏎️', 0, 0);
      c.restore();
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      hudText(c, W, String(passed), '');
    },
    input(kind, px) {
      if (kind === 'left') lane = Math.max(0, lane - 1);
      else if (kind === 'right') lane = Math.min(2, lane + 1);
      else if (kind === 'down' && px != null) lane = px < x ? Math.max(0, lane - 1) : Math.min(2, lane + 1);
    }
  });
  return api.el('div', { class: 'arc-col' }, [stage, dpad(api, d => stage.press(d))]);
}
