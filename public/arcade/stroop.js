// 顏色干擾: tap the colour the word is printed in, not the colour it names.
// 45 seconds. Score: right answers (a wrong one −1).
import { countdown, startButton } from './kit.js';

const NAMES = [['紅', 'RED', '#dc2626'], ['藍', 'BLUE', '#2563eb'], ['綠', 'GREEN', '#16a34a'], ['黃', 'YELLOW', '#ca8a04']];
export default function stroop(api) {
  let score = 0;
  let right = 0;
  let left = () => 45;
  const word = api.el('p', { class: 'st-word' });
  const opts = api.el('div', { class: 'st-opts' });
  const info = () => api.L(`${left()} 秒`, `${left()}s`);
  const ask = () => {
    const name = Math.floor(api.rand() * 4);
    let ink = Math.floor(api.rand() * 4);
    if (api.rand() < 0.75) while (ink === name) ink = Math.floor(api.rand() * 4);
    word.textContent = api.L(NAMES[name][0], NAMES[name][1]);
    word.style.color = NAMES[ink][2];
    opts.replaceChildren(...NAMES.map(([zh, en, col], k) => api.el('button', { class: 'st-opt', type: 'button', text: api.L(zh, en), onclick: () => {
      if (api.ended) return;
      if (k === ink) (score++, right++);
      else score = Math.max(0, score - 1);
      api.set({ score, info: info() });
      ask();
    } })));
  };
  const start = startButton(api, null, () => {
    left = countdown(api, 45, () => api.set({ score, info: info() }), () => api.end(score, api.L(`答對 ${right} 題。`, `${right} right.`)));
    ask();
  });
  return api.el('div', { class: 'arc-col' }, [api.el('p', { class: 'arc-hint', text: api.L('選「字的顏色」，不是字的意思', 'Pick the ink colour, not the word') }), word, opts, start]);
}
