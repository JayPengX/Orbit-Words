// The dictionary (data/words.json's meanings and KK, data/more.json's
// examples and forms): written once from Wiktionary and Tatoeba
// (scripts/dict/), checked here so a rebuild can't slip.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadWords, loadMore, senses, shortMeaning } from '../public/lib/words.mjs';

const read = f => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url)));
const words = loadWords(read('words.json'));
const more = loadMore(read('more.json'));
const byKey = new Map(words.map(w => [w.key, w]));
const POS = new Set(['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.', 'interj.', 'aux.', 'det.', 'num.', 'abbr.']);
const KK = /^[abdefghijklmnoprstuvwzæɑɔəɛɪʊʌʃʒθðŋɝɚˋˏ̩ ]+$/u;
// Characters only Simplified Chinese writes (their Traditional forms differ).
const SIMPLIFIED = /[们这个说时对为会来过还没么见无门问间车东书长马鸟鱼开关头买卖实学习听写读语认识让给钱电话网络软发现边经济业务种类变运动]/u;

test('every word: 1 to 4 senses, each with its part of speech, Traditional Chinese', () => {
  for (const w of words) {
    const list = senses(w.zh);
    assert.ok(list.length >= 1 && list.length <= 4, `${w.word}: ${list.length} senses`);
    for (const s of list) {
      assert.ok(POS.has(s.pos), `${w.word}: "${s.pos}"`);
      assert.ok(s.text && !SIMPLIFIED.test(s.text), `${w.word}: ${s.text}`);
    }
  }
});

test("the quiz's meaning is the word's main one", () => {
  const first = k => shortMeaning(byKey.get(k).zh);
  assert.match(first('mean'), /意思|意指|意謂/);
  assert.match(first('like'), /喜歡/);
  assert.match(first('sow'), /播種/);
  assert.match(first('run'), /跑/);
  assert.match(first('present'), /禮物|現在|出席|呈現|提出/);
});

test('every word has KK, US, no stress mark on one syllable', () => {
  for (const w of words) {
    assert.match(w.ph, KK, `${w.word}: [${w.ph}]`);
    const syllables = (w.ph.match(/[aeiouæɑɔəɛɪʊʌɝɚ]+|[nlm]̩/gu) || []).length;
    if (syllables === 1 && !/\s/.test(w.ph)) assert.ok(!/[ˋˏ]/.test(w.ph), `${w.word}: [${w.ph}]`);
  }
  assert.equal(byKey.get('sow').ph, 'so');
});

test('examples: most words have one, each uses the word, Chinese in Traditional', () => {
  let n = 0;
  for (const [k, m] of more) {
    assert.ok(byKey.has(k), k);
    if (!m.en) continue;
    n++;
    const forms = [byKey.get(k).word, ...m.forms].map(f => f.toLowerCase().replace(/’/g, "'"));
    const en = m.en.toLowerCase().replace(/’/g, "'");
    assert.ok(forms.some(f => en.includes(f)) || en.includes(k.slice(0, Math.max(3, k.length - 2))), `${k}: ${m.en}`);
    assert.ok(!SIMPLIFIED.test(m.zh), `${k}: ${m.zh}`);
  }
  assert.ok(n > words.length * 0.95, `${n} examples`);
});

test('loadMore drops rows of the wrong shape', () => {
  const m = loadMore({ a: [['as'], 'An a.', '一個 a。'], b: 'x', c: [[], '', ''], d: [[1, 'ds'], 'Hi d', ''] });
  assert.deepEqual(m.get('a'), { forms: ['as'], en: 'An a.', zh: '一個 a。' });
  assert.equal(m.has('b'), false);
  assert.equal(m.has('c'), false);
  assert.deepEqual(m.get('d'), { forms: ['ds'], en: '', zh: '' });
});
