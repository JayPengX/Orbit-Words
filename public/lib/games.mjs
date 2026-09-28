// Rewards' mini games: small games that pay for effort, never luck. Every
// round takes about a minute and pays about ECONOMY.gamesPerMinute for
// typical play (better players up to about 3-4 times), all of them together
// at most ECONOMY.gamesDailyCap a Taiwan day (earn.mjs).
//
//   derby      home run derby: swing as the pitch reaches the plate
//   freethrow  free throws: stop the arrow in the green
//   pairs      word pairs: match each English word with its meaning
//   merge      2048: slide and merge the tiles
//
// The derby and free throws came from Quadra Play's arcade; their difficulty
// follows the player (adapt), so a streak is always earned at the edge of
// your skill.
import { ECONOMY } from './quadra.mjs';

export const GAMES = ['pairs', 'merge', 'derby', 'freethrow'];
export const ICON = { derby: '⚾', freethrow: '🏀', pairs: '🃏', merge: '🔢' };
// Taiwan's minimum hourly wage in 2026 (NT$).
export const MIN_WAGE = 196;
// Pay points are scaled to NT$ so a typical minute pays ECONOMY.gamesPerMinute.
export const PAY_SCALE = ECONOMY.gamesPerMinute / 25;

// Streaks: `every` right in a row adds `bonus`; a `ladder` adds ladder[0]
// for the 2nd in a row, ladder[1] for each after; `penalty` per mistake.
export const STREAK = {
  derby: { ladder: [3, 6], penalty: 1 },
  freethrow: { ladder: [3, 6], penalty: 1 },
  pairs: { every: 3, bonus: 3, penalty: 1 },
  merge: { every: 4, bonus: 1, penalty: 0 }
};

export const ADAPT = { start: 0.15, up: 0.1, upBest: 0.14, down: 0.16 };
export function adapt(level, result) {
  const step = result === 'miss' ? -ADAPT.down : result === 'hr' || result === 'swish' ? ADAPT.upBest : ADAPT.up;
  return Math.min(1, Math.max(0, level + step));
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
  merge: { ok: () => MERGE.pay }
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

// ---- Pay facts for the rules lines -------------------------------------------------------
export const PACE = {
  derby: { seconds: 60, events: ['hr', 'hit', 'miss', 'hit', 'hit', 'hr', 'miss', 'hit', 'miss', 'hr', 'hit', 'miss', 'hit', 'hit', 'hr', 'miss', 'hit', 'miss'] },
  freethrow: { seconds: 60, events: ['swish', 'make', 'miss', 'make', 'make', 'swish', 'miss', 'make', 'miss', 'swish', 'make', 'miss', 'make', 'make', 'swish', 'miss', 'make', 'miss'] }
};
export function bestRound(game) {
  if (game === 'derby') return scoreRound('derby', Array(DERBY.pitches).fill('hr')).total;
  if (game === 'freethrow') return scoreRound('freethrow', Array(FREE_THROW.shots).fill('swish')).total;
  if (game === 'pairs') return scoreRound('pairs', Array(PAIRS.boards * PAIRS.size).fill('ok')).total;
  return 60;
}
export const wageMinutes = paid => (paid / MIN_WAGE) * 60;
