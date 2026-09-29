// 找不同: two pictures, three differences; tap them on the bottom one. Each
// picture has 40 seconds; five pictures.
import { startButton } from './kit.js';

const POOL = '🌲🌳🌴🌵🌷🌸🌼🍀🍁🍄🐝🐞🦋🐌🐛🐦🐤🦆🦉🐟🐠🐬🐳🦀⭐🌙☁️🌈⛅💧🔥🍎🍐🍋'.match(/\p{Extended_Pictographic}️?/gu);
const PICS = 5;
const W = 6;
const H = 5;
export default function spotdiff(api) {
  let pic = 0;
  let score = 0;
  let a;
  let b;
  let diffs;
  let found;
  let stop = null;
  let left = () => 40;
  const top = api.el('div', { class: 'sd-board' });
  const bottom = api.el('div', { class: 'sd-board' });
  const info = () => api.set({ score, info: a ? api.L(`第 ${pic + 1}/${PICS} 張 · 找到 ${found.size}/3 · ${left()} 秒`, `Picture ${pic + 1}/${PICS} · ${found.size}/3 · ${left()}s`) : '' });
  const paint = () => {
    top.replaceChildren(...a.map((e, i) => api.el('span', { class: `sd-cell${found.has(i) ? ' ok' : ''}`, text: e })));
    bottom.replaceChildren(...b.map((e, i) => api.el('button', { class: `sd-cell${found.has(i) ? ' ok' : ''}`, type: 'button', text: e, onclick: () => tap(i) })));
    info();
  };
  const next = () => {
    if (pic >= PICS) return api.end(score, api.L(`${PICS} 張都看完了。`, `All ${PICS} pictures done.`));
    const pal = [...POOL].sort(() => api.rand() - 0.5).slice(0, 7 + pic);
    a = Array.from({ length: W * H }, () => pal[Math.floor(api.rand() * pal.length)]);
    b = [...a];
    diffs = new Set();
    while (diffs.size < 3) diffs.add(Math.floor(api.rand() * W * H));
    for (const i of diffs) {
      let e;
      do e = pal[Math.floor(api.rand() * pal.length)];
      while (e === a[i]);
      b[i] = e;
    }
    found = new Set();
    let t = 40;
    left = () => t;
    stop?.();
    let alive = true;
    stop = () => (alive = false);
    const tick = () => {
      if (!alive || api.ended) return;
      t--;
      info();
      if (t <= 0) return done();
      api.later(tick, 1000);
    };
    api.later(tick, 1000);
    paint();
  };
  const done = () => {
    stop?.();
    for (const i of diffs) found.add(i);
    paint();
    pic++;
    api.later(next, 1100);
  };
  function tap(i) {
    if (api.ended || found.size >= 3) return;
    if (diffs.has(i) && !found.has(i)) {
      found.add(i);
      score += 2 + Math.floor(left() / 10);
      paint();
      if (found.size === 3) done();
    } else if (!diffs.has(i)) {
      score = Math.max(0, score - 1);
      bottom.children[i].classList.add('bad');
      info();
    }
  }
  const go = startButton(api, null, next);
  return api.el('div', { class: 'arc-col' }, [top, bottom, go]);
}
