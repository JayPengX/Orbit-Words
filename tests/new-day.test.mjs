import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Kept open past midnight (Orbit keeps the app running overnight) with the
// Pass unchanged, nothing redrew 今天: the morning showed yesterday's count,
// streak, words and word of the day, and tonight's streak notice wasn't
// planned (2026-11-17, proven with the Worker's "unchanged" answers).
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

test('each drawing notes the day it was drawn on', () => {
  const render = app.slice(app.indexOf('function render() {'), app.indexOf('\n}\n', app.indexOf('function render() {')));
  assert.match(render, /drawnDay = fmtKit\.localDay\(Date\.now\(\)\)/);
});

test('a new day, on coming back or a minute on screen, redraws the tab and plans the notices again', () => {
  const fn = app.slice(app.indexOf('function newDay() {'), app.indexOf('\n}\n', app.indexOf('function newDay() {')));
  assert.match(fn, /drawnDay === fmtKit\.localDay\(Date\.now\(\)\)\) return/);
  assert.match(fn, /quietRefresh\(\)/);
  assert.match(fn, /goalWatch\(\)/);
  assert.match(app, /visibilitychange', \(\) => document\.visibilityState === 'visible' && newDay\(\)\)/);
  assert.match(app, /setInterval\(\(\) => document\.visibilityState === 'visible' && newDay\(\), 60_000\)/);
});
