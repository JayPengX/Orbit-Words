// 紅綠燈 (Go / no-go): green, tap as fast as you can; red, don't touch. 40
// lights. A fast tap on green scores up to 2, tapping red costs 2.
import { startButton } from './kit.js';

const TRIALS = 40;
export default function gonogo(api) {
  let n = 0;
  let score = 0;
  let state = 'idle';
  let shown = 0;
  let times = [];
  let slips = 0;
  const light = api.el('button', { class: 'gn-light', type: 'button' });
  const note = api.el('p', { class: 'arc-hint', text: api.L('綠燈點，紅燈不要點', 'Tap on green, never on red') });
  const info = () => api.set({ score: Math.round(score * 10) / 10, info: api.L(`第 ${Math.min(n, TRIALS)}/${TRIALS}`, `${Math.min(n, TRIALS)}/${TRIALS}`) });
  const next = () => {
    if (api.ended) return;
    if (n >= TRIALS) {
      const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      return api.end(Math.round(score * 10) / 10, api.L(`平均反應 ${avg} 毫秒，踩紅燈 ${slips} 次。`, `Average ${avg} ms, ${slips} reds tapped.`));
    }
    state = 'wait';
    light.className = 'gn-light';
    api.later(() => {
      if (api.ended) return;
      n++;
      state = api.rand() < 0.3 ? 'red' : 'green';
      light.className = `gn-light ${state}`;
      shown = performance.now();
      const mine = n;
      info();
      api.later(() => {
        if (n !== mine || state === 'wait') return;
        if (state === 'red') score += 0.5;
        next();
      }, state === 'red' ? 900 : 1000);
    }, 500 + api.rand() * 900);
  };
  light.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (api.ended || state === 'idle') return;
    if (state === 'green') {
      const ms = performance.now() - shown;
      times.push(ms);
      score += Math.max(0.5, 2 - ms / 400);
      light.className = 'gn-light ok';
    } else if (state === 'red') {
      score = Math.max(0, score - 2);
      slips++;
      light.className = 'gn-light bad';
    } else return;
    state = 'wait';
    info();
    api.later(next, 250);
  });
  const go = startButton(api, null, next);
  info();
  return api.el('div', { class: 'arc-col' }, [note, light, go]);
}
