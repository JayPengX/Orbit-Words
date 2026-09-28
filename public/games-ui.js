// Rewards' mini games on screen: the list with today's earnings against the
// cap, and the game being played. The pay rules are in lib/games.mjs; a
// finished round is paid through the app (ctx.pay), as much as today's room
// allows.
import {
  STREAK, ADAPT, adapt, scorer, bestRound, wageMinutes, MIN_WAGE, PAY_SCALE,
  DERBY, pitchPlan, ballAt, swingResult, FREE_THROW, shotPlan, markerAt, shotResult,
  PAIRS, pairsBoard, pairResult, MERGE, mergeBoard, move, spawn, canMove, mergePoints,
  SPEED, speedQuestion, HANGMAN, hangmanWords, hangmanPay, guessLetter, hangmanSolved, hangmanOver, hangmanMask,
  SIMON, simonPay, simonSequence, SUDOKU, sudokuPuzzle, ALL_GAMES, gameInfo
} from './lib/games.mjs';
import { ARCADE_BY_ID, CATEGORIES, arcadePay } from './lib/arcade.mjs';
import { money, ECONOMY } from './lib/quadra.mjs';

const state = { t: null, arcadeFrame: 0 };
let ctx = null;

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of [].concat(children)) if (child != null && child !== false) node.append(child);
  return node;
}
const fmtMoney = (v, { sign = true } = {}) => money(v, { sign });
// Pay points as NT$ (points × PAY_SCALE), with cents when under NT$10.
const fmtPay = pts => money(pts * PAY_SCALE, { cents: pts * PAY_SCALE < 10 });

const FAV_KEY = 'quadra.rewards.favs';
const RECENT_KEY = 'quadra.rewards.recent';
const readList = key => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter(g => ALL_GAMES.includes(g)) : [];
  } catch {
    return [];
  }
};
const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
};
const CAT_ICON = { words: '🔤', puzzle: '🧩', arcade: '🕹️', board: '♟️', brain: '🧠' };

// The games tab: today's earnings, today's challenge, a search and the
// categories (favourites too), what you played lately, then every game as a
// card. A game opens in its own stage with a bar to get back.
export function mountGames(container, context) {
  ctx = context;
  state.t = context.t;
  let game = null;
  let view = null;
  let shell = null;
  const ui = { cat: 'all', q: '' };
  const lang = () => (ctx.locale === 'en' ? 'en' : 'zh');
  const info = g => gameInfo(g, state.t, lang());
  const build = () => {
    const t = state.t;
    const capFill = el('i');
    const capText = el('strong', { class: 'num' });
    const search = el('input', { class: 'gh-search', type: 'search', placeholder: t('gamesSearch'), 'aria-label': t('gamesSearch'), enterkeyhint: 'search' });
    search.addEventListener('input', () => ((ui.q = search.value.trim().toLowerCase()), paintList()));
    const chips = el('div', { class: 'gh-chips', role: 'group' });
    const recent = el('div', { class: 'gh-recent' });
    const grid = el('div', { class: 'gh-grid' });
    const count = el('p', { class: 'gh-count muted' });
    const daily = el('button', { class: 'gh-daily', type: 'button' });
    const bests = el('div', { class: 'q-card list bests' });
    const hub = el('div', { class: 'gh-hub' }, [
      el('div', { class: 'gh-cap' }, [el('div', { class: 'gh-cap-top' }, [el('span', { text: t('gamesTitle') }), capText]), el('div', { class: 'meter accent' }, [capFill])]),
      daily,
      el('div', { class: 'gh-find' }, [el('span', { class: 'gh-search-icon', 'aria-hidden': 'true', text: '🔍' }), search]),
      chips,
      recent,
      count,
      grid,
      el('details', { class: 'gh-bests' }, [el('summary', { text: t('bestsTitle') }), bests])
    ]);
    const slot = el('div', { class: 'game-slot' });
    const stageName = el('strong');
    const stageKind = el('small', { class: 'muted' });
    const stageEarned = el('small', { class: 'gh-stage-earned num' });
    const stage = el('div', { class: 'gh-stage', hidden: '' }, [
      el('div', { class: 'gh-stage-bar' }, [
        el('button', { class: 'gh-back', type: 'button', 'aria-label': t('gameBack'), onclick: close }, [el('span', { 'aria-hidden': 'true', text: '‹' }), el('span', { text: t('gameBack') })]),
        el('div', { class: 'gh-stage-title' }, [stageName, stageKind]),
        stageEarned
      ]),
      slot
    ]);
    const card = el('div', { class: 'games' }, [hub, stage]);
    shell = { card, capFill, capText, hub, stage, stageName, stageKind, stageEarned, slot, chips, recent, grid, count, daily, bests, search };
    container.replaceChildren(card);
  };

  const cardFor = (g, { small = false } = {}) => {
    const t = state.t;
    const i = info(g);
    const b = ctx.bests()[g];
    const d = ctx.daily();
    const favs = readList(FAV_KEY);
    const fav = favs.includes(g);
    const star = el('button', {
      class: `gh-star${fav ? ' on' : ''}`,
      type: 'button',
      'aria-pressed': String(fav),
      'aria-label': t(fav ? 'favRemove' : 'favAdd'),
      text: fav ? '★' : '☆',
      onclick: e => {
        e.stopPropagation();
        const now = readList(FAV_KEY);
        writeList(FAV_KEY, now.includes(g) ? now.filter(x => x !== g) : [g, ...now]);
        paintList();
      }
    });
    if (small)
      return el('button', { class: `gh-mini cat-${i.cat}`, type: 'button', onclick: () => open(g) }, [el('span', { class: 'gh-icon', 'aria-hidden': 'true', text: i.icon }), el('span', { class: 'gh-mini-name', text: i.name })]);
    return el('div', { class: `gh-card cat-${i.cat}${g === d.game && !d.done ? ' daily' : ''}`, role: 'button', tabindex: '0', onclick: () => open(g), onkeydown: e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(g)) }, [
      el('span', { class: 'gh-icon', 'aria-hidden': 'true', text: i.icon }),
      star,
      el('strong', { class: 'gh-name', text: i.name }),
      el('small', { class: 'gh-kind', text: i.kind }),
      el('div', { class: 'gh-foot' }, [
        el('small', { class: 'gh-max num', text: t('gameUpTo', { v: fmtMoney(bestRound(g), { sign: false }) }) }),
        b ? el('small', { class: 'gh-best num', text: `🏆 ${fmtMoney(b.v, { sign: false })}` }) : null
      ]),
      g === d.game && !d.done ? el('span', { class: 'gh-daily-tag', text: t('dailyTag') }) : null
    ]);
  };

  function paintList() {
    if (!shell) return;
    const t = state.t;
    const favs = readList(FAV_KEY);
    shell.chips.replaceChildren(
      ...['all', 'fav', ...CATEGORIES].map(c =>
        el('button', { type: 'button', class: 'gh-chip', 'aria-pressed': String(ui.cat === c), onclick: () => ((ui.cat = c), paintList()) }, [c !== 'all' && c !== 'fav' ? el('span', { 'aria-hidden': 'true', text: CAT_ICON[c] }) : null, document.createTextNode(t(`cat_${c}`))])
      )
    );
    const q = ui.q;
    const list = ALL_GAMES.filter(g => {
      const i = info(g);
      if (ui.cat === 'fav' && !favs.includes(g)) return false;
      if (ui.cat !== 'all' && ui.cat !== 'fav' && i.cat !== ui.cat) return false;
      return !q || `${i.name} ${i.kind} ${g}`.toLowerCase().includes(q);
    });
    const recent = readList(RECENT_KEY).slice(0, 8);
    shell.recent.hidden = !recent.length || ui.cat !== 'all' || Boolean(q);
    shell.recent.replaceChildren(el('p', { class: 'gh-h', text: t('gamesRecent') }), el('div', { class: 'gh-strip' }, recent.map(g => cardFor(g, { small: true }))));
    shell.count.textContent = t('gamesCount', { n: list.length });
    shell.grid.replaceChildren(...(list.length ? list.map(g => cardFor(g)) : [el('p', { class: 'gh-empty', text: ui.cat === 'fav' && !q ? t('gamesNoFav') : t('gamesNoMatch') })]));
  }

  const render = () => {
    if (!shell || !shell.card.isConnected) (build(), paintList());
    const t = state.t;
    const left = ctx.room();
    const cap = ECONOMY.gamesDailyCap;
    shell.capFill.style.width = `${Math.min(100, ((cap - left) / cap) * 100)}%`;
    shell.capText.textContent = left > 0 ? t('gamesToday', { v: fmtMoney(cap - left, { sign: false }), cap: fmtMoney(cap, { sign: false }) }) : t('gamesCapped');
    shell.stageEarned.textContent = fmtMoney(cap - left, { sign: false });
    const isOpen = Boolean(game);
    shell.hub.hidden = isOpen;
    shell.stage.hidden = !isOpen;
    if (isOpen) {
      const i = info(game);
      shell.stageName.textContent = `${i.icon} ${i.name}`;
      shell.stageKind.textContent = i.kind;
    }
    // Today's challenge.
    const d = ctx.daily();
    const di = info(d.game);
    shell.daily.onclick = () => open(d.game);
    shell.daily.className = `gh-daily cat-${di.cat}${d.done ? ' done' : ''}`;
    shell.daily.replaceChildren(
      el('span', { class: 'gh-daily-icon', 'aria-hidden': 'true', text: di.icon }),
      el('span', { class: 'gh-daily-text' }, [
        el('small', { text: t('dailyTitle') }),
        el('strong', { text: di.name }),
        el('small', { text: d.done ? t('dailyDone', { n: d.streak }) : t(d.streak ? 'dailyLine' : 'dailyLineNew', { v: fmtMoney(d.bonus, { sign: false }), n: d.streak }) })
      ]),
      el('span', { class: 'gh-daily-go', text: d.done ? '✓' : '▶' })
    );
    const b = ctx.bests();
    const played = ALL_GAMES.filter(g => b[g]).sort((x, y) => b[y].v - b[x].v);
    shell.bests.replaceChildren(
      ...(played.length
        ? played.map(g => el('div', { class: 'best-row' }, [el('span', { class: 'best-icon', text: info(g).icon }), el('strong', { text: info(g).name }), el('small', { class: 'muted num', text: new Date(b[g].t).toLocaleDateString(state.t('dateLocale')) }), el('strong', { class: 'num', text: fmtMoney(b[g].v, { sign: false }) })]))
        : [el('p', { class: 'muted pad-row', text: t('bestsNone') })])
    );
    if (!isOpen) paintList();
    if (shell.slot.firstChild !== view) shell.slot.replaceChildren(...(view ? [view] : []));
  };

  let opening = 0;
  async function open(g) {
    stopGame();
    game = g;
    live = true;
    writeList(RECENT_KEY, [g, ...readList(RECENT_KEY).filter(x => x !== g)].slice(0, 12));
    const mine = ++opening;
    if (ARCADE_BY_ID[g]) {
      view = el('p', { class: 'muted gh-loading', text: state.t('gameLoading') });
      render();
      try {
        const mod = await import(`./arcade/${g}.js`);
        if (mine !== opening || game !== g) return;
        view = arcadeView(g, mod.default);
      } catch (error) {
        console.error(error);
        if (mine !== opening) return;
        view = el('p', { class: 'muted gh-loading', text: state.t('gameLoadFail') });
      }
    } else view = { derby: derbyView, freethrow: freeThrowView, pairs: pairsView, merge: mergeView, speed: speedView, hangman: hangmanView, simon: simonView, sudoku: sudokuView }[g]();
    render();
    view.setAttribute?.('tabindex', '-1');
    view.focus?.({ preventScroll: true });
    shell.stage.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function close() {
    stopGame();
    opening++;
    game = null;
    view = null;
    live = false;
    render();
    shell.hub.scrollIntoView({ block: 'start' });
  }
  reopen = open;
  roundDone = () => {
    live = false;
    render();
  };
  return {
    render,
    stop: close,
    busy: () => live
  };
}
let live = false;
let roundDone = () => {};
let reopen = () => {};

// Timers and the animation of the running game, all stopped when it closes.
let gameTimers = [];
function later(fn, ms) {
  gameTimers.push(setTimeout(fn, ms));
}
let cleanups = [];
function stopGame() {
  gameTimers.forEach(clearTimeout);
  gameTimers = [];
  cleanups.forEach(fn => fn());
  cleanups = [];
  cancelAnimationFrame(state.arcadeFrame ?? 0);
}
function animate(draw) {
  cancelAnimationFrame(state.arcadeFrame ?? 0);
  const frame = now => {
    if (draw(now) !== false) state.arcadeFrame = requestAnimationFrame(frame);
  };
  state.arcadeFrame = requestAnimationFrame(frame);
}

// The strip above a game: progress, the round's money so far, the streak,
// the difficulty, and a moment's note of a bonus or a penalty.
function gameHud() {
  const t = state.t;
  const progress = el('div', { class: 'hud-bar', 'aria-hidden': 'true' }, el('div'));
  const count = el('span', { class: 'hud-count num' });
  const cash = el('strong', { class: 'hud-money num' });
  const streak = el('span', { class: 'hud-streak' });
  const note = el('span', { class: 'hud-note', 'aria-live': 'polite' });
  const meter = el('span', { class: 'hud-level', hidden: '' });
  const node = el('div', { class: 'game-hud' }, [el('div', { class: 'hud-row' }, [count, meter, streak, note, cash]), progress]);
  const set = ({ done, of, earned, run, level = null, label = null }) => {
    if (level != null) {
      meter.hidden = false;
      const bars = 1 + Math.round(level * 4);
      meter.textContent = `${'▮'.repeat(bars)}${'▯'.repeat(5 - bars)}`;
      meter.setAttribute('aria-label', `${t('hudLevel')} ${bars} / 5`);
    }
    count.textContent = label ?? t('hudCount', { n: done, of });
    cash.textContent = fmtMoney(earned, { sign: false });
    streak.textContent = run >= 2 ? t('hudStreak', { n: run }) : '';
    streak.classList.toggle('hot', run >= 5);
    progress.firstChild.style.width = `${Math.min(100, (done / of) * 100)}%`;
  };
  const flash = (amount, good) => {
    if (!amount) return;
    note.textContent = good ? t('hudBonus', { v: fmtMoney(amount, { sign: false }) }) : t('hudPenalty', { v: fmtMoney(amount, { sign: false }) });
    note.className = `hud-note ${good ? 'bonus' : 'penalty'}`;
    void note.offsetWidth;
    note.classList.add('show');
  };
  return { node, set, flash };
}

function streakRule(game) {
  const r = STREAK[game];
  const v = x => fmtMoney(x * PAY_SCALE, { sign: false, cents: x * PAY_SCALE < 10 });
  if (r.ladder) return state.t('streakRuleLadder', { a: v(r.ladder[0]), b: v(r.ladder[1]), penalty: v(r.penalty) });
  return r.penalty ? state.t('streakRule', { every: r.every, bonus: v(r.bonus), penalty: v(r.penalty) }) : state.t('streakRuleSafe', { every: r.every, bonus: v(r.bonus) });
}

// A finished round: paid (up to today's room), then what the work came to
// against the minimum wage.
function finishRound(game, amount, box, summary, ms, score = null) {
  const t = state.t;
  stopGame();
  const { paid, bonus, best } = ctx.pay(game, amount);
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  const work = wageMinutes(paid);
  box.replaceChildren(
    ...[
      el('p', { class: 'game-result' }, [document.createTextNode(summary), el('strong', { class: paid > 0 ? 'paid' : '', text: ` ${t('gamePaid', { v: fmtMoney(paid) })}` })]),
      score && (score.bonus || score.penalty) ? el('p', { class: 'note', text: t('scoreLine', { bonus: fmtMoney(score.bonus, { sign: false }), penalty: fmtMoney(score.penalty, { sign: false }) }) }) : null,
      bonus > 0 ? el('p', { class: 'daily-paid', text: t('dailyPaid', { v: fmtMoney(bonus, { sign: false }) }) }) : null,
      best ? el('p', { class: 'best-new', text: t('bestNew') }) : null,
      amount > paid ? el('p', { class: 'note', text: t('gameCapNote') }) : null,
      el('p', { class: 'note', text: t('gameWage', { m: minutes, s: seconds, work: work < 10 ? (Math.round(work * 10) / 10).toString() : Math.round(work), wage: fmtMoney(MIN_WAGE, { sign: false }) }) }),
      el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('gameAgain'), onclick: () => reopen(game) })
    ].filter(Boolean)
  );
  roundDone();
}

// A canvas drawn at the screen's pixel density, W x H in CSS pixels.
function gameCanvas(W, H) {
  const canvas = el('canvas', { class: 'game-canvas', width: String(W * (window.devicePixelRatio || 1)), height: String(H * (window.devicePixelRatio || 1)) });
  const c = canvas.getContext('2d');
  c.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  return { canvas, ctx: c };
}
function drawCallout(ctx, W, text, sub, age, life = 1100, color = '#fff') {
  if (!text || age < 0 || age > life) return;
  const a = Math.max(0, 1 - age / life);
  const rise = (age / life) * 12;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 4;
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.strokeText(text, W / 2, 96 - rise);
  ctx.fillText(text, W / 2, 96 - rise);
  if (sub) {
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeText(sub, W / 2, 120 - rise);
    ctx.fillText(sub, W / 2, 120 - rise);
  }
  ctx.restore();
}

// Bursts of confetti for the best results.
function burst(x, y, n = 28) {
  const colors = ['#ffd54f', '#ff7043', '#4fc3f7', '#81c784', '#f06292'];
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5, color: colors[i % colors.length], life: 900 };
  });
}
function drawParticles(ctx, particles, dt) {
  for (const p of particles) {
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.vy += 0.004 * dt;
    p.life -= dt;
    if (p.life <= 0) continue;
    ctx.globalAlpha = Math.min(1, p.life / 400);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  return particles.filter(p => p.life > 0);
}

// 全壘打大賽: the pitch comes in from the mound; swing as it reaches the plate.
function derbyView() {
  const t = state.t;
  const W = 360;
  const H = 250;
  const { canvas, ctx } = gameCanvas(W, H);
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const mound = { x: W / 2, y: 78 };
  const plate = { x: W / 2, y: 214 };
  const results = [];
  let phase = 'idle';
  let plan = null;
  let pitchStart = 0;
  let swingAt = -1e9;
  let flight = null;
  let callout = null;
  let particles = [];
  let began = 0;
  const score = scorer('derby');
  // Difficulty follows the batter: up after a hit, down after a miss.
  let level = ADAPT.start;
  let last = performance.now();
  const update = () => hud.set({ done: results.length, of: DERBY.pitches, earned: score.total, run: score.run, level });
  // The ball along its path: p is ballAt's 0-1, the plate at DERBY.plate.
  const ballPos = p => {
    const k = p / DERBY.plate;
    // A breaking ball drifts sideways more and more on its way in.
    const drift = (plan?.breakX ?? 0) * 26 * Math.min(1.2, k) ** 2;
    return { x: mound.x + (plate.x - mound.x) * k + drift, y: mound.y + (plate.y - mound.y) * k, r: 2.5 + 5.5 * Math.min(1.2, k) };
  };
  const drawField = () => {
    // Stands and sky, the outfield grass in stripes, the infield dirt.
    const sky = ctx.createLinearGradient(0, 0, 0, 60);
    sky.addColorStop(0, '#0d2a4a');
    sky.addColorStop(1, '#1d4f7a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 60);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.08)' : 'rgba(255,214,79,0.14)';
      ctx.fillRect((i * 37) % W, 30 + ((i * 13) % 22), 3, 3);
    }
    ctx.fillStyle = '#12351f';
    ctx.fillRect(0, 52, W, 6);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#2f7d3a' : '#358a41';
      ctx.fillRect(0, 58 + i * 25, W, 25);
    }
    ctx.fillStyle = '#b07a4a';
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 30, 190, 120, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#a06b3c';
    ctx.beginPath();
    ctx.ellipse(mound.x, mound.y + 6, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // The pitcher: a simple figure, arm up while throwing.
    const throwing = phase === 'pitch' && performance.now() - pitchStart < 160;
    ctx.fillStyle = '#e8eef5';
    ctx.beginPath();
    ctx.arc(mound.x, mound.y - 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(mound.x - 5, mound.y - 16, 10, 16);
    ctx.strokeStyle = '#e8eef5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mound.x + 4, mound.y - 13);
    ctx.lineTo(mound.x + (throwing ? -8 : 11), mound.y + (throwing ? -24 : -4));
    ctx.stroke();
    // Home plate, the batter's boxes and the strike zone ring.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(plate.x - 11, plate.y - 4);
    ctx.lineTo(plate.x + 11, plate.y - 4);
    ctx.lineTo(plate.x + 11, plate.y + 2);
    ctx.lineTo(plate.x, plate.y + 9);
    ctx.lineTo(plate.x - 11, plate.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plate.x - 52, plate.y - 26, 30, 44);
    ctx.strokeRect(plate.x + 22, plate.y - 26, 30, 44);
  };
  const drawBat = now => {
    // A right-handed batter's bat, swinging round in 160 ms.
    const pivot = { x: plate.x - 30, y: plate.y - 6 };
    const k = Math.min(1, (now - swingAt) / 160);
    const angle = -2.3 + (k < 1 ? k : 1) * 2.9 * (now - swingAt < 600 ? 1 : 0);
    ctx.strokeStyle = '#c58b4e';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(pivot.x + Math.cos(angle) * 58, pivot.y + Math.sin(angle) * 58);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#7a4f24';
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(pivot.x + Math.cos(angle) * 14, pivot.y + Math.sin(angle) * 14);
    ctx.stroke();
  };
  const drawBall = (x, y, r) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + r + 2, r, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - r * 0.9, y, r * 0.8, -0.8, 0.8);
    ctx.arc(x + r * 0.9, y, r * 0.8, Math.PI - 0.8, Math.PI + 0.8);
    ctx.stroke();
  };
  const draw = now => {
    const dt = Math.min(50, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);
    drawField();
    if (phase === 'pitch') {
      const p = ballAt(plan, now - pitchStart);
      // The timing ring lights up while the ball is in the hitting window.
      const inWindow = Math.abs(p - DERBY.plate) <= DERBY.hit;
      ctx.strokeStyle = inWindow ? 'rgba(255,213,79,0.95)' : 'rgba(255,213,79,0.35)';
      ctx.lineWidth = inWindow ? 3 : 2;
      ctx.beginPath();
      ctx.arc(plate.x, plate.y - 10, 16, 0, Math.PI * 2);
      ctx.stroke();
      const b = ballPos(p);
      drawBall(b.x, b.y, b.r);
      if (p > 1.02) swing(true);
    } else if (flight) {
      const k = Math.min(1, (now - flight.start) / flight.ms);
      const x = flight.from.x + (flight.to.x - flight.from.x) * k;
      const y = flight.from.y + (flight.to.y - flight.from.y) * k - Math.sin(k * Math.PI) * flight.arc;
      drawBall(x, y, Math.max(1.5, flight.r * (1 - 0.7 * k)));
      if (k >= 1 && flight.result === 'hr' && !flight.popped) {
        flight.popped = true;
        particles.push(...burst(x, Math.max(20, y)));
      }
    }
    drawBat(now);
    particles = drawParticles(ctx, particles, dt);
    if (phase === 'idle') drawCallout(ctx, W, t('derbyTitle'), t('derbyTap'), 0, 1);
    if (callout) drawCallout(ctx, W, callout.text, callout.sub, now - callout.at, 1200, callout.color);
    return phase !== 'done' || particles.length > 0 || (callout && now - callout.at < 1200);
  };
  const next = () => {
    if (results.length === DERBY.pitches) {
      phase = 'done';
      const hr = results.filter(r => r === 'hr').length;
      const hits = results.filter(r => r === 'hit').length;
      later(() => finishRound('derby', score.total, box, t('derbyDone', { hr, hits }), performance.now() - began, score), 900);
      return;
    }
    phase = 'wait';
    flight = null;
    later(() => {
      plan = pitchPlan(level);
      phase = 'pitch';
      pitchStart = performance.now();
    }, 900 + Math.random() * 700);
  };
  function swing(late = false) {
    const now = performance.now();
    if (phase === 'idle') return start();
    if (!late) swingAt = now;
    if (phase !== 'pitch') return;
    const p = ballAt(plan, now - pitchStart);
    const result = late ? 'miss' : swingResult(p);
    results.push(result);
    if (result === 'miss') hud.flash(score.bad(), false);
    else hud.flash(score.good(DERBY.pay[result]), true);
    level = adapt(level, result);
    phase = 'flight';
    const b = ballPos(Math.min(p, 1.1));
    const off = Math.abs(p - DERBY.plate);
    if (result === 'hr') {
      // Distance by how true the swing was.
      const meters = Math.round(118 + (1 - off / DERBY.hr) * 32);
      flight = { from: b, to: { x: W / 2 + (p - DERBY.plate) * 900, y: -30 }, arc: 90, ms: 1000, r: b.r, result };
      callout = { text: t('derby_hr'), sub: t('derbyMeters', { m: meters }), at: now, color: '#ffd54f' };
    } else if (result === 'hit') {
      const side = p < DERBY.plate ? -1 : 1;
      flight = { from: b, to: { x: W / 2 + side * (60 + Math.random() * 90), y: 95 + Math.random() * 40 }, arc: 50, ms: 800, r: b.r, result };
      callout = { text: t('derby_hit'), sub: t('derbyMeters', { m: Math.round(35 + (1 - off / DERBY.hit) * 55) }), at: now, color: '#fff' };
    } else {
      flight = { from: b, to: { x: plate.x + 4, y: H + 20 }, arc: 0, ms: 250, r: b.r, result };
      callout = { text: t(late ? 'derby_strike' : 'derby_miss'), sub: '', at: now, color: '#ff8a80' };
    }
    update();
    later(next, 1300);
  }
  function start() {
    began = performance.now();
    box.replaceChildren(swingButton);
    next();
  }
  canvas.addEventListener('pointerdown', event => (event.preventDefault(), swing()));
  const swingButton = el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('derbySwing'), onclick: () => swing() });
  box.append(el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('gameStart'), onclick: start }));
  update();
  animate(draw);
  return el('div', { class: 'game', tabindex: '0', onkeydown: e => e.key === ' ' && (e.preventDefault(), swing()) }, [
    el('p', { class: 'note', text: `${t('derbyRules', { n: DERBY.pitches, hr: fmtPay(DERBY.pay.hr), hit: fmtPay(DERBY.pay.hit) })} ${streakRule('derby')}` }),
    hud.node,
    canvas,
    box
  ]);
}

// 罰球: stop the sweeping marker in the green zone, and watch the shot.
function freeThrowView() {
  const t = state.t;
  const W = 360;
  const H = 250;
  const { canvas, ctx } = gameCanvas(W, H);
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const meter = { x: 22, y: 30, w: 16, h: 190 };
  const rim = { x: 286, y: 92, r: 18 };
  const hand = { x: 110, y: 186 };
  const results = [];
  let phase = 'idle';
  let plan = null;
  let aimStart = 0;
  let shot = null;
  let callout = null;
  let particles = [];
  let ripple = -1e9;
  let began = 0;
  const score = scorer('freethrow');
  // Difficulty follows the shooter: up after a make, down after a miss.
  let level = ADAPT.start;
  let last = performance.now();
  const update = () => hud.set({ done: results.length, of: FREE_THROW.shots, earned: score.total, run: score.run, level });
  const drawCourt = now => {
    const wall = ctx.createLinearGradient(0, 0, 0, 150);
    wall.addColorStop(0, '#1b2331');
    wall.addColorStop(1, '#2a3547');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, 150);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#c8904f' : '#d19a58';
      ctx.fillRect(0, 150 + i * 12, W, 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 250);
    ctx.lineTo(130, 150);
    ctx.stroke();
    // Backboard, its square, the pole.
    ctx.fillStyle = '#9aa7b8';
    ctx.fillRect(326, 60, 6, 140);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(304, 38, 8, 70);
    ctx.strokeStyle = '#e53935';
    ctx.strokeRect(304, 70, 8, 22);
    // The net: longer and swaying just after a make.
    const sway = Math.max(0, 1 - (now - ripple) / 600);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const x0 = rim.x - rim.r + (i * rim.r * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(x0, rim.y);
      ctx.lineTo(rim.x - rim.r * 0.55 + (i * rim.r * 1.1) / 6 + Math.sin(now / 60 + i) * 3 * sway, rim.y + 26 + 8 * sway);
      ctx.stroke();
    }
  };
  const drawRim = () => {
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(rim.x, rim.y, rim.r, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  };
  const drawBall = (x, y) => {
    ctx.fillStyle = '#ef6c00';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 9, y);
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x, y + 9);
    ctx.stroke();
  };
  const drawMeter = now => {
    const zone = plan?.zone ?? shotPlan(level).zone;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(meter.x - 3, meter.y - 3, meter.w + 6, meter.h + 6);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(meter.x, meter.y, meter.w, meter.h);
    ctx.fillStyle = '#fdd835';
    ctx.fillRect(meter.x, meter.y + meter.h * (0.5 - zone), meter.w, meter.h * zone * 2);
    ctx.fillStyle = '#43a047';
    ctx.fillRect(meter.x, meter.y + meter.h * (0.5 - zone / 2), meter.w, meter.h * zone);
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(meter.x, meter.y + meter.h * (0.5 - zone / 4), meter.w, (meter.h * zone) / 2);
    if (phase === 'aim' || phase === 'flight') {
      const m = phase === 'aim' ? markerAt(plan, now - aimStart) : shot.marker;
      const y = meter.y + meter.h * m;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(meter.x + meter.w + 2, y);
      ctx.lineTo(meter.x + meter.w + 12, y - 6);
      ctx.lineTo(meter.x + meter.w + 12, y + 6);
      ctx.fill();
      ctx.fillRect(meter.x - 2, y - 1.5, meter.w + 4, 3);
    }
  };
  const drawShooter = () => {
    ctx.fillStyle = '#e8eef5';
    ctx.beginPath();
    ctx.arc(hand.x - 22, hand.y - 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(hand.x - 30, hand.y - 18, 16, 28);
    ctx.fillStyle = '#e8eef5';
    ctx.fillRect(hand.x - 29, hand.y + 10, 5, 22);
    ctx.fillRect(hand.x - 20, hand.y + 10, 5, 22);
    ctx.strokeStyle = '#e8eef5';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hand.x - 16, hand.y - 14);
    ctx.lineTo(hand.x - 4, hand.y - 4);
    ctx.stroke();
  };
  const draw = now => {
    const dt = Math.min(50, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);
    drawCourt(now);
    drawShooter();
    drawMeter(now);
    if (shot) {
      // The flight: up and over to the target, then through, off the rim, or short.
      const k = Math.min(1, (now - shot.start) / 850);
      const x = hand.x + (shot.target.x - hand.x) * k;
      const y = hand.y + (shot.target.y - hand.y) * k - Math.sin(k * Math.PI) * 120;
      if (k < 1) drawBall(x, y);
      else {
        const k2 = Math.min(1, (now - shot.start - 850) / 500);
        if (shot.result !== 'miss') drawBall(rim.x + shot.drift * (1 - k2), rim.y + 8 + k2 * 70);
        else drawBall(shot.target.x + shot.bounce * k2 * 60, shot.target.y - Math.sin(k2 * Math.PI) * 30 + k2 * 60);
        if (!shot.landed) {
          shot.landed = true;
          if (shot.result !== 'miss') ripple = now;
          if (shot.result === 'swish') particles.push(...burst(rim.x, rim.y));
        }
      }
    } else if (phase !== 'done') drawBall(hand.x, hand.y);
    drawRim();
    particles = drawParticles(ctx, particles, dt);
    if (phase === 'idle') drawCallout(ctx, W, t('ftTitle'), t('ftTap'), 0, 1);
    if (callout) drawCallout(ctx, W, callout.text, callout.sub, now - callout.at, 1200, callout.color);
    return phase !== 'done' || particles.length > 0 || (callout && now - callout.at < 1200);
  };
  const next = () => {
    if (results.length === FREE_THROW.shots) {
      phase = 'done';
      const made = results.filter(r => r !== 'miss').length;
      const swish = results.filter(r => r === 'swish').length;
      later(() => finishRound('freethrow', score.total, box, t('ftDone', { made, swish }), performance.now() - began, score), 900);
      return;
    }
    shot = null;
    plan = shotPlan(level);
    phase = 'aim';
    aimStart = performance.now();
  };
  function shoot() {
    if (phase === 'idle') return start();
    if (phase !== 'aim') return;
    const now = performance.now();
    const marker = markerAt(plan, now - aimStart);
    const result = shotResult(marker, plan);
    results.push(result);
    level = adapt(level, result);
    // The money shows once the ball lands.
    later(() => (result === 'miss' ? hud.flash(score.bad(), false) : hud.flash(score.good(FREE_THROW.pay[result]), true), update()), 900);
    phase = 'flight';
    const err = marker - 0.5;
    // Too high a mark: long (off the back of the rim); too low: short.
    const target = result === 'miss' ? { x: rim.x + Math.sign(err) * (rim.r + 4), y: rim.y - 2 } : { x: rim.x + err * 40, y: rim.y - 2 };
    shot = { start: now, marker, result, target, drift: err * 40, bounce: err > 0 ? 1 : -1.2 };
    callout = { text: t(`ft_${result}`), sub: '', at: now + 850, color: result === 'swish' ? '#ffd54f' : result === 'make' ? '#fff' : '#ff8a80' };
    update();
    later(next, 1700);
  }
  function start() {
    began = performance.now();
    box.replaceChildren(shootButton);
    next();
  }
  canvas.addEventListener('pointerdown', event => (event.preventDefault(), shoot()));
  const shootButton = el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('ftShoot'), onclick: () => shoot() });
  box.append(el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('gameStart'), onclick: start }));
  update();
  animate(draw);
  return el('div', { class: 'game', tabindex: '0', onkeydown: e => e.key === ' ' && (e.preventDefault(), shoot()) }, [
    el('p', { class: 'note', text: `${t('ftRules', { n: FREE_THROW.shots, swish: fmtPay(FREE_THROW.pay.swish), make: fmtPay(FREE_THROW.pay.make) })} ${streakRule('freethrow')}` }),
    hud.node,
    canvas,
    box
  ]);
}


// Word pairs: three boards of six words; turn two cards, keep the matches.
function pairsView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const grid = el('div', { class: 'pairs-grid' });
  const score = scorer('pairs');
  const pool = ctx.words();
  const used = new Set();
  let board = 0;
  let cards = [];
  let open = [];
  let matched = new Set();
  let seen = new Set();
  let right = 0;
  let wrong = 0;
  let began = 0;
  let lock = false;
  const total = PAIRS.boards * PAIRS.size;
  const update = () => hud.set({ done: right, of: total, earned: score.total, run: score.run });
  const deal = () => {
    const fresh = pool.filter(w => !used.has(w.key) && w.meaning);
    const chosen = [];
    const meanings = new Set();
    for (let tries = 0; chosen.length < PAIRS.size && tries < 400 && fresh.length; tries++) {
      const w = fresh[Math.floor(Math.random() * fresh.length)];
      if (used.has(w.key) || meanings.has(w.meaning)) continue;
      used.add(w.key);
      meanings.add(w.meaning);
      chosen.push(w);
    }
    cards = pairsBoard(chosen);
    open = [];
    matched = new Set();
    seen = new Set();
    paint();
  };
  const paint = () =>
    grid.replaceChildren(
      ...cards.map(c => {
        const up = matched.has(c.key) || open.includes(c);
        return el('button', { class: `pair-card ${c.face}${up ? ' up' : ''}${matched.has(c.key) ? ' done' : ''}`, type: 'button', disabled: matched.has(c.key), onclick: () => turn(c) }, [el('span', { text: up ? c.text : '?' })]);
      })
    );
  function turn(c) {
    if (lock || open.includes(c) || matched.has(c.key)) return;
    began ||= performance.now();
    open.push(c);
    paint();
    if (open.length < 2) return;
    const [a, b] = open;
    const result = pairResult(a, b, seen);
    seen.add(a.id);
    seen.add(b.id);
    if (result === 'match') {
      matched.add(a.key);
      right++;
      hud.flash(score.good(PAIRS.pay), true);
      open = [];
      paint();
      update();
      if (matched.size === cards.length / 2) {
        board++;
        if (board >= PAIRS.boards) return later(() => finishRound('pairs', score.total, box, t('pairsDone', { n: right, miss: wrong }), performance.now() - began, score), 500);
        later(deal, 600);
      }
      return;
    }
    if (result === 'miss') {
      wrong++;
      hud.flash(score.bad(), false);
    }
    lock = true;
    update();
    later(() => {
      open = [];
      lock = false;
      paint();
    }, 900);
  }
  deal();
  update();
  return el('div', { class: 'game', tabindex: '-1' }, [el('p', { class: 'note', text: `${t('pairsRules', { n: total, v: fmtPay(PAIRS.pay) })} ${streakRule('pairs')}` }), hud.node, grid, box]);
}

// 2048: swipe or use the arrow keys; merges of 16 and up pay.
function mergeView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const grid = el('div', { class: 'merge-grid' });
  const score = scorer('merge');
  let board = mergeBoard();
  let began = 0;
  let over = false;
  let best = 0;
  let clock = 0;
  const update = () => {
    const left = began ? Math.max(0, MERGE.seconds - Math.floor((performance.now() - began) / 1000)) : MERGE.seconds;
    hud.set({ done: MERGE.seconds - left, of: MERGE.seconds, earned: score.total, run: score.run, label: t('secondsLeft', { n: left }) });
  };
  const paint = () => grid.replaceChildren(...board.map(v => el('div', { class: `tile2048 v${Math.min(v, 4096)}`, text: v ? String(v) : '' })));
  const end = () => {
    if (over) return;
    over = true;
    clearInterval(clock);
    finishRound('merge', score.total, box, t('mergeDone', { best }), performance.now() - began, score);
  };
  function go(dir) {
    if (over) return;
    if (!began) {
      began = performance.now();
      clock = setInterval(() => {
        update();
        if (performance.now() - began >= MERGE.seconds * 1000) end();
      }, 500);
      gameTimers.push(clock);
    }
    const res = move(board, dir);
    if (!res.moved) return;
    board = spawn(res.board);
    best = Math.max(best, ...board);
    const pts = mergePoints(res.merged);
    if (pts > 0) hud.flash(score.good(pts * MERGE.pay), true);
    paint();
    update();
    if (!canMove(board)) later(end, 400);
  }
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
  const view = el('div', { class: 'game', tabindex: '0', onkeydown: e => keys[e.key] && (e.preventDefault(), go(keys[e.key])) }, [el('p', { class: 'note', text: t('mergeRules', { s: MERGE.seconds }) }), hud.node, grid, box]);
  let start = null;
  grid.addEventListener('pointerdown', e => (start = { x: e.clientX, y: e.clientY }));
  grid.addEventListener('pointerup', e => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  });
  grid.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  box.append(el('div', { class: 'arrows' }, [['up', '↑'], ['left', '←'], ['down', '↓'], ['right', '→']].map(([d, s]) => el('button', { class: `q-btn arrow ${d}`, type: 'button', text: s, 'aria-label': d, onclick: () => go(d) }))));
  paint();
  update();
  return view;
}

// A clock for the timed games: the HUD's count shows the seconds left.
function countdown(seconds, onTick, onEnd) {
  const began = performance.now();
  const left = () => Math.max(0, seconds - Math.floor((performance.now() - began) / 1000));
  const clock = setInterval(() => {
    onTick(left());
    if (performance.now() - began >= seconds * 1000) {
      clearInterval(clock);
      onEnd();
    }
  }, 250);
  gameTimers.push(clock);
  return { began, left, stop: () => clearInterval(clock) };
}

// Speed match: a word, four meanings, a minute.
function speedView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const stage = el('div', { class: 'speed-stage' });
  const score = scorer('speed');
  const words = ctx.words();
  const recent = new Set();
  let right = 0;
  let wrong = 0;
  let timer = null;
  let over = false;
  let lock = false;
  const update = (left = SPEED.seconds) => hud.set({ done: SPEED.seconds - left, of: SPEED.seconds, earned: score.total, run: score.run, label: t('secondsLeft', { n: left }) });
  const ask = () => {
    const q = speedQuestion(words, Math.random, recent);
    if (!q) return end();
    recent.add(q.word.key);
    if (recent.size > 30) recent.delete(recent.values().next().value);
    stage.replaceChildren(
      el('p', { class: 'speed-word', text: q.word.word }),
      el(
        'div',
        { class: 'speed-choices' },
        q.choices.map((c, i) =>
          el('button', { class: 'speed-choice', type: 'button', 'data-n': String(i + 1), onclick: e => pick(c, q, e.currentTarget) }, [el('small', { text: String(i + 1) }), el('span', { text: c.meaning })])
        )
      )
    );
  };
  function pick(c, q, button) {
    if (over || lock) return;
    const ok = c.key === q.word.key;
    if (ok) {
      right++;
      hud.flash(score.good(SPEED.pay), true);
    } else {
      wrong++;
      hud.flash(score.bad(), false);
      stage.querySelectorAll('.speed-choice').forEach((b, i) => q.choices[i].key === q.word.key && b.classList.add('right'));
    }
    button.classList.add(ok ? 'right' : 'wrong');
    update(timer.left());
    lock = true;
    later(() => ((lock = false), ask()), ok ? 180 : 650);
  }
  const end = () => {
    if (over) return;
    over = true;
    timer?.stop();
    finishRound('speed', score.total, box, t('speedDone', { n: right, miss: wrong }), timer ? performance.now() - timer.began : 0, score);
  };
  const start = () => {
    box.replaceChildren();
    timer = countdown(SPEED.seconds, update, end);
    ask();
  };
  stage.append(el('p', { class: 'speed-word muted', text: t('speedReady') }));
  box.append(el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('gameStart'), onclick: start }));
  update();
  return el('div', { class: 'game', tabindex: '0', onkeydown: e => stage.querySelector(`.speed-choice[data-n="${e.key}"]`)?.click() }, [
    el('p', { class: 'note', text: `${t('speedRules', { s: SPEED.seconds, v: fmtPay(SPEED.pay) })} ${streakRule('speed')}` }),
    hud.node,
    stage,
    box
  ]);
}

// Hangman: guess the word from its meaning, a letter at a time.
function hangmanView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const stage = el('div', { class: 'hang-stage' });
  const keys = el('div', { class: 'hang-keys' });
  const score = scorer('hangman');
  const pool = hangmanWords(ctx.words());
  const used = new Set();
  let n = 0;
  let solved = 0;
  let cur = null;
  let meaning = '';
  let began = 0;
  let lock = false;
  const update = () => hud.set({ done: n, of: HANGMAN.words, earned: score.total, run: score.run });
  const next = () => {
    if (n >= HANGMAN.words || !pool.length) return finishRound('hangman', score.total, box, t('hangDone', { n: solved, of: n }), performance.now() - began, score);
    let w = pool[Math.floor(Math.random() * pool.length)];
    for (let tries = 0; used.has(w.key) && tries < 50; tries++) w = pool[Math.floor(Math.random() * pool.length)];
    used.add(w.key);
    cur = { word: w.word, guessed: new Set(), lives: HANGMAN.lives };
    meaning = w.meaning;
    lock = false;
    paint();
  };
  const paint = (reveal = false) => {
    stage.replaceChildren(
      el('p', { class: 'hang-meaning', text: meaning }),
      el('p', { class: 'hang-word', 'aria-label': t('letters', { n: cur.word.length }) }, (reveal ? [...cur.word] : hangmanMask(cur)).map((ch, i) => el('span', { class: `hang-slot${ch !== '_' ? ' on' : ''}${reveal && !cur.guessed.has(cur.word[i]) ? ' missed' : ''}`, text: ch === '_' ? '' : ch }))),
      el('p', { class: 'hang-lives', 'aria-label': t('hangLives', { n: cur.lives }) }, [el('span', { text: '❤️'.repeat(Math.max(0, cur.lives)) }), el('span', { class: 'lost', text: '🤍'.repeat(HANGMAN.lives - Math.max(0, cur.lives)) })])
    );
    keys.replaceChildren(
      ...'abcdefghijklmnopqrstuvwxyz'.split('').map(ch =>
        el('button', { class: `hang-key${cur.guessed.has(ch) ? (cur.word.includes(ch) ? ' hit' : ' miss') : ''}`, type: 'button', disabled: cur.guessed.has(ch) || lock, text: ch, onclick: () => guess(ch) })
      )
    );
  };
  function guess(ch) {
    if (!cur || lock) return;
    began ||= performance.now();
    const r = guessLetter(cur, ch);
    if (r.hit === null) return;
    cur = r.state;
    if (!hangmanOver(cur)) return paint();
    n++;
    lock = true;
    if (hangmanSolved(cur)) {
      solved++;
      hud.flash(score.good(hangmanPay(cur.lives)), true);
    } else hud.flash(score.bad(), false);
    update();
    paint(true);
    later(next, hangmanSolved(cur) ? 700 : 1600);
  }
  next();
  update();
  return el('div', { class: 'game', tabindex: '0', onkeydown: e => /^[a-z]$/i.test(e.key) && (e.preventDefault(), guess(e.key.toLowerCase())) }, [
    el('p', { class: 'note', text: `${t('hangRules', { n: HANGMAN.words, lives: HANGMAN.lives, v: fmtPay(HANGMAN.pay), life: fmtPay(HANGMAN.perLife) })} ${streakRule('hangman')}` }),
    hud.node,
    stage,
    keys,
    box
  ]);
}

// Colour memory: watch the pads light up, then repeat the sequence.
function simonView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const status = el('p', { class: 'simon-status', 'aria-live': 'polite' });
  const score = scorer('simon');
  const pads = Array.from({ length: SIMON.pads }, (_, i) => el('button', { class: `simon-pad p${i}`, type: 'button', 'aria-label': t(`simonPad${i}`), onclick: () => tap(i) }));
  const board = el('div', { class: 'simon-board' }, pads);
  let seq = [];
  let at = 0;
  let phase = 'idle';
  let cleared = 0;
  let began = 0;
  const update = () => hud.set({ done: cleared, of: SIMON.max, earned: score.total, run: score.run });
  const light = (i, ms = 380) => {
    pads[i].classList.add('lit');
    later(() => pads[i].classList.remove('lit'), ms);
  };
  const play = () => {
    phase = 'show';
    status.textContent = t('simonWatch');
    const gap = Math.max(260, 560 - seq.length * 20);
    seq.forEach((p, k) => later(() => light(p, gap * 0.7), 500 + k * gap));
    later(() => {
      phase = 'input';
      at = 0;
      status.textContent = t('simonYou', { n: seq.length });
    }, 500 + seq.length * gap);
  };
  function tap(i) {
    if (phase === 'idle') return start();
    if (phase !== 'input') return;
    light(i, 200);
    if (i !== seq[at]) {
      phase = 'done';
      status.textContent = t('simonWrong');
      return later(() => finishRound('simon', score.total, box, t('simonDone', { n: cleared }), performance.now() - began, score), 700);
    }
    at++;
    if (at < seq.length) return;
    cleared++;
    hud.flash(score.good(simonPay(seq.length)), true);
    update();
    if (cleared >= SIMON.max) {
      phase = 'done';
      return later(() => finishRound('simon', score.total, box, t('simonDone', { n: cleared }), performance.now() - began, score), 500);
    }
    seq = [...seq, ...simonSequence(1)];
    phase = 'wait';
    later(play, 500);
  }
  function start() {
    began = performance.now();
    box.replaceChildren();
    seq = simonSequence(1);
    play();
  }
  status.textContent = t('simonReady');
  box.append(el('button', { class: 'q-btn primary game-big-button', type: 'button', text: t('gameStart'), onclick: start }));
  update();
  return el('div', { class: 'game', tabindex: '0', onkeydown: e => ['1', '2', '3', '4'].includes(e.key) && tap(Number(e.key) - 1) }, [
    el('p', { class: 'note', text: `${t('simonRules', { max: SIMON.max })} ${streakRule('simon')}` }),
    hud.node,
    status,
    board,
    box
  ]);
}

// Mini sudoku: three 4 x 4 puzzles; tap a square, then a number.
function sudokuView() {
  const t = state.t;
  const hud = gameHud();
  const box = el('div', { class: 'game-actions' });
  const grid = el('div', { class: 'sudoku-grid' });
  const pad = el('div', { class: 'sudoku-pad' });
  const score = scorer('sudoku');
  let solvedN = 0;
  let wrong = 0;
  let cur = null;
  let cells = [];
  let sel = -1;
  let timer = null;
  let over = false;
  const update = (left = SUDOKU.seconds) => hud.set({ done: solvedN, of: SUDOKU.puzzles, earned: score.total, run: score.run, label: `${t('hudCount', { n: solvedN, of: SUDOKU.puzzles })} · ${t('secondsLeft', { n: left })}` });
  const deal = () => {
    cur = sudokuPuzzle();
    cells = [...cur.puzzle];
    sel = cells.indexOf(0);
    paint();
  };
  const paint = (bad = -1) => {
    grid.replaceChildren(
      ...cells.map((v, i) =>
        el('button', {
          class: `sudoku-cell${cur.puzzle[i] ? ' given' : ''}${i === sel ? ' sel' : ''}${i === bad ? ' bad' : ''}${Math.floor(i / 4) === 1 ? ' band' : ''}${i % 4 === 1 ? ' stack' : ''}`,
          type: 'button',
          disabled: Boolean(cur.puzzle[i]) || over,
          text: v ? String(v) : '',
          onclick: () => ((sel = i), paint())
        })
      )
    );
  };
  function put(v) {
    if (over || sel < 0 || cur.puzzle[sel] || cells[sel]) return;
    timer ||= countdown(SUDOKU.seconds, update, end);
    if (cur.solution[sel] !== v) {
      wrong++;
      hud.flash(score.bad(), false);
      update(timer.left());
      return paint(sel);
    }
    cells[sel] = v;
    if (cells.every(Boolean)) {
      solvedN++;
      hud.flash(score.good(SUDOKU.pay), true);
      update(timer.left());
      paint();
      if (solvedN >= SUDOKU.puzzles) return later(end, 500);
      return later(deal, 500);
    }
    // On to the next empty square.
    const after = [...cells.keys()].filter(i => !cells[i]);
    sel = after.find(i => i > sel) ?? after[0];
    paint();
  }
  const end = () => {
    if (over) return;
    over = true;
    timer?.stop();
    paint();
    finishRound('sudoku', score.total, box, t('sudokuDone', { n: solvedN, miss: wrong }), timer ? performance.now() - timer.began : 0, score);
  };
  pad.append(...[1, 2, 3, 4].map(v => el('button', { class: 'q-btn sudoku-num', type: 'button', text: String(v), onclick: () => put(v) })));
  deal();
  update();
  return el('div', {
    class: 'game',
    tabindex: '0',
    onkeydown: e => {
      if (['1', '2', '3', '4'].includes(e.key)) put(Number(e.key));
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.key];
      if (step) {
        e.preventDefault();
        sel = Math.min(15, Math.max(0, sel + step));
        paint();
      }
    }
  }, [el('p', { class: 'note', text: `${t('sudokuRules', { n: SUDOKU.puzzles, s: SUDOKU.seconds, v: fmtPay(SUDOKU.pay) })} ${streakRule('sudoku')}` }), hud.node, grid, pad, box]);
}

// ---- The arcade ------------------------------------------------------------------------
//
// An arcade game (./arcade/<id>.js) is a function of `api` that returns its
// screen. It shows its score with api.set({ score, info }) and ends the round
// with api.end(score, summary); the pay is the score at the game's rate
// (arcadePay), paid like any round. Timers, frames, keys and swipes made
// through the api stop when the game closes.
const KEY_DIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'action', Enter: 'action' };
function arcadeView(id, make) {
  const t = state.t;
  const lang = ctx.locale === 'en' ? 'en' : 'zh';
  const box = el('div', { class: 'game-actions arcade-result' });
  const scoreEl = el('span', { class: 'arc-score num' });
  const infoEl = el('span', { class: 'arc-info num' });
  const payEl = el('strong', { class: 'arc-pay num' });
  const strip = el('div', { class: 'arc-strip' }, [scoreEl, infoEl, payEl]);
  const started = Date.now();
  let ended = false;
  let root = null;
  const api = {
    id,
    lang,
    el,
    t,
    L: (zh, en) => (lang === 'en' ? en : zh),
    rand: Math.random,
    later,
    animate,
    canvas: gameCanvas,
    burst,
    drawParticles,
    set({ score = 0, info = '' } = {}) {
      scoreEl.textContent = t('arcadeScore', { n: Math.round(score * 10) / 10 });
      infoEl.textContent = info;
      payEl.textContent = fmtMoney(arcadePay(id, score), { sign: false });
    },
    end(score, summary = null) {
      if (ended) return;
      ended = true;
      api.set({ score, info: t('arcadeOver') });
      root?.classList.add('over');
      finishRound(id, arcadePay(id, score), box, summary ?? t('arcadeSummary', { n: Math.round(score * 10) / 10 }), Date.now() - started);
      box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    get ended() {
      return ended;
    },
    onKey(fn) {
      const h = e => {
        const dir = KEY_DIR[e.key];
        if (!dir || !root?.isConnected || e.target?.tagName === 'INPUT') return;
        e.preventDefault();
        fn(dir, e);
      };
      document.addEventListener('keydown', h);
      cleanups.push(() => document.removeEventListener('keydown', h));
    },
    // Swipes on `node`: up, down, left, right (and a tap as 'tap').
    swipe(node, fn) {
      let from = null;
      node.style.touchAction = 'none';
      node.addEventListener('pointerdown', e => (from = { x: e.clientX, y: e.clientY }));
      node.addEventListener('pointerup', e => {
        if (!from) return;
        const dx = e.clientX - from.x;
        const dy = e.clientY - from.y;
        from = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return fn('tap', e);
        fn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up', e);
      });
    },
    every(fn, ms) {
      const h = setInterval(fn, ms);
      cleanups.push(() => clearInterval(h));
    },
    cleanup(fn) {
      cleanups.push(fn);
    }
  };
  api.set({ score: 0 });
  const stage = make(api);
  root = el('div', { class: `game arcade arcade-${id}` }, [strip, stage, box]);
  return root;
}
