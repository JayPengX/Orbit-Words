// Quadra Words (四方單字): what this app does in the Quadra ecosystem, apart
// from its own sync (sync.js). Loaded as a module after the classic scripts.
//
//   - Home-screen only on phones, and always the newest deploy (quadra.mjs).
//   - Study rewards: every right answer and every word mastered for the
//     first time earns play money for the Quadra Pass's shared pool, where
//     Quadra Securities and Quadra Sportsbook can spend it
//     (ECONOMY.vocab: NT$3 a right answer, NT$25 a newly mastered word, at
//     most NT$600 a Taiwan day: the best pay for effort in Quadra). Earned money waits on this device until it
//     reaches the pass (or until there is one), then goes as one entry per
//     batch with a fixed id, so it's never paid twice.
//   - Back pay, once: what the rewards would have paid for everything
//     studied before they existed (backPay below).
//   - On the progress tab: the Quadra Pass panel (the same as in the other
//     apps; its actions are sync.js's) and the study rewards box.
import { ECONOMY, installGate, watchUpdates, poolBalance, randomId, passPanel } from './quadra.mjs';

const zh = () => (window.I18n?.getLocale?.() || document.documentElement.lang || 'zh').startsWith('zh');
const lang = () => (zh() ? 'zh' : 'en');

installGate('vocab', lang());
watchUpdates({ current: document.querySelector('meta[name="build-version"]')?.content, key: 'vocab', cachePrefix: 'vocab-tool-cache-', busy: () => Boolean(document.querySelector('#view-test.active') && !document.getElementById('test-form')?.classList.contains('hidden')) });

const KEY = 'quadra.words.rewards';
const TPE = 8 * 3_600_000;
const today = () => new Date(Date.now() + TPE).toISOString().slice(0, 10);

function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (r && typeof r === 'object') return { day: r.day || today(), earned: r.earned || 0, pending: Array.isArray(r.pending) ? r.pending : [], open: r.open || null, mastered: r.mastered || {}, total: r.total || 0, seeded: r.seeded, backpay: r.backpay || null };
  } catch {}
  return { day: today(), earned: 0, pending: [], open: null, mastered: {}, total: 0 };
}
let rewards = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(rewards));
  } catch {}
}

// This device's words mastered before rewards existed don't pay (only a
// first mastery from now on does): recorded once, the first time.
function seedMastered() {
  if (rewards.seeded) return;
  const progress = window.VocabState?.getProgress?.() || {};
  for (const [key, h] of Object.entries(progress)) if (window.VocabLogic?.classifyState?.(h) === 'memorized') rewards.mastered[key] = 1;
  rewards.seeded = true;
  save();
}

// One answer: `before` and `after` are the word's state around it.
function onAnswer(word, correct, before, after) {
  seedMastered();
  if (rewards.day !== today()) rewards = { ...rewards, day: today(), earned: 0 };
  const cap = ECONOMY.vocab.dailyCap;
  let amount = correct ? ECONOMY.vocab.perCorrect : 0;
  const key = String(word || '').toLowerCase();
  if (after === 'memorized' && before !== 'memorized' && !rewards.mastered[key]) {
    rewards.mastered[key] = 1;
    amount += ECONOMY.vocab.perMastered;
  }
  amount = Math.max(0, Math.min(amount, cap - rewards.earned));
  if (!amount) return save();
  rewards.earned += amount;
  rewards.total += amount;
  // Answers add up in an open batch; it's closed (and sent) at the end of a
  // round, after 25 answers' worth, or when the app goes to the background.
  rewards.open = rewards.open || { id: `vocab:${randomId()}`, t: Date.now(), amount: 0, n: 0 };
  rewards.open.amount += amount;
  rewards.open.n++;
  save();
  if (rewards.open.n >= 25) flush();
  else renderBox();
}

function closeBatch() {
  if (!rewards.open?.amount) return;
  const b = rewards.open;
  rewards.pending.push({ id: b.id, t: b.t, app: 'vocab', kind: 'reward', amount: b.amount, note: zh() ? `${b.n} 題` : `${b.n} answers` });
  rewards.open = null;
  save();
}

// ---- Back pay -----------------------------------------------------------------
//
// Study done before the rewards existed, paid once: what the rules would have
// paid if they always had (ECONOMY.vocab for every right answer ever and every
// word mastered now), within the daily cap over the days studied (the days
// seen in the progress's timestamps, so if anything too few), less
// everything the rewards have already paid (every device's, in the pass's
// wallet, and what still waits on this one). One entry with a fixed id, so
// a second device can never pay it again.
const BACKPAY_ID = 'vocab:backpay:v1';
export function backPayAmount(progress, alreadyPaid, classify = h => window.VocabLogic?.classifyState?.(h)) {
  let correct = 0;
  let mastered = 0;
  const days = new Set();
  const day = t => new Date(t + TPE).toISOString().slice(0, 10);
  for (const h of Object.values(progress || {})) {
    correct += Number(h?.correct) || 0;
    if (classify(h) === 'memorized') mastered++;
    for (const a of h?.recentAttempts || []) if (a?.timestamp) days.add(day(a.timestamp));
    if (h?.lastSeen) days.add(day(h.lastSeen));
  }
  const owed = correct * ECONOMY.vocab.perCorrect + mastered * ECONOMY.vocab.perMastered;
  const capped = Math.min(owed, days.size * ECONOMY.vocab.dailyCap);
  return { amount: Math.max(0, Math.round(capped - alreadyPaid)), correct, mastered, days: days.size, owed };
}

function paidSoFar(w) {
  const inWallet = (w?.entries || []).filter(e => e.app === 'vocab' && e.kind === 'reward' && e.id !== BACKPAY_ID).reduce((sum, e) => sum + e.amount, 0);
  const waiting = rewards.pending.filter(e => e.id !== BACKPAY_ID).reduce((sum, e) => sum + e.amount, 0) + (rewards.open?.amount || 0);
  return inWallet + waiting;
}

// Once the pass's wallet is read (so every device's rewards are counted)
// and this device's progress has been synced.
function maybeBackPay(w) {
  if (rewards.backpay || !w) return;
  if ((w.entries || []).some(e => e.id === BACKPAY_ID) || rewards.pending.some(e => e.id === BACKPAY_ID)) {
    rewards.backpay = { amount: 0, t: Date.now(), elsewhere: true };
    return save();
  }
  const synced = !window.VocabSync?.isSyncConfigured?.() || window.VocabSync?.panelState?.().syncedAt > 0;
  const progress = window.VocabState?.getProgress?.();
  if (!synced || !progress || !window.VocabLogic?.classifyState) return;
  const r = backPayAmount(progress, paidSoFar(w));
  rewards.backpay = { amount: r.amount, t: Date.now() };
  if (r.amount > 0) rewards.pending.push({ id: BACKPAY_ID, t: Date.now(), app: 'vocab', kind: 'reward', amount: r.amount, note: zh() ? `補發：之前的 ${r.correct} 題答對、${r.mastered} 個熟記` : `Back pay: ${r.correct} right answers and ${r.mastered} words mastered before rewards` });
  save();
  return r.amount > 0;
}

let wallet = null;
let sending = false;
async function flush() {
  closeBatch();
  const pass = window.VocabSync?.getPasscode?.();
  const base = window.VocabSync?.proxyBase?.();
  if (sending || !base || !window.VocabSync?.isQuadraPass?.(pass) || !navigator.onLine) return renderBox();
  sending = true;
  try {
    const entries = rewards.pending.slice(0, 500);
    const res = await fetch(`${base}/eco?passcode=${encodeURIComponent(pass)}&app=vocab`, {
      method: entries.length ? 'PATCH' : 'GET',
      headers: entries.length ? { 'Content-Type': 'application/json' } : {},
      body: entries.length ? JSON.stringify({ wallet: { entries } }) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.wallet || data.exists === false)) {
      wallet = data.wallet || null;
      const sent = new Set(entries.map(e => e.id));
      rewards.pending = rewards.pending.filter(e => !sent.has(e.id));
      save();
      // Back pay, once the wallet says what has been paid already.
      if (maybeBackPay(wallet)) setTimeout(flush, 500);
    }
  } catch {
  } finally {
    sending = false;
    renderBox();
    renderPass();
  }
}

const money = v => `NT$${Math.round(v).toLocaleString('en-US')}`;
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of children) if (c) node.append(c);
  return node;
};

function renderBox() {
  const box = document.getElementById('quadra-words');
  if (!box) return;
  const z = zh();
  const pass = window.VocabSync?.getPasscode?.() || '';
  const onPass = window.VocabSync?.isQuadraPass?.(pass);
  const waiting = rewards.pending.reduce((s, e) => s + e.amount, 0) + (rewards.open?.amount || 0);
  const earnedToday = rewards.day === today() ? rewards.earned : 0;
  const cap = ECONOMY.vocab.dailyCap;
  const bar = el('div', { className: 'quadra-words-bar' }, [el('i')]);
  bar.firstChild.style.width = `${Math.min(100, (earnedToday / cap) * 100)}%`;
  const rows = [
    el('p', { className: 'quadra-words-lede', textContent: z ? `答對一題 ${money(ECONOMY.vocab.perCorrect)}，第一次熟記一個字再加 ${money(ECONOMY.vocab.perMastered)}，每天最多 ${money(cap)}。在四方證券買股票、在四方運彩下注都能用。` : `${money(ECONOMY.vocab.perCorrect)} a right answer, ${money(ECONOMY.vocab.perMastered)} more for each word mastered the first time, up to ${money(cap)} a day. Spend it on stocks in Quadra Securities or bets in Quadra Sportsbook.` }),
    el('div', { className: 'quadra-words-stats' }, [
      el('div', {}, [el('small', { textContent: z ? '今天' : 'Today' }), el('strong', { textContent: `${money(earnedToday)} / ${money(cap)}` }), bar]),
      el('div', {}, [el('small', { textContent: z ? '累計' : 'All time' }), el('strong', { textContent: money(rewards.total) })])
    ]),
    rewards.backpay?.amount > 0 ? el('p', { className: 'hint', textContent: z ? `🎁 已補發之前的學習獎勵 ${money(rewards.backpay.amount)}。` : `🎁 Back pay for your earlier study: ${money(rewards.backpay.amount)}.` }) : null,
    waiting > 0 ? el('p', { className: 'hint', textContent: onPass ? (z ? `${money(waiting)} 正在存進資金池…` : `${money(waiting)} on its way to the pool…`) : z ? `${money(waiting)} 先存在這台裝置，登入四方通行碼後就會存進資金池。` : `${money(waiting)} is kept on this device until you sign in with a Quadra Pass.` }) : null
  ];
  box.replaceChildren(el('h3', { className: 'quadra-words-title', textContent: z ? '💰 學習獎勵' : '💰 Study rewards' }), ...rows.filter(Boolean));
}

// The Quadra Pass panel; its actions are sync.js's.
let panel = null;
let panelLang = '';
function renderPass() {
  const slot = document.getElementById('quadra-pass');
  const sync = window.VocabSync;
  if (!slot || !sync?.panelState) return;
  if (!panel || panelLang !== lang()) {
    panelLang = lang();
    panel = passPanel({
      app: 'vocab',
      lang: panelLang,
      create: () => sync.createPass(),
      enter: code => sync.joinPass(code),
      sync: () => sync.syncByHand(),
      signOut: () => sync.signOut()
    });
    slot.replaceChildren(panel.el);
  }
  const pass = sync.getPasscode?.() || '';
  const view = sync.panelState();
  panel.update({
    pass: sync.isQuadraPass(pass) ? pass : '',
    error: view.status.isError ? view.status.text : '',
    note: view.fresh ? (zh() ? '請記下通行碼：它是這個帳戶唯一的鑰匙。' : 'Write your pass down: it is the only key to this account.') : '',
    syncedAt: view.syncedAt,
    pool: wallet ? poolBalance(wallet) : null
  });
}

window.QuadraWords = { onAnswer, flush, render: renderBox, renderPass };
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
  else flush();
});
window.addEventListener('online', flush);
renderBox();
renderPass();
setTimeout(flush, 3000);
