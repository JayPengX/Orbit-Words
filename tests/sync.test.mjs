// The saved copy (copy.mjs): encoded, merged, kept. (The Pass sync itself is the kit's.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePayload, encodePayload, mergeCopy } from '../public/lib/copy.mjs';
const T = Date.parse('2026-10-05T04:00:00Z');
const blank = () => ({ progress: {}, days: {}, log: {}, marks: {}, cal: [], study: [], levels: [1, 2, 3], mode: 'smart', opt: {}, st: 0 });
const word = (t, b = 2) => ({ b, d: 20000, n: 1, r: 1, t, s: 3, D: 5 });

test('a copy encodes and decodes; anything else is unreadable', async () => {
  const s = { ...blank(), progress: { apple: word(T) }, st: 1_790_000_000 };
  const back = await decodePayload(await encodePayload(s));
  assert.deepEqual(back.progress.apple, { ...word(T) });
  assert.equal(back.st, 1_790_000_000);
  for (const bad of ['', 'z3:', 'z3:!!!', 'w1:{}', null, 42]) assert.equal(await decodePayload(bad), null, String(bad));
});

test('two copies made one: newest answer per word, the settings set last, no quizzed batch brought back', () => {
  const mine = { ...blank(), progress: { apple: word(T + 1000), banana: word(T) }, study: [], levels: [4, 5], mode: 'spell', opt: { rate: 0.75 }, st: 200 };
  // The other device: banana answered later, apple earlier; its study batch
  // holds apple (since quizzed here) and kiwi; its settings older.
  const theirs = { ...blank(), progress: { apple: word(T), banana: { ...word(T + 5000), b: 1, o: 2 } }, study: ['apple', 'kiwi'], levels: [1], mode: 'meaning', opt: { rate: 1.25 }, st: 100 };
  const m = mergeCopy(mine, theirs);
  assert.equal(m.progress.apple.t, T + 1000);
  assert.equal(m.progress.banana.o, 2);
  assert.deepEqual(m.study, ['kiwi'], 'apple was quizzed: not studied again');
  assert.equal(m.levels, undefined, 'my settings are newer: kept');
  assert.equal(m.mode, undefined);
  // Theirs newer: theirs.
  const n = mergeCopy(mine, { ...theirs, st: 300 });
  assert.deepEqual([n.levels, n.mode, n.opt.rate, n.st], [[1], 'meaning', 1.25, 300]);
  // A copy from before settings were dated: as it always was, the other copy's settings.
  const legacy = mergeCopy({ ...mine, st: 0 }, { ...theirs, st: 0 });
  assert.deepEqual([legacy.levels, legacy.mode], [[1], 'meaning']);
  assert.deepEqual(mergeCopy(mine, null), {});
  // Days and logs: the larger; bookmarks: the latest choice.
  const d = mergeCopy({ ...blank(), days: { x: 5 }, log: { x: [3, 10] }, marks: { apple: [1, 10] } }, { ...blank(), days: { x: 9 }, log: { x: [2, 30] }, marks: { apple: [0, 20] } });
  assert.deepEqual([d.days.x, d.log.x, d.marks.apple], [9, [3, 30], [0, 20]]);
});

// ---- One return: how much of the pass is read ------------------------------------------------

test('the words per round (10, 20, 30) is kept in the saved copy and follows the newer settings', async () => {
  const mine = { ...blank(), size: 30, st: 200 };
  // Saved and read back: still 30.
  const back = await decodePayload(await encodePayload(mine));
  assert.equal(mergeCopy({ ...blank(), size: 10 }, back).size, 30);
  // Another device's newer setting wins; an older one does not; a size that isn't one of the three is ignored.
  assert.equal(mergeCopy(mine, { ...blank(), st: 300, opt: { size: 20 } }).size, 20);
  assert.equal(mergeCopy(mine, { ...blank(), st: 100, opt: { size: 20 } }).size, undefined);
  assert.equal(mergeCopy(mine, { ...blank(), st: 300, opt: { size: 7 } }).size, 10);
});
