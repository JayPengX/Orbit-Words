// 貪食蛇: eat apples, don't hit the walls or yourself. Score: apples eaten.
import { canvasGame, dpad, hudText } from './kit.js';

export default function snake(api) {
  const N = 16;
  const S = 20;
  const W = N * S;
  let body = [[8, 8], [7, 8], [6, 8]];
  let dir = [1, 0];
  let queue = [];
  let apple = place();
  let score = 0;
  let acc = 0;
  function place() {
    for (;;) {
      const p = [Math.floor(api.rand() * N), Math.floor(api.rand() * N)];
      if (!body.some(([x, y]) => x === p[0] && y === p[1])) return p;
    }
  }
  const turn = d => {
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    if (!v) return;
    const last = queue.at(-1) || dir;
    if (v[0] === -last[0] && v[1] === -last[1]) return;
    if (queue.length < 3) queue.push(v);
  };
  const stage = canvasGame(api, W, W, {
    hint: api.L('滑動或方向鍵轉彎', 'Swipe or use the arrows'),
    step(dt) {
      acc += dt;
      const every = Math.max(70, 150 - score * 3);
      while (acc >= every && !api.ended) {
        acc -= every;
        if (queue.length) dir = queue.shift();
        const head = [body[0][0] + dir[0], body[0][1] + dir[1]];
        if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || body.some(([x, y]) => x === head[0] && y === head[1])) return api.end(score);
        body.unshift(head);
        if (head[0] === apple[0] && head[1] === apple[1]) {
          score++;
          api.set({ score });
          apple = place();
        } else body.pop();
      }
    },
    draw(c) {
      c.fillStyle = '#0f172a';
      c.fillRect(0, 0, W, W);
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) (c.fillStyle = '#111c33'), c.fillRect(x * S, y * S, S, S);
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.arc(apple[0] * S + S / 2, apple[1] * S + S / 2, S / 2.4, 0, Math.PI * 2);
      c.fill();
      body.forEach(([x, y], i) => {
        c.fillStyle = i === 0 ? '#4ade80' : `hsl(142, 70%, ${45 - Math.min(20, i)}%)`;
        c.beginPath();
        c.roundRect(x * S + 1, y * S + 1, S - 2, S - 2, 5);
        c.fill();
      });
      hudText(c, W, `🍎 ${score}`, '');
    },
    input(kind) {
      if (['up', 'down', 'left', 'right'].includes(kind)) turn(kind);
    }
  });
  api.swipe(stage, d => turn(d));
  return api.el('div', { class: 'arc-col' }, [stage, dpad(api, turn)]);
}
