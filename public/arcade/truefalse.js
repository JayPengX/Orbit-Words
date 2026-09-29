// 對錯快判: does this word mean this? 60 seconds of yes or no.
import { quiz } from './kit.js';

export default function truefalse(api) {
  const pool = api.words().filter(w => w.meaning);
  return quiz(api, {
    seconds: 60,
    ask() {
      const w = pool[Math.floor(api.rand() * pool.length)];
      const yes = api.rand() < 0.5;
      let m = w.meaning;
      if (!yes) {
        // A wrong meaning from a word of the same level when possible.
        const same = pool.filter(x => x.level === w.level && x.meaning !== w.meaning);
        m = (same.length ? same : pool)[Math.floor(api.rand() * (same.length || pool.length))].meaning;
      }
      return { prompt: api.el('div', {}, [api.el('span', { text: w.word }), api.el('small', { text: m })]), choices: ['⭕', '❌'], answer: yes || m === w.meaning ? 0 : 1 };
    }
  });
}
