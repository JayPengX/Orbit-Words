// 節奏大師 (Rhythm): notes fall down four lanes; tap the lane (or press ←
// ↓ ↑ →) as each reaches the line. Perfect scores 2, good 1; every ten in a
// row adds 2. 45 seconds.
import { canvasGame } from './kit.js';

const LANES = 4;
const KEYS = { left: 0, down: 1, up: 2, right: 3 };
export default function rhythm(api) {
  const W = 320;
  const H = 440;
  const LINE = H - 70;
  const LW = W / LANES;
  const SPEED = 0.26;
  let t = 0;
  let notes = [];
  // A song: a note (sometimes two) on most beats, faster later on.
  for (let at = 1500; at < 44000; ) {
    const lane = Math.floor(api.rand() * LANES);
    notes.push({ lane, at, done: false });
    if (api.rand() < 0.12) notes.push({ lane: (lane + 2) % LANES, at, done: false });
    at += at < 15000 ? 500 : at < 30000 ? (api.rand() < 0.5 ? 250 : 500) : api.rand() < 0.6 ? 250 : 375;
  }
  let score = 0;
  let combo = 0;
  let perfect = 0;
  let flash = Array(LANES).fill(0);
  let word = null;
  const y = n => LINE - (n.at - t) * SPEED;
  const judge = (text, color) => (word = { text, color, until: t + 450 });
  const hitLane = lane => {
    flash[lane] = 120;
    const n = notes.filter(k => !k.done && k.lane === lane).sort((a, b) => Math.abs(y(a) - LINE) - Math.abs(y(b) - LINE))[0];
    if (!n) return;
    const d = Math.abs(y(n) - LINE);
    if (d > 44) return;
    n.done = true;
    combo++;
    if (d < 18) (score += 2, perfect++, judge(api.L('完美', 'Perfect'), '#fde047'));
    else (score += 1, judge(api.L('不錯', 'Good'), '#86efac'));
    if (combo % 10 === 0) score += 2;
    api.set({ score, info: api.L(`連擊 ${combo}`, `Combo ${combo}`) });
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('音符到線上時點那一欄', 'Tap the lane as a note hits the line'),
    step(dt) {
      t += dt;
      flash = flash.map(f => Math.max(0, f - dt));
      for (const n of notes) if (!n.done && y(n) > LINE + 44) {
        n.done = true;
        combo = 0;
        judge(api.L('漏掉', 'Miss'), '#fca5a5');
        api.set({ score, info: api.L('連擊 0', 'Combo 0') });
      }
      if (t > 46000) api.end(score, api.L(`完美 ${perfect} 次。`, `${perfect} perfect hits.`));
    },
    draw(c) {
      c.fillStyle = '#18181b';
      c.fillRect(0, 0, W, H);
      const COL = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6'];
      for (let k = 0; k < LANES; k++) {
        c.fillStyle = flash[k] ? 'rgba(255,255,255,0.12)' : k % 2 ? '#1f1f23' : '#232329';
        c.fillRect(k * LW, 0, LW, H);
      }
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.fillRect(0, LINE - 2, W, 4);
      for (const n of notes) {
        if (n.done) continue;
        const ny = y(n);
        if (ny < -20 || ny > H + 20) continue;
        c.fillStyle = COL[n.lane];
        c.beginPath();
        c.roundRect(n.lane * LW + 8, ny - 10, LW - 16, 20, 8);
        c.fill();
      }
      c.textAlign = 'center';
      c.font = '700 13px system-ui';
      c.fillStyle = 'rgba(255,255,255,0.4)';
      ['←', '↓', '↑', '→'].forEach((a, k) => c.fillText(a, k * LW + LW / 2, H - 30));
      if (word && t < word.until) {
        c.font = '900 26px system-ui';
        c.fillStyle = word.color;
        c.fillText(word.text, W / 2, 120);
      }
      c.font = '800 16px system-ui';
      c.fillStyle = '#fff';
      c.textAlign = 'left';
      c.fillText(String(score), 10, 22);
      c.textAlign = 'right';
      c.fillText(`${Math.max(0, Math.ceil((46000 - t) / 1000))}s`, W - 10, 22);
      c.textAlign = 'left';
    },
    input(kind, x) {
      if ((kind === 'down' || kind === 'start') && x != null) hitLane(Math.min(LANES - 1, Math.floor(x / LW)));
      else if (kind in KEYS) hitLane(KEYS[kind]);
    }
  });
  return stage;
}
