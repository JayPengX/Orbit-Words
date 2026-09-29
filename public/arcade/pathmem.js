// 路徑記憶: watch a path light up across the grid, then tap it in order. It
// grows by one each time; three mistakes end it.
import { startButton } from './kit.js';

const N = 5;
export default function pathmem(api) {
  let path = [];
  let at = 0;
  let lives = 3;
  let score = 0;
  let showing = true;
  const cells = Array.from({ length: N * N }, (_, i) => api.el('button', { class: 'gcell pm', type: 'button', onclick: () => tap(i) }));
  const info = () => api.set({ score, info: api.L(`長度 ${path.length} · ♥ ${lives}`, `Length ${path.length} · ♥ ${lives}`) });
  const extend = () => {
    let cur = path.at(-1) ?? Math.floor(api.rand() * N * N);
    if (!path.length) return path.push(cur);
    const opts = [];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const r = Math.floor(cur / N) + dr;
      const c = (cur % N) + dc;
      if (r >= 0 && r < N && c >= 0 && c < N && !path.includes(r * N + c)) opts.push(r * N + c);
    }
    cur = opts.length ? opts[Math.floor(api.rand() * opts.length)] : [...Array(N * N).keys()].find(k => !path.includes(k));
    path.push(cur);
  };
  const play = () => {
    showing = true;
    at = 0;
    cells.forEach(c => (c.className = 'gcell pm'));
    info();
    path.forEach((k, j) => {
      api.later(() => cells[k].classList.add('lit'), 500 + j * 450);
      api.later(() => cells[k].classList.remove('lit'), 500 + j * 450 + 350);
    });
    api.later(() => (showing = false), 500 + path.length * 450);
  };
  function tap(i) {
    if (showing || api.ended || !path.length) return;
    if (i === path[at]) {
      cells[i].classList.add('ok');
      at++;
      if (at === path.length) {
        score += path.length - 2;
        extend();
        api.later(play, 500);
      }
    } else {
      cells[i].classList.add('bad');
      lives--;
      info();
      if (lives <= 0) return api.end(score, api.L(`記到 ${path.length - 1} 步。`, `Remembered ${path.length - 1} steps.`));
      api.later(play, 700);
    }
    info();
  }
  const go = startButton(api, null, () => {
    for (let k = 0; k < 3; k++) extend();
    play();
  });
  return api.el('div', { class: 'arc-col' }, [api.el('div', { class: 'gboard', style: `grid-template-columns: repeat(${N}, 1fr)` }, cells), go]);
}
