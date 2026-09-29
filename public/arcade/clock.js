// 看時鐘: read the clock. 60 seconds; five-minute steps first, then any minute.
import { quiz } from './kit.js';

function face(api, h, m) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'clock-face');
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<line x1="${50 + 40 * Math.sin(a)}" y1="${50 - 40 * Math.cos(a)}" x2="${50 + 45 * Math.sin(a)}" y2="${50 - 45 * Math.cos(a)}" stroke="currentColor" stroke-width="${i % 3 ? 1.5 : 3}"/>`;
  }).join('');
  const ha = ((h % 12) + m / 60) * 30;
  const ma = m * 6;
  svg.innerHTML = `<circle cx="50" cy="50" r="47" fill="var(--q-surface)" stroke="currentColor" stroke-width="2.5"/>${ticks}
    <line x1="50" y1="50" x2="${50 + 24 * Math.sin((ha * Math.PI) / 180)}" y2="${50 - 24 * Math.cos((ha * Math.PI) / 180)}" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50 + 36 * Math.sin((ma * Math.PI) / 180)}" y2="${50 - 36 * Math.cos((ma * Math.PI) / 180)}" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3" fill="currentColor"/>`;
  return svg;
}
const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
export default function clock(api) {
  return quiz(api, {
    seconds: 60,
    ask(level) {
      const step = level < 0.4 ? 5 : 1;
      const h = 1 + Math.floor(api.rand() * 12);
      const m = Math.floor(api.rand() * (60 / step)) * step;
      const right = fmt(h, m);
      // Wrong ones a reader would pick: hands swapped, an hour off, the minutes off.
      const tempt = [fmt(((Math.round(m / 5) + 11) % 12) + 1, (h % 12) * 5), fmt((h % 12) + 1, m), fmt(h, (m + 30) % 60), fmt(h, (m + 55 - (step === 1 ? 4 : 0)) % 60)];
      const choices = [right, ...[...new Set(tempt)].filter(x => x !== right)].slice(0, 4);
      while (choices.length < 4) choices.push(fmt(1 + Math.floor(api.rand() * 12), Math.floor(api.rand() * 12) * 5));
      const order = choices.map((c, i) => [api.rand(), c, i]).sort((a, b) => a[0] - b[0]);
      return { prompt: face(api, h, m), choices: order.map(o => o[1]), answer: order.findIndex(o => o[2] === 0) };
    }
  });
}
