import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatWords, turnsToSend } from '../public/lib/chat.mjs';

test('the words a chat asks for: the last three days’ newest first, then the ones up next', () => {
  const now = Date.parse('2026-11-11T10:00:00Z');
  const w = k => ({ key: k, word: k });
  const words = ['a', 'b', 'c', 'd', 'e'].map(w);
  const progress = { a: { t: now - 3600e3 }, b: { t: now - 60e3 }, c: { t: now - 5 * 86_400_000 } };
  assert.deepEqual(chatWords(words, progress, { now, next: [w('b'), w('e'), w('d')] }).map(x => x.key), ['b', 'a', 'e', 'd']);
  assert.deepEqual(chatWords(words, {}, { now, next: [w('d')] }).map(x => x.key), ['d']);
});

test('a long chat sends its opener and the latest turns', () => {
  const turns = Array.from({ length: 12 }, (_, i) => ({ who: i % 2 ? 'me' : 'ai', text: String(i) }));
  const sent = turnsToSend(turns);
  assert.equal(sent.length, 8);
  assert.equal(sent[0].text, '0');
  assert.equal(sent.at(-1).text, '11');
});

test('learningList: words being learned, latest first, with forms; not new, not mastered', async () => {
  const { learningList } = await import('../public/lib/words.mjs');
  const words = [
    { key: 'abandon', word: 'abandon', zh: 'v. 放棄、拋棄' },
    { key: 'brief', word: 'brief', zh: 'adj. 簡短的' },
    { key: 'able', word: 'able', zh: 'adj. 能夠的' },
    { key: 'novel', word: 'novel', zh: 'n. 小說' }
  ];
  const progress = { abandon: { b: 2, t: 100 }, brief: { b: 1, t: 200 }, able: { b: 5, t: 300 } };
  const out = learningList(words, progress, k => (k === 'abandon' ? ['abandon', 'abandoned', 'abandons'] : []));
  assert.deepEqual(out.map(w => w.w), ['brief', 'abandon']);
  assert.deepEqual(out[1].f, ['abandoned', 'abandons']);
  assert.equal(out[0].f, undefined);
  assert.equal(out[1].zh, '放棄');
});
