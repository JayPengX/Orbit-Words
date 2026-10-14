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
export const FIT_SENSES = '.word-row-main small.muted, .miss-mean';
export function fitSenses(nodes) {
  for (const n of nodes) {
    if (!n.isConnected || !n.clientWidth) continue;
    n.dataset.full ??= n.textContent;
    n.textContent = n.dataset.full;
    n.style.fontSize = '';
    const parts = n.dataset.full.split('、');
    while (parts.length > 1 && n.scrollWidth > n.clientWidth + 0.5) {
      parts.pop();
      n.textContent = parts.join('、');
    }
    if (n.scrollWidth > n.clientWidth + 0.5) {
      const base = parseFloat(getComputedStyle(n).fontSize);
      n.style.fontSize = `${Math.max(base * 0.75, (base * n.clientWidth) / n.scrollWidth - 0.3)}px`;
    }
  }
}
// A category's name and count that don't fit its button (four-digit counts
// on a narrow phone): the button's text a little smaller, never cut.
// (Measured as the text itself: Safari's scrollWidth of a button doesn't
// count what overflows its inner box.)
export function fitButtons(nodes) {
  for (const n of nodes) {
    n.style.fontSize = '';
    const cs = getComputedStyle(n);
    const room = n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const range = document.createRange();
    range.selectNodeContents(n);
    const need = range.getBoundingClientRect().width;
    if (room <= 0 || need <= room + 0.5) continue;
    const base = parseFloat(cs.fontSize);
    n.style.fontSize = `${Math.max(base * 0.75, Math.floor(((base * room) / need) * 10) / 10 - 0.2)}px`;
  }
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
