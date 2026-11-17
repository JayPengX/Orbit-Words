// A round's question timed only while it's on screen: a word known at a
// glance, answered on coming back from a minute in another app, was graded
// slow (學習中, back in 4 days, not out of the way for weeks; proven 11-18).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resumePaper } from '../public/lib/contest.mjs';
import { grade, stateOf } from '../public/lib/words.mjs';

test("a round's question doesn't count the time out of sight", () => {
  const src = readFileSync(new URL('../public/views/session.js', import.meta.url), 'utf8');
  const on = src.slice(src.indexOf("document.addEventListener('visibilitychange'"));
  assert.ok(on.length < src.length, 'session.js listens for the app going out of sight');
  const body = on.slice(0, on.indexOf('});'));
  assert.match(body, /kind !== 'round'/);
  assert.match(body, /r\.awayAt \?\?= Date\.now\(\)/, 'away: when it went');
  assert.match(body, /resumePaper\(r\)/, 'back: the question shown that much later');
  // The question shown at 0, away from 1 s to 61 s, answered at 62 s: 2 s on it.
  const r = { kind: 'round', shownAt: 0, awayAt: 1_000 };
  resumePaper(r, 61_000);
  const ms = 62_000 - r.shownAt;
  assert.equal(ms, 2_000);
  const known = grade(null, true, { type: 'meaning', ms, check: true, now: 62_000 });
  assert.equal(stateOf(known.p), 'mastered', 'known at a glance: out of the way');
  const slow = grade(null, true, { type: 'meaning', ms: 62_000, check: true, now: 62_000 });
  assert.equal(stateOf(slow.p), 'learning', '(what the minute away made it)');
});
