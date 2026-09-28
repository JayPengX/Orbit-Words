// 跳棋 (English draughts) against Quadra: you are red and move up. Tap a
// piece, then where it goes (the dots). Captures are compulsory and a piece
// keeps jumping while it can; the far row crowns it (♛, moves both ways).
// Score: each piece taken 3, a win +40, a draw +10.
import { checkersStart, checkersMoves, checkersPlay, checkersAI, checkersCount } from '../lib/long.mjs';
import { quitButton, row } from './kit.js';

export default function checkers(api) {
  let b = checkersStart();
  let sel = -1;
  let taken = 0;
  let busy = false;
  let quiet = 0;
  const cells = Array.from({ length: 64 }, (_, i) => api.el('button', { class: 'ck-cell', type: 'button', onclick: () => tap(i) }));
  const note = api.el('p', { class: 'arc-hint' });
  const score = (bonus = 0) => taken * 3 + bonus;
  const mine = () => checkersMoves(b, 1);
  const paint = () => {
    const moves = mine();
    const from = new Set(moves.map(m => m.from));
    const to = new Set(moves.filter(m => m.from === sel).map(m => m.to));
    cells.forEach((c, i) => {
      const dark = (Math.floor(i / 8) + (i % 8)) % 2 === 1;
      const p = b[i];
      c.className = `ck-cell${dark ? ' dark' : ''}${i === sel ? ' sel' : ''}${to.has(i) ? ' to' : ''}${!busy && from.has(i) && sel < 0 ? ' can' : ''}`;
      c.replaceChildren(p ? api.el('span', { class: `ck-piece ${p === 1 || p === 3 ? 'me' : 'ai'}`, text: p > 2 ? '♛' : '' }) : '');
    });
    api.set({ score: score(), info: api.L(`你 ${checkersCount(b, 1)} · Quadra ${checkersCount(b, 2)}`, `You ${checkersCount(b, 1)} · Quadra ${checkersCount(b, 2)}`) });
  };
  const over = () => {
    if (!checkersCount(b, 2) || !checkersMoves(b, 2).length) return api.end(score(40), api.L('你贏了！', 'You win!'));
    if (!checkersCount(b, 1) || !mine().length) return api.end(score(), api.L('Quadra 贏了。', 'Quadra wins.'));
    if (quiet >= 60) return api.end(score(10), api.L('和局（30 回合沒有吃子）。', 'A draw (30 moves without a capture).'));
    return false;
  };
  const tap = i => {
    if (api.ended || busy) return;
    const moves = mine();
    const m = moves.find(x => x.from === sel && x.to === i);
    if (m) {
      b = checkersPlay(b, m);
      taken += m.take.length;
      quiet = m.take.length ? 0 : quiet + 1;
      sel = -1;
      paint();
      if (over() !== false) return;
      busy = true;
      note.textContent = api.L('Quadra 想一下…', 'Quadra is thinking…');
      api.later(() => {
        const r = checkersAI(b, 4, api.rand);
        if (r) {
          b = checkersPlay(b, r);
          quiet = r.take.length ? 0 : quiet + 1;
        }
        busy = false;
        note.textContent = mine().some(x => x.take.length) ? api.L('一定要吃子。', 'You must capture.') : api.L('輪到你（紅）。', 'Your move (red).');
        paint();
        over();
      }, 450);
      return;
    }
    sel = moves.some(x => x.from === i) ? i : -1;
    paint();
  };
  note.textContent = api.L('你是紅棋，先走。', 'You’re red: your move.');
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'ck-grid' }, cells), note, row(api, [quitButton(api, () => score())])]);
}
