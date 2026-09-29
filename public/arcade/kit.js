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
  // Thick chevrons drawn as SVG (the ▲ ◀ characters render hairline-thin on iPhones).
  const ROT = { up: 0, right: 90, down: 180, left: 270 };
  const arrow = dir => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<path d="M5 15.5 12 8.5l7 7" transform="rotate(${ROT[dir]} 12 12)" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    return svg;
  };
  const btn = dir => {
    const b = api.el('button', { class: `arc-pad-btn ${dir}`, type: 'button', 'aria-label': dir, onpointerdown: e => (e.preventDefault(), fn(dir)) });
    b.append(arrow(dir));
    return b;
  };
  return api.el('div', { class: 'arc-pad' }, [btn('up'), btn('left'), action ? api.el('button', { class: 'arc-pad-btn action', type: 'button', text: action.label, onpointerdown: e => (e.preventDefault(), action.fn()) }) : api.el('span'), btn('right'), btn('down')]);
}

// A canvas game: a loop at the screen's frame rate once started (a tap, or
// a key, an on-screen arrow or swipe via stage.press), step(dt) moving things and draw(c) painting; `input(kind, x, y)`
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
  const stage = api.el('div', { class: 'arc-stage' }, [canvas]);
  // An on-screen arrow or a swipe: starts the game too, and counts as that move.
  stage.press = dir => {
    if (begin()) input?.('start');
    input?.(dir);
  };
  return stage;
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

// ---- A timed quiz: questions one after another against the clock -------------------
//
// ask(level 0-1, index) returns { prompt: text or node, choices: [text or node], answer:
// index, wide? } ; a right answer scores 1 (bonus: fast ones more), a wrong one
// takes 1 off. Used by the quick-answer games (words, numbers, patterns…).
export function quiz(api, { seconds = 60, ask, start = null, wide = false, per = 1 }) {
  let score = 0;
  let right = 0;
  let asked = 0;
  let left = () => seconds;
  let lock = false;
  const prompt = api.el('div', { class: 'qz-prompt' });
  const opts = api.el('div', { class: `qz-opts${wide ? ' wide' : ''}` });
  const info = () => api.L(`${left()} 秒 · 答對 ${right}`, `${left()}s · ${right} right`);
  const next = () => {
    lock = false;
    const q = ask(Math.min(1, right / 20), asked++);
    prompt.replaceChildren(typeof q.prompt === 'string' ? api.el('span', { text: q.prompt }) : q.prompt);
    opts.className = `qz-opts${q.wide ?? wide ? ' wide' : ''}`;
    opts.replaceChildren(
      ...q.choices.map((c, i) =>
        api.el('button', { class: 'qz-opt', type: 'button', onclick: e => {
          if (api.ended || lock) return;
          lock = true;
          const ok = i === q.answer;
          if (ok) (score += per, right++);
          else score = Math.max(0, score - 1);
          e.currentTarget.classList.add(ok ? 'ok' : 'bad');
          if (!ok) opts.children[q.answer]?.classList.add('ok');
          api.set({ score, info: info() });
          api.later(next, ok ? 180 : 650);
        } }, [typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c])
      )
    );
  };
  const go = () => {
    left = countdown(api, seconds, () => api.set({ score, info: info() }), () => api.end(score, api.L(`答對 ${right} 題。`, `${right} right.`)));
    next();
  };
  const btn = startButton(api, start, go);
  return api.el('div', { class: 'arc-col qz' }, [prompt, opts, btn]);
}

// ---- Playing cards ---------------------------------------------------------------------
export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
// A shuffled deck: { r: 1-13, s: 0-3, red }.
export function deck(rand, suits = [0, 1, 2, 3]) {
  const d = [];
  for (const s of suits) for (let r = 1; r <= 13; r++) d.push({ r, s, red: s === 1 || s === 2, id: `${r}${s}` });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
// A card's face (or its back), as a button.
export function cardEl(api, c, { up = true, onclick = null, cls = '' } = {}) {
  const b = api.el('button', { class: `pc ${up ? (c.red ? 'red' : 'black') : 'back'} ${cls}`, type: 'button', onclick, disabled: onclick ? null : true });
  if (up) b.append(api.el('span', { class: 'pc-r', text: RANKS[c.r - 1] }), api.el('span', { class: 'pc-s', text: SUITS[c.s] }));
  return b;
}

// ---- Latin squares (futoshiki, skyscrapers) ---------------------------------------------
// An n×n grid where every row and column holds 1…n once.
export function latin(n, rand) {
  const base = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ((r + c) % n) + 1));
  const perm = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const rows = perm([...Array(n).keys()]);
  const cols = perm([...Array(n).keys()]);
  const syms = perm([...Array(n).keys()].map(i => i + 1));
  return rows.map(r => cols.map(c => syms[base[r][c] - 1]));
}

// ---- A number grid with a keypad (skyscrapers, futoshiki, magic squares) --------------
// cells: n×n values (0 empty), given: which are fixed. Tap a square, then a number.
// onChange(values) after every entry; decorate(i, cell) adds clues or marks.
export function numberGrid(api, { n, cols = n, values, given, max = n, onChange, decorate = null, cls = '' }) {
  let sel = values.findIndex((v, i) => !given[i]);
  const cells = values.map((_, i) => api.el('button', { class: 'gcell', type: 'button', onclick: () => ((sel = i), paint()) }));
  const board = api.el('div', { class: `gboard ${cls}`, style: `grid-template-columns: repeat(${cols}, 1fr)` }, cells);
  const set = v => {
    if (sel < 0 || given[sel] || api.ended) return;
    values[sel] = v;
    paint();
    onChange(values);
  };
  const pad = api.el('div', { class: 'gpad' }, [...Array.from({ length: max }, (_, i) => api.el('button', { class: 'q-btn', type: 'button', text: String(i + 1), onclick: () => set(i + 1) })), api.el('button', { class: 'q-btn ghost', type: 'button', text: '⌫', onclick: () => set(0) })]);
  function paint(bad = new Set()) {
    cells.forEach((c, i) => {
      c.textContent = values[i] ? String(values[i]) : '';
      c.className = `gcell${given[i] ? ' given' : ''}${i === sel ? ' sel' : ''}${bad.has(i) ? ' bad' : ''}`;
      decorate?.(i, c);
    });
  }
  paint();
  return { board, pad, paint, cells };
}

// The whole word list (every level), for games that check what you type: a set
// of lower-case words. Fetched once (the service worker has it cached).
let dictionary = null;
export async function allWords() {
  if (!dictionary) {
    const rows = await fetch('./data/words.json').then(r => r.json());
    dictionary = new Set(rows.map(r => String(r[0]).toLowerCase()).filter(w => /^[a-z]+$/.test(w)));
  }
  return dictionary;
}
