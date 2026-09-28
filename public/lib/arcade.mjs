// The arcade: Rewards' games that aren't about words. Each is a short round
// (about a minute or two) scored by skill, never luck, and paid by its score
// (arcadePay) up to its own most a round, inside the games' daily cap like
// every game. This file is the list and the rules (pure, tested); each game's
// screen is in ../arcade/<id>.js, loaded when it's opened.
//
// The rules are written here from the games' common descriptions (all
// long-standing public-domain games: minesweeper, lights out, the 8-puzzle,
// mastermind, nonograms, flood-it, towers of Hanoi, sokoban, n-queens,
// snake, falling blocks, breakout, pong, tic-tac-toe, connect four, reversi,
// gomoku, nim, the Schulte table, the Stroop test…).

// [id, icon, category, 中文名, English name, 中文說明, English line, most a round (NT$), NT$ per point]
const LIST = [
  // Puzzles
  ['mines', '💣', 'puzzle', '踩地雷', 'Minesweeper', '邏輯 · 8×8 十顆雷', 'Logic · 8×8, 10 mines', 40, 0.5],
  ['lights', '💡', 'puzzle', '關燈', 'Lights out', '謎題 · 三盤', 'Puzzle · 3 boards', 40, 1],
  ['slide', '🧩', 'puzzle', '數字推盤', 'Sliding puzzle', '謎題 · 三盤 3×3', 'Puzzle · three 3×3', 40, 1],
  ['codebreak', '🔐', 'puzzle', '猜密碼', 'Code breaker', '推理 · 兩組密碼', 'Deduction · 2 codes', 50, 1],
  ['nonogram', '🖼️', 'puzzle', '數織', 'Nonogram', '邏輯 · 兩張 5×5', 'Logic · two 5×5', 40, 1],
  ['flood', '🌊', 'puzzle', '顏色填滿', 'Flood it', '策略 · 22 步', 'Strategy · 22 moves', 40, 1],
  ['hanoi', '🗼', 'puzzle', '河內塔', 'Tower of Hanoi', '謎題 · 4 和 5 層', 'Puzzle · 4 then 5 discs', 35, 1],
  ['sokoban', '📦', 'puzzle', '推箱子', 'Sokoban', '謎題 · 三關', 'Puzzle · 3 levels', 40, 1],
  ['maze', '🌀', 'puzzle', '迷宮', 'Maze', '方向 · 三個迷宮', 'Direction · 3 mazes', 40, 1],
  ['queens', '👑', 'puzzle', '六皇后', 'Six queens', '邏輯 · 兩盤', 'Logic · 2 boards', 40, 1],
  // Arcade
  ['snake', '🐍', 'arcade', '貪食蛇', 'Snake', '動作 · 越長越難', 'Action · longer, harder', 50, 1.5],
  ['blocks', '🧱', 'arcade', '俄羅斯方塊', 'Falling blocks', '動作 · 2 分鐘', 'Action · 2 minutes', 50, 3],
  ['breakout', '🏓', 'arcade', '打磚塊', 'Breakout', '動作 · 三條命', 'Action · 3 lives', 45, 0.8],
  ['flappy', '🐤', 'arcade', '飛飛鳥', 'Flappy bird', '動作 · 點一下飛', 'Action · tap to flap', 45, 1.5],
  ['runner', '🦖', 'arcade', '小恐龍', 'Dino run', '動作 · 點一下跳', 'Action · tap to jump', 45, 1.2],
  ['stack', '🏗️', 'arcade', '疊疊樂', 'Stack', '抓時機 · 越疊越窄', 'Timing · narrower and narrower', 45, 1.5],
  ['dodge', '☄️', 'arcade', '閃隕石', 'Dodge', '動作 · 撐 60 秒', 'Action · last 60 s', 40, 0.6],
  ['catch', '🍎', 'arcade', '接水果', 'Fruit catch', '動作 · 45 秒', 'Action · 45 s', 40, 0.6],
  ['whack', '🔨', 'arcade', '打地鼠', 'Whack-a-mole', '反應 · 40 秒', 'Reflex · 40 s', 35, 0.5],
  ['pong', '🥎', 'arcade', '乒乓', 'Pong', '對戰 · 先得 7 分', 'Versus · first to 7', 40, 4],
  ['aim', '🎯', 'arcade', '瞄準', 'Aim trainer', '反應 · 30 秒', 'Reflex · 30 s', 35, 0.6],
  // Board games against Quadra
  ['tictactoe', '⭕', 'board', '井字棋', 'Tic-tac-toe', '對戰 · 五盤', 'Versus · best of 5', 40, 1],
  ['connect4', '🔴', 'board', '四子棋', 'Connect four', '對戰 · 一盤', 'Versus · one game', 35, 1],
  ['reversi', '⚫', 'board', '黑白棋', 'Reversi', '對戰 · 6×6', 'Versus · 6×6', 40, 1],
  ['gomoku', '⚪', 'board', '五子棋', 'Gomoku', '對戰 · 9×9', 'Versus · 9×9', 35, 1],
  ['nim', '🪨', 'board', '取石子', 'Nim', '對戰 · 三盤', 'Versus · 3 games', 30, 1],
  // Brain
  ['math', '➗', 'brain', '心算快打', 'Quick maths', '腦力 · 60 秒', 'Brain · 60 s', 45, 1.2],
  ['reaction', '⚡', 'brain', '反應力', 'Reaction time', '反應 · 五次', 'Reflex · 5 tries', 35, 1],
  ['schulte', '🔟', 'brain', '數字方格', 'Schulte table', '專注 · 1 到 25', 'Focus · 1 to 25', 35, 1],
  ['oddcolor', '🟩', 'brain', '找不同色', 'Odd colour', '眼力 · 60 秒', 'Eyes · 60 s', 45, 1],
  ['digits', '🔢', 'brain', '數字記憶', 'Number memory', '記憶 · 越來越長', 'Memory · longer and longer', 40, 1],
  ['gridmem', '🟦', 'brain', '方格記憶', 'Grid memory', '記憶 · 越來越多', 'Memory · more and more', 40, 1],
  ['stroop', '🎨', 'brain', '顏色干擾', 'Stroop', '專注 · 45 秒', 'Focus · 45 s', 40, 1],
  ['count', '🔴', 'brain', '數點點', 'Quick count', '眼力 · 十題', 'Eyes · 10 rounds', 35, 3.5],
  ['compare', '⚖️', 'brain', '比大小', 'Bigger or smaller', '腦力 · 45 秒', 'Brain · 45 s', 40, 0.8]
];

export const ARCADE = LIST.map(([id, icon, cat, zh, en, kindZh, kindEn, max, rate]) => ({ id, icon, cat, zh, en, kindZh, kindEn, max, rate }));
export const ARCADE_BY_ID = Object.fromEntries(ARCADE.map(g => [g.id, g]));
export const CATEGORIES = ['words', 'puzzle', 'arcade', 'board', 'brain'];

// A round's pay: its score at the game's rate, whole dollars, up to its most.
export function arcadePay(id, score) {
  const g = ARCADE_BY_ID[id];
  if (!g || !(score > 0)) return 0;
  return Math.min(g.max, Math.round(score * g.rate));
}

// ---- Randomness: seeded where a board must be reproducible ---------------------------
export function rng(seed = (Math.random() * 2 ** 32) >>> 0) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (rand, n) => Math.floor(rand() * n);
export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const around = (i, w, h) => {
  const x = i % w;
  const y = Math.floor(i / w);
  const out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h) out.push((y + dy) * w + x + dx);
  return out;
};
const orth = (i, w, h) => {
  const x = i % w;
  const y = Math.floor(i / w);
  return [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1].filter(j => j >= 0);
};

// ---- Minesweeper ------------------------------------------------------------------------
// Mines placed after the first tap, never on it or next to it.
export function minesBoard(w, h, n, first, rand = Math.random) {
  const keep = new Set([first, ...around(first, w, h)]);
  const spots = shuffle([...Array(w * h).keys()].filter(i => !keep.has(i)), rand).slice(0, n);
  const mine = Array(w * h).fill(false);
  for (const i of spots) mine[i] = true;
  const count = mine.map((_, i) => around(i, w, h).filter(j => mine[j]).length);
  return { w, h, n, mine, count };
}
// Opens a cell (and, from a 0, everything around it); returns the opened set.
export function minesOpen(board, open, i) {
  const out = new Set(open);
  const stack = [i];
  while (stack.length) {
    const c = stack.pop();
    if (out.has(c)) continue;
    out.add(c);
    if (!board.mine[c] && board.count[c] === 0) for (const j of around(c, board.w, board.h)) if (!out.has(j)) stack.push(j);
  }
  return out;
}
export const minesWon = (board, open) => open.size === board.w * board.h - board.n;

// ---- Lights out -------------------------------------------------------------------------
export function lightsPress(grid, n, i) {
  const next = [...grid];
  for (const j of [i, ...orth(i, n, n)]) next[j] = !next[j];
  return next;
}
// A board made by pressing `presses` different cells of a dark one, so it can always be solved.
export function lightsPuzzle(n, presses, rand = Math.random) {
  let grid = Array(n * n).fill(false);
  for (const i of shuffle([...Array(n * n).keys()], rand).slice(0, presses)) grid = lightsPress(grid, n, i);
  return grid.some(Boolean) ? grid : lightsPuzzle(n, presses, rand);
}

// ---- The sliding puzzle (0 is the gap) ------------------------------------------------------
export function slideCan(tiles, n, i) {
  return orth(i, n, n).includes(tiles.indexOf(0));
}
export function slideMove(tiles, n, i) {
  if (!slideCan(tiles, n, i)) return tiles;
  const next = [...tiles];
  const gap = next.indexOf(0);
  [next[gap], next[i]] = [next[i], next[gap]];
  return next;
}
export const slideSolved = tiles => tiles.every((v, i) => v === (i + 1) % tiles.length);
// Shuffled by legal moves from solved, so always solvable.
export function slidePuzzle(n, moves, rand = Math.random) {
  let tiles = [...Array(n * n).keys()].map(i => (i + 1) % (n * n));
  let prev = -1;
  for (let k = 0; k < moves; k++) {
    const gap = tiles.indexOf(0);
    const options = orth(gap, n, n).filter(j => j !== prev);
    const pick = options[randInt(rand, options.length)];
    prev = gap;
    tiles = slideMove(tiles, n, pick);
  }
  return slideSolved(tiles) ? slidePuzzle(n, moves, rand) : tiles;
}

// ---- Code breaker (mastermind) ------------------------------------------------------------
// Right colour in the right place (exact), right colour elsewhere (near).
export function codeScore(code, guess) {
  let exact = 0;
  const a = {};
  const b = {};
  code.forEach((c, i) => {
    if (guess[i] === c) exact++;
    else {
      a[c] = (a[c] || 0) + 1;
      b[guess[i]] = (b[guess[i]] || 0) + 1;
    }
  });
  const near = Object.keys(a).reduce((s, c) => s + Math.min(a[c], b[c] || 0), 0);
  return { exact, near };
}
export const codePay = guesses => Math.max(8, 25 - 2 * (guesses - 1));

// ---- Nonograms ----------------------------------------------------------------------------
export function nonoClues(line) {
  const out = [];
  let run = 0;
  for (const v of line) {
    if (v) run++;
    else if (run) (out.push(run), (run = 0));
  }
  if (run) out.push(run);
  return out.length ? out : [0];
}
export function nonoPuzzle(n, rand = Math.random) {
  const cells = Array.from({ length: n * n }, () => rand() < 0.58);
  // No empty rows or columns: every line has something to find.
  for (let r = 0; r < n; r++) if (!cells.slice(r * n, r * n + n).some(Boolean)) cells[r * n + randInt(rand, n)] = true;
  for (let c = 0; c < n; c++) if (![...Array(n).keys()].some(r => cells[r * n + c])) cells[randInt(rand, n) * n + c] = true;
  return cells;
}
export function nonoSolved(solution, marks, n) {
  // Solved when every row's and column's clues match (another picture with the same clues counts).
  for (let r = 0; r < n; r++) if (nonoClues(marks.slice(r * n, r * n + n)).join() !== nonoClues(solution.slice(r * n, r * n + n)).join()) return false;
  for (let c = 0; c < n; c++) {
    const col = v => [...Array(n).keys()].map(r => v[r * n + c]);
    if (nonoClues(col(marks)).join() !== nonoClues(col(solution)).join()) return false;
  }
  return true;
}

// ---- Flood it ------------------------------------------------------------------------------
export function floodBoard(n, colors, rand = Math.random) {
  return Array.from({ length: n * n }, () => randInt(rand, colors));
}
// The region joined to the top-left corner, all turned to `color`.
export function floodFill(grid, n, color) {
  const from = grid[0];
  if (from === color) return grid;
  const next = [...grid];
  const stack = [0];
  const seen = new Set();
  while (stack.length) {
    const i = stack.pop();
    if (seen.has(i) || grid[i] !== from) continue;
    seen.add(i);
    next[i] = color;
    stack.push(...orth(i, n, n));
  }
  return next;
}
export const floodDone = grid => grid.every(c => c === grid[0]);
export const floodShare = grid => {
  const n = Math.round(Math.sqrt(grid.length));
  const seen = new Set();
  const stack = [0];
  while (stack.length) {
    const i = stack.pop();
    if (seen.has(i) || grid[i] !== grid[0]) continue;
    seen.add(i);
    stack.push(...orth(i, n, n));
  }
  return seen.size / grid.length;
};

// ---- Tower of Hanoi (pegs: arrays of disc sizes, bottom first) ------------------------------------
export function hanoiMove(pegs, from, to) {
  const disc = pegs[from].at(-1);
  if (disc == null || from === to || (pegs[to].length && pegs[to].at(-1) < disc)) return null;
  return pegs.map((p, i) => (i === from ? p.slice(0, -1) : i === to ? [...p, disc] : p));
}
export const hanoiStart = n => [[...Array(n).keys()].map(i => n - i), [], []];
export const hanoiDone = (pegs, n) => pegs[2].length === n;
export const hanoiPay = (n, moves) => (moves > 0 ? ((2 ** n - 1) / moves) * (n === 4 ? 15 : 20) : 0);

// ---- Sokoban ---------------------------------------------------------------------------------
// # wall, . goal, $ box, * box on goal, @ player, + player on goal.
export const SOKOBAN = [
  ['#######', '#.  @ #', '# $$  #', '#.    #', '#######'],
  ['######', '#    #', '# #$ #', '# .@ #', '# $. #', '#    #', '######'],
  ['########', '#  .   #', '# $$ $ #', '#.  @ .#', '#   #  #', '########']
];
export function sokoParse(rows) {
  const w = Math.max(...rows.map(r => r.length));
  const cells = rows.flatMap(r => [...r.padEnd(w, ' ')]);
  return {
    w,
    h: rows.length,
    walls: new Set(cells.flatMap((c, i) => (c === '#' ? [i] : []))),
    goals: new Set(cells.flatMap((c, i) => ('.*+'.includes(c) ? [i] : []))),
    boxes: new Set(cells.flatMap((c, i) => ('$*'.includes(c) ? [i] : []))),
    player: cells.findIndex(c => '@+'.includes(c)),
    moves: 0
  };
}
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export function sokoMove(s, dir) {
  const [dx, dy] = DIRS[dir];
  const step = i => {
    const x = (i % s.w) + dx;
    const y = Math.floor(i / s.w) + dy;
    return x < 0 || y < 0 || x >= s.w || y >= s.h ? -1 : y * s.w + x;
  };
  const next = step(s.player);
  if (next < 0 || s.walls.has(next)) return s;
  if (s.boxes.has(next)) {
    const beyond = step(next);
    if (beyond < 0 || s.walls.has(beyond) || s.boxes.has(beyond)) return s;
    const boxes = new Set(s.boxes);
    boxes.delete(next);
    boxes.add(beyond);
    return { ...s, boxes, player: next, moves: s.moves + 1 };
  }
  return { ...s, player: next, moves: s.moves + 1 };
}
export const sokoDone = s => [...s.boxes].every(b => s.goals.has(b));

// ---- Mazes (a perfect maze: one way between any two cells) ---------------------------------------
// walls[i] = [top, right, bottom, left].
export function makeMaze(w, h, rand = Math.random) {
  const walls = Array.from({ length: w * h }, () => [true, true, true, true]);
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const i = stack.at(-1);
    const x = i % w;
    const y = Math.floor(i / w);
    const next = [
      [0, x, y - 1, 2],
      [1, x + 1, y, 3],
      [2, x, y + 1, 0],
      [3, x - 1, y, 1]
    ].filter(([, nx, ny]) => nx >= 0 && ny >= 0 && nx < w && ny < h && !seen.has(ny * w + nx));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [side, nx, ny, back] = next[randInt(rand, next.length)];
    const j = ny * w + nx;
    walls[i][side] = false;
    walls[j][back] = false;
    seen.add(j);
    stack.push(j);
  }
  return { w, h, walls };
}
export function mazeStep(maze, i, dir) {
  const side = { up: 0, right: 1, down: 2, left: 3 }[dir];
  if (maze.walls[i][side]) return i;
  return i + [-maze.w, 1, maze.w, -1][side];
}

// ---- N queens -------------------------------------------------------------------------------
// queens: the column of the queen in each row (null for none).
export function queensClash(queens) {
  const bad = new Set();
  queens.forEach((c, r) => {
    if (c == null) return;
    queens.forEach((c2, r2) => {
      if (r2 === r || c2 == null) return;
      if (c2 === c || Math.abs(c2 - c) === Math.abs(r2 - r)) bad.add(r);
    });
  });
  return bad;
}
export const queensDone = queens => queens.every(c => c != null) && queensClash(queens).size === 0;

// ---- Falling blocks ----------------------------------------------------------------------------
export const PIECES = {
  I: [[0, 1], [1, 1], [2, 1], [3, 1]],
  O: [[1, 0], [2, 0], [1, 1], [2, 1]],
  T: [[1, 0], [0, 1], [1, 1], [2, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]]
};
// A quarter turn clockwise inside the piece's box (4 for I and O, else 3).
export function rotateCells(cells, size) {
  return cells.map(([x, y]) => [size - 1 - y, x]);
}
export function blocksFit(board, w, h, cells, px, py) {
  return cells.every(([x, y]) => {
    const bx = px + x;
    const by = py + y;
    return bx >= 0 && bx < w && by < h && (by < 0 || !board[by * w + bx]);
  });
}
// Full rows removed; returns { board, lines }.
export function blocksClear(board, w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = board.slice(y * w, y * w + w);
    if (!row.every(Boolean)) rows.push(row);
  }
  const lines = h - rows.length;
  return { board: [...Array(lines * w).fill(0), ...rows.flat()], lines };
}

// ---- Tic-tac-toe (cells: 'X', 'O' or '') --------------------------------------------------------
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function tttWinner(b) {
  for (const [a, c, d] of LINES3) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'draw' : null;
}
// The best move for `me` (minimax).
export function tttBest(b, me) {
  const other = me === 'X' ? 'O' : 'X';
  const score = (board, turn, depth) => {
    const w = tttWinner(board);
    if (w === me) return 10 - depth;
    if (w === other) return depth - 10;
    if (w === 'draw') return 0;
    const vals = board.flatMap((v, i) => (v ? [] : [score(board.map((x, j) => (j === i ? turn : x)), turn === 'X' ? 'O' : 'X', depth + 1)]));
    return turn === me ? Math.max(...vals) : Math.min(...vals);
  };
  let best = -1;
  let bestScore = -Infinity;
  b.forEach((v, i) => {
    if (v) return;
    const s = score(b.map((x, j) => (j === i ? me : x)), other, 1);
    if (s > bestScore) (bestScore = s), (best = i);
  });
  return best;
}

// ---- Connect four (7 × 6, cells 1 you, 2 Quadra, 0 empty; row 0 at the top) -------------------------
export const C4 = { w: 7, h: 6 };
export function c4Drop(b, col, who) {
  for (let r = C4.h - 1; r >= 0; r--) {
    if (!b[r * C4.w + col]) {
      const next = [...b];
      next[r * C4.w + col] = who;
      return next;
    }
  }
  return null;
}
export function c4Winner(b) {
  const { w, h } = C4;
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? b[y * w + x] : 0);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = at(x, y);
      if (!v) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if (at(x + dx, y + dy) === v && at(x + 2 * dx, y + 2 * dy) === v && at(x + 3 * dx, y + 3 * dy) === v) return v;
    }
  return b.every(Boolean) ? 'draw' : 0;
}
function c4Heur(b, me) {
  const { w, h } = C4;
  let s = 0;
  for (let y = 0; y < h; y++) if (b[y * w + 3] === me) s += 3;
  const windows = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const cells = [0, 1, 2, 3].map(k => [x + k * dx, y + k * dy]);
        if (cells.every(([cx, cy]) => cx >= 0 && cy >= 0 && cx < w && cy < h)) windows.push(cells.map(([cx, cy]) => b[cy * w + cx]));
      }
  for (const win of windows) {
    const mine = win.filter(v => v === me).length;
    const theirs = win.filter(v => v && v !== me).length;
    if (theirs === 0) s += [0, 1, 4, 20, 1000][mine];
    if (mine === 0) s -= [0, 1, 5, 40, 1000][theirs];
  }
  return s;
}
// Quadra's move: negamax to `depth`, centre first.
export function c4Best(b, me, depth = 4) {
  const order = [3, 2, 4, 1, 5, 0, 6];
  const other = me === 1 ? 2 : 1;
  const search = (board, turn, d, alpha, beta) => {
    const win = c4Winner(board);
    if (win === 'draw') return 0;
    if (win) return win === turn ? 100000 + d : -100000 - d;
    if (d === 0) return c4Heur(board, turn);
    let best = -Infinity;
    for (const c of order) {
      const next = c4Drop(board, c, turn);
      if (!next) continue;
      const v = -search(next, turn === 1 ? 2 : 1, d - 1, -beta, -alpha);
      best = Math.max(best, v);
      alpha = Math.max(alpha, v);
      if (alpha >= beta) break;
    }
    return best === -Infinity ? 0 : best;
  };
  let bestCol = order.find(c => c4Drop(b, c, me));
  let bestVal = -Infinity;
  for (const c of order) {
    const next = c4Drop(b, c, me);
    if (!next) continue;
    const v = -search(next, other, depth - 1, -Infinity, Infinity);
    if (v > bestVal) (bestVal = v), (bestCol = c);
  }
  return bestCol;
}

// ---- Reversi (n × n, 1 you (black, first), 2 Quadra) -----------------------------------------------
export function rvStart(n = 6) {
  const b = Array(n * n).fill(0);
  const m = n / 2;
  b[(m - 1) * n + m - 1] = 2;
  b[m * n + m] = 2;
  b[(m - 1) * n + m] = 1;
  b[m * n + m - 1] = 1;
  return b;
}
export function rvFlips(b, n, i, who) {
  if (b[i]) return [];
  const x0 = i % n;
  const y0 = Math.floor(i / n);
  const out = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const line = [];
    let x = x0 + dx;
    let y = y0 + dy;
    while (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] && b[y * n + x] !== who) {
      line.push(y * n + x);
      x += dx;
      y += dy;
    }
    if (line.length && x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] === who) out.push(...line);
  }
  return out;
}
export const rvMoves = (b, n, who) => b.flatMap((_, i) => (rvFlips(b, n, i, who).length ? [i] : []));
export function rvPlay(b, n, i, who) {
  const flips = rvFlips(b, n, i, who);
  if (!flips.length) return null;
  const next = [...b];
  next[i] = who;
  for (const f of flips) next[f] = who;
  return next;
}
// Quadra: corners first, never the square next to an empty corner if it can help it, then most flips.
export function rvBest(b, n, who) {
  const moves = rvMoves(b, n, who);
  if (!moves.length) return -1;
  const corners = [0, n - 1, n * (n - 1), n * n - 1];
  const x = i => i % n;
  const y = i => Math.floor(i / n);
  const nearCorner = i => corners.some(c => !b[c] && Math.abs(x(c) - x(i)) <= 1 && Math.abs(y(c) - y(i)) <= 1);
  const edge = i => x(i) === 0 || y(i) === 0 || x(i) === n - 1 || y(i) === n - 1;
  const value = i => (corners.includes(i) ? 100 : 0) + (nearCorner(i) ? -40 : 0) + (edge(i) ? 8 : 0) + rvFlips(b, n, i, who).length;
  return moves.reduce((best, i) => (value(i) > value(best) ? i : best), moves[0]);
}

// ---- Gomoku (n × n, five in a row) -------------------------------------------------------------------
export function gmFive(b, n, i) {
  const who = b[i];
  if (!who) return false;
  const x0 = i % n;
  const y0 = Math.floor(i / n);
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let count = 1;
    for (const s of [1, -1]) {
      let x = x0 + s * dx;
      let y = y0 + s * dy;
      while (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] === who) {
        count++;
        x += s * dx;
        y += s * dy;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}
// Quadra: the empty cell with the best mix of its own lines and blocking yours.
export function gmBest(b, n, me) {
  const other = me === 1 ? 2 : 1;
  const lineScore = (i, who) => {
    const x0 = i % n;
    const y0 = Math.floor(i / n);
    let total = 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      let count = 0;
      let open = 0;
      for (const s of [1, -1]) {
        let x = x0 + s * dx;
        let y = y0 + s * dy;
        while (x >= 0 && y >= 0 && x < n && y < n && b[y * n + x] === who) {
          count++;
          x += s * dx;
          y += s * dy;
        }
        if (x >= 0 && y >= 0 && x < n && y < n && !b[y * n + x]) open++;
      }
      total += count >= 4 ? 100000 : [0, 10, 100, 1000][count] * (open === 2 ? 2 : open === 1 ? 1 : 0.2);
    }
    return total;
  };
  let best = -1;
  let bestVal = -1;
  const c = (n - 1) / 2;
  b.forEach((v, i) => {
    if (v) return;
    const val = lineScore(i, me) * 1.1 + lineScore(i, other) - (Math.abs((i % n) - c) + Math.abs(Math.floor(i / n) - c)) * 0.5;
    if (val > bestVal) (bestVal = val), (best = i);
  });
  return best;
}

// ---- Nim (take any number from one heap; taking the last stone wins) -----------------------------------
export function nimBest(heaps) {
  const x = heaps.reduce((a, h) => a ^ h, 0);
  if (x) {
    const i = heaps.findIndex(h => (h ^ x) < h);
    return { heap: i, take: heaps[i] - (heaps[i] ^ x) };
  }
  const i = heaps.findIndex(h => h > 0);
  return { heap: i, take: 1 };
}

// ---- Brain games ---------------------------------------------------------------------------------
// A sum at a level (0 easy … 1 hard): { text, answer }.
export function mathQuestion(level, rand = Math.random) {
  const hard = level > 0.5;
  const op = ['+', '−', '×', '÷'][randInt(rand, hard ? 4 : 3)];
  const big = hard ? 50 : 20;
  let a = 2 + randInt(rand, big);
  let b = 2 + randInt(rand, big);
  if (op === '×') (a = 2 + randInt(rand, hard ? 13 : 9)), (b = 2 + randInt(rand, 9));
  if (op === '÷') {
    b = 2 + randInt(rand, 9);
    const q = 2 + randInt(rand, 12);
    a = b * q;
    return { text: `${a} ÷ ${b}`, answer: q };
  }
  if (op === '−' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : op === '−' ? a - b : a * b;
  return { text: `${a} ${op} ${b}`, answer };
}
// Three wrong answers near the right one, and the right one, shuffled.
export function mathChoices(answer, rand = Math.random) {
  const set = new Set([answer]);
  while (set.size < 4) {
    const d = 1 + randInt(rand, Math.max(3, Math.round(Math.abs(answer) * 0.2)));
    set.add(answer + (rand() < 0.5 ? -d : d));
  }
  return shuffle([...set], rand);
}
export const reactionPay = ms => Math.max(0, Math.round((500 - ms) / 8));
export const schultePay = seconds => Math.max(0, Math.round(50 - seconds));
// The odd tile's colour gap shrinks as levels go up.
export const oddGap = level => Math.max(4, 40 - level * 2.2);
export const oddSize = level => Math.min(8, 2 + Math.floor(level / 3));
