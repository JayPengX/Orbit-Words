// Words: the high-school English reference list (大考中心, 108 curriculum),
// levels 1 to 6, and how Quadra Hub teaches them. Pure functions (no DOM),
// so they're tested directly.
//
// Learning is meant to be hard, because what's hard to recall is what's
// remembered ("desirable difficulty"):
//   - Every wrong option is the one most likely to be picked by mistake: a
//     word spelt almost the same (adapt / adopt / adept), one that means
//     something close (能力 / 才能), the same part of speech and shape, and
//     above all a word this person has already mixed this one up with
//     (`distractors`). Two options are never both right.
//   - Each word is asked in a way it's ready for, and a round mixes every
//     way: recognising it (English to meaning, meaning to English, by ear)
//     and producing it (unscrambling, filling in its missing letters,
//     dictation), producing more the better it's known (`smartType`).
//   - A memory model per word (`grade`, FSRS, the scheduler Anki uses): how
//     long it stays remembered (stability, in days) and how hard it is for
//     this person (difficulty, 1 to 10). A word comes back when the chance
//     of still knowing it falls to 90%. Recalling it late in that time
//     counts more than recalling it fresh; writing it counts more than
//     picking it; a quick answer more than a slow one; missing it cuts its
//     stability and makes it harder for good.
//   - The list is long (some 3,000 words in levels 4 to 6 alone), so time
//     goes to what isn't known yet. A new word's first question in a round
//     is a check, a cloze that's hard to guess: right without hesitating, it's
//     known and out of the way for weeks after one question (`grade`'s
//     `check`); only what's missed is learnt. Words easy for this person come
//     back later (at 80% recall, not 90%), and a round leads with the weak
//     ones: missed, slipping, hard.
//   - A round leads with the weakest due words (the likeliest forgotten, and
//     the hard and slipping before the easy), adds the words they were
//     confused with, keeps confusable words apart, and adds new words only
//     while the words still being learnt are few enough to hold (`pickRound`).
//   - New words can be studied first, as cards (`toStudy`): a batch of them,
//     then a quiz on just that batch.
//   - The model fits this person (`personalFactor`): FSRS's numbers are an
//     average learner's. Every review a day or more after the last is kept
//     (the last 300), and the one factor on stability that best explains
//     what this person actually recalled is found (pulled to 1 while the
//     reviews are few). Someone who remembers better than average gets
//     longer gaps (less time on what they know), someone who forgets more,
//     shorter ones.
//   - Due dates are spread (`fuzz`): a few percent either way, the same on
//     every device, so words learnt together don't all fall due on one day.
//
// A word's progress (the payload's `w`): { s stability (days), D difficulty,
// b box (from s: 1 to 5), d due day, n answers, r right, t last answer (ms),
// m mastered once, l lapses, c [keys it was mistaken for, latest first] }.

export const LEVELS = [1, 2, 3, 4, 5, 6];
// Which study modes a person can choose; 'smart' picks per word.
export const MODES = ['smart', 'meaning', 'word', 'listen', 'letters', 'cloze', 'spell'];
// How many mix-ups are remembered per word.
const CONFUSED_KEEP = 4;
const DAY = 86_400_000;
const TPE = 8 * 3_600_000;

// A day number (days since 1970 in Taiwan), for due dates.
export const dayNum = (t = Date.now()) => Math.floor((t + TPE) / DAY);
export const keyOf = word => String(word || '').toLowerCase().replace(/’/g, "'").trim();

// The raw list ([word, pos, level, zh, phonetic]) as objects.
export function loadWords(rows) {
  return rows.map(([word, pos, level, zh, ph], i) => ({ i, word, key: keyOf(word), pos, level, zh, ph: ph || '' }));
}

// ---- The memory model --------------------------------------------------------------------
//
// FSRS-5's published defaults (open-spaced-repetition). R(t) = (1 + F·t/S)^C:
// the chance of recalling a word t days after its last answer; at t = S it's
// 90%, the retention asked for, so a word is due again S days on.
const FSRS = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5;
const FACTOR = 19 / 81;
export const retrievability = (days, s) => (1 + (FACTOR * Math.max(0, days)) / Math.max(0.01, s)) ** DECAY;
// How much a right answer is worth by how it was asked: recall from nothing
// (dictation) proves the most, picking from four the least.
export const TYPE_WEIGHT = { meaning: 0.55, word: 0.7, listen: 0.75, letters: 0.85, cloze: 0.95, spell: 1.1 };
// Grades, as FSRS has them: 1 missed, 2 right but slow, 3 right, 4 right and quick.
// Quick and slow, by how it was asked (ms): a choice, or per letter typed.
export function gradeOf(correct, type, ms, word = '') {
  if (!correct) return 1;
  if (!(ms > 0)) return 3;
  const choice = type === 'meaning' || type === 'word' || type === 'listen';
  const slow = choice ? 9_000 : 6_000 + 900 * word.length;
  const quick = choice ? 2_500 : 1_500 + 350 * word.length;
  return ms > slow ? 2 : ms < quick && !choice ? 4 : 3;
}
// How long until a word is asked again, by how hard it is for this person:
// a hard one when recall falls to 90% (its stability), a middling one at 85%,
// an easy one at 80%. An easy word costs little to forget now and then, and
// its slot goes to the weak ones. Days, from stability and difficulty.
const RETAIN = D => (D >= 7 ? 0.9 : D >= 4 ? 0.85 : 0.8);
export const intervalOf = (s, D = 5) => s * ((RETAIN(D) ** (1 / DECAY) - 1) / FACTOR);
// A word answered right at its check (first sight in a round, not just
// studied): known already. Stability by how it went: quick or steady, about
// three weeks (mastered); slow, a few days.
const CHECK_S = { 3: 21, 4: 30, 2: 4 };
// Stability to box: 1 (under 2 days) to 5 (a month or more); box 4 and up
// is mastered (remembered for more than ten days).
const BOX_FROM = [0, 2, 4, 10, 30];
export const MASTERED = 4;
export const boxOf = s => (s >= BOX_FROM[4] ? 5 : s >= BOX_FROM[3] ? 4 : s >= BOX_FROM[2] ? 3 : s >= BOX_FROM[1] ? 2 : 1);
const clampD = d => Math.min(10, Math.max(1, d));
const initD = g => clampD(FSRS[4] - Math.exp(FSRS[5] * (g - 1)) + 1);
const sOf = p => p.s || 0.1;
const dOf = p => p.D || 5;

export function stateOf(p) {
  if (!p || !p.b) return 'new';
  return p.b >= MASTERED ? 'mastered' : 'learning';
}

// One answer. `type`: how it was asked; `ms`: how long it took; `chose`:
// the word picked instead, on a wrong answer; `check`: a new word's first
// question in a round (not a batch just studied), where right means known.
// Returns the word's new progress and whether this answer mastered it for
// the first time.
export function grade(p, correct, { now = Date.now(), chose = null, type = 'meaning', ms = 0, word = '', check = false, factor = 1 } = {}) {
  const was = p || { b: 0, d: 0, n: 0, r: 0, t: 0 };
  const today = dayNum(now);
  const g = gradeOf(correct, type, ms, word);
  const weight = TYPE_WEIGHT[type] ?? 1;
  const next = { ...was, n: (was.n || 0) + 1, r: (was.r || 0) + (correct ? 1 : 0), t: now };
  let s;
  let D;
  if (!was.n && !was.b && check && correct) {
    // Known already: out of the way at once, easy for this person.
    s = CHECK_S[g];
    D = g === 2 ? initD(3) : clampD(initD(g) - 1);
  } else if (!was.n && !was.b) {
    // First sight: stability by the grade, and a right pick proves less.
    s = FSRS[g - 1] * (correct ? weight : 1);
    D = initD(g);
  } else {
    const s0 = sOf(was);
    const d0 = dOf(was);
    const elapsed = Math.max(0, (now - (was.t || now)) / DAY);
    D = clampD(FSRS[7] * initD(4) + (1 - FSRS[7]) * (d0 - FSRS[6] * (g - 3) * ((10 - d0) / 9)));
    if (elapsed < 1) {
      // Asked again the same day: a small change either way.
      s = s0 * Math.exp(FSRS[17] * (g - 3 + FSRS[18]));
      if (correct) s = Math.min(Math.max(s0, s), s0 + 1);
    } else {
      const R = retrievability(elapsed, s0);
      if (correct) {
        const gain = Math.exp(FSRS[8]) * (11 - D) * s0 ** -FSRS[9] * (Math.exp(FSRS[10] * (1 - R)) - 1) * (g === 2 ? FSRS[15] : 1) * (g === 4 ? FSRS[16] : 1);
        s = s0 * (1 + gain * weight);
      } else {
        s = Math.min(s0, FSRS[11] * D ** -FSRS[12] * ((s0 + 1) ** FSRS[13] - 1) * Math.exp(FSRS[14] * (1 - R)));
      }
    }
  }
  s = Math.max(0.1, Math.min(3650, s));
  next.s = Math.round(s * 100) / 100;
  next.D = Math.round(D * 100) / 100;
  next.b = boxOf(next.s);
  // Missed: due again today; else when recall falls to its mark (RETAIN).
  next.d = correct ? today + fuzz(Math.max(1, Math.round(intervalOf(next.s * factor, next.D))), keyOf(word), today) : today;
  if (!correct) {
    // Forgotten after it had been learnt: a lapse.
    if ((was.b || 0) >= 2) next.l = (was.l || 0) + 1;
    if (chose) next.c = [chose, ...(was.c || []).filter(k => k !== chose)].slice(0, CONFUSED_KEEP);
  }
  const firstMastery = next.b >= MASTERED && !was.m;
  if (firstMastery) next.m = 1;
  return { p: next, firstMastery };
}

// A gap of a few days or more moves by up to 5% (a day at least from a week
// on), by the word and the day: the same on every device.
export function fuzz(days, key = '', today = 0) {
  if (days < 3) return days;
  const spread = Math.max(days >= 7 ? 1 : 0, Math.round(days * 0.05));
  if (!spread) return days;
  return days + ((hash(`${key}:${today}`) % (2 * spread + 1)) - spread);
}

// ---- Fitting the model to this person ---------------------------------------------------
//
// `cal`: the latest reviews, [when (s), days since the last answer, stability
// then, 1 right / 0 missed]. Only answers a day or more after the last count
// (the same day says little about memory), and only words already learnt.
const CAL_KEEP = 300;
export function recordReview(cal = [], was, correct, now = Date.now()) {
  if (!was?.b || !was.t) return cal;
  const elapsed = (now - was.t) / DAY;
  if (elapsed < 1) return cal;
  return [...cal, [Math.round(now / 1000), Math.round(elapsed * 10) / 10, sOf(was), correct ? 1 : 0]].slice(-CAL_KEEP);
}
export function mergeCal(a = [], b = []) {
  const byT = new Map();
  for (const r of [...a, ...b]) if (Array.isArray(r) && r.length === 4) byT.set(r[0], r);
  return [...byT.values()].sort((x, y) => x[0] - y[0]).slice(-CAL_KEEP);
}
// The factor on stability (0.5 to 2.5) that best explains the reviews,
// pulled towards 1 as if CAL_PRIOR more reviews had gone as FSRS expects
// (on a log scale: n / (n + CAL_PRIOR) of the way); 1 under CAL_MIN reviews.
const CAL_MIN = 30;
const CAL_PRIOR = 40;
export function personalFactor(cal = []) {
  if (cal.length < CAL_MIN) return 1;
  let best = 1;
  let top = -Infinity;
  for (let m = 0.5; m <= 2.5001; m += 0.05) {
    let ll = 0;
    for (const [, t, st, ok] of cal) {
      const R = Math.min(0.999, Math.max(0.001, retrievability(t, st * m)));
      ll += ok ? Math.log(R) : Math.log(1 - R);
    }
    if (ll > top) (top = ll), (best = m);
  }
  const shrunk = Math.exp((Math.log(best) * cal.length) / (cal.length + CAL_PRIOR));
  return Math.round(shrunk * 100) / 100;
}

// "Too easy": a word the person already knows, mastered and out of the way
// for two months.
export function markKnown(p, now = Date.now()) {
  const was = p || { b: 0, d: 0, n: 0, r: 0, t: 0 };
  return { ...was, s: 60, D: 2, b: 5, d: dayNum(now) + 60, t: now, m: 1 };
}

// ---- How a word is asked -----------------------------------------------------------
//
// Smart mode, per word by its box: from recognising to producing it. Every
// box has several ways, and a round takes the one it has asked least so
// far, so one round goes through all of them. A word that keeps slipping
// (lapses) is asked as if it were further on: recognising it isn't the
// problem. A new word is never dictated (it was never heard).
export const SMART_TYPES = [
  ['meaning', 'word', 'listen', 'letters', 'cloze'],
  ['word', 'listen', 'letters', 'cloze', 'spell', 'meaning'],
  ['listen', 'letters', 'cloze', 'spell', 'word'],
  ['letters', 'cloze', 'spell', 'listen'],
  ['cloze', 'spell', 'letters'],
  ['spell', 'cloze']
];
export const isLong = word => Boolean(word) && (/\s/.test(word.word) || word.word.length > 11);
export function smartType(p, random = Math.random, word = null, used = {}) {
  const box = Math.min(5, (p?.b || 0) + Math.min(2, p?.l || 0));
  let kinds = SMART_TYPES[box];
  // A phrase or a long word is never unscrambled (too many tiles for a phone).
  if (isLong(word)) kinds = kinds.filter(k => k !== 'letters');
  let best = null;
  let low = Infinity;
  for (const k of kinds) {
    const score = (used[k] || 0) + random() * 0.9;
    if (score < low) (low = score), (best = k);
  }
  return best;
}

// ---- A round ---------------------------------------------------------------------------
//
// Due words first, the weakest first (lowest chance of recall now, a word
// missed last time lowest; a hard or slipping word ahead of an easy one). New words fill the rest while
// the words still being learnt (box 1 and 2) are few enough to hold: none
// past HOLD, fewer the closer it is, and fewer when much is due. A word due
// that was mixed up with another brings that one along, so the two are told
// apart side by side. Then the round is ordered so words that look alike
// aren't asked one after the other (interleaved, never blocked).
// `skip`: words not to bring in new (a studied batch waiting for its quiz).
const HOLD = 60;
export function pickRound(words, progress, { levels = LEVELS, size = 10, now = Date.now(), random = Math.random, skip = new Set(), factor = 1 } = {}) {
  const today = dayNum(now);
  const chosen = words.filter(w => levels.includes(w.level));
  const byKey = new Map(chosen.map(w => [w.key, w]));
  // The chance of recall a day on at least (so a word missed an hour ago,
  // its stability cut, still ranks as the likeliest forgotten).
  const recall = w => {
    const p = progress[w.key];
    return retrievability(Math.max(1, (now - (p.t || 0)) / DAY), sOf(p) * factor);
  };
  // Weakness: the chance it's gone, raised for a word that's hard for this
  // person or keeps slipping. Easy words that are due wait behind them.
  const weak = w => {
    const p = progress[w.key];
    return 1 - recall(w) + 0.04 * (dOf(p) - 5) + 0.06 * Math.min(3, p.l || 0);
  };
  const seen = chosen.filter(w => progress[w.key]?.b);
  const ranked = seen.map(w => [-weak(w) + random() * 0.01, w]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const due = ranked.filter(w => progress[w.key].d <= today);
  const learning = seen.filter(w => progress[w.key].b <= 2).length;
  // New words, a little shuffled within the next few.
  const window = toStudy(words, progress, { levels, n: 60, skip }).sort(() => random() - 0.5);
  // New words: up to 40% of a round, less as the words being learnt pile up
  // and when more than two rounds are due.
  const newShare = Math.max(0, (due.length > size * 2 ? 0.2 : 0.4) * (1 - learning / HOLD));
  let dueCount = Math.min(due.length, window.length ? Math.round(size * (1 - newShare)) : size);
  const newCount = Math.min(window.length, size - dueCount, learning >= HOLD ? 0 : size);
  dueCount = Math.min(due.length, size - newCount);
  const round = due.slice(0, dueCount);
  const inRound = new Set(round.map(w => w.key));
  // The words they were mixed up with, in up to half the places left.
  for (const w of due.slice(0, dueCount)) {
    const other = byKey.get(progress[w.key].c?.[0]);
    if (other && !inRound.has(other.key) && round.length < dueCount + Math.floor((size - dueCount) / 2)) {
      round.push(other);
      inRound.add(other.key);
    }
  }
  for (const w of window) if (round.length < dueCount + newCount && !inRound.has(w.key)) (round.push(w), inRound.add(w.key));
  // Nothing due and no room for new words: the ones slipping most.
  for (const w of ranked) if (round.length < Math.min(size, dueCount + newCount || size) && !inRound.has(w.key)) (round.push(w), inRound.add(w.key));
  return spread(round.sort(() => random() - 0.5));
}
// ---- Which new words this person is likely to get wrong --------------------------------
//
// With thousands of words, a new word worth asking is one this person
// probably doesn't know. Every answer so far says where that is: how often
// they miss at each level, at each part of speech and word length (as a
// ratio to their usual), and words spelt like ones they've missed lately
// (adapt after adopt). Levels start from a guess (harder, missed more) that
// answers soon outweigh. Returns w => the chance this word is missed.
const LEVEL_PRIOR = l => 0.12 + 0.1 * (l - 1);
const PRIOR_WEIGHT = 6;
const posOf = w => String(w.pos || '').split('/')[0] || '?';
const lenOf = w => (w.word.length <= 5 ? 0 : w.word.length <= 8 ? 1 : w.word.length <= 11 ? 2 : 3);
const missedEver = p => (p.n || 0) > (p.r || 0) || (p.l || 0) > 0;
// `alike: false`: without the look-alike check (quicker, for a first sort).
export function missChance(words, progress, { alike: lookAlikes = true } = {}) {
  const seen = words.filter(w => progress[w.key]?.n);
  const missed = seen.filter(w => missedEver(progress[w.key]));
  const overall = (missed.length + 1) / (seen.length + 2);
  const rate = key => {
    const all = new Map();
    for (const w of seen) {
      const k = key(w);
      const c = all.get(k) || { n: 0, m: 0 };
      c.n++;
      if (missedEver(progress[w.key])) c.m++;
      all.set(k, c);
    }
    return all;
  };
  const byLevel = rate(w => w.level);
  const byPos = rate(posOf);
  const byLen = rate(lenOf);
  // A group's own rate against the usual, pulled to 1 while it's seen little.
  const ratio = (map, k) => {
    const c = map.get(k);
    if (!c) return 1;
    return Math.min(2.5, Math.max(0.4, (c.m + overall * 4) / (c.n + 4) / overall));
  };
  // The latest misses (the look-alikes of these are the likeliest next).
  const recent = missed.sort((a, b) => (progress[b.key].t || 0) - (progress[a.key].t || 0)).slice(0, 40).map(w => w.key);
  return w => {
    const c = byLevel.get(w.level) || { n: 0, m: 0 };
    const level = (c.m + LEVEL_PRIOR(w.level) * PRIOR_WEIGHT) / (c.n + PRIOR_WEIGHT);
    let odds = (level / (1 - level)) * ratio(byPos, posOf(w)) * ratio(byLen, lenOf(w));
    if (lookAlikes && recent.length) {
      let alike = 0;
      for (const k of recent) if (k !== w.key) alike = Math.max(alike, lookAlike(w.key, k));
      if (alike >= ALIKE) odds *= 1 + 2.5 * alike;
    }
    return odds / (1 + odds);
  };
}

// The next `n` new words: the ones this person is likeliest to miss first
// (missChance), from the chosen levels; a fixed nudge per word keeps the
// order from being one group at a time. The same words each time until
// answers change the picture. `skip`: ones already taken.
export function toStudy(words, progress, { levels = LEVELS, n = 10, skip = new Set() } = {}) {
  const chosen = words.filter(w => levels.includes(w.level) && !progress[w.key]?.b && !skip.has(w.key));
  if (Object.keys(progress).length) {
    const chance = missChance(words, progress);
    // Cheap first (no look-alikes), then the closer look for the front of the line.
    const quick = missChance(words, progress, { alike: false });
    const nudge = w => ((hash(w.key) % 1000) / 1000) * 0.08;
    const front = chosen.map(w => [quick(w) + nudge(w), w]).sort((a, b) => b[0] - a[0]).slice(0, Math.max(n * 4, 200)).map(x => x[1]);
    return front.map(w => [chance(w) + nudge(w), w]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
  }
  const byLevel = [...new Set(chosen.map(w => w.level))].sort((a, b) => b - a).map(l => chosen.filter(w => w.level === l).sort((a, b) => hash(a.key) - hash(b.key)));
  const out = [];
  for (let i = 0; out.length < n && byLevel.some(list => i < list.length); i++) for (const list of byLevel) if (i < list.length && out.length < n) out.push(list[i]);
  return out;
}

// Reorders a list so no two neighbours look alike, where it can: each next
// word is one that doesn't look like the one before, the ones with the most
// look-alikes still left first (so they aren't all that's left at the end).
const ALIKE = 0.6;
function spread(list) {
  const left = [...list];
  const out = [];
  while (left.length) {
    const alikeLeft = w => left.filter(x => x !== w && lookAlike(x.key, w.key) >= ALIKE).length;
    let best = 0;
    let most = -1;
    left.forEach((w, i) => {
      if (out.length && lookAlike(out.at(-1).key, w.key) >= ALIKE) return;
      const n = alikeLeft(w);
      if (n > most) (most = n), (best = i);
    });
    out.push(...left.splice(best, 1));
  }
  return out;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---- The wrong options ----------------------------------------------------------------
//
// How alike two spellings are, 0 to 1: the edit distance against the
// longer one, more for a shared start and end and the same length.
export function editDistance(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}
const shared = (a, b, from) => {
  let n = 0;
  while (n < a.length && n < b.length && (from ? a[n] === b[n] : a[a.length - 1 - n] === b[b.length - 1 - n])) n++;
  return n;
};
export function lookAlike(a, b) {
  const len = Math.max(a.length, b.length) || 1;
  const s = 1 - editDistance(a, b) / len + Math.min(4, shared(a, b, true)) * 0.06 + Math.min(4, shared(a, b, false)) * 0.04 + (Math.abs(a.length - b.length) <= 1 ? 0.08 : 0);
  return Math.max(0, Math.min(1, s));
}

// A meaning's terms: the first two lines' terms, without the part-of-speech
// marks (「a. 能幹的、能夠的」 → 能幹的, 能夠的).
const zhCache = new Map();
function zhOf(zh) {
  let hit = zhCache.get(zh);
  if (hit) return hit;
  const lines = String(zh || '').split(/\r?\n/).slice(0, 2);
  const terms = new Set(lines.flatMap(l => l.replace(/^\s*[a-z]+\.\s*/i, '').replace(/\[[^\]]*\]|\([^)]*\)|（[^）]*）/g, '').split(/[、,，;；]/)).map(x => x.trim()).filter(Boolean));
  // The characters that carry meaning: not the grammar ones every term has.
  const chars = new Set([...terms].join('').replace(/[^一-鿿]/g, '').replace(/[的地得之使被把了著者等某一]/g, ''));
  hit = { terms, chars };
  zhCache.set(zh, hit);
  return hit;
}
// Two meanings with a term in common: both would be right.
export function sameMeaning(a, b) {
  const x = zhOf(a).terms;
  for (const t of zhOf(b).terms) if (x.has(t)) return true;
  return false;
}
// How close two meanings are, 0 to 1: the meaningful characters they share.
export function meaningAlike(a, b) {
  const x = zhOf(a).chars;
  const y = zhOf(b).chars;
  if (!x.size || !y.size) return 0;
  let both = 0;
  for (const c of x) if (y.has(c)) both++;
  return both / Math.min(x.size, y.size, 4);
}
const posSet = pos => new Set(String(pos || '').split('/').map(p => p.replace(/\.$/, '').trim()).filter(Boolean));
const samePos = (a, b) => {
  const x = posSet(a);
  const y = posSet(b);
  if (!x.size || !y.size) return 0;
  if ([...x][0] === [...y][0]) return 1;
  return [...x].some(p => y.has(p)) ? 0.5 : 0;
};
// How each kind of question weighs the ways to be confused: by meaning
// when the options are meanings, by spelling when they're spellings, by
// spelling and sound when the word is only heard.
const WEIGH = {
  meaning: { look: 1.2, mean: 1.8, pos: 0.8 },
  word: { look: 2, mean: 1.1, pos: 0.8 },
  listen: { look: 2.4, mean: 0.4, pos: 0.4 }
};
// The `n` words most likely to be picked instead of `word` in a question of
// `type`: the ones this person has mixed it up with first (`confused`), then
// the best by WEIGH, the same shape (a phrase with phrases), never one that
// means the same, and no two options that would read the same.
export function distractors(word, words, n = 3, { type = 'meaning', confused = [], random = Math.random } = {}) {
  const w = WEIGH[type] || WEIGH.meaning;
  const phrase = /\s/.test(word.word);
  const mistaken = new Map(confused.map((k, i) => [k, 3 - i * 0.5]));
  const scored = [];
  for (const c of words) {
    if (c.key === word.key || !c.zh || /\s/.test(c.word) !== phrase || sameMeaning(c.zh, word.zh)) continue;
    const look = lookAlike(c.key, word.key);
    const mean = meaningAlike(c.zh, word.zh);
    const s = w.look * look + w.mean * mean + w.pos * samePos(c.pos, word.pos) + 0.2 * (c.level === word.level) + (mistaken.get(c.key) || 0) + random() * 0.15;
    scored.push([s, c]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const out = [];
  for (const [, c] of scored) {
    if (out.length >= n) break;
    const shown = type === 'meaning' ? shortMeaning(c.zh) : c.key;
    if (out.some(o => (type === 'meaning' ? shortMeaning(o.zh) === shown || sameMeaning(o.zh, c.zh) : o.key === shown))) continue;
    out.push(c);
  }
  return out;
}

// The first meaning line, short (for choices).
export function shortMeaning(zh) {
  const line = String(zh || '').split('\n')[0];
  return line.replace(/^[a-z]+\.\s*/i, '').split('、').slice(0, 3).join('、');
}

function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The letters a cloze hides: about half, never the first, more the better
// the word is known; spaces and hyphens stay. A list of indexes.
export function clozeGaps(word, box = 2, random = Math.random) {
  const open = [...word].map((ch, i) => i).filter(i => i > 0 && /[a-z]/i.test(word[i]));
  const share = Math.min(0.75, 0.4 + 0.1 * Math.max(0, box - 2));
  const n = Math.max(1, Math.round(open.length * share));
  return shuffle(open, random).slice(0, n).sort((a, b) => a - b);
}

// A question: { type, word, choices (for choice types), letters (to
// unscramble), gaps (a cloze's hidden letters), answer }.
export function makeQuestion(word, type, words, { random = Math.random, p = null } = {}) {
  const confused = p?.c || [];
  if (type === 'meaning') {
    const options = shuffle([word, ...distractors(word, words, 3, { type, confused, random })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: shortMeaning(w.zh) })), answer: word.key };
  }
  if (type === 'word' || type === 'listen') {
    const options = shuffle([word, ...distractors(word, words, 3, { type, confused, random })], random);
    return { type, word, choices: options.map(w => ({ key: w.key, text: w.word })), answer: word.key };
  }
  if (type === 'letters') {
    const letters = [...word.word];
    let mixed = shuffle(letters, random);
    for (let i = 0; i < 4 && mixed.join('') === word.word && letters.length > 1; i++) mixed = shuffle(letters, random);
    return { type, word, letters: mixed, answer: word.key };
  }
  if (type === 'cloze') return { type, word, gaps: clozeGaps(word.word, p?.b || 2, random), answer: word.key };
  return { type, word, answer: word.key };
}
// A cloze as shown: the word with its gaps as underscores.
export const clozeText = (word, gaps) => [...word].map((ch, i) => (gaps.includes(i) ? '_' : ch)).join('');

// A typed answer against the word: case, curly quotes and spaces don't matter.
export const sameWord = (typed, word) => keyOf(typed).replace(/\s+/g, ' ') === keyOf(word).replace(/\s+/g, ' ');

// Where a typed answer goes wrong, letter by letter, for the feedback:
// [{ ch, ok }] over the right spelling.
export function spellDiff(typed, word) {
  const a = keyOf(typed);
  const b = String(word);
  return [...b].map((ch, i) => ({ ch, ok: a[i] === ch.toLowerCase() }));
}

// Counts per level: { 1: { total, seen, learning, mastered, due }, …, all: {…} }.
export function stats(words, progress, now = Date.now()) {
  const today = dayNum(now);
  const out = { all: { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 } };
  for (const l of LEVELS) out[l] = { total: 0, seen: 0, learning: 0, mastered: 0, due: 0 };
  for (const w of words) {
    const p = progress[w.key];
    for (const s of [out[w.level], out.all]) {
      s.total++;
      if (p?.b) {
        s.seen++;
        if (p.b >= MASTERED) s.mastered++;
        else s.learning++;
        if (p.d <= today) s.due++;
      }
    }
  }
  return out;
}
// The words that slip most: missed after being learnt, most often first.
export const hardest = (words, progress, n = 5) =>
  words.filter(w => progress[w.key]?.l > 0).sort((a, b) => progress[b.key].l - progress[a.key].l || progress[b.key].t - progress[a.key].t).slice(0, n);

// ---- Saved progress (this app's payload on the pass) ------------------------------
//
// { v: 3, w: { word: [box, due day, answers, right, last answer (s),
//   mastered once, lapses, [mistaken for], stability, difficulty] }, levels,
//   mode, days, study } (a row stops after the last part it has; `study`:
//   the studied batch waiting for its quiz)
// (`days`: answers per Taiwan day, practice.mjs). The app gzips it.
export function packProgress({ progress, levels, mode, days = {}, study = [], cal = [] }) {
  const w = {};
  for (const [k, p] of Object.entries(progress)) {
    const row = [p.b || 0, p.d || 0, p.n || 0, p.r || 0, Math.round((p.t || 0) / 1000), p.m ? 1 : 0, p.l || 0, p.c || [], p.s ?? null, p.D ?? null];
    while (row.length > 6 && (row.at(-1) === null || row.at(-1) === 0 || (Array.isArray(row.at(-1)) && !row.at(-1).length))) row.pop();
    w[k] = row;
  }
  return { v: 3, w, levels, mode, days, study, cal };
}
export function unpackProgress(obj) {
  if (obj?.v !== 3 || !obj.w) return null;
  const progress = {};
  for (const [k, a] of Object.entries(obj.w)) progress[k] = { b: a[0], d: a[1], n: a[2], r: a[3], t: a[4] * 1000, ...(a[5] ? { m: 1 } : {}), ...(a[6] ? { l: a[6] } : {}), ...(Array.isArray(a[7]) && a[7].length ? { c: a[7] } : {}), ...(a[8] > 0 ? { s: a[8] } : {}), ...(a[9] > 0 ? { D: a[9] } : {}) };
  return {
    progress,
    levels: Array.isArray(obj.levels) && obj.levels.some(l => LEVELS.includes(l)) ? obj.levels.filter(l => LEVELS.includes(l)) : null,
    mode: MODES.includes(obj.mode) ? obj.mode : null,
    days: obj.days && typeof obj.days === 'object' ? obj.days : {},
    study: Array.isArray(obj.study) ? obj.study.filter(k => typeof k === 'string') : [],
    cal: Array.isArray(obj.cal) ? obj.cal.filter(r => Array.isArray(r) && r.length === 4 && r.every(Number.isFinite)) : []
  };
}

// Two copies of the progress (two devices): per word, the one answered last.
export function mergeProgress(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, p] of Object.entries(b)) {
    const q = out[k];
    if (!q || (p.t || 0) > (q.t || 0)) out[k] = q?.m && !p.m ? { ...p, m: 1 } : p;
    else if (p.m && !q.m) out[k] = { ...q, m: 1 };
  }
  return out;
}

// The word of the day: the same for everyone on a Taiwan day, from levels 3-6
// (a single word, not a phrase), a different one each day.
export function wordOfDay(words, now = Date.now()) {
  const pool = words.filter(w => w.level >= 3 && /^[a-z]+$/.test(w.word) && w.zh);
  if (!pool.length) return null;
  const n = dayNum(now);
  // A fixed stride coprime with the pool size walks the list without repeats.
  let stride = 7919;
  while (gcd(stride, pool.length) !== 1) stride++;
  return pool[(n * stride) % pool.length];
}
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
