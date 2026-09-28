// 踩地雷: 8 × 8 with 10 mines; the first tap is always safe. Tap to open, the
// 🚩 switch to flag. Score: cells opened, +20 for clearing the board, +
// a time bonus when cleared inside two minutes.
import { minesBoard, minesOpen, minesWon } from '../lib/arcade.mjs';

const NUM = ['', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#111827', '#6b7280'];
export default function mines(api) {
  const W = 8;
  const N = 10;
  let board = null;
  let open = new Set();
  const flags = new Set();
  let flagMode = false;
  let started = 0;
  const cells = Array.from({ length: W * W }, (_, i) => api.el('button', { class: 'mn-cell', type: 'button', 'aria-label': `${(i % W) + 1},${Math.floor(i / W) + 1}` }));
  const flagBtn = api.el('button', { class: 'q-chip', type: 'button', 'aria-pressed': 'false', text: api.L('🚩 插旗', '🚩 Flag') });
  flagBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagBtn.setAttribute('aria-pressed', String(flagMode));
  });
  const score = (won = false) => {
    const secs = started ? (Date.now() - started) / 1000 : 0;
    return open.size + (won ? 20 + Math.max(0, Math.round((120 - secs) / 6)) : 0);
  };
  const paint = (reveal = false) => {
    cells.forEach((c, i) => {
      const isOpen = open.has(i);
      c.className = `mn-cell${isOpen ? ' open' : ''}${reveal && board?.mine[i] ? ' mine' : ''}`;
      c.textContent = isOpen ? (board.mine[i] ? '💥' : board.count[i] || '') : reveal && board?.mine[i] ? '💣' : flags.has(i) ? '🚩' : '';
      c.style.color = isOpen ? NUM[board.count[i]] : '';
    });
    api.set({ score: score(), info: api.L(`🚩 ${flags.size}/${N}`, `🚩 ${flags.size}/${N}`) });
  };
  const tap = i => {
    if (api.ended) return;
    if (flagMode) {
      if (!open.has(i)) flags.has(i) ? flags.delete(i) : flags.add(i);
      return paint();
    }
    if (flags.has(i) || open.has(i)) return;
    if (!board) {
      board = minesBoard(W, W, N, i);
      started = Date.now();
    }
    if (board.mine[i]) {
      open.add(i);
      paint(true);
      return api.end(score(), api.L(`踩到地雷！打開了 ${open.size - 1} 格。`, `Boom! You opened ${open.size - 1} cells.`));
    }
    open = minesOpen(board, open, i);
    for (const f of flags) if (open.has(f)) flags.delete(f);
    paint();
    if (minesWon(board, open)) {
      paint(true);
      api.end(score(true), api.L('全部清除！', 'Board cleared!'));
    }
  };
  cells.forEach((c, i) => {
    c.addEventListener('click', () => tap(i));
    c.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (!open.has(i)) flags.has(i) ? flags.delete(i) : flags.add(i);
      paint();
    });
  });
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'mn-grid' }, cells), flagBtn]);
}
