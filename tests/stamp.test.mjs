// The deploy's version stamp (scripts/stamp-version.mjs) on a copy of the
// page: every relative import gets the same ?v=, so each module is loaded
// once (a file imported both stamped and unstamped would be two modules,
// with two copies of the app's state).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('every relative module import is stamped with the version, ../ included', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stamp-'));
  try {
    const src = new URL('../public/', import.meta.url).pathname;
    cpSync(src, dir, { recursive: true, filter: p => !p.includes('/data/audio') });
    execFileSync(process.execPath, [new URL('../scripts/stamp-version.mjs', import.meta.url).pathname, 'T1', dir]);
    const walk = d => readdirSync(d).flatMap(f => (statSync(join(d, f)).isDirectory() ? (f === 'data' ? [] : walk(join(d, f))) : /\.(m?js)$/.test(f) ? [join(d, f)] : []));
    let checked = 0;
    for (const file of walk(dir)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/(?:from|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        assert.match(m[1], /\?v=T1$/, `${file}: ${m[1]}`);
        checked++;
      }
    }
    assert.ok(checked > 20, String(checked));
    assert.match(readFileSync(join(dir, 'index.html'), 'utf8'), /modulepreload" href="\.\/views\/session\.js\?v=T1"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
