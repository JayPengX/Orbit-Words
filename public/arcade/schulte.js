// 數字方格: tap 1 to 25 in order as fast as you can. Score: 50 − seconds.
import { shuffle, schultePay } from '../lib/arcade.mjs';

export default function schulte(api) {
  const nums = shuffle([...Array(25).keys()].map(i => i + 1), api.rand);
  let want = 1;
  let started = 0;
  let misses = 0;
  const secs = () => (started ? (performance.now() - started) / 1000 : 0) + misses * 2;
  const grid = api.el('div', { class: 'sc-grid' }, nums.map(v => api.el('button', { class: 'sc-cell num', type: 'button', text: String(v), onclick: e => {
    if (api.ended) return;
    if (v !== want) {
      if (started) misses++;
      e.currentTarget.classList.add('bad');
      setTimeout(() => e.currentTarget?.classList.remove('bad'), 250);
      return;
    }
    if (want === 1) started = performance.now();
    e.currentTarget.classList.add('done');
    want++;
    api.set({ score: 0, info: api.L(`找 ${Math.min(25, want)} · ${secs().toFixed(1)} 秒`, `Find ${Math.min(25, want)} · ${secs().toFixed(1)}s`) });
    if (want > 25) api.end(schultePay(secs()), api.L(`${secs().toFixed(1)} 秒完成（錯一次加 2 秒）。`, `Done in ${secs().toFixed(1)}s (2s added a miss).`));
  } })));
  api.set({ score: 0, info: api.L('找 1', 'Find 1') });
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('從 1 按到 25，按錯加 2 秒', 'Tap 1 to 25 in order; a miss adds 2s') }), grid]);
}
