// The long games' rules (pure, tested): classic 9×9 sudoku, Klondike
// solitaire, checkers against Quadra and the word search. Each is a game of
// ten minutes or more, paid by its score like every arcade game.
import { shuffle } from './arcade.mjs';

// ---- Sudoku 9×9 ----------------------------------------------------------------------------
// A full grid (backtracking over shuffled digits), then cells taken away,
// keeping only those whose removal leaves a single solution.

const box = i => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
export function sudokuCanPlace(g, i, v) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const b = box(i);
  for (let j = 0; j < 81; j++) {
    if (j === i || g[j] !== v) continue;
    if (Math.floor(j / 9) === r || j % 9 === c || box(j) === b) return false;
  }
  return true;
}
function fill(g, rand, limit = { n: 0 }) {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
    if (!sudokuCanPlace(g, i, v)) continue;
    g[i] = v;
    if (++limit.n > 200_000) return false;
    if (fill(g, rand, limit)) return true;
    g[i] = 0;
  }
  return false;
}
// How many solutions (stopping at 2).
export function sudokuCount(grid) {
  const g = [...grid];
  let n = 0;
  const go = () => {
    if (n > 1) return;
    let best = -1;
    let options = null;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const opts = [];
      for (let v = 1; v <= 9; v++) if (sudokuCanPlace(g, i, v)) opts.push(v);
      if (!opts.length) return;
      if (!options || opts.length < options.length) {
        best = i;
        options = opts;
        if (opts.length === 1) break;
      }
    }
    if (best < 0) return void n++;
    for (const v of options) {
      g[best] = v;
      go();
      g[best] = 0;
      if (n > 1) return;
    }
  };
  go();
  return n;
}
// { puzzle, solution }: clues ~ how many cells stay (about 30 hard, 38 easy).
export function sudokuMake(rand = Math.random, clues = 34) {
  const solution = Array(81).fill(0);
  fill(solution, rand);
  const puzzle = [...solution];
  let left = 81;
  for (const i of shuffle([...Array(81).keys()], rand)) {
    if (left <= clues) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (sudokuCount(puzzle) !== 1) puzzle[i] = keep;
    else left--;
  }
  return { puzzle, solution };
}
// The cells that break a rule.
export function sudokuConflicts(g) {
  const out = new Set();
  for (let i = 0; i < 81; i++) if (g[i] && !sudokuCanPlace(g, i, g[i])) out.add(i);
  return out;
}
export const sudokuSolved = g => g.every(Boolean) && sudokuConflicts(g).size === 0;

// ---- Klondike solitaire (draw one) ------------------------------------------------------------
// Cards are { s: 0..3 (♠♥♦♣), r: 1..13, up }. Red: ♥ ♦.
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const isRed = c => c.s === 1 || c.s === 2;
export function klondikeDeal(rand = Math.random) {
  const deck = shuffle(
    [0, 1, 2, 3].flatMap(s => Array.from({ length: 13 }, (_, i) => ({ s, r: i + 1, up: false }))),
    rand
  );
  const tableau = [];
  let k = 0;
  for (let col = 0; col < 7; col++) {
    const pile = deck.slice(k, k + col + 1).map((c, i) => ({ ...c, up: i === col }));
    k += col + 1;
    tableau.push(pile);
  }
  return { stock: deck.slice(k).map(c => ({ ...c, up: false })), waste: [], found: [[], [], [], []], tableau, moves: 0 };
}
const clone = g => ({ stock: g.stock.map(c => ({ ...c })), waste: g.waste.map(c => ({ ...c })), found: g.found.map(p => p.map(c => ({ ...c }))), tableau: g.tableau.map(p => p.map(c => ({ ...c }))), moves: g.moves });
export const canFound = (card, pile) => (pile.length ? pile.at(-1).s === card.s && pile.at(-1).r === card.r - 1 : card.r === 1);
export const canStack = (card, pile) => (pile.length ? pile.at(-1).up && isRed(pile.at(-1)) !== isRed(card) && pile.at(-1).r === card.r + 1 : card.r === 13);
// Turn the stock (one card), or put the waste back when it's empty.
export function klondikeDraw(g) {
  const n = clone(g);
  if (n.stock.length) n.waste.push({ ...n.stock.pop(), up: true });
  else if (n.waste.length) {
    n.stock = n.waste.reverse().map(c => ({ ...c, up: false }));
    n.waste = [];
  } else return g;
  n.moves++;
  return n;
}
const flipTop = pile => {
  if (pile.length && !pile.at(-1).up) pile.at(-1).up = true;
};
// Move from a source: { from: 'waste' } | { from: 'tab', col, i } | { from: 'found', f },
// to a target { to: 'found', f } | { to: 'tab', col }. Returns the new game or null.
export function klondikeMove(g, src, dst) {
  const n = clone(g);
  let cards;
  if (src.from === 'waste') cards = n.waste.length ? [n.waste.at(-1)] : [];
  else if (src.from === 'found') cards = n.found[src.f].length ? [n.found[src.f].at(-1)] : [];
  else cards = n.tableau[src.col].slice(src.i);
  if (!cards.length || !cards[0].up) return null;
  if (dst.to === 'found') {
    if (cards.length !== 1 || !canFound(cards[0], n.found[dst.f])) return null;
  } else if (dst.to === 'tab') {
    if (src.from === 'tab' && src.col === dst.col) return null;
    if (!canStack(cards[0], n.tableau[dst.col])) return null;
  } else return null;
  if (src.from === 'waste') n.waste.pop();
  else if (src.from === 'found') n.found[src.f].pop();
  else {
    n.tableau[src.col].splice(src.i);
    flipTop(n.tableau[src.col]);
  }
  if (dst.to === 'found') n.found[dst.f].push(cards[0]);
  else n.tableau[dst.col].push(...cards);
  n.moves++;
  return n;
}
// The best place for a tapped card: a foundation, else a tableau pile
// (one with cards before an empty one).
export function klondikeAuto(g, src) {
  const card = src.from === 'waste' ? g.waste.at(-1) : src.from === 'found' ? g.found[src.f].at(-1) : g.tableau[src.col][src.i];
  if (!card) return null;
  const single = src.from !== 'tab' || src.i === g.tableau[src.col].length - 1;
  if (single && src.from !== 'found') for (let f = 0; f < 4; f++) {
    const n = klondikeMove(g, src, { to: 'found', f });
    if (n) return n;
  }
  const cols = [...Array(7).keys()].sort((a, b) => (g.tableau[a].length === 0) - (g.tableau[b].length === 0));
  for (const col of cols) {
    const n = klondikeMove(g, src, { to: 'tab', col });
    if (n) return n;
  }
  return null;
}
export const klondikeFound = g => g.found.reduce((s, p) => s + p.length, 0);
export const klondikeWon = g => klondikeFound(g) === 52;
// Any move left at all (including turning the stock)?
export function klondikeStuck(g) {
  if (g.stock.length || g.waste.length > 1) return false;
  const srcs = [{ from: 'waste' }, ...g.tableau.flatMap((p, col) => p.map((c, i) => (c.up ? { from: 'tab', col, i } : null)).filter(Boolean))];
  return !srcs.some(src => klondikeAuto(g, src));
}

// ---- Checkers (English draughts, 8×8) ---------------------------------------------------------
// Board: 64 cells, 0 empty, 1 you (moving up), 2 Quadra (moving down), 3 your
// king, 4 Quadra's king. Captures are compulsory; a piece keeps jumping
// while it can; reaching the far row crowns it.
export function checkersStart() {
  const b = Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(i / 8);
    const c = i % 8;
    if ((r + c) % 2 === 1) {
      if (r < 3) b[i] = 2;
      if (r > 4) b[i] = 1;
    }
  }
  return b;
}
const side = p => (p === 1 || p === 3 ? 1 : p === 2 || p === 4 ? 2 : 0);
const dirsOf = p => (p === 1 ? [[-1, -1], [-1, 1]] : p === 2 ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
function jumpsFrom(b, i) {
  const p = b[i];
  const r = Math.floor(i / 8);
  const c = i % 8;
  const out = [];
  for (const [dr, dc] of dirsOf(p)) {
    const mr = r + dr;
    const mc = c + dc;
    const tr = r + 2 * dr;
    const tc = c + 2 * dc;
    if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue;
    const mid = mr * 8 + mc;
    const to = tr * 8 + tc;
    if (side(b[mid]) && side(b[mid]) !== side(p) && !b[to]) out.push({ from: i, to, take: [mid] });
  }
  return out;
}
function applyStep(b, m) {
  const n = [...b];
  n[m.to] = n[m.from];
  n[m.from] = 0;
  for (const t of m.take) n[t] = 0;
  const r = Math.floor(m.to / 8);
  if (n[m.to] === 1 && r === 0) n[m.to] = 3;
  if (n[m.to] === 2 && r === 7) n[m.to] = 4;
  return n;
}
// Every full move for `who` (multi-jumps chained): [{ from, to, path, take }].
export function checkersMoves(b, who) {
  const jumps = [];
  // Keep jumping from `pos` while the piece can (a crowning ends the move).
  const chain = (board, pos, m) => {
    const more = jumpsFrom(board, pos);
    if (!more.length) return void jumps.push(m);
    for (const x of more) {
      const after = applyStep(board, x);
      const next = { from: m.from, to: x.to, path: [...m.path, x.to], take: [...m.take, ...x.take] };
      if (after[x.to] !== board[pos]) jumps.push(next);
      else chain(after, x.to, next);
    }
  };
  for (let i = 0; i < 64; i++) {
    if (side(b[i]) !== who) continue;
    for (const j of jumpsFrom(b, i)) {
      const after = applyStep(b, j);
      const m = { from: i, to: j.to, path: [j.to], take: j.take };
      if (after[j.to] !== b[i]) jumps.push(m);
      else chain(after, j.to, m);
    }
  }
  if (jumps.length) return jumps.map(m => ({ from: m.from, to: m.to, path: m.path, take: m.take }));
  const steps = [];
  for (let i = 0; i < 64; i++) {
    if (side(b[i]) !== who) continue;
    const r = Math.floor(i / 8);
    const c = i % 8;
    for (const [dr, dc] of dirsOf(b[i])) {
      const tr = r + dr;
      const tc = c + dc;
      if (tr < 0 || tr > 7 || tc < 0 || tc > 7 || b[tr * 8 + tc]) continue;
      steps.push({ from: i, to: tr * 8 + tc, path: [tr * 8 + tc], take: [] });
    }
  }
  return steps;
}
export function checkersPlay(b, m) {
  let n = [...b];
  n[m.to] = n[m.from];
  if (m.to !== m.from) n[m.from] = 0;
  for (const t of m.take) n[t] = 0;
  const r = Math.floor(m.to / 8);
  if (n[m.to] === 1 && r === 0) n[m.to] = 3;
  if (n[m.to] === 2 && r === 7) n[m.to] = 4;
  return n;
}
const material = b => b.reduce((s, p) => s + (p === 2 ? 1 : p === 4 ? 1.6 : p === 1 ? -1 : p === 3 ? -1.6 : 0), 0);
// Quadra's move: a small minimax (depth 4) on material, a little randomness
// among equals so games differ.
export function checkersAI(b, depth = 4, rand = Math.random) {
  const search = (board, d, who, alpha, beta) => {
    const moves = checkersMoves(board, who);
    if (!moves.length) return who === 2 ? -100 : 100;
    if (d === 0) return material(board);
    let best = who === 2 ? -Infinity : Infinity;
    for (const m of moves) {
      const v = search(checkersPlay(board, m), d - 1, who === 2 ? 1 : 2, alpha, beta);
      if (who === 2) {
        best = Math.max(best, v);
        alpha = Math.max(alpha, v);
      } else {
        best = Math.min(best, v);
        beta = Math.min(beta, v);
      }
      if (beta <= alpha) break;
    }
    return best;
  };
  const moves = checkersMoves(b, 2);
  if (!moves.length) return null;
  const scored = moves.map(m => ({ m, v: search(checkersPlay(b, m), depth - 1, 1, -Infinity, Infinity) + rand() * 0.05 }));
  scored.sort((x, y) => y.v - x.v);
  return scored[0].m;
}
export const checkersCount = (b, who) => b.filter(p => side(p) === who).length;

// ---- Word search ---------------------------------------------------------------------------------
// Words hidden in a grid (across, down, diagonally, forwards only) with
// random letters around them. { size, grid: [letters], words: [{ word, cells }] }.
const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1]];
export function wordSearch(list, size = 10, rand = Math.random) {
  const grid = Array(size * size).fill('');
  const placed = [];
  for (const raw of list) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, '');
    if (word.length < 3 || word.length > size) continue;
    let ok = false;
    for (let tries = 0; tries < 200 && !ok; tries++) {
      const [dr, dc] = DIRS[Math.floor(rand() * DIRS.length)];
      const r0 = Math.floor(rand() * size);
      const c0 = Math.floor(rand() * size);
      const cells = [];
      for (let k = 0; k < word.length; k++) {
        const r = r0 + dr * k;
        const c = c0 + dc * k;
        if (r < 0 || r >= size || c < 0 || c >= size) break;
        const i = r * size + c;
        if (grid[i] && grid[i] !== word[k]) break;
        cells.push(i);
      }
      if (cells.length !== word.length) continue;
      cells.forEach((i, k) => (grid[i] = word[k]));
      placed.push({ word: raw, cells });
      ok = true;
    }
  }
  const ABC = 'ABCDEFGHIJKLMNOPRSTUW';
  for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = ABC[Math.floor(rand() * ABC.length)];
  return { size, grid, words: placed };
}
// The cells on the straight line from a to b (a row, column or diagonal), or null.
export function lineCells(size, a, b) {
  const [r1, c1, r2, c2] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const n = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return null;
  return Array.from({ length: n + 1 }, (_, k) => (r1 + dr * k) * size + c1 + dc * k);
}
