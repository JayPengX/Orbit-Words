// 打字: see the meaning, type the word. 60 seconds; each letter of a right word
// scores (a half point), a miss costs a point.
import { countdown, startButton } from './kit.js';

export default function typing(api) {
  const pool = api.words().filter(w => /^[a-z]{3,12}$/i.test(w.word));
  let score = 0;
  let done = 0;
  let left = () => 60;
  let cur = null;
  const ask = api.el('p', { class: 'ty-ask' });
  const len = api.el('p', { class: 'arc-hint small' });
  const input = api.el('input', { class: 'ty-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go', disabled: true });
  const next = () => {
    cur = pool[Math.floor(api.rand() * pool.length)];
    ask.textContent = cur.meaning;
    len.textContent = `${cur.word[0]}${'_ '.repeat(cur.word.length - 1)}`.trim();
    input.value = '';
    input.className = 'ty-input';
  };
  const form = api.el('form', { class: 'ty-form', onsubmit: e => {
    e.preventDefault();
    if (api.ended || !cur) return;
    const ok = input.value.trim().toLowerCase() === cur.word.toLowerCase();
    if (ok) (score += cur.word.length / 2, done++);
    else score = Math.max(0, score - 1);
    input.className = `ty-input ${ok ? 'ok' : 'bad'}`;
    if (!ok) len.textContent = cur.word;
    api.set({ score, info: api.L(`${left()} 秒 · 打對 ${done}`, `${left()}s · ${done} right`) });
    api.later(next, ok ? 150 : 900);
  } }, [input]);
  const start = startButton(api, null, () => {
    input.disabled = false;
    input.focus();
    left = countdown(api, 60, () => api.set({ score, info: api.L(`${left()} 秒 · 打對 ${done}`, `${left()}s · ${done} right`) }), () => ((input.disabled = true), api.end(score, api.L(`打對 ${done} 個字。`, `${done} words.`))));
    next();
  });
  return api.el('div', { class: 'arc-col' }, [ask, len, form, start]);
}
