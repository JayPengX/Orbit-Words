// 俄羅斯方塊: two minutes; clear lines. Score: lines cleared (2 lines at once
// count 3, 3 count 5, 4 count 8).
import { PIECES, rotateCells, blocksFit, blocksClear } from '../lib/arcade.mjs';
import { canvasGame, hudText } from './kit.js';

const COLOR = { I: '#22d3ee', O: '#facc15', T: '#a855f7', S: '#22c55e', Z: '#ef4444', J: '#3b82f6', L: '#f97316' };
export default function blocks(api) {
  const w = 10;
  const h = 18;
  const S = 18;
  const W = w * S + 90;
  const H = h * S;
  let board = Array(w * h).fill(0);
  let score = 0;
  let lines = 0;
  let timeLeft = 120_000;
  let fall = 0;
  const bag = [];
  const draw = () => {
    if (!bag.length) bag.push(...Object.keys(PIECES).sort(() => api.rand() - 0.5));
    return bag.pop();
  };
  let next = draw();
  let cur = null;
  const spawn = () => {
    const k = next;
    next = draw();
    cur = { k, cells: PIECES[k], size: k === 'I' || k === 'O' ? 4 : 3, x: 3, y: -1 };
    if (!blocksFit(board, w, h, cur.cells, cur.x, cur.y)) api.end(score);
  };
  spawn();
  const lock = () => {
    for (const [x, y] of cur.cells) if (cur.y + y >= 0) board[(cur.y + y) * w + cur.x + x] = cur.k;
    const r = blocksClear(board, w, h);
    board = r.board;
    if (r.lines) {
      lines += r.lines;
      score += [0, 1, 3, 5, 8][r.lines];
      api.set({ score, info: api.L(`${lines} 行`, `${lines} lines`) });
    }
    spawn();
  };
  const tryMove = (dx, dy, cells = cur.cells) => {
    if (blocksFit(board, w, h, cells, cur.x + dx, cur.y + dy)) {
      cur = { ...cur, x: cur.x + dx, y: cur.y + dy, cells };
      return true;
    }
    return false;
  };
  const act = kind => {
    if (!cur || api.ended) return;
    if (kind === 'left') tryMove(-1, 0);
    else if (kind === 'right') tryMove(1, 0);
    else if (kind === 'down') {
      while (tryMove(0, 1));
      lock();
    } else if (kind === 'up' || kind === 'rotate') {
      const r = rotateCells(cur.cells, cur.size);
      tryMove(0, 0, r) || tryMove(-1, 0, r) || tryMove(1, 0, r);
    }
  };
  const stage = canvasGame(api, W, H, {
    hint: api.L('點左右移動、點上方旋轉、下滑落下', 'Tap sides to move, top to turn, swipe down to drop'),
    step(dt) {
      timeLeft -= dt;
      if (timeLeft <= 0) return api.end(score);
      fall += dt;
      const every = Math.max(160, 650 - lines * 25);
      if (fall >= every) {
        fall = 0;
        if (!tryMove(0, 1)) lock();
      }
    },
    draw(c) {
      c.fillStyle = '#0b1020';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#111933';
      c.fillRect(0, 0, w * S, H);
      const cell = (x, y, k) => {
        c.fillStyle = COLOR[k];
        c.fillRect(x * S + 1, y * S + 1, S - 2, S - 2);
      };
      board.forEach((k, i) => k && cell(i % w, Math.floor(i / w), k));
      if (cur) {
        let gy = 0;
        while (blocksFit(board, w, h, cur.cells, cur.x, cur.y + gy + 1)) gy++;
        c.globalAlpha = 0.25;
        for (const [x, y] of cur.cells) if (cur.y + y + gy >= 0) cell(cur.x + x, cur.y + y + gy, cur.k);
        c.globalAlpha = 1;
        for (const [x, y] of cur.cells) if (cur.y + y >= 0) cell(cur.x + x, cur.y + y, cur.k);
      }
      c.fillStyle = '#cbd5e1';
      c.font = '700 12px system-ui';
      c.fillText(api.L('下一個', 'Next'), w * S + 12, 20);
      for (const [x, y] of PIECES[next]) (c.fillStyle = COLOR[next]), c.fillRect(w * S + 16 + x * 14, 30 + y * 14, 12, 12);
      c.fillStyle = '#cbd5e1';
      c.fillText(api.L('時間', 'Time'), w * S + 12, 100);
      c.font = '800 20px system-ui';
      c.fillText(`${Math.ceil(timeLeft / 1000)}`, w * S + 12, 124);
      c.font = '700 12px system-ui';
      c.fillText(api.L('行數', 'Lines'), w * S + 12, 160);
      c.font = '800 20px system-ui';
      c.fillText(String(lines), w * S + 12, 184);
      hudText(c, 0, '', '');
    },
    input(kind, x, y) {
      if (kind === 'down' && x != null) {
        if (y < H * 0.3) act('rotate');
        else act(x < (w * S) / 2 ? 'left' : 'right');
      } else if (['left', 'right', 'up', 'down', 'action'].includes(kind)) act(kind === 'action' ? 'down' : kind);
    }
  });
  api.swipe(stage, d => d === 'down' && act('down'));
  return stage;
}
