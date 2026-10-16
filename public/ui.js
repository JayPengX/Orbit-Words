// The small pieces every tab draws with (the kit's controls, kit/ui.mjs and quadra.css).
import { toast as kitToast, settleSegs } from '#kit/ui.mjs';

export function el(tag, props = {}, children = []) {
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
// A word's meaning that doesn't fit its one line drops its last senses (、)
// rather than ending in an ellipsis; one sense still too wide, smaller.
// In passes, so a list of 80 lays out three times, not once a row: every
// line's whole meaning written, every width read, the senses that fit found
// with the canvas (no layout), then those lines read once more to check.
export const FIT_SENSES = '.word-row-main small.muted, .miss-mean';
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
}
// A category's name and count that don't fit its button (four-digit counts
// on a narrow phone): the button's text a little smaller, never cut.
// (Measured as the text itself: Safari's scrollWidth of a button doesn't
// count what overflows its inner box.) All written, then all read, then sized.
export function fitButtons(nodes) {
  for (const n of nodes) if (n.style.fontSize) n.style.fontSize = '';
  const sizes = nodes.map(n => {
    const cs = getComputedStyle(n);
    const room = n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const range = document.createRange();
    range.selectNodeContents(n);
    const need = range.getBoundingClientRect().width;
    if (room <= 0 || need <= room + 0.5) return 0;
    const base = parseFloat(cs.fontSize);
    return Math.max(base * 0.75, Math.floor(((base * room) / need) * 10) / 10 - 0.2);
  });
  nodes.forEach((n, i) => sizes[i] && (n.style.fontSize = `${sizes[i]}px`));
  // One size across a control (its smallest), not one option smaller than the next.
  for (const seg of new Set(nodes.map(n => n.parentElement))) {
    const kids = [...seg.children];
    const sizes = kids.map(k => k.style.fontSize).filter(Boolean);
    if (sizes.length) kids.forEach(k => (k.style.fontSize = `${Math.min(...sizes.map(parseFloat))}px`));
  }
}
export const put = (node, ...kids) => node.replaceChildren(...kids.filter(k => k != null && k !== false));
export const section = (title, content, { sub = '', action = null } = {}) =>
  el('section', { class: 'q-section' }, [el('div', { class: 'q-section-head' }, [el('h2', { text: title }), action]), sub ? el('p', { class: 'section-sub', text: sub }) : null, content]);
export const toast = (text, kind = '') => kitToast(text, { tone: kind === 'bad' ? 'bad' : '', ms: 2600 });
export const bar = (value, max, cls = '') => el('div', { class: `meter ${cls}` }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);
export const stat = (label, value) => el('div', { class: 'stat' }, [el('strong', { class: 'num', text: value }), el('small', { text: label })]);
// A capsule of choices, one on: [{ id, label }] (the kit's segmented
// control; drawn again after a pick, its thumb slides from the last one).
const lastPick = new Map();
export function segmented(options, current, onPick, cls = '') {
  const key = cls || options.map(o => o.id).join('|');
  const at = id => Math.max(0, options.findIndex(o => o.id === id));
  const from = lastPick.has(key) ? lastPick.get(key) : current;
  lastPick.set(key, current);
  const seg = el('div', { class: `q-seg ${cls}`.trim(), role: 'group', style: `--q-seg-n:${options.length};--q-seg-i:${at(from)}`, 'data-to': String(at(current)) }, options.map(o => el('button', { type: 'button', 'aria-pressed': String(o.id === current), onclick: () => o.id !== current && onPick(o.id) }, [o.label, o.count != null ? el('small', { class: 'seg-count num', text: String(o.count) }) : null])));
  queueMicrotask(() => settleSegs(seg.parentNode || document));
  return seg;
}
// A row of chips, one on: [{ id, label }] (the kit's q-chips; it slides sideways).
export const chips = (options, current, onPick, cls = '') =>
  el('div', { class: `q-chips ${cls}`.trim(), role: 'group' }, options.map(o => el('button', { class: `q-chip${o.id === current ? ' on' : ''}`, type: 'button', 'aria-pressed': String(o.id === current), text: o.label, onclick: () => o.id !== current && onPick(o.id) })));
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
export function pagedList(items, row, { page = 40, cls = 'q-card list', empty = '', more: label = '' } = {}) {
  if (!items.length) return el('p', { class: 'empty muted', text: empty });
  const box = el('div', { class: cls });
  const more = el('button', { class: 'q-btn small block more', type: 'button' });
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
