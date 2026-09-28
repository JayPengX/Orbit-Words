// 猜密碼: find the four-colour code (colours can repeat) in 8 guesses. ● right
// colour in the right place, ○ right colour elsewhere. Two codes; a code
// found in fewer guesses scores more (codePay).
import { codeScore, codePay } from '../lib/arcade.mjs';
import { COLORS, quitButton, row } from './kit.js';

export default function codebreak(api) {
  const LEN = 4;
  const TRIES = 8;
  const newCode = () => Array.from({ length: LEN }, () => Math.floor(api.rand() * COLORS.length));
  let round = 0;
  let code = newCode();
  let guesses = [];
  let cur = [];
  let score = 0;
  const board = api.el('div', { class: 'cb-board' });
  const palette = api.el('div', { class: 'cb-palette' });
  const title = api.el('p', { class: 'arc-hint' });
  const peg = (c, cls = '') => api.el('span', { class: `cb-peg ${cls}`, style: c == null ? '' : `background:${COLORS[c]}` });
  const paint = () => {
    const lines = guesses.map(g =>
      api.el('div', { class: 'cb-line' }, [api.el('div', { class: 'cb-pegs' }, g.guess.map(c => peg(c))), api.el('span', { class: 'cb-score', text: '●'.repeat(g.r.exact) + '○'.repeat(g.r.near) || '—' })])
    );
    if (guesses.length < TRIES) lines.push(api.el('div', { class: 'cb-line current' }, [api.el('div', { class: 'cb-pegs' }, Array.from({ length: LEN }, (_, i) => peg(cur[i], cur[i] == null ? 'empty' : ''))), api.el('span', { class: 'cb-score', text: `${guesses.length + 1}/${TRIES}` })]));
    board.replaceChildren(...lines);
    title.textContent = api.L(`第 ${round + 1}/2 組密碼`, `Code ${round + 1}/2`);
    api.set({ score, info: api.L(`第 ${round + 1}/2 組`, `Code ${round + 1}/2`) });
  };
  const next = found => {
    if (found) score += codePay(guesses.length);
    round++;
    if (round >= 2) return api.end(score, found ? api.L('破解！', 'Cracked!') : api.L(`答案是這組。`, 'That was the code.'));
    code = newCode();
    guesses = [];
    cur = [];
    paint();
  };
  const submit = () => {
    if (cur.length < LEN || api.ended) return;
    const r = codeScore(code, cur);
    guesses.push({ guess: cur, r });
    cur = [];
    paint();
    if (r.exact === LEN) api.later(() => next(true), 500);
    else if (guesses.length >= TRIES) {
      board.append(api.el('div', { class: 'cb-line answer' }, [api.el('div', { class: 'cb-pegs' }, code.map(c => peg(c))), api.el('span', { class: 'cb-score', text: api.L('答案', 'Code') })]));
      api.later(() => next(false), 1400);
    }
  };
  palette.append(
    ...COLORS.map((col, c) => api.el('button', { class: 'cb-color', type: 'button', style: `background:${col}`, 'aria-label': `colour ${c + 1}`, onclick: () => cur.length < LEN && ((cur = [...cur, c]), paint()) })),
    api.el('button', { class: 'q-btn small', type: 'button', text: '⌫', onclick: () => ((cur = cur.slice(0, -1)), paint()) }),
    api.el('button', { class: 'q-btn small primary', type: 'button', text: api.L('猜', 'Guess'), onclick: submit })
  );
  paint();
  return api.el('div', { class: 'arc-col' }, [title, board, palette, row(api, [quitButton(api, () => score)])]);
}
