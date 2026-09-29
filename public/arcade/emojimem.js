// 哪裡變了: look at the picture, it goes dark, one thing changes; tap what
// changed. Ten rounds, more things each time.
import { startButton } from './kit.js';

const POOL = '🍎🍌🍇🍉🍒🥝🍍🥕🌽🍄🌵🌻🐶🐱🐭🐰🦊🐻🐼🐸🐵🐔🐧🐢🐙🦋🐞⚽🏀🎈🎁🔑🎸🚗🚀⛵⭐🌙☂️🎩👟'.match(/\p{Extended_Pictographic}️?/gu);
const ROUNDS = 10;
export default function emojimem(api) {
  let round = 0;
  let score = 0;
  let items = [];
  let changed = -1;
  let wait = true;
  const board = api.el('div', { class: 'em-board' });
  const note = api.el('p', { class: 'arc-hint', text: api.L('記住每一格，等一下會有一格換掉', 'Remember them; one will change') });
  const info = () => api.set({ score, info: api.L(`第 ${Math.min(round + 1, ROUNDS)}/${ROUNDS} 回`, `Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`) });
  const paint = (hidden = false) => board.replaceChildren(...items.map((e, i) => api.el('button', { class: `em-cell${hidden ? ' dark' : ''}`, type: 'button', text: hidden ? '' : e, onclick: () => tap(i) })));
  const next = () => {
    if (round >= ROUNDS) return api.end(score, api.L(`${ROUNDS} 回結束。`, `${ROUNDS} rounds done.`));
    const n = Math.min(16, 6 + round);
    const bag = [...POOL].sort(() => api.rand() - 0.5);
    items = bag.slice(0, n);
    board.style.gridTemplateColumns = `repeat(${n > 9 ? 4 : 3}, 1fr)`;
    wait = true;
    paint();
    info();
    const look = 2600 + n * 120;
    api.later(() => paint(true), look);
    api.later(() => {
      changed = Math.floor(api.rand() * n);
      items[changed] = bag[n + Math.floor(api.rand() * (bag.length - n))];
      paint();
      wait = false;
    }, look + 700);
  };
  function tap(i) {
    if (wait || api.ended) return;
    wait = true;
    const cells = board.children;
    if (i === changed) score += 3 + Math.floor(round / 3);
    else cells[i].classList.add('bad');
    cells[changed].classList.add('ok');
    round++;
    info();
    api.later(next, 900);
  }
  const go = startButton(api, null, next);
  return api.el('div', { class: 'arc-col' }, [note, board, go]);
}
