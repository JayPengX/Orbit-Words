// The speaker never stays silent (Jay 2026-11-05): a slow or failed
// recording, or a sound context iOS stopped, hands the word to the device's
// voice; with no voice either, the person is told.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sayWord, CLIP_MS } from '../public/lib/sound.mjs';

const never = () => new Promise(() => {});
const base = over => {
  const seen = [];
  return {
    seen,
    args: {
      clip: () => Promise.resolve('buf'),
      start: () => (seen.push('clip'), true),
      voice: () => (seen.push('voice'), true),
      notice: why => seen.push(`notice:${why}`),
      ms: 30,
      ...over
    }
  };
};

test('the recording plays when it comes in time', async () => {
  const { seen, args } = base();
  assert.equal(await sayWord(args), 'clip');
  assert.deepEqual(seen, ['clip']);
});

test('a recording stuck on a slow connection: the voice says it', async () => {
  const { seen, args } = base({ clip: never });
  assert.equal(await sayWord(args), 'voice');
  assert.deepEqual(seen, ['voice']);
  assert.ok(CLIP_MS > 0 && CLIP_MS <= 3000, 'a tap waits at most 3 s for the recording');
});

test('a failed recording: the voice says it', async () => {
  const { seen, args } = base({ clip: () => Promise.reject(new Error('clip 404')) });
  assert.equal(await sayWord(args), 'voice');
  assert.deepEqual(seen, ['voice']);
});

test('a context that will not run (iOS stopped it): the voice, not silence', async () => {
  const { seen, args } = base({ start: async () => false });
  assert.equal(await sayWord(args), 'voice');
  assert.deepEqual(seen, ['voice']);
});

test('no recording and no voice: the person is told why', async () => {
  const { seen, args } = base({ clip: never, voice: () => false });
  assert.equal(await sayWord(args), 'none');
  assert.deepEqual(seen, ['notice:slow']);
  const b = base({ start: () => false, voice: () => false });
  await sayWord(b.args);
  assert.deepEqual(b.seen, ['notice:context']);
});

test('a newer tap takes over: the older one says nothing', async () => {
  const { seen, args } = base({ clip: never, current: () => false });
  assert.equal(await sayWord(args), 'stale');
  assert.deepEqual(seen, []);
});

test('the speaker goes through sayWord, never a bare wait on the clip', () => {
  const src = readFileSync(new URL('../public/audio.js', import.meta.url), 'utf8');
  assert.match(src, /sayWord\(\{/);
  assert.match(src, /speak\(word, b\)/, 'the button passes itself, to show it is waiting');
  assert.doesNotMatch(src, /decoded\(ac, clipUrl\(word\)\)\s*\.then/, 'the old unbounded wait');
});
