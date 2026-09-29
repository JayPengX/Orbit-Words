// 字尾接龍: pick the word that starts with the last letter of this one. 60 seconds.
import { quiz } from './kit.js';

export default function wordchain(api) {
  const pool = api.words().filter(w => /^[a-z]{3,11}$/i.test(w.word));
  let cur = pool[Math.floor(api.rand() * pool.length)];
  return quiz(api, {
    seconds: 60,
    ask() {
      const last = cur.word.slice(-1).toLowerCase();
      const fits = pool.filter(w => w.word[0].toLowerCase() === last && w.key !== cur.key);
      if (!fits.length) cur = pool[Math.floor(api.rand() * pool.length)];
      const right = fits.length ? fits[Math.floor(api.rand() * fits.length)] : pool.find(w => w.word[0].toLowerCase() === cur.word.slice(-1).toLowerCase() && w.key !== cur.key) || pool[0];
      const wrong = pool.filter(w => w.word[0].toLowerCase() !== right.word[0].toLowerCase()).sort(() => api.rand() - 0.5).slice(0, 3);
      const picks = [right, ...wrong];
      const order = picks.map((v, i) => [api.rand(), v, i]).sort((x, y) => x[0] - y[0]);
      const shown = cur;
      cur = right;
      return { prompt: api.el('div', {}, [api.el('span', {}, [document.createTextNode(shown.word.slice(0, -1)), api.el('b', { class: 'wc-last', text: shown.word.slice(-1) })]), api.el('small', { text: shown.meaning })]), choices: order.map(o => o[1].word), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
