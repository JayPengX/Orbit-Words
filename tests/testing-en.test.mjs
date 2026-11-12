// The 測試工具 rows Words adds: their English has no Chinese left in it
// (2026-11-12: 「繼續’s due row shows 240」 in English).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('testing.js: every English label is English', () => {
  const src = readFileSync(new URL('../public/testing.js', import.meta.url), 'utf8');
  const pairs = [...src.matchAll(/\bT\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)];
  assert.ok(pairs.length >= 8, `found ${pairs.length} labels`);
  for (const [, zh, en] of pairs) assert.ok(!/[一-鿿]/.test(en), `「${zh}」 → 「${en}」`);
});
