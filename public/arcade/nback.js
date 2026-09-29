// N-back: letters one at a time; press 一樣 when this one matches the one two
// back (three back after 20). Hits score, false alarms and misses cost.
import { startButton } from './kit.js';

const LETTERS = 'BCDFGHKLMR'.split('');
const TRIALS = 36;
export default function nback(api) {
  let seq = [];
  let i = -1;
  let n = 2;
  let score = 0;
  let hits = 0;
  let pressed = false;
  let started = false;
  const show = api.el('div', { class: 'nb-letter', text: '·' });
  const btn = api.el('button', { class: 'q-btn primary game-big-button', type: 'button', text: api.L('一樣！', 'Match!'), onclick: () => press() });
  const info = () => api.set({ score, info: started ? api.L(`${n}-back · 第 ${Math.max(0, i + 1)}/${TRIALS}`, `${n}-back · ${Math.max(0, i + 1)}/${TRIALS}`) : '' });
  const isMatch = () => i >= n && seq[i] === seq[i - n];
  function press() {
    if (!started || api.ended || pressed || i < 0) return;
    pressed = true;
    if (isMatch()) (score += 2, hits++, show.classList.add('ok'));
    else (score = Math.max(0, score - 1), show.classList.add('bad'));
    info();
  }
  const step = () => {
    if (api.ended) return;
    if (i >= 0 && isMatch() && !pressed) (score = Math.max(0, score - 1), show.classList.add('miss'));
    api.later(() => {
      if (api.ended) return;
      i++;
      if (i >= TRIALS) return api.end(score, api.L(`抓到 ${hits} 次相同。`, `${hits} matches caught.`));
      if (i === 20) n = 3;
      // About a third of trials are matches.
      seq[i] = i >= n && api.rand() < 0.33 ? seq[i - n] : LETTERS[Math.floor(api.rand() * LETTERS.length)];
      pressed = false;
      show.className = 'nb-letter';
      show.textContent = seq[i];
      info();
      api.later(() => (show.textContent = ''), 1400);
      api.later(step, 2300);
    }, 250);
  };
  api.onKey(k => k === 'action' && press());
  const go = startButton(api, null, () => {
    started = true;
    seq = [];
    step();
  });
  info();
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('跟兩個前的字母一樣就按（20 題後變三個前）', 'Press when it matches two back (three back after 20)') }), show, btn, go]);
}
