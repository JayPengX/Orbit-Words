// 取石子: take any number of stones from one row; whoever takes the last stone
// wins. Three games against Quadra (it slips now and then). Score: 10 a win.
import { nimBest } from '../lib/arcade.mjs';

export default function nim(api) {
  let game = 0;
  let wins = 0;
  let heaps = [];
  let pick = null;
  let busy = false;
  const box = api.el('div', { class: 'nm-heaps' });
  const title = api.el('p', { class: 'arc-hint' });
  const deal = () => {
    heaps = [3 + Math.floor(api.rand() * 3), 4 + Math.floor(api.rand() * 3), 5 + Math.floor(api.rand() * 3)];
    pick = null;
    busy = false;
  };
  const finish = won => {
    if (won) wins++;
    game++;
    paint(won ? api.L('你拿到最後一顆，贏了！', 'You took the last stone: you win!') : api.L('Quadra 拿到最後一顆。', 'Quadra took the last stone.'));
    if (game >= 3) return api.later(() => api.end(wins * 10, api.L(`三盤贏了 ${wins} 盤。`, `Won ${wins} of 3.`)), 800);
    api.later(() => (deal(), paint()), 1100);
  };
  const quadra = () => {
    const m = api.rand() < 0.3 ? (() => {
      const i = heaps.map((h, k) => (h ? k : -1)).filter(k => k >= 0);
      const heap = i[Math.floor(api.rand() * i.length)];
      return { heap, take: 1 + Math.floor(api.rand() * heaps[heap]) };
    })() : nimBest(heaps);
    heaps = heaps.map((h, k) => (k === m.heap ? h - m.take : h));
    busy = false;
    if (heaps.every(h => !h)) return finish(false);
    paint(api.L(`Quadra 從第 ${m.heap + 1} 排拿了 ${m.take} 顆`, `Quadra took ${m.take} from row ${m.heap + 1}`));
  };
  const take = () => {
    if (!pick || busy || api.ended) return;
    heaps = heaps.map((h, k) => (k === pick.heap ? h - pick.n : h));
    pick = null;
    if (heaps.every(h => !h)) return finish(true);
    busy = true;
    paint();
    api.later(quadra, 700);
  };
  const paint = (note = '') => {
    box.replaceChildren(
      ...heaps.map((h, k) =>
        api.el('div', { class: 'nm-row' }, Array.from({ length: h }, (_, j) => api.el('button', {
          class: `nm-stone${pick && pick.heap === k && j >= h - pick.n ? ' picked' : ''}`,
          type: 'button',
          'aria-label': `row ${k + 1}`,
          onclick: () => {
            if (busy || api.ended) return;
            pick = { heap: k, n: h - j };
            paint(note);
          }
        })))
      ),
      api.el('button', { class: 'q-btn primary', type: 'button', disabled: pick ? null : '', text: pick ? api.L(`拿走 ${pick.n} 顆`, `Take ${pick.n}`) : api.L('點石頭選要拿幾顆', 'Tap stones to choose'), onclick: take })
    );
    title.textContent = `${api.L(`第 ${game + 1}/3 盤 · 贏 ${wins}`, `Game ${game + 1}/3 · won ${wins}`)}${note ? ` · ${note}` : ''}`;
    api.set({ score: wins * 10, info: api.L(`第 ${Math.min(3, game + 1)}/3 盤`, `Game ${Math.min(3, game + 1)}/3`) });
  };
  deal();
  paint();
  return api.el('div', { class: 'arc-col' }, [title, box]);
}
