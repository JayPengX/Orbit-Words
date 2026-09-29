// 字母方塊 (Boggle): make words from touching letters (any direction, each square
// once a word). Three letters or more, from the word list. Two minutes.
import { allWords, countdown, startButton } from './kit.js';

const DICE = ['aaeegn', 'abbjoo', 'achops', 'affkps', 'aoottw', 'cimotu', 'deilrx', 'delrvy', 'distty', 'eeghnw', 'eeinsu', 'ehrtvw', 'eiosst', 'elrtty', 'himnqu', 'hlnnrz'];
export default function boggle(api) {
  const letters = DICE.map(d => d[Math.floor(api.rand() * 6)]).sort(() => api.rand() - 0.5);
  let dict = null;
  allWords().then(d => (dict = d)).catch(() => (dict = new Set(api.words().map(w => w.word.toLowerCase()))));
  let path = [];
  const found = [];
  let score = 0;
  let left = () => 120;
  let started = false;
  const word = api.el('p', { class: 'bg-word' });
  const list = api.el('p', { class: 'bg-found' });
  const cells = letters.map((ch, i) => api.el('button', { class: 'bg-cell', type: 'button', text: ch === 'q' ? 'Qu' : ch.toUpperCase(), onclick: () => tap(i) }));
  const near = (a, b) => Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) <= 1 && Math.abs((a % 4) - (b % 4)) <= 1;
  const text = () => path.map(i => (letters[i] === 'q' ? 'qu' : letters[i])).join('');
  const paint = () => {
    cells.forEach((c, i) => ((c.className = `bg-cell${path.includes(i) ? ' on' : ''}${path.at(-1) === i ? ' last' : ''}`)));
    word.textContent = text().toUpperCase() || '　';
    list.textContent = found.join(' · ');
    api.set({ score, info: started ? api.L(`${left()} 秒 · ${found.length} 個字`, `${left()}s · ${found.length} words`) : '' });
  };
  function tap(i) {
    if (!started || api.ended) return;
    if (path.at(-1) === i) path.pop();
    else if (!path.includes(i) && (!path.length || near(path.at(-1), i))) path.push(i);
    paint();
  }
  const submit = () => {
    const w = text();
    if (w.length >= 3 && dict?.has(w) && !found.includes(w)) {
      found.unshift(w);
      score += [0, 0, 0, 1, 1, 2, 3, 5, 8][Math.min(8, w.length)] + (w.length > 8 ? 3 : 0);
      word.classList.add('ok');
    } else word.classList.add('bad');
    api.later(() => word.classList.remove('ok', 'bad'), 300);
    path = [];
    paint();
  };
  const go = api.el('button', { class: 'q-btn primary', type: 'button', text: api.L('送出單字', 'Submit word'), onclick: submit });
  const clear = api.el('button', { class: 'q-btn', type: 'button', text: api.L('清除', 'Clear'), onclick: () => ((path = []), paint()) });
  const start = startButton(api, null, () => {
    started = true;
    left = countdown(api, 120, paint, () => api.end(score, api.L(`找到 ${found.length} 個字。`, `${found.length} words.`)));
    paint();
  });
  paint();
  return api.el('div', { class: 'arc-col' }, [word, api.el('div', { class: 'bg-board' }, cells), api.el('div', { class: 'arc-row' }, [clear, go]), list, start]);
}
