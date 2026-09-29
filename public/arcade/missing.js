// 缺字母: one letter is gone; which? The meaning's shown. 60 seconds.
import { quiz } from './kit.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
export default function missing(api) {
  const pool = api.words().filter(w => /^[a-z]{4,12}$/i.test(w.word));
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const w = pool[Math.floor(api.rand() * pool.length)];
      const word = w.word.toLowerCase();
      // Harder later: a vowel's easy, the middle of a long word less so.
      const at = level < 0.3 ? Math.floor(api.rand() * word.length) : 1 + Math.floor(api.rand() * (word.length - 2));
      const ch = word[at];
      // Only letters that don't also make another real spelling from the list.
      const others = [...new Set(LETTERS.split('').filter(c => c !== ch))].sort(() => api.rand() - 0.5);
      const picks = [ch, ...others.filter(c => !pool.some(x => x.word.toLowerCase() === word.slice(0, at) + c + word.slice(at + 1))).slice(0, 3)];
      const order = picks.map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      return { prompt: api.el('div', {}, [api.el('span', { class: 'mono', text: `${word.slice(0, at)}_${word.slice(at + 1)}` }), api.el('small', { text: w.meaning })]), choices: order.map(o => o[1]), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
