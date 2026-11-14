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
  assert.match(read('views/progress.js'), /const wide = kit\.screenFit\(\)\.wide;[\s\S]*if \(!wide\) return put\(box, \.\.\.parts\)/);
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

// Jay 2026-11-14, his laptop.
test('a computer: the page starts level with the side bar, never against the window top', () => {
  assert.match(css, /html\.q-tabrail\.q-desk \.page \{ padding-top: calc\(var\(--q-top\) \+ 20px\); \}/);
});
test('複習 wide: the categories sit across the top whether the category is empty or not (no jump on 收藏)', () => {
  const src = read('views/review.js');
  assert.match(src, /class: 'tab-flow review-empty' \}, \[cats, emptyCard\(\)\]/);
  assert.match(src, /class: 'tab-flow review-seg' \}, \[cats\]\), \.\.\.columns\(\[\[deckHero\(n\), wordsSection\(\)\], \[wordPane\(first\)\]\]\)/);
});
test('今天 wide: the shelves that can give a row do, so the columns end near one line', () => {
  const src = read('views/today.js');
  assert.match(src, /kitUI\.flowColumns\(box\);\n  evenUp\(box\);/);
  assert.match(src, /function giveRow\(col, over\)/);
});
test('進度 on a computer: one row of one height, the words forgotten most in the page', () => {
  const src = read('views/progress.js');
  assert.match(src, /screenFit\(\)\.w3 \? el\('div', \{ class: 'prog-row' \}/);
  assert.match(src, /function hardBand\(\)/);
  assert.match(css, /\.prog-row \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*align-items: stretch; \}/);
});
test('進度 after a quiet spell: when you last practised, never 還沒有作答紀錄 or two dashes', () => {
  const src = read('views/progress.js');
  assert.match(src, /t\('chartQuiet'\)/);
  assert.match(src, /label: t\('stLastDay'\)/);
  assert.match(read('lib/i18n.mjs'), /chartQuiet: '最近 14 天沒有作答'/);
});
