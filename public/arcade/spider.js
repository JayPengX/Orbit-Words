// 蜘蛛接龍 (Spider, two suits): build K down to A in one suit inside a column
// and the run leaves the table. Tap a card to move it (with the same-suit run
// under it) onto a card one higher; tap the stock to deal ten more. A finished
// run scores 10, each hidden card turned up scores ½.
import { cardEl, deck, quitButton, row } from './kit.js';

export const spiderRun = (col, i) => col[i]?.up && col.slice(i).every((c, k, run) => !k || (c.s === run[k - 1].s && c.r === run[k - 1].r - 1));
export default function spider(api) {
  const all = deck(api.rand, [0, 1, 0, 1, 0, 1, 0, 1]);
  let g = { cols: Array.from({ length: 10 }, (_, k) => all.splice(0, k < 4 ? 6 : 5).map((c, i, a) => ({ ...c, up: i === a.length - 1 }))), stock: all.map(c => ({ ...c, up: true })), sets: 0, turned: 0 };
  const hist = [];
  const t0 = Date.now();
  const score = () => g.sets * 10 + Math.floor(g.turned / 2) + (g.sets === 8 ? Math.max(0, 20 - Math.floor((Date.now() - t0) / 120000)) : 0);
  const settle = col => {
    if (col.length >= 13 && spiderRun(col, col.length - 13) && col.at(-13).r === 13) {
      col.splice(col.length - 13);
      g.sets++;
    }
    if (col.length && !col.at(-1).up) {
      col.at(-1).up = true;
      g.turned++;
    }
  };
  const done = () => {
    paint();
    if (g.sets === 8) api.end(score(), api.L('八組全部完成！', 'All eight runs done!'));
  };
  function tap(ci, i) {
    if (api.ended) return;
    const col = g.cols[ci];
    if (!spiderRun(col, i)) return shake();
    const c = col[i];
    const others = g.cols.map((_, k) => k).filter(k => k !== ci);
    const to = others.find(k => g.cols[k].at(-1)?.r === c.r + 1 && g.cols[k].at(-1).s === c.s) ?? others.find(k => g.cols[k].at(-1)?.r === c.r + 1) ?? (i ? others.find(k => !g.cols[k].length) : undefined);
    if (to === undefined) return shake();
    hist.push(JSON.stringify(g));
    g.cols[to].push(...col.splice(i));
    settle(col);
    settle(g.cols[to]);
    done();
  }
  const deal = () => {
    if (api.ended || !g.stock.length) return;
    hist.push(JSON.stringify(g));
    g.cols.forEach(col => col.push(g.stock.pop()));
    g.cols.forEach(settle);
    done();
  };
  const shake = () => {
    felt.classList.remove('shake');
    void felt.offsetWidth;
    felt.classList.add('shake');
  };
  const tab = api.el('div', { class: 'cg-tab', style: 'grid-template-columns: repeat(10, 1fr)' });
  const stock = api.el('button', { class: 'q-btn small', type: 'button', onclick: deal });
  const paint = () => {
    tab.replaceChildren(...g.cols.map((col, ci) => api.el('div', { class: 'cg-pile' }, col.length ? col.map((c, i) => cardEl(api, c, { up: c.up, cls: 'fl', onclick: c.up ? () => tap(ci, i) : null })) : [api.el('span', { class: 'pc-slot fl' })])));
    stock.textContent = api.L(`發牌（剩 ${g.stock.length / 10} 次）`, `Deal (${g.stock.length / 10} left)`);
    stock.disabled = !g.stock.length;
    api.set({ score: score(), info: api.L(`完成 ${g.sets}/8 組`, `${g.sets}/8 runs`) });
  };
  const undo = api.el('button', { class: 'q-btn small', type: 'button', text: api.L('上一步', 'Undo'), onclick: () => hist.length && !api.ended && ((g = JSON.parse(hist.pop())), paint()) });
  const felt = api.el('div', { class: 'arc-col felt cg spider' }, [tab]);
  paint();
  return api.el('div', { class: 'arc-col' }, [felt, row(api, [stock, undo, quitButton(api, score)])]);
}
