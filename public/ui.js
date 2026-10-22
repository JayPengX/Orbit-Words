// The small pieces every tab draws with (the kit's controls, kit/ui.mjs and orbit.css).
import { toast as kitToast, pickSeg, h } from '#kit/ui.mjs';

export const el = h;
// A word's meaning that doesn't fit its one line drops its last senses (、)
// rather than ending in an ellipsis; one sense still too wide, smaller.
// In passes, so a list of 80 lays out three times, not once a row: every
// line's whole meaning written, every width read, the senses that fit found
// with the canvas (no layout), then those lines read once more to check.
export const FIT_SENSES = '.wr-main small.muted, .miss-mean';
const SLACK = 0.5;
let pen, penFont;
// (Spaces as a line lays them out: runs one, none at its ends.)
const textWidth = (text, font) => {
  pen ??= document.createElement('canvas').getContext('2d');
  if (penFont !== font) pen.font = penFont = font;
  return pen.measureText(text.replace(/\s+/g, ' ').trim()).width;
};
const shrunk = (base, cw, sw) => `${Math.max(base * 0.75, (base * cw) / sw - 0.3)}px`;
export function fitSenses(nodes) {
  const live = nodes.filter(n => n.isConnected && n.clientWidth);
  for (const n of live) {
    n.dataset.full ??= n.textContent;
    if (n.textContent !== n.dataset.full) n.textContent = n.dataset.full;
    if (n.style.fontSize) n.style.fontSize = '';
  }
  // (Every width and style read before any line is written: a read after a
  // write lays the page out again. A computed style is live: copied out.)
  const over = live
    .map(n => ({ n, cw: n.clientWidth, sw: n.scrollWidth }))
    .filter(row => row.sw > row.cw + SLACK)
    .map(row => {
      const cs = getComputedStyle(row.n);
      return Object.assign(row, {
        base: parseFloat(cs.fontSize),
        font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        room: row.cw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        parts: row.n.dataset.full.split('、'),
      });
    });
  for (const { n, font, room, parts } of over) {
    if (parts.length < 2) continue;
    while (parts.length > 1 && textWidth(parts.join('、'), font) > room + SLACK) parts.pop();
    n.textContent = parts.join('、');
  }
  for (const row of over) if (row.n.dataset.full.includes('、')) Object.assign(row, { cw: row.n.clientWidth, sw: row.n.scrollWidth });
  for (const { n, cw, sw, base, parts } of over) {
    if (sw <= cw + SLACK) continue;
    if (parts.length > 1) {
      // (The canvas said it fit and the line says not: the old way, one sense at a time.)
      while (parts.length > 1 && n.scrollWidth > n.clientWidth + SLACK) {
        parts.pop();
        n.textContent = parts.join('、');
      }
      if (n.scrollWidth > n.clientWidth + SLACK) n.style.fontSize = shrunk(base, n.clientWidth, n.scrollWidth);
    } else n.style.fontSize = shrunk(base, cw, sw);
  }
  // (A mistaken word's meaning that still won't fit is left out: the word is what the row says.)
  for (const { n } of over) if (n.classList.contains('miss-mean') && n.scrollWidth > n.clientWidth + SLACK) n.textContent = '';
}
export const put = (node, ...kids) => node.replaceChildren(...kids.filter(k => k != null && k !== false));
export const toast = (text, kind = '') => kitToast(text, { tone: kind === 'bad' ? 'bad' : '', ms: 2600 });
// A capsule of choices, one on: [{ id, label }] (the kit's segmented
// control; drawn again after a pick, its thumb slides from the last one).
export const segmented = (options, current, onPick, cls = '') => pickSeg(options, current, onPick, { cls });
// A row of chips, one on: [{ id, label }] (the kit's q-chips; it slides sideways).
export const chips = (options, current, onPick, cls = '') => pickSeg(options, current, onPick, { cls, chips: true });
// A search field that calls back as it's typed (not on every redraw).
// (The kit's search capsule: a magnifier, a clear button.)
export function searchField(value, placeholder, onInput) {
  const input = el('input', { type: 'search', value, placeholder, 'aria-label': placeholder, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'search' });
  let timer = 0;
  input.addEventListener('input', () => (clearTimeout(timer), (timer = setTimeout(() => onInput(input.value), 120))));
  input.addEventListener('keydown', e => e.key === 'Enter' && input.blur());
  const clear = el('button', { class: 'q-search-clear', type: 'button', 'aria-label': '清除', text: '✕', onclick: () => ((input.value = ''), onInput(''), input.focus()) });
  return el('label', { class: 'q-search' }, [input, clear]);
}
// A typed spelling against the right one: the right letters, each wrong one
// marked (spellDiff's [{ ch, ok }]).
export const diffLine = (parts, cls = '') => el('span', { class: `diff ${cls}`.trim() }, parts.map(d => el('span', { class: d.ok ? '' : 'bad', text: d.ch })));
// A list shown a page at a time: the button under it adds the next page in place.
export function pagedList(items, row, { page = 40, cls = 'q-rowcard words', empty = '', more: label = '' } = {}) {
  if (!items.length) return el('p', { class: 'none', text: empty });
  const box = el('div', { class: cls });
  const more = el('button', { class: 'q-btn more', type: 'button' });
  let shown = 0;
  const step = () => {
    const next = items.slice(shown, shown + page);
    shown += next.length;
    box.append(...next.map(row));
    more.hidden = shown >= items.length;
    more.textContent = `${label} (${(items.length - shown).toLocaleString()})`;
  };
  more.addEventListener('click', step);
  step();
  return el('div', { class: 'paged' }, [box, more]);
}
