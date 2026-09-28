import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../public/lib/arcade.mjs';
import { existsSync } from 'node:fs';

test('every arcade game has a screen, a unique id and a sane pay', () => {
  assert.ok(A.ARCADE.length >= 30);
  assert.equal(new Set(A.ARCADE.map(g => g.id)).size, A.ARCADE.length);
  for (const g of A.ARCADE) {
    assert.ok(existsSync(new URL(`../public/arcade/${g.id}.js`, import.meta.url)), g.id);
    assert.ok(g.max > 0 && g.max <= 60 && g.rate > 0, g.id);
    assert.equal(A.arcadePay(g.id, 1e6), g.max);
    assert.equal(A.arcadePay(g.id, 0), 0);
  }
});

test('minesweeper: the first tap is safe, a 0 opens its neighbours', () => {
  const rand = A.rng(1);
  const b = A.minesBoard(8, 8, 10, 27, rand);
  assert.equal(b.mine.filter(Boolean).length, 10);
  assert.ok(!b.mine[27] && b.count[27] === 0);
  assert.ok(A.minesOpen(b, new Set(), 27).size > 1);
});

test('lights out and the sliding puzzle are always solvable from their start', () => {
  const g = A.lightsPuzzle(5, 3, A.rng(2));
  assert.ok(g.some(Boolean));
  const t = A.slidePuzzle(3, 20, A.rng(3));
  assert.ok(!A.slideSolved(t));
  assert.equal(A.slideSolved([1, 2, 3, 4, 5, 6, 7, 8, 0]), true);
});

test('code breaker scores exact and near colours', () => {
  assert.deepEqual(A.codeScore([0, 1, 2, 3], [0, 2, 1, 5]), { exact: 1, near: 2 });
  assert.deepEqual(A.codeScore([1, 1, 2, 2], [1, 2, 1, 1]), { exact: 1, near: 2 });
});

test('nonogram clues, flood fill, hanoi, queens', () => {
  assert.deepEqual(A.nonoClues([1, 1, 0, 1, 0]), [2, 1]);
  assert.deepEqual(A.nonoClues([0, 0, 0]), [0]);
  const sol = A.nonoPuzzle(5, A.rng(4));
  assert.ok(A.nonoSolved(sol, sol, 5));
  const f = A.floodFill([0, 0, 1, 2], 2, 1);
  assert.deepEqual(f, [1, 1, 1, 2]);
  let pegs = A.hanoiStart(3);
  assert.equal(A.hanoiMove(pegs, 1, 2), null);
  pegs = A.hanoiMove(pegs, 0, 2);
  assert.equal(A.hanoiMove(pegs, 0, 2), null);
  assert.ok(A.queensDone([1, 3, 5, 0, 2, 4]));
  assert.equal(A.queensDone([0, 1, 2, 3, 4, 5]), false);
});

test('every sokoban level can be solved', () => {
  const key = s => `${s.player}:${[...s.boxes].sort((a, b) => a - b)}`;
  for (const level of A.SOKOBAN) {
    const start = A.sokoParse(level);
    assert.equal(start.boxes.size, start.goals.size);
    const q = [start];
    const seen = new Set([key(start)]);
    let solved = false;
    for (let i = 0; i < q.length && i < 200_000 && !solved; i++)
      for (const d of ['up', 'down', 'left', 'right']) {
        const n = A.sokoMove(q[i], d);
        if (A.sokoDone(n)) solved = true;
        if (!seen.has(key(n))) (seen.add(key(n)), q.push(n));
      }
    assert.ok(solved);
  }
});

test('a maze connects every cell', () => {
  const m = A.makeMaze(8, 8, A.rng(5));
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const i = stack.pop();
    for (const d of ['up', 'down', 'left', 'right']) {
      const j = A.mazeStep(m, i, d);
      if (!seen.has(j)) (seen.add(j), stack.push(j));
    }
  }
  assert.equal(seen.size, 64);
});

test('falling blocks clear full rows', () => {
  const w = 4;
  const board = [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1];
  const r = A.blocksClear(board, w, 3);
  assert.equal(r.lines, 1);
  assert.deepEqual(r.board, [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1]);
  assert.ok(!A.blocksFit(board, w, 3, A.PIECES.O, 0, 1));
});

test('the board-game players take a win and block a loss', () => {
  assert.equal(A.tttBest(['O', 'O', '', 'X', 'X', '', '', '', ''], 'O'), 2);
  assert.equal(A.tttBest(['X', 'X', '', 'O', '', '', '', '', ''], 'O'), 2);
  let b = Array(42).fill(0);
  for (const c of [0, 1, 2]) b = A.c4Drop(b, c, 1);
  assert.equal(A.c4Best(b, 2, 3), 3);
  const rv = A.rvStart(6);
  assert.equal(A.rvMoves(rv, 6, 1).length, 4);
  assert.equal(A.nimBest([1, 2, 3]).take >= 1, true);
  assert.deepEqual(A.nimBest([3, 4]), { heap: 1, take: 1 });
  const g = Array(81).fill(0);
  for (const i of [40, 41, 42, 43]) g[i] = 1;
  assert.ok([39, 44].includes(A.gmBest(g, 9, 2)));
});

test('brain games: sums are right, choices hold the answer', () => {
  const rand = A.rng(6);
  for (let i = 0; i < 50; i++) {
    const q = A.mathQuestion(i / 50, rand);
    const [a, op, b] = q.text.split(' ');
    const v = { '+': +a + +b, '−': a - b, '×': a * b, '÷': a / b }[op];
    assert.equal(v, q.answer);
    assert.ok(A.mathChoices(q.answer, rand).includes(q.answer));
  }
  assert.equal(A.reactionPay(250), 31);
});

test('every game has how-to-play text in both languages', async () => {
  const { ALL_GAMES } = await import('../public/lib/games.mjs');
  for (const g of ALL_GAMES) assert.ok(A.HOW[g]?.[0] && A.HOW[g]?.[1], g);
});
