// 猜字 (Wordle): guess the five-letter word in six tries. Green: right letter,
// right place; yellow: in the word elsewhere; grey: not in it. Two words.
import { allWords, quitButton, row } from './kit.js';

export function wordleMarks(target, guess) {
  const marks = Array(5).fill('miss');
  const left = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) marks[i] = 'hit';
    else left[target[i]] = (left[target[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) if (marks[i] !== 'hit' && left[guess[i]] > 0) (marks[i] = 'near'), left[guess[i]]--;
  return marks;
}
export default function wordle(api) {
  const WORDS = 2;
  const pool = api.words().filter(w => /^[a-z]{5}$/i.test(w.word));
  let dict = new Set(pool.map(w => w.word.toLowerCase()));
  allWords().then(d => (dict = d)).catch(() => {});
  let round = 0;
  let score = 0;
  let target;
  let guesses = [];
  let typed = '';
  const board = api.el('div', { class: 'wd-board' });
  const note = api.el('p', { class: 'arc-hint small' });
  const keys = api.el('div', { class: 'wd-keys' });
  const pickTarget = () => {
    const w = pool[Math.floor(api.rand() * pool.length)];
    target = { word: w.word.toLowerCase(), meaning: w.meaning };
    guesses = [];
    typed = '';
  };
  const known = () => {
    const k = {};
    for (const g of guesses) wordleMarks(target.word, g).forEach((m, i) => {
      const was = k[g[i]];
      if (was !== 'hit' && !(was === 'near' && m === 'miss')) k[g[i]] = m;
    });
    return k;
  };
  const paint = () => {
    board.replaceChildren(
      ...Array.from({ length: 6 }, (_, r) => {
        const g = guesses[r] ?? (r === guesses.length ? typed.padEnd(5) : '     ');
        const marks = guesses[r] ? wordleMarks(target.word, guesses[r]) : [];
        return api.el('div', { class: 'wd-row' }, [...g].map((ch, i) => api.el('span', { class: `wd-tile ${marks[i] || (ch.trim() ? 'typed' : '')}`, text: ch.trim().toUpperCase() })));
      })
    );
    const k = known();
    keys.replaceChildren(
      ...['qwertyuiop', 'asdfghjkl', '⏎zxcvbnm⌫'].map(line =>
        api.el('div', { class: 'wd-key-row' }, [...line].map(ch => api.el('button', { class: `wd-key ${k[ch] || ''}${ch === '⏎' || ch === '⌫' ? ' wide' : ''}`, type: 'button', text: ch === '⏎' ? api.L('送出', 'Enter') : ch.toUpperCase(), onclick: () => press(ch) })))
      )
    );
    api.set({ score, info: api.L(`第 ${round + 1}/${WORDS} 字`, `Word ${round + 1}/${WORDS}`) });
  };
  function press(ch) {
    if (api.ended) return;
    if (ch === '⌫') typed = typed.slice(0, -1);
    else if (ch === '⏎') {
      if (typed.length < 5) return;
      if (!dict.has(typed)) return void ((note.textContent = api.L('單字表裡沒有這個字', 'Not in the word list')), api.later(() => (note.textContent = ''), 1200));
      guesses.push(typed);
      typed = '';
      const won = guesses.at(-1) === target.word;
      if (won || guesses.length >= 6) {
        if (won) score += 8 + (6 - guesses.length) * 3;
        note.textContent = `${target.word.toUpperCase()} · ${target.meaning}`;
        round++;
        if (round >= WORDS) {
          paint();
          return api.end(score, won ? api.L('猜中了！', 'Got it!') : api.L(`答案是 ${target.word}。`, `It was ${target.word}.`));
        }
        paint();
        return api.later(() => ((note.textContent = ''), pickTarget(), paint()), 1600);
      }
    } else if (typed.length < 5) typed += ch;
    paint();
  }
  const key = e => {
    if (!board.isConnected) return document.removeEventListener('keydown', key);
    if (/^[a-z]$/i.test(e.key)) press(e.key.toLowerCase());
    else if (e.key === 'Enter') press('⏎');
    else if (e.key === 'Backspace') press('⌫');
  };
  document.addEventListener('keydown', key);
  api.cleanup(() => document.removeEventListener('keydown', key));
  pickTarget();
  paint();
  return api.el('div', { class: 'arc-col' }, [board, note, keys, row(api, [quitButton(api, () => score)])]);
}
