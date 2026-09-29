// 新接龍 (FreeCell): every card dealt face up into eight columns; four free
// cells hold one card each. Build the four foundations A to K by suit. Tap a
// card (or the run under it) to send it where it fits: home first, then onto
// a column, an empty column, a free cell. A card home scores 1; finishing
// adds a time bonus.
import { cardEl, deck, quitButton, row, SUITS } from './kit.js';

export const fcFits = (c, col) => !col.length || (col.at(-1).r === c.r + 1 && col.at(-1).red !== c.red);
export const fcRun = (col, i) => col.slice(i).every((c, k, run) => !k || (c.r === run[k - 1].r - 1 && c.red !== run[k - 1].red));
export default function freecell(api) {
  let g = { cols: Array.from({ length: 8 }, () => []), cells: [null, null, null, null], home: [0, 0, 0, 0] };
  deck(api.rand).forEach((c, i) => g.cols[i % 8].push(c));
  const hist = [];
  const t0 = Date.now();
  const home = () => g.home.reduce((a, b) => a + b, 0);
  const score = () => home() + (home() === 52 ? Math.max(0, 38 - 2 * Math.floor((Date.now() - t0) / 60000)) : 0);
  const canHome = c => g.home[c.s] === c.r - 1;
  const room = toEmpty => (g.cells.filter(x => !x).length + 1) * 2 ** (g.cols.filter(c => !c.length).length - (toEmpty ? 1 : 0));
  // Cards that can't be needed any more go home by themselves.
  const safe = c => canHome(c) && (c.r <= 2 || (c.red ? [0, 3] : [1, 2]).every(s => g.home[s] >= c.r - 1));
  const autoHome = () => {
    for (let moved = true; moved; ) {
      moved = false;
      g.cells.forEach((c, k) => c && safe(c) && ((g.home[c.s] = c.r), (g.cells[k] = null), (moved = true)));
      g.cols.forEach(col => col.length && safe(col.at(-1)) && ((g.home[col.at(-1).s] = col.pop().r), (moved = true)));
    }
  };
  const commit = () => {
    autoHome();
    paint();
    if (home() === 52) api.end(score(), api.L('全部收齊！', 'All home!'));
  };
  const save = () => hist.push(JSON.stringify(g));
  // Somewhere for `run` (from column `from`, or a free cell when from < 0).
  const place = (run, from, whole) => {
    if (run.length === 1 && canHome(run[0])) return ['home'];
    const cols = g.cols.map((col, k) => k).filter(k => k !== from);
    const onto = cols.find(k => g.cols[k].length && fcFits(run[0], g.cols[k]) && run.length <= room(false));
    if (onto !== undefined) return ['col', onto];
    const empty = cols.find(k => !g.cols[k].length);
    if (empty !== undefined && !whole && run.length <= room(true)) return ['col', empty];
    if (run.length === 1 && from >= 0) {
      const k = g.cells.indexOf(null);
      if (k >= 0) return ['cell', k];
    }
    return null;
  };
  function tapCol(ci, i) {
    if (api.ended) return;
    const col = g.cols[ci];
    if (!fcRun(col, i)) return shake();
    const run = col.slice(i);
    const to = place(run, ci, i === 0);
    if (!to) return shake();
    save();
    col.splice(i);
    if (to[0] === 'home') g.home[run[0].s] = run[0].r;
    else if (to[0] === 'col') g.cols[to[1]].push(...run);
    else g.cells[to[1]] = run[0];
    commit();
  }
  function tapCell(k) {
    const c = g.cells[k];
    if (api.ended || !c) return;
    const to = place([c], -1, false);
    if (!to) return shake();
    save();
    g.cells[k] = null;
    if (to[0] === 'home') g.home[c.s] = c.r;
    else g.cols[to[1]].push(c);
    commit();
  }
  const shake = () => {
    root.classList.remove('shake');
    void root.offsetWidth;
    root.classList.add('shake');
  };
  const top = api.el('div', { class: 'cg-top' });
  const tab = api.el('div', { class: 'cg-tab', style: 'grid-template-columns: repeat(8, 1fr)' });
  const paint = () => {
    top.replaceChildren(
      ...g.cells.map((c, k) => (c ? cardEl(api, c, { cls: 'fl', onclick: () => tapCell(k) }) : api.el('span', { class: 'pc-slot fl' }))),
      ...g.home.map((r, s) => (r ? cardEl(api, { r, s, red: s === 1 || s === 2 }, { cls: 'fl' }) : api.el('span', { class: 'pc-slot fl', text: SUITS[s] })))
    );
    tab.replaceChildren(...g.cols.map((col, ci) => api.el('div', { class: 'cg-pile' }, col.length ? col.map((c, i) => cardEl(api, c, { cls: 'fl', onclick: () => tapCol(ci, i) })) : [api.el('span', { class: 'pc-slot fl' })])));
    api.set({ score: score(), info: api.L(`已收 ${home()}/52`, `${home()}/52 home`) });
  };
  const undo = api.el('button', { class: 'q-btn small', type: 'button', text: api.L('上一步', 'Undo'), onclick: () => hist.length && !api.ended && ((g = JSON.parse(hist.pop())), paint()) });
  const root = api.el('div', { class: 'arc-col felt cg' }, [top, tab]);
  autoHome();
  paint();
  return api.el('div', { class: 'arc-col' }, [root, api.el('p', { class: 'arc-hint small', text: api.L('點牌自動移到能放的地方；一次能搬幾張看空位多少', 'Tap a card to move it where it fits; how many move at once depends on free spaces') }), row(api, [undo, quitButton(api, score)])]);
}
