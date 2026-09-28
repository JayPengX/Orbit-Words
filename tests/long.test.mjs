// The long games' rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rng } from '../public/lib/arcade.mjs';
import { sudokuMake, sudokuCount, sudokuSolved, sudokuConflicts, klondikeDeal, klondikeDraw, klondikeAuto, klondikeMove, klondikeFound, checkersStart, checkersMoves, checkersPlay, checkersAI, wordSearch, lineCells } from '../public/lib/long.mjs';

test('sudoku: a puzzle with one solution, and its solution solves it', () => {
  const { puzzle, solution } = sudokuMake(rng(7), 34);
  assert.equal(sudokuCount(puzzle), 1);
  assert.ok(puzzle.filter(Boolean).length <= 40);
  assert.ok(sudokuSolved(solution));
  const bad = [...solution];
  bad[0] = bad[1];
  assert.ok(sudokuConflicts(bad).size >= 2);
});

test('klondike: a fair deal, drawing, moving to the foundations', () => {
  const g = klondikeDeal(rng(3));
  assert.equal(g.stock.length, 24);
  assert.deepEqual(g.tableau.map(p => p.length), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(g.tableau.every(p => p.at(-1).up && p.slice(0, -1).every(c => !c.up)));
  let d = g;
  for (let i = 0; i < 24; i++) d = klondikeDraw(d);
  assert.equal(d.stock.length, 0);
  assert.equal(d.waste.length, 24);
  d = klondikeDraw(d);
  assert.equal(d.stock.length, 24);
  // An ace goes home.
  const ace = { stock: [], waste: [{ s: 1, r: 1, up: true }], found: [[], [], [], []], tableau: [[], [], [], [], [], [], []], moves: 0 };
  const moved = klondikeAuto(ace, { from: 'waste' });
  assert.equal(klondikeFound(moved), 1);
  // A red 7 on a black 8, not on a red one.
  const t = { stock: [], waste: [{ s: 1, r: 7, up: true }], found: [[], [], [], []], tableau: [[{ s: 0, r: 8, up: true }], [{ s: 2, r: 8, up: true }], [], [], [], [], []], moves: 0 };
  assert.ok(klondikeMove(t, { from: 'waste' }, { to: 'tab', col: 0 }));
  assert.equal(klondikeMove(t, { from: 'waste' }, { to: 'tab', col: 1 }), null);
});

test('checkers: opening moves, compulsory captures, multi-jumps, a move from Quadra', () => {
  const b = checkersStart();
  assert.equal(checkersMoves(b, 1).length, 7);
  // A lone piece of yours can jump two in a row.
  const j = Array(64).fill(0);
  j[5 * 8 + 0] = 1;
  j[4 * 8 + 1] = 2;
  j[2 * 8 + 3] = 2;
  j[7 * 8 + 7] = 2;
  const moves = checkersMoves(j, 1);
  assert.equal(moves.length, 1);
  assert.equal(moves[0].take.length, 2);
  const after = checkersPlay(j, moves[0]);
  assert.equal(after[4 * 8 + 1], 0);
  assert.equal(after[2 * 8 + 3], 0);
  assert.ok(checkersAI(b, 3, rng(1)));
});

test('word search: every word placed along a line', () => {
  const ws = wordSearch(['apple', 'river', 'music', 'garden'], 10, rng(5));
  assert.equal(ws.words.length, 4);
  for (const w of ws.words) {
    assert.equal(w.cells.map(i => ws.grid[i]).join(''), w.word.toUpperCase());
    assert.deepEqual(lineCells(10, w.cells[0], w.cells.at(-1)), w.cells);
  }
  assert.equal(lineCells(10, 0, 12), null);
});
