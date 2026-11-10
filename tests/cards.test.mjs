// 例句與記憶法 and 用它造句 (lib/cards.mjs): what the sheet keeps of a
// word's AI card, and the corrected sentence word by word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardOf, cardsPath, letterOf, wordDiff } from '../public/lib/cards.mjs';

test('a word’s card: its own letter’s file; the sheet’s sentence not twice; mix-ups only from the list', () => {
  assert.equal(cardsPath('Abandon'), 'words/cards/a.json');
  assert.equal(letterOf('3D'), '_');
  const doc = { cards: { abandon: { ex: [{ en: 'Never abandon hope!', zh: '永不放棄希望。' }, { en: 'They abandoned the car.', zh: '他們丟下車子。' }, { en: 'x', zh: 'y' }], hook: '  a + band + on  ', confuse: ['Abundant', 'abandon', 'zzzz'] } } };
  const c = cardOf(doc, 'abandon', { own: 'never abandon hope', known: new Map([['abundant', {}]]) });
  assert.deepEqual(c.ex.map(e => e.en), ['They abandoned the car.', 'x']);
  assert.equal(c.hook, 'a + band + on');
  assert.deepEqual(c.confuse, ['abundant']);
  assert.equal(cardOf(doc, 'bake'), null);
  assert.equal(cardOf({ cards: { odd: { ex: [], hook: '', confuse: [] } } }, 'odd'), null, 'an empty card is no card');
  assert.equal(cardOf(null, 'abandon'), null);
});

test('the corrected sentence: only what changed is marked', () => {
  const d = wordDiff('He abandon his dream after he fail the exam.', 'He abandoned his dream after he failed the exam.');
  assert.deepEqual(d.filter(w => w.changed).map(w => w.text), ['abandoned', 'failed']);
  assert.deepEqual(wordDiff('I like it.', 'I like it!').filter(w => w.changed), [], 'stops aside');
  assert.deepEqual(wordDiff('', 'A new one.').map(w => w.changed), [true, true, true]);
});
