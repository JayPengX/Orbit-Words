// 接龍 (Klondike, draw one): build the four foundations A to K by suit.
// Tap a card to move it where it fits (a foundation first); tap the stock
// to turn a card. Score: 2 a card on a foundation (104 for all), + a time
// bonus for a finished game.
import { klondikeDeal, klondikeDraw, klondikeAuto, klondikeFound, klondikeWon, klondikeStuck, SUITS, RANKS, isRed } from '../lib/long.mjs';
import { quitButton, row } from './kit.js';

export default function solitaire(api) {
  let g = klondikeDeal(api.rand);
  const history = [];
  const started = Date.now();
  const score = () => klondikeFound(g) * 2 + (klondikeWon(g) ? Math.max(0, Math.round((30 * 60 - (Date.now() - started) / 1000) / 60)) : 0);
  const face = (c, cls = '') =>
    c.up
      ? api.el('span', { class: `sl-card up${isRed(c) ? ' red' : ''}${cls}` }, [api.el('b', { text: RANKS[c.r] }), api.el('i', { text: SUITS[c.s] }), api.el('em', { text: SUITS[c.s] })])
      : api.el('span', { class: `sl-card down${cls}` });
  const doMove = n => {
    if (!n) return shake();
    history.push(g);
    g = n;
    paint();
    if (klondikeWon(g)) return api.end(score(), api.L('全部收齊！', 'All home!'));
  };
  let shaking = 0;
  const shake = () => {
    root.classList.remove('shake');
    void root.offsetWidth;
    root.classList.add('shake');
    clearTimeout(shaking);
    shaking = setTimeout(() => root.classList.remove('shake'), 300);
  };
  const top = api.el('div', { class: 'sl-top' });
  const tab = api.el('div', { class: 'sl-tab' });
  const note = api.el('p', { class: 'arc-hint small' });
  const paint = () => {
    const stock = api.el('button', { class: 'sl-slot stock', type: 'button', 'aria-label': api.L('翻牌', 'Turn a card'), onclick: () => !api.ended && doMove(klondikeDraw(g)) }, [g.stock.length ? face({ up: false }) : api.el('span', { class: 'sl-empty', text: '↻' })]);
    const waste = api.el('button', { class: 'sl-slot', type: 'button', onclick: () => !api.ended && g.waste.length && doMove(klondikeAuto(g, { from: 'waste' })) }, [g.waste.length ? face(g.waste.at(-1)) : api.el('span', { class: 'sl-empty' })]);
    const found = g.found.map((p, f) => api.el('button', { class: 'sl-slot found', type: 'button', onclick: () => !api.ended && p.length && doMove(klondikeAuto(g, { from: 'found', f })) }, [p.length ? face(p.at(-1)) : api.el('span', { class: 'sl-empty', text: SUITS[f] })]));
    top.replaceChildren(stock, waste, api.el('span', { class: 'sl-gap' }), ...found);
    tab.replaceChildren(
      ...g.tableau.map((pile, col) =>
        api.el(
          'div',
          { class: 'sl-pile' },
          pile.length
            ? pile.map((c, i) => {
                const b = api.el('button', { class: `sl-in${i && !pile[i - 1].up ? ' after-down' : ''}`, type: 'button', disabled: !c.up || api.ended, onclick: () => doMove(klondikeAuto(g, { from: 'tab', col, i })) }, [face(c)]);
                return b;
              })
            : [api.el('span', { class: 'sl-empty' })]
        )
      )
    );
    note.textContent = api.L(`已收 ${klondikeFound(g)}/52 · ${g.moves} 步${klondikeStuck(g) ? ' · 沒有可以走的了' : ''}`, `${klondikeFound(g)}/52 home · ${g.moves} moves${klondikeStuck(g) ? ' · no moves left' : ''}`);
    api.set({ score: score(), info: api.L(`${klondikeFound(g)}/52`, `${klondikeFound(g)}/52`) });
  };
  const undo = api.el('button', { class: 'q-btn small', type: 'button', text: api.L('上一步', 'Undo'), onclick: () => history.length && !api.ended && ((g = history.pop()), paint()) });
  const root = api.el('div', { class: 'arc-col sl' }, [top, tab, note, row(api, [undo, quitButton(api, score)])]);
  paint();
  return root;
}
