// 詞性分類: noun, verb, adjective or adverb? 60 seconds.
import { quiz } from './kit.js';

const POS = [['n.', '名詞', 'Noun'], ['v.', '動詞', 'Verb'], ['adj.', '形容詞', 'Adjective'], ['adv.', '副詞', 'Adverb']];
export default function wordsort(api) {
  // Words with a single part of speech only, so there's one right answer.
  const pool = api.words().filter(w => POS.some(p => p[0] === w.pos));
  return quiz(api, {
    seconds: 60,
    ask() {
      const w = pool[Math.floor(api.rand() * pool.length)];
      return { prompt: api.el('div', {}, [api.el('span', { text: w.word }), api.el('small', { text: w.meaning })]), choices: POS.map(p => api.L(p[1], p[2])), answer: POS.findIndex(p => p[0] === w.pos) };
    }
  });
}
