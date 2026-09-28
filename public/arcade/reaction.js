// 反應力: tap as soon as the panel turns green; five tries. Tapping early
// costs 3. Score: (500 − your average ms) / 8.
import { reactionPay } from '../lib/arcade.mjs';

export default function reaction(api) {
  const times = [];
  let penalty = 0;
  let phase = 'idle';
  let shownAt = 0;
  const pad = api.el('button', { class: 'rx-pad', type: 'button' });
  const score = () => Math.max(0, (times.length ? reactionPay(times.reduce((a, b) => a + b, 0) / times.length) : 0) - penalty);
  const say = (text, cls) => {
    pad.textContent = text;
    pad.className = `rx-pad ${cls}`;
  };
  const arm = () => {
    phase = 'wait';
    say(api.L('等綠色…', 'Wait for green…'), 'wait');
    api.later(() => {
      if (phase !== 'wait') return;
      phase = 'go';
      shownAt = performance.now();
      say(api.L('點！', 'Tap!'), 'go');
    }, 1200 + api.rand() * 2500);
  };
  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (api.ended) return;
    if (phase === 'idle' || phase === 'shown') return arm();
    if (phase === 'wait') {
      phase = 'shown';
      penalty += 3;
      say(api.L('太早了！（−3）點一下再來', 'Too soon! (−3) Tap to retry'), 'early');
      return;
    }
    if (phase === 'go') {
      const ms = Math.round(performance.now() - shownAt);
      times.push(ms);
      api.set({ score: score(), info: `${times.length}/5` });
      if (times.length >= 5) {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        say(`${ms} ms`, 'done');
        return api.end(score(), api.L(`平均 ${avg} 毫秒。`, `Average ${avg} ms.`));
      }
      phase = 'shown';
      say(api.L(`${ms} 毫秒 · 點一下下一次`, `${ms} ms · tap for the next`), 'shown');
    }
  });
  say(api.L('點一下開始', 'Tap to start'), 'idle');
  api.set({ score: 0, info: '0/5' });
  return api.el('div', { class: 'arc-col' }, [pad]);
}
