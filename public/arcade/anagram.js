// 字母重組: the letters of a word, mixed up; tap them in order (the meaning's a
// hint). 90 seconds; longer words score more.
import { countdown, startButton } from './kit.js';

export default function anagram(api) {
  const pool = api.words().filter(w => /^[a-z]{4,9}$/i.test(w.word));
  let score = 0;
  let solved = 0;
  let left = () => 90;
  let word = '';
  let tiles = [];
  let built = [];
  const hint = api.el('p', { class: 'ag-hint' });
  const slots = api.el('div', { class: 'ag-slots' });
  const pad = api.el('div', { class: 'ag-tiles' });
  const next = () => {
    const w = pool[Math.floor(api.rand() * Math.min(pool.length, 40 + solved * 30))];
    word = w.word.toLowerCase();
    hint.textContent = w.meaning;
    do tiles = [...word].map((ch, i) => ({ ch, i })).sort(() => api.rand() - 0.5);
    while (tiles.map(t => t.ch).join('') === word);
    built = [];
    paint();
  };
  const paint = () => {
    slots.replaceChildren(...[...word].map((_, i) => api.el('span', { class: `ag-slot${built[i] ? ' on' : ''}`, text: built[i]?.ch.toUpperCase() ?? '' })));
    pad.replaceChildren(
      ...tiles.map(t => api.el('button', { class: 'ag-tile', type: 'button', text: t.ch.toUpperCase(), disabled: built.includes(t) ? true : null, onclick: () => tap(t) })),
      api.el('button', { class: 'ag-tile undo', type: 'button', text: '⌫', onclick: () => (built.pop(), paint()) })
    );
    api.set({ score, info: api.L(`${left()} 秒 · 拼出 ${solved}`, `${left()}s · ${solved} solved`) });
  };
  function tap(t) {
    if (api.ended) return;
    built.push(t);
    if (built.length === word.length) {
      if (built.map(b => b.ch).join('') === word) {
        score += word.length;
        solved++;
        slots.classList.add('ok');
        return api.later(() => (slots.classList.remove('ok'), next()), 350);
      }
      slots.classList.add('bad');
      return api.later(() => (slots.classList.remove('bad'), (built = []), paint()), 450);
    }
    paint();
  }
  const skip = api.el('button', { class: 'q-btn small ghost', type: 'button', text: api.L('換一個', 'Skip'), onclick: () => !api.ended && next() });
  const start = startButton(api, null, () => {
    left = countdown(api, 90, paint, () => api.end(score, api.L(`拼出 ${solved} 個字。`, `${solved} words.`)));
    next();
  });
  return api.el('div', { class: 'arc-col' }, [hint, slots, pad, skip, start]);
}
