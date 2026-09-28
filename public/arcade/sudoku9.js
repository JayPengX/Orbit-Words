// 數獨 9×9: the classic. A new puzzle with a single solution; tap a cell,
// then a number (✎ notes small numbers). Rule breaks show red; three
// mistakes (a number that isn't the solution's) and it ends. Score: every
// right number 1, a solved grid +40, and a time bonus inside 20 minutes.
import { sudokuMake, sudokuConflicts, sudokuSolved } from '../lib/long.mjs';
import { quitButton, row } from './kit.js';

export default function sudoku9(api) {
  const { puzzle, solution } = sudokuMake(api.rand, 34);
  const grid = [...puzzle];
  const notes = Array.from({ length: 81 }, () => new Set());
  let sel = puzzle.findIndex(v => !v);
  let noteMode = false;
  let mistakes = 0;
  let right = 0;
  const started = Date.now();
  const cells = Array.from({ length: 81 }, (_, i) => api.el('button', { class: 'sd9-cell', type: 'button', onclick: () => ((sel = i), paint()) }));
  const score = (won = false) => right + (won ? 40 + Math.max(0, Math.round((20 * 60 - (Date.now() - started) / 1000) / 30)) : 0);
  const paint = () => {
    const bad = sudokuConflicts(grid);
    const same = grid[sel];
    cells.forEach((c, i) => {
      const r = Math.floor(i / 9);
      const k = i % 9;
      const peer = sel >= 0 && (Math.floor(sel / 9) === r || sel % 9 === k || (Math.floor(Math.floor(sel / 9) / 3) === Math.floor(r / 3) && Math.floor((sel % 9) / 3) === Math.floor(k / 3)));
      c.className = `sd9-cell${puzzle[i] ? ' given' : ''}${i === sel ? ' sel' : peer ? ' peer' : ''}${same && grid[i] === same ? ' same' : ''}${bad.has(i) ? ' bad' : ''}${k % 3 === 2 && k < 8 ? ' br' : ''}${r % 3 === 2 && r < 8 ? ' bb' : ''}`;
      if (grid[i]) c.textContent = String(grid[i]);
      else if (notes[i].size) c.replaceChildren(api.el('span', { class: 'sd9-notes' }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => api.el('i', { text: notes[i].has(n) ? String(n) : '' }))));
      else c.textContent = '';
    });
    noteBtn.setAttribute('aria-pressed', String(noteMode));
    api.set({ score: score(), info: api.L(`錯 ${mistakes}/3 · 剩 ${grid.filter(v => !v).length} 格`, `Mistakes ${mistakes}/3 · ${grid.filter(v => !v).length} left`) });
  };
  const put = v => {
    if (api.ended || sel < 0 || puzzle[sel]) return;
    if (noteMode && v) {
      notes[sel].has(v) ? notes[sel].delete(v) : notes[sel].add(v);
      return paint();
    }
    if (!v) {
      grid[sel] = 0;
      return paint();
    }
    if (grid[sel] === v) return;
    grid[sel] = v;
    notes[sel].clear();
    if (v === solution[sel]) {
      right++;
      // The same number no longer needs noting in its row, column and box.
      for (let j = 0; j < 81; j++) if (Math.floor(j / 9) === Math.floor(sel / 9) || j % 9 === sel % 9) notes[j].delete(v);
    } else mistakes++;
    paint();
    if (sudokuSolved(grid)) return api.end(score(true), api.L('解開了！', 'Solved!'));
    if (mistakes >= 3) return api.end(score(), api.L('錯了三次，這盤結束。', 'Three mistakes: this one’s over.'));
  };
  const noteBtn = api.el('button', { class: 'q-chip', type: 'button', 'aria-pressed': 'false', text: api.L('✎ 筆記', '✎ Notes'), onclick: () => ((noteMode = !noteMode), paint()) });
  const pad = api.el(
    'div',
    { class: 'sd9-pad' },
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => api.el('button', { class: 'sd9-key', type: 'button', text: String(n), onclick: () => put(n) })).concat(api.el('button', { class: 'sd9-key erase', type: 'button', text: '⌫', 'aria-label': api.L('清除', 'Erase'), onclick: () => put(0) }))
  );
  api.onKey(dir => {
    const moveBy = { up: -9, down: 9, left: -1, right: 1 }[dir];
    if (moveBy) {
      sel = Math.max(0, Math.min(80, (sel < 0 ? 0 : sel) + moveBy));
      paint();
    }
  });
  const onDigit = e => /^[1-9]$/.test(e.key) && put(Number(e.key));
  document.addEventListener('keydown', onDigit);
  api.cleanup(() => document.removeEventListener('keydown', onDigit));
  paint();
  return api.el('div', { class: 'arc-col sd9' }, [api.el('div', { class: 'sd9-grid' }, cells), pad, row(api, [noteBtn, quitButton(api, () => score())])]);
}
