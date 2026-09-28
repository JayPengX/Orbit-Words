// Shared pieces for the arcade games' screens (see games-ui.js's arcadeView
// for `api`).

export const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

// A countdown of `seconds`: onTick(left) each second, onEnd() at 0.
export function countdown(api, seconds, onTick, onEnd) {
  let left = seconds;
  onTick(left);
  api.every(() => {
    if (api.ended) return;
    left--;
    onTick(left);
    if (left <= 0) onEnd();
  }, 1000);
  return () => left;
}

// A big start button in `stage`, removed when pressed.
export function startButton(api, text, onStart) {
  const b = api.el('button', { class: 'q-btn primary game-big-button arc-start', type: 'button', text: text || api.t('gameStart') });
  b.addEventListener('click', () => {
    b.remove();
    onStart();
  });
  return b;
}

// On-screen arrows (for phones): fn('up' | 'down' | 'left' | 'right').
export function dpad(api, fn, { action = null } = {}) {
  const btn = (dir, label) => api.el('button', { class: `arc-pad-btn ${dir}`, type: 'button', 'aria-label': dir, text: label, onpointerdown: e => (e.preventDefault(), fn(dir)) });
  return api.el('div', { class: 'arc-pad' }, [btn('up', '▲'), btn('left', '◀'), action ? api.el('button', { class: 'arc-pad-btn action', type: 'button', text: action.label, onpointerdown: e => (e.preventDefault(), action.fn()) }) : api.el('span'), btn('right', '▶'), btn('down', '▼')]);
}

// A canvas game: a loop at the screen's frame rate once started (a tap, or
// a key), step(dt) moving things and draw(c) painting; `input(kind, x, y)`
// for taps and keys. Returns the stage.
export function canvasGame(api, W, H, { step, draw, input, hint }) {
  const { canvas, ctx } = api.canvas(W, H);
  canvas.classList.add('arc-canvas');
  canvas.style.aspectRatio = `${W} / ${H}`;
  let started = false;
  let last = 0;
  const loop = now => {
    const dt = Math.min(48, now - (last || now));
    last = now;
    if (started && !api.ended) step(dt);
    draw(ctx, started);
    if (!started) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '800 22px system-ui, sans-serif';
      ctx.fillText(api.t('arcadeTapStart'), W / 2, H / 2);
      if (hint) {
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillText(hint, W / 2, H / 2 + 24);
      }
      ctx.restore();
    }
    return !api.ended;
  };
  const point = e => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const begin = () => {
    if (!started) {
      started = true;
      return true;
    }
    return false;
  };
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    const [x, y] = point(e);
    if (begin()) return input?.('start', x, y);
    input?.('down', x, y);
  });
  canvas.addEventListener('pointermove', e => started && input?.('move', ...point(e)));
  canvas.addEventListener('pointerup', e => started && input?.('up', ...point(e)));
  api.onKey(dir => {
    if (begin()) return input?.('start');
    input?.(dir);
  });
  api.animate(loop);
  return api.el('div', { class: 'arc-stage' }, [canvas]);
}

// Numbers drawn at the canvas's top.
export function hudText(c, W, left, right) {
  c.save();
  c.font = '800 16px system-ui, sans-serif';
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.textAlign = 'left';
  c.fillText(left, 10, 22);
  c.textAlign = 'right';
  c.fillText(right, W - 10, 22);
  c.restore();
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// A button to end the round now, paid for what's done.
export function quitButton(api, score) {
  return api.el('button', { class: 'q-btn small arc-quit', type: 'button', text: api.L('結束這局', 'End the round'), onclick: () => api.end(score()) });
}
// A row of buttons under a board.
export const row = (api, kids) => api.el('div', { class: 'arc-row' }, kids.filter(Boolean));
