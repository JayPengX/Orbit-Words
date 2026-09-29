// 1A2B: guess the four different digits. A = right digit, right place; B = right
// digit, wrong place. Two codes, ten guesses each; fewer guesses score more.
import { quitButton, row } from './kit.js';

export function score1A2B(secret, guess) {
  let a = 0;
  let b = 0;
  guess.forEach((d, i) => (d === secret[i] ? a++ : secret.includes(d) && b++));
  return { a, b };
}
export default function bulls(api) {
  const CODES = 2;
  const MAX = 10;
  let code = 0;
  let score = 0;
  const newSecret = () => [...'0123456789'].sort(() => api.rand() - 0.5).slice(0, 4).map(Number);
  let secret = newSecret();
  let guess = [];
  let tries = [];
  const slots = api.el('div', { class: 'ab-slots' });
  const log = api.el('ol', { class: 'ab-log' });
  const title = api.el('p', { class: 'arc-hint' });
  const pad = api.el('div', { class: 'gpad ab-pad' });
  const paint = () => {
    title.textContent = api.L(`第 ${code + 1}/${CODES} 組 · 第 ${tries.length + 1}/${MAX} 次`, `Code ${code + 1}/${CODES} · guess ${tries.length + 1}/${MAX}`);
    slots.replaceChildren(...[0, 1, 2, 3].map(i => api.el('span', { class: `ab-slot${guess[i] != null ? ' on' : ''}`, text: guess[i] ?? '' })));
    log.replaceChildren(...tries.map(t => api.el('li', {}, [api.el('span', { class: 'mono', text: t.g.join('') }), api.el('b', { text: `${t.a}A${t.b}B` })])));
    pad.replaceChildren(
      ...[...'1234567890'].map(d => api.el('button', { class: 'q-btn', type: 'button', text: d, disabled: guess.includes(Number(d)) || guess.length >= 4 ? true : null, onclick: () => (guess.push(Number(d)), paint()) })),
      api.el('button', { class: 'q-btn ghost', type: 'button', text: '⌫', onclick: () => (guess.pop(), paint()) }),
      api.el('button', { class: 'q-btn primary', type: 'button', text: api.L('猜', 'Guess'), disabled: guess.length < 4 ? true : null, onclick: submit })
    );
    api.set({ score, info: api.L(`第 ${code + 1}/${CODES} 組`, `Code ${code + 1}/${CODES}`) });
  };
  function submit() {
    if (api.ended || guess.length < 4) return;
    const r = score1A2B(secret, guess);
    tries.push({ g: guess, ...r });
    guess = [];
    if (r.a === 4 || tries.length >= MAX) {
      if (r.a === 4) score += 8 + (MAX - tries.length) * 2;
      const was = secret.join('');
      code++;
      if (code >= CODES) {
        paint();
        return api.end(score, r.a === 4 ? api.L('兩組都破解了！', 'Both cracked!') : api.L(`答案是 ${was}。`, `It was ${was}.`));
      }
      secret = newSecret();
      tries = [];
    }
    paint();
  }
  paint();
  return api.el('div', { class: 'arc-col' }, [title, slots, pad, log, row(api, [quitButton(api, () => score)])]);
}
