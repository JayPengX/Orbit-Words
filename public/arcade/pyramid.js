// 金字塔 (Pyramid): pair two uncovered cards that add up to 13 (J 11, Q 12,
// K 13 goes alone) to clear the pyramid. The stock turns one card at a time,
// through twice more. Three pyramids at most.
import { cardEl, deck, quitButton, row } from './kit.js';

const covered = (gone, r, k) => r < 6 && (!gone.has(`${r + 1},${k}`) || !gone.has(`${r + 1},${k + 1}`));
export default function pyramid(api) {
  const ROUNDS = 3;
  let round = 0;
  let score = 0;
  let pyr;
  let gone;
  let stock;
  let waste;
  let redeals;
  let sel = null;
  const newDeal = () => {
    const d = deck(api.rand);
    pyr = Array.from({ length: 7 }, (_, r) => d.splice(0, r + 1));
    stock = d;
    waste = [];
    gone = new Set();
    redeals = 2;
    sel = null;
  };
  newDeal();
  const free = () => {
    const out = [];
    pyr.forEach((line, r) => line.forEach((c, k) => !gone.has(`${r},${k}`) && !covered(gone, r, k) && out.push(c)));
    if (waste.length) out.push(waste.at(-1));
    return out;
  };
  const stuck = () => !stock.length && (!redeals || !waste.length) && !free().some((a, i, f) => a.r === 13 || f.some((b, j) => j > i && a.r + b.r === 13));
  const take = where => {
    if (where === 'w') waste.pop();
    else {
      gone.add(where);
      score++;
    }
  };
  function pick(where, c) {
    if (api.ended) return;
    if (c.r === 13) take(where);
    else if (sel && sel.where !== where && sel.c.r + c.r === 13) {
      take(sel.where);
      take(where);
    } else {
      sel = sel?.where === where ? null : { where, c };
      return paint();
    }
    sel = null;
    after();
  }
  const after = () => {
    if (gone.size === 28) {
      score += 8;
      round++;
      if (round >= ROUNDS) return (paint(), api.end(score, api.L('三座金字塔都清光！', 'All three pyramids cleared!')));
      newDeal();
    } else if (stuck()) {
      paint();
      return api.end(score, api.L(`清掉 ${score} 分，沒有牌可以配了。`, `No more pairs.`));
    }
    paint();
  };
  const turn = () => {
    if (api.ended) return;
    if (stock.length) waste.push(stock.pop());
    else if (redeals && waste.length) {
      redeals--;
      stock = waste.reverse();
      waste = [];
    }
    sel = null;
    after();
  };
  const board = api.el('div', { class: 'pyr' });
  const side = api.el('div', { class: 'cg-top pyr-side' });
  const paint = () => {
    board.replaceChildren(
      ...pyr.map((line, r) =>
        api.el('div', { class: 'pyr-row', style: `--n: ${r + 1}` }, line.map((c, k) => {
          const where = `${r},${k}`;
          if (gone.has(where)) return api.el('span', { class: 'pc-gap' });
          const open = !covered(gone, r, k);
          return cardEl(api, c, { cls: `fl${sel?.where === where ? ' sel' : ''}`, onclick: open ? () => pick(where, c) : null });
        }))
      )
    );
    side.replaceChildren(
      api.el('button', { class: 'pc fl back', type: 'button', onclick: turn }, [api.el('span', { class: 'pc-s', text: stock.length ? String(stock.length) : redeals && waste.length ? '↻' : '' })]),
      waste.length ? cardEl(api, waste.at(-1), { cls: `fl${sel?.where === 'w' ? ' sel' : ''}`, onclick: () => pick('w', waste.at(-1)) }) : api.el('span', { class: 'pc-slot fl' })
    );
    api.set({ score, info: api.L(`第 ${round + 1}/${ROUNDS} 座 · 剩 ${28 - gone.size} 張 · 可再翻 ${redeals} 輪`, `Pyramid ${round + 1}/${ROUNDS} · ${28 - gone.size} left · ${redeals} redeals`) });
  };
  paint();
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'arc-col felt cg' }, [board, side]), api.el('p', { class: 'arc-hint small', text: api.L('兩張加起來 13 就消掉（J=11 Q=12 K=13 自己消）', 'Pairs making 13 clear (J 11, Q 12, K alone)') }), row(api, [quitButton(api, () => score)])]);
}
