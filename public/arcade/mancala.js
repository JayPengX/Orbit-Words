// 播棋 (Mancala / Kalah) against Quadra: pick one of your pits and sow its
// stones one by one counter-clockwise. Last stone in your store: go again.
// Last stone in an empty pit of yours: take it and the stones across. Score:
// stones in your store, +10 for a win.
import { quitButton, row } from './kit.js';

// Pits 0-5 yours (left to right), 6 your store, 7-12 Quadra's, 13 its store.
export function sow(b, pit) {
  const s = [...b];
  const me = pit < 6 ? 0 : 1;
  const skip = me ? 6 : 13;
  let n = s[pit];
  s[pit] = 0;
  let i = pit;
  while (n) {
    i = (i + 1) % 14;
    if (i === skip) continue;
    s[i]++;
    n--;
  }
  const store = me ? 13 : 6;
  const mine = k => (me ? k >= 7 && k <= 12 : k >= 0 && k <= 5);
  if (mine(i) && s[i] === 1 && s[12 - i] > 0) {
    s[store] += s[12 - i] + 1;
    s[i] = s[12 - i] = 0;
  }
  let over = false;
  if ([0, 1, 2, 3, 4, 5].every(k => !s[k]) || [7, 8, 9, 10, 11, 12].every(k => !s[k])) {
    for (let k = 0; k < 6; k++) (s[6] += s[k]), (s[k] = 0);
    for (let k = 7; k < 13; k++) (s[13] += s[k]), (s[k] = 0);
    over = true;
  }
  return { b: s, again: i === store && !over, over };
}
function search(b, depth, quadra) {
  const pits = quadra ? [7, 8, 9, 10, 11, 12] : [0, 1, 2, 3, 4, 5];
  let best = quadra ? -Infinity : Infinity;
  let pick = -1;
  for (const p of pits) {
    if (!b[p]) continue;
    const r = sow(b, p);
    const v = r.over || depth <= 1 ? r.b[13] - r.b[6] : search(r.b, depth - 1, r.again ? quadra : !quadra).v;
    if (quadra ? v > best : v < best) (best = v), (pick = p);
  }
  return pick < 0 ? { v: b[13] - b[6], pick } : { v: best, pick };
}
export const mancalaBest = (b, depth = 6) => search(b, depth, true).pick;
export default function mancala(api) {
  let b = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
  let busy = false;
  let last = -1;
  const score = () => b[6] + (b[6] > 24 ? 10 : 0);
  const board = api.el('div', { class: 'mc-board' });
  const note = api.el('p', { class: 'arc-hint' });
  const finish = () => {
    paint();
    api.end(score(), b[6] > b[13] ? api.L(`${b[6]} 比 ${b[13]}，你贏了！`, `${b[6]} to ${b[13]}: you win!`) : b[6] === b[13] ? api.L('平手！', 'A draw!') : api.L(`${b[6]} 比 ${b[13]}，Quadra 贏了。`, `${b[6]} to ${b[13]}: Quadra wins.`));
  };
  const quadra = () => {
    if (api.ended) return;
    const p = mancalaBest(b);
    if (p < 0) return finish();
    const r = sow(b, p);
    b = r.b;
    last = p;
    if (r.over) return finish();
    if (r.again) return (paint(), api.later(quadra, 700));
    busy = false;
    paint();
  };
  function play(p) {
    if (busy || api.ended || !b[p]) return;
    const r = sow(b, p);
    b = r.b;
    last = p;
    if (r.over) return finish();
    if (!r.again) {
      busy = true;
      api.later(quadra, 700);
    }
    paint();
  }
  const pit = (k, cls = '') => api.el('button', { class: `mc-pit ${cls}${k === last ? ' last' : ''}`, type: 'button', disabled: k > 6 || k === 6 || busy || !b[k], onclick: () => play(k) }, [api.el('b', { text: String(b[k]) }), api.el('span', { class: 'mc-stones', text: '●'.repeat(Math.min(b[k], 12)) })]);
  const paint = () => {
    board.replaceChildren(
      api.el('div', { class: 'mc-store them' }, [api.el('b', { text: String(b[13]) }), api.el('small', { text: 'Quadra' })]),
      api.el('div', { class: 'mc-row them' }, [12, 11, 10, 9, 8, 7].map(k => pit(k, 'them'))),
      api.el('div', { class: 'mc-row me' }, [0, 1, 2, 3, 4, 5].map(k => pit(k, 'me'))),
      api.el('div', { class: 'mc-store me' }, [api.el('b', { text: String(b[6]) }), api.el('small', { text: api.L('你', 'You') })])
    );
    note.textContent = busy ? api.L('Quadra 下…', 'Quadra’s move…') : api.L('點你這排（下面）的一格播種', 'Tap one of your pits (bottom row)');
    api.set({ score: score(), info: `${b[6]} : ${b[13]}` });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [note, board, row(api, [quitButton(api, score)])]);
}
