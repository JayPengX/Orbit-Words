import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Wide screens (Jay 2026-11-06, iPad: "Words on iPad UI is shit"): 今天 and 進度
// were three phone columns, two nearly empty beside one long stack, and 單字's
// word beside the list scrolled away with the list's first screen. These hold
// the fix; a phone upright keeps its one column.
const read = f => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const css = read('styles.css');

test('今天 and 進度 wide: a lead band, then the kit flowColumns (columns of even height)', () => {
  for (const f of ['views/today.js', 'views/progress.js']) {
    const src = read(f);
    assert.match(src, /class: 'wide-lead'/, `${f}: its first cards in one lead row`);
    assert.match(src, /class: 'q-flow tab-flow'/, `${f}: the rest in a .q-flow`);
    assert.match(src, /flowColumns/, `${f}: dealt by the kit's flowColumns`);
    assert.match(src, /classList\.add\('span2'\)/, `${f}: one lead card across two columns`);
  }
});

test('a phone upright keeps its one column: the lead band and the flow only on q-wide', () => {
  assert.match(read('views/today.js'), /if \(!fit\.wide\) return \[goal, \.\.\.side, \.\.\.rest\]/);
  assert.match(read('views/progress.js'), /if \(!kit\.screenFit\?\.\(\)\.wide\) return put\(box, \.\.\.parts\)/);
  // (Every wide rule sits under :root.q-wide / q-w3, or on classes only drawn wide.)
  for (const line of css.split('\n').filter(l => /wide-lead|tab-flow/.test(l) && /\{/.test(l))) {
    assert.ok(/q-wide|q-w3|^\.wide-lead|^\.tab-panel \.wide-lead/.test(line.trim()), line);
  }
});

test('wide tabs laid out in columns are not squeezed to the 720 reading column', () => {
  const rule = css.match(/:root\.q-wide \.tab-panel:not\(:has\(> :is\(([^)]*)\)\)\)/);
  assert.ok(rule, 'the 720 rule names what it leaves alone');
  for (const c of ['.tab-cols', '.tab-flow', '.wide-lead']) assert.ok(rule[1].includes(c), c);
});

test('單字 and 複習: the word beside the list stays in view all the way down', () => {
  // (The column holding it sticks inside the grid, which is as tall as the list.)
  assert.match(css, /:root\.q-wide \.tab-col:has\(> \.word-pane\) \{ position: sticky;/);
  assert.match(css, /\.word-pane \{ position: sticky;/);
});
