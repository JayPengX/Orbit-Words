// 海戰棋 (Battleship) against Quadra: take turns firing at each other's hidden
// fleet on 8×8 seas. A hit scores 1, a ship sunk 2, sinking the whole fleet
// first 12.
import { quitButton, row } from './kit.js';

const N = 8;
const FLEET = [4, 3, 3, 2, 2];
export function placeFleet(rand) {
  const grid = Array(N * N).fill(-1);
  FLEET.forEach((len, id) => {
    for (;;) {
      const across = rand() < 0.5;
      const r = Math.floor(rand() * (across ? N : N - len + 1));
      const c = Math.floor(rand() * (across ? N - len + 1 : N));
      const cells = Array.from({ length: len }, (_, k) => (across ? r * N + c + k : (r + k) * N + c));
      if (cells.every(i => grid[i] < 0)) {
        cells.forEach(i => (grid[i] = id));
        break;
      }
    }
  });
  return grid;
}
export default function battleship(api) {
  const theirs = placeFleet(api.rand);
  const mine = placeFleet(api.rand);
  const shotAt = Array(N * N).fill(false);
  const shotMe = Array(N * N).fill(false);
  let score = 0;
  let busy = false;
  const sunk = (grid, shots, id) => grid.every((v, i) => v !== id || shots[i]);
  const allSunk = (grid, shots) => FLEET.every((_, id) => sunk(grid, shots, id));
  const sea = api.el('div', { class: 'bs-sea', style: `grid-template-columns: repeat(${N}, 1fr)` });
  const home = api.el('div', { class: 'bs-sea mine', style: `grid-template-columns: repeat(${N}, 1fr)` });
  const note = api.el('p', { class: 'arc-hint' });
  // Quadra hunts: next to an unsunk hit first, else a checkerboard square.
  const aim = () => {
    const open = i => i >= 0 && i < N * N && !shotMe[i];
    const hits = shotMe.map((s, i) => s && mine[i] >= 0 && !sunk(mine, shotMe, mine[i]) ? i : -1).filter(i => i >= 0);
    const near = [];
    for (const h of hits) {
      const r = Math.floor(h / N);
      const c = h % N;
      const line = hits.filter(o => o !== h && (Math.floor(o / N) === r || o % N === c));
      const dirs = line.length ? (Math.floor(line[0] / N) === r ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]) : [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N && open(rr * N + cc)) near.push(rr * N + cc);
      }
    }
    if (near.length) return near[Math.floor(api.rand() * near.length)];
    let free = shotMe.map((s, i) => (!s && (Math.floor(i / N) + (i % N)) % 2 === 0 ? i : -1)).filter(i => i >= 0);
    if (!free.length) free = shotMe.map((s, i) => (s ? -1 : i)).filter(i => i >= 0);
    return free[Math.floor(api.rand() * free.length)];
  };
  const quadra = () => {
    if (api.ended) return;
    const i = aim();
    shotMe[i] = true;
    busy = false;
    paint(i);
    if (allSunk(mine, shotMe)) api.end(score, api.L('Quadra 先把你的艦隊擊沉了。', 'Quadra sank your fleet first.'));
  };
  function fire(i) {
    if (busy || api.ended || shotAt[i]) return;
    shotAt[i] = true;
    if (theirs[i] >= 0) {
      score++;
      if (sunk(theirs, shotAt, theirs[i])) score += 2;
    }
    if (allSunk(theirs, shotAt)) {
      score += 12;
      paint();
      return api.end(score, api.L('擊沉整支艦隊，你贏了！', 'Whole fleet sunk: you win!'));
    }
    busy = true;
    paint();
    api.later(quadra, 550);
  }
  const paint = (last = -1) => {
    sea.replaceChildren(...theirs.map((v, i) => {
      const s = shotAt[i];
      const down = s && v >= 0 && sunk(theirs, shotAt, v);
      return api.el('button', { class: `bs-cell${s ? (v >= 0 ? (down ? ' sunk' : ' hit') : ' miss') : ''}`, type: 'button', disabled: s || busy, onclick: () => fire(i), text: s ? (v >= 0 ? '💥' : '•') : '' });
    }));
    home.replaceChildren(...mine.map((v, i) => api.el('span', { class: `bs-cell${v >= 0 ? ' ship' : ''}${shotMe[i] ? (v >= 0 ? ' hit' : ' miss') : ''}${i === last ? ' last' : ''}`, text: shotMe[i] ? (v >= 0 ? '✕' : '•') : '' })));
    const left = FLEET.filter((_, id) => !sunk(theirs, shotAt, id)).length;
    const mineLeft = FLEET.filter((_, id) => !sunk(mine, shotMe, id)).length;
    note.textContent = busy ? api.L('Quadra 開火中…', 'Quadra is firing…') : api.L('點敵方海域開火', 'Tap the enemy sea to fire');
    api.set({ score, info: api.L(`敵艦剩 ${left} · 你剩 ${mineLeft}`, `Enemy ${left} left · you ${mineLeft}`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [note, sea, api.el('p', { class: 'arc-hint small', text: api.L('你的艦隊', 'Your fleet') }), home, row(api, [quitButton(api, () => score)])]);
}
