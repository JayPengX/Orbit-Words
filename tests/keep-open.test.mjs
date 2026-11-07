import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// A star tapped redraws the tab (Jay 2026-11-07: "reset the list I expand when
// I click favorite"). 單字 and 複習 were drawn back to their first 40 words, the
// page left on blank far below them. These hold the fix: every paged list is
// kept as far open as it was, and the wide word pane keeps its place.
const read = f => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');

test('pagedList remembers how far each list was opened, by its name', () => {
  const ui = read('ui.js');
  assert.match(ui, /const opened = new Map\(\)/);
  assert.match(ui, /opened\.set\(keep, shown\)/, 'a 顯示更多 tap is remembered');
  assert.match(ui, /step\(Math\.max\(page, \(keep && opened\.get\(keep\)\) \|\| 0\)\)/, 'a redraw opens as far as before');
});

test('every paged list is named (its filter in the name), so a redraw keeps it open', () => {
  const views = readdirSync(new URL('../public/views/', import.meta.url)).map(f => read(`views/${f}`));
  const calls = views.flatMap(src => src.split('\n').filter(l => /pagedList\(/.test(l) && !/import/.test(l)));
  assert.ok(calls.length >= 3);
  for (const line of calls) assert.match(line, /keep: `/, line.trim().slice(0, 120));
});

test('the wide word pane, drawn again on the same word, goes back to where it was read to', () => {
  const sheet = read('views/sheet.js');
  assert.match(sheet, /paneKey === word\.key \? pane\.el\.scrollTop : 0/);
  assert.match(sheet, /at\.scrollTo\?\.\(0, was\)/);
});
