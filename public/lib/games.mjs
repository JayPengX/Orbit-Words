// Rewards' mini games: small games that give points (XP) for effort, never
// luck. Every round takes about a minute and gives about
// ECONOMY.gamesPerMinute for typical play (better players up to about 3-4
// times). Points only: Rewards pays no money (earn.mjs).
//
//   derby      home run derby: swing as the pitch reaches the plate
//   freethrow  free throws: stop the arrow in the green
//   pairs      word pairs: match each English word with its meaning
//   merge      2048: slide and merge the tiles
//   speed      speed match: a word's meaning out of four, against the clock
//   hangman    guess the word from its meaning, a letter at a time
//   simon      colour memory: repeat a growing sequence
//
// The derby and free throws came from Quadra Play's arcade; their difficulty
// follows the player (adapt), so a streak is always earned at the edge of
// your skill.
import { ECONOMY } from './quadra.mjs';
import { ARCADE_BY_ID, ARCADE } from './arcade.mjs';

export const GAMES = ['pairs', 'speed', 'hangman', 'merge', 'simon', 'derby', 'freethrow'];
export const ICON = { derby: '⚾', freethrow: '🏀', pairs: '🃏', merge: '🔢', speed: '⚡', hangman: '🔤', simon: '🎨', sudoku: '🧮' };
// Every game: these eight, then the arcade (arcade.mjs), and each one's
// category for the games list.
export const ALL_GAMES = [...GAMES, ...ARCADE.map(g => g.id)];
const CLASSIC_CAT = { pairs: 'words', speed: 'words', hangman: 'words', merge: 'puzzle', simon: 'brain', derby: 'action', freethrow: 'action' };
// A game's icon, name, line and category, in `t`'s language (t: i18n's).
export function gameInfo(id, t, lang = 'zh') {
  const a = ARCADE_BY_ID[id];
  if (a) return { id, icon: a.icon, name: lang === 'en' ? a.en : a.zh, kind: lang === 'en' ? a.kindEn : a.kindZh, cat: a.cat, long: a.long, arcade: true };
  return { id, icon: ICON[id] || '🎮', name: t(`game_${id}`), kind: t(`gameKind_${id}`), cat: CLASSIC_CAT[id] || 'puzzle', arcade: false };
}
// A game's raw points are scaled so a typical minute gives ECONOMY.gamesPerMinute XP.
export const PAY_SCALE = ECONOMY.gamesPerMinute / 25;

// Streaks: `every` right in a row adds `bonus`; a `ladder` adds ladder[0]
// for the 2nd in a row, ladder[1] for each after; `penalty` per mistake.
export const STREAK = {
  // The derby and free throws play like the arcade games: a miss costs
  // nothing, it just ends the run.
  derby: { ladder: [3, 6], penalty: 0 },
  freethrow: { ladder: [3, 6], penalty: 0 },
  pairs: { every: 3, bonus: 3, penalty: 1 },
  merge: { every: 4, bonus: 1, penalty: 0 },
  speed: { every: 5, bonus: 2, penalty: 1 },
  hangman: { every: 3, bonus: 2, penalty: 1 },
  simon: { every: 4, bonus: 2, penalty: 0 },
  sudoku: { every: 3, bonus: 3, penalty: 1 }
};

// Gentle: it starts easy, climbs a little with each hit and never past `max`
// (the old top speed was too hard to enjoy).
export const ADAPT = { start: 0, up: 0.06, upBest: 0.08, down: 0.12, max: 0.75 };
export function adapt(level, result) {
  const step = result === 'miss' ? -ADAPT.down : result === 'hr' || result === 'swish' ? ADAPT.upBest : ADAPT.up;
  return Math.min(ADAPT.max, Math.max(0, level + step));
}

// A round's running score: good(pay) for a success (returns its streak
// bonus), bad() for a mistake (returns what it cost). Never under 0.
export function scorer(game) {
  const rule = STREAK[game];
  let sum = 0;
  let run = 0;
  let bonus = 0;
  let penalty = 0;
  return {
    good(pay) {
      sum += pay * PAY_SCALE;
      run++;
      const extra = (rule.ladder ? (run === 1 ? 0 : rule.ladder[Math.min(run - 2, rule.ladder.length - 1)]) : run % rule.every === 0 ? rule.bonus : 0) * PAY_SCALE;
      sum += extra;
      bonus += extra;
      return extra;
    },
    bad() {
      run = 0;
      const cost = rule.penalty * PAY_SCALE;
      sum -= cost;
      penalty += cost;
      return cost;
    },
    get total() {
      return Math.max(0, Math.round(sum));
    },
    get run() {
      return run;
    },
    get bonus() {
      return bonus;
    },
    get penalty() {
      return penalty;
    }
  };
}

const EVENT_PAY = {
  derby: { hr: () => DERBY.pay.hr, hit: () => DERBY.pay.hit },
  freethrow: { swish: () => FREE_THROW.pay.swish, make: () => FREE_THROW.pay.make },
  pairs: { ok: () => PAIRS.pay },
  merge: { ok: () => MERGE.pay },
  speed: { ok: () => SPEED.pay },
  hangman: { ok: () => HANGMAN.pay },
  sudoku: { ok: () => SUDOKU.pay }
};
export function scoreRound(game, events) {
  const score = scorer(game);
  for (const e of events) {
    const pay = EVENT_PAY[game][e];
    if (pay) score.good(pay());
    else score.bad();
  }
  return score;
}

// ---- Home run derby -------------------------------------------------------------------
export const DERBY = { pitches: 18, plate: 0.83, hr: 0.018, hit: 0.05, pay: { hr: 1, hit: 0.5 } };
export function pitchPlan(level, random = Math.random) {
  const base = 1000 - 540 * level;
  return { ms: Math.round(base * (0.85 + random() * 0.3)), changeUp: level >= 0.25 && random() < 0.35, breakX: level >= 0.5 ? random() * 2 - 1 : 0 };
}
export function ballAt(plan, elapsed) {
  const x = elapsed / plan.ms;
  if (!plan.changeUp || x <= 0.5) return x;
  return 0.5 + (x - 0.5) * 0.6;
}
export function swingResult(position) {
  const off = Math.abs(position - DERBY.plate);
  return off <= DERBY.hr ? 'hr' : off <= DERBY.hit ? 'hit' : 'miss';
}

// ---- Free throws ----------------------------------------------------------------------
export const FREE_THROW = { shots: 18, pay: { swish: 1, make: 0.5 } };
export function shotPlan(level) {
  return { period: 1300 - 630 * level, zone: 0.13 - 0.072 * level };
}
export function markerAt(plan, elapsed) {
  const x = (elapsed % plan.period) / plan.period;
  return (1 - Math.cos(2 * Math.PI * x)) / 2;
}
export function shotResult(position, plan) {
  const off = Math.abs(position - 0.5);
  return off <= plan.zone / 4 ? 'swish' : off <= plan.zone / 2 ? 'make' : 'miss';
}

// ---- Word pairs -----------------------------------------------------------------------
//
// Three boards of six words: each English word face down beside its meaning.
// Turn two cards; a word and its own meaning stay open. Turning a pair
// that doesn't match costs a little only after the first look at both cards
// (remembering is the game), and every right pair pays.
export const PAIRS = { boards: 3, size: 6, pay: 1.6 };
export function pairsBoard(words, random = Math.random) {
  const cards = words.flatMap(w => [
    { id: `${w.key}:w`, key: w.key, face: 'word', text: w.word },
    { id: `${w.key}:m`, key: w.key, face: 'meaning', text: w.meaning }
  ]);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
// Two turned cards: 'match', 'miss' (both seen before, so it's a mistake)
// or 'look' (a first look at one of them: no cost).
export function pairResult(a, b, seen) {
  if (a.key === b.key && a.face !== b.face) return 'match';
  return seen.has(a.id) && seen.has(b.id) ? 'miss' : 'look';
}

// ---- 2048 -----------------------------------------------------------------------------
//
// Slide the tiles; two equal tiles merge into their sum. A round ends when
// no move is left or after MERGE.seconds. Every merge of 16 or more pays
// (a 16 a little, bigger merges more: log2(value) - 3 points), and each 4
// such merges in a row of moves adds a bonus.
export const MERGE = { size: 4, seconds: 90, pay: 0.6 };
export function mergeBoard(random = Math.random) {
  let b = Array(MERGE.size * MERGE.size).fill(0);
  b = spawn(b, random);
  return spawn(b, random);
}
export function spawn(board, random = Math.random) {
  const empty = board.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  if (!empty.length) return board;
  const out = [...board];
  out[empty[Math.floor(random() * empty.length)]] = random() < 0.9 ? 2 : 4;
  return out;
}
// One line slid toward its start: { line, merged: [values made] }.
function slideLine(line) {
  const tiles = line.filter(Boolean);
  const out = [];
  const merged = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] * 2);
      merged.push(tiles[i] * 2);
      i++;
    } else out.push(tiles[i]);
  }
  while (out.length < line.length) out.push(0);
  return { line: out, merged };
}
// A move ('left' | 'right' | 'up' | 'down'): { board, moved, merged }.
export function move(board, dir) {
  const n = MERGE.size;
  const out = [...board];
  const merged = [];
  for (let r = 0; r < n; r++) {
    const idx = Array.from({ length: n }, (_, c) => (dir === 'left' ? r * n + c : dir === 'right' ? r * n + (n - 1 - c) : dir === 'up' ? c * n + r : (n - 1 - c) * n + r));
    const res = slideLine(idx.map(i => board[i]));
    idx.forEach((i, k) => (out[i] = res.line[k]));
    merged.push(...res.merged);
  }
  return { board: out, moved: out.some((v, i) => v !== board[i]), merged };
}
export const canMove = board => ['left', 'right', 'up', 'down'].some(d => move(board, d).moved);
// Pay points for a move's merges.
export const mergePoints = merged => merged.filter(v => v >= 16).reduce((s, v) => s + Math.log2(v) - 3, 0);

export function bestRound(game) {
  if (ARCADE_BY_ID[game]) return ARCADE_BY_ID[game].max;
  if (game === 'derby') return scoreRound('derby', Array(DERBY.pitches).fill('hr')).total;
  if (game === 'freethrow') return scoreRound('freethrow', Array(FREE_THROW.shots).fill('swish')).total;
  if (game === 'pairs') return scoreRound('pairs', Array(PAIRS.boards * PAIRS.size).fill('ok')).total;
  if (game === 'speed') return scoreRound('speed', Array(SPEED.best).fill('ok')).total;
  if (game === 'hangman') {
    const score = scorer('hangman');
    for (let i = 0; i < HANGMAN.words; i++) score.good(hangmanPay(HANGMAN.lives));
    return score.total;
  }
  if (game === 'simon') {
    const score = scorer('simon');
    for (let n = 1; n <= SIMON.max; n++) score.good(simonPay(n));
    return score.total;
  }
  if (game === 'sudoku') {
    const score = scorer('sudoku');
    for (let i = 0; i < SUDOKU.puzzles; i++) score.good(SUDOKU.pay);
    return score.total;
  }
  return 60;
}

// ---- Speed match ----------------------------------------------------------------------
//
// A word and four meanings; pick the right one before the clock runs out.
// Every right answer pays, a wrong one costs a little (so guessing doesn't).
export const SPEED = { seconds: 60, pay: 1.2, choices: 4, best: 40 };
export function speedQuestion(words, random = Math.random, avoid = new Set()) {
  const pool = words.filter(w => w.meaning && !avoid.has(w.key));
  if (pool.length < SPEED.choices) return null;
  const answer = pool[Math.floor(random() * pool.length)];
  const choices = [answer];
  const meanings = new Set([answer.meaning]);
  for (let tries = 0; choices.length < SPEED.choices && tries < 200; tries++) {
    const w = words[Math.floor(random() * words.length)];
    if (!w.meaning || meanings.has(w.meaning)) continue;
    meanings.add(w.meaning);
    choices.push(w);
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { word: answer, choices };
}

// ---- Hangman --------------------------------------------------------------------------
//
// Five words a round, each shown by its meaning and its length; guess the
// letters. A solved word pays, more with lives left; a lost one costs.
export const HANGMAN = { words: 5, lives: 6, pay: 3.5, perLife: 0.5, min: 4, max: 9 };
export const hangmanPay = livesLeft => HANGMAN.pay + HANGMAN.perLife * livesLeft;
export const hangmanWords = words => words.filter(w => w.meaning && /^[a-z]+$/.test(w.word) && w.word.length >= HANGMAN.min && w.word.length <= HANGMAN.max);
// One guess: { state, hit } where state is { word, guessed: Set, lives }.
export function guessLetter(state, letter) {
  const ch = letter.toLowerCase();
  if (!/^[a-z]$/.test(ch) || state.guessed.has(ch) || hangmanOver(state)) return { state, hit: null };
  const guessed = new Set(state.guessed).add(ch);
  const hit = state.word.includes(ch);
  return { state: { ...state, guessed, lives: hit ? state.lives : state.lives - 1 }, hit };
}
export const hangmanSolved = state => [...state.word].every(ch => state.guessed.has(ch));
export const hangmanOver = state => state.lives <= 0 || hangmanSolved(state);
export const hangmanMask = state => [...state.word].map(ch => (state.guessed.has(ch) ? ch : '_'));

// ---- Colour memory --------------------------------------------------------------------
//
// Four coloured pads light up in a sequence; repeat it. Every step cleared
// adds one to the sequence and pays by its length; a slip ends the round.
export const SIMON = { pads: 4, max: 14, pay: 0.45 };
export const simonPay = n => SIMON.pay * n;
export function simonSequence(n, random = Math.random) {
  return Array.from({ length: n }, () => Math.floor(random() * SIMON.pads));
}

// ---- Mini sudoku ----------------------------------------------------------------------
//
// Three 4 x 4 puzzles (each row, column and 2 x 2 box holds 1-4 once), each
// with exactly one answer. A solved puzzle pays; a wrong number costs.
export const SUDOKU = { puzzles: 3, seconds: 150, pay: 8, givens: 6 };
const BASE_GRID = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
// A full grid: the base with its digits, rows within bands, bands, columns
// within stacks and stacks shuffled, and maybe transposed.
export function sudokuSolution(random = Math.random) {
  const digits = shuffled([1, 2, 3, 4], random);
  const bands = shuffled([0, 1], random);
  const stacks = shuffled([0, 1], random);
  const rows = bands.flatMap(b => shuffled([0, 1], random).map(r => b * 2 + r));
  const cols = stacks.flatMap(st => shuffled([0, 1], random).map(c => st * 2 + c));
  const flip = random() < 0.5;
  const out = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const [rr, cc] = flip ? [cols[c], rows[r]] : [rows[r], cols[c]];
      out.push(digits[BASE_GRID[rr * 4 + cc] - 1]);
    }
  return out;
}
export function sudokuOk(grid, i, v) {
  const r = Math.floor(i / 4);
  const c = i % 4;
  const br = r - (r % 2);
  const bc = c - (c % 2);
  for (let k = 0; k < 4; k++) {
    if (k !== c && grid[r * 4 + k] === v) return false;
    if (k !== r && grid[k * 4 + c] === v) return false;
  }
  for (let rr = br; rr < br + 2; rr++) for (let cc = bc; cc < bc + 2; cc++) if (rr * 4 + cc !== i && grid[rr * 4 + cc] === v) return false;
  return true;
}
// How many answers a puzzle has (stops counting at `limit`).
export function sudokuCount(grid, limit = 2) {
  const i = grid.indexOf(0);
  if (i < 0) return 1;
  let n = 0;
  for (let v = 1; v <= 4 && n < limit; v++) {
    if (!sudokuOk(grid, i, v)) continue;
    const next = [...grid];
    next[i] = v;
    n += sudokuCount(next, limit - n);
  }
  return n;
}
// A puzzle: { puzzle, solution }, cells emptied while the answer stays unique.
export function sudokuPuzzle(random = Math.random, givens = SUDOKU.givens) {
  const solution = sudokuSolution(random);
  const puzzle = [...solution];
  for (const i of shuffled([...Array(16).keys()], random)) {
    if (puzzle.filter(Boolean).length <= givens) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (sudokuCount(puzzle) !== 1) puzzle[i] = keep;
  }
  return { puzzle, solution };
}

// ---- The daily challenge ----------------------------------------------------------------
//
// One game a day (the same for everyone), its first paid round adding a
// bonus that grows with the days in a row played; paid as a game, so inside
// the games' daily cap.
export const DAILY = { base: 5, perDay: 3, maxDays: 5 };
export function dailyGame(day) {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ALL_GAMES[h % ALL_GAMES.length];
}
export const dailyBonus = streak => DAILY.base + DAILY.perDay * Math.min(Math.max(0, streak), DAILY.maxDays);

// ---- Your bests ------------------------------------------------------------------------
//
// The best round per game ({ game: { v, t } }, v in pay points before the
// day's cap): kept in the wallet's settings, merged by the higher.
export function mergeBests(a = {}, b = {}) {
  const out = { ...a };
  for (const [g, x] of Object.entries(b || {})) if (x && (!out[g] || x.v > out[g].v)) out[g] = x;
  return out;
}
