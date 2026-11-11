import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Orbit's own look is the app's only look (Orbit-Core docs/DESIGN.md §11):
// the page says so before anything draws, its stylesheet after the app's own.
const read = f => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');

test('the look is always on: data-look="native" on <html>, look.css after styles.css', () => {
  const html = read('index.html');
  assert.match(html, /<html[^>]*data-look="native"/);
  const app = html.indexOf('./styles.css');
  assert.ok(app > 0 && html.indexOf('./look.css') > app);
});

// Jay 2026-11-03: a question on the home is "start playing", not a home. 今天
// shows the day (the goal, the streak, the word of the day, where to pick up)
// and one 開始 button; a round starts only on a tap.
test('今天 never starts a round by itself: no question drawn on the home, 開始 the one way in', () => {
  const src = read('views/today.js');
  const body = src.slice(src.indexOf('export function renderToday'), src.indexOf('\n}\n', src.indexOf('export function renderToday')));
  assert.doesNotMatch(src, /questionCard|primeRound|buildQuestion/);
  assert.doesNotMatch(body, /startRound\(/);
  assert.match(src, /heroBtn\([^;]*\(\) => startRound\(\{ words \}\)/);
});

// Colour is what it names: the lead card is graphite, never the app's colour.
test('the lead card is never filled with a colour', () => {
  const css = read('look.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /\.hero\s*\{[^}]*background/);
  assert.doesNotMatch(css, /\.hero[^{]*\{[^}]*#fff/);
});

// Jay 2026-11-03: 練習模式 has its own 開始; a tap on a way only picks it.
test('練習模式: a tap picks a way, its own 開始 starts the round', () => {
  const src = read('views/today.js');
  const pick = src.slice(src.indexOf('function pickMode'), src.indexOf('\n}\n', src.indexOf('function pickMode')));
  assert.doesNotMatch(pick, /startRound/);
  assert.match(src, /mode-go[^\n]*startRound\(\{ mode: state\.mode \}\)/);
});

// Jay 2026-11-03: a round opened on blank (the page left down where the tapped
// row was). A round started or put away opens at the top.
test('a round starts at the top of the page, never where the tapped row was', () => {
  const app = read('app.js');
  assert.match(app, /running !== drawn[^\n]*freshScreen/);
});

// Fixes (2026-11-11): the search's clear button speaks the page's language; a
// failed more.json says so on the contest card with 再試一次; the streak's
// notices are planned again once the day's goal is met.
test('search clear is translated; the contest says when its sentences fail; the goal met re-plans the streak notices', () => {
  assert.doesNotMatch(read('ui.js'), /'aria-label': '清除'/);
  assert.match(read('ui.js'), /t\('clearSearch'\)/);
  const app = read('app.js');
  assert.match(app, /state\.moreFailed = true/);
  assert.match(read('views/contest.js'), /state\.moreFailed[\s\S]*contestRetry/);
  assert.match(app, /hooks\.changed = [^\n]*goalWatch\(\)/);
});
