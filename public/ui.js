// The small pieces every tab draws with.

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
export const put = (node, ...kids) => node.replaceChildren(...kids.filter(k => k != null && k !== false));
export const section = (title, content, { sub = '', action = null } = {}) =>
  el('section', { class: 'q-section' }, [el('div', { class: 'q-section-head' }, [el('h2', { text: title }), action]), sub ? el('p', { class: 'section-sub', text: sub }) : null, content]);
export function toast(text, kind = '') {
  const box = el('div', { class: `toast ${kind}`, text });
  document.getElementById('toasts').append(box);
  setTimeout(() => box.remove(), 2600);
}
export const bar = (value, max, cls = '') => el('div', { class: `meter ${cls}` }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);
export const stat = (label, value) => el('div', { class: 'stat' }, [el('strong', { class: 'num', text: value }), el('small', { text: label })]);
// A capsule of choices, one on: [{ id, label }].
export const segmented = (options, current, onPick, cls = '') =>
  el('div', { class: `segmented ${cls}`.trim(), role: 'group' }, options.map(o => el('button', { type: 'button', 'aria-pressed': String(o.id === current), onclick: () => o.id !== current && onPick(o.id) }, [o.label, o.count != null ? el('small', { class: 'seg-count num', text: String(o.count) }) : null])));
// A row of chips, one on: [{ id, label }] (the kit's q-chips; it slides sideways).
export const chips = (options, current, onPick, cls = '') =>
  el('div', { class: `q-chips ${cls}`.trim(), role: 'group' }, options.map(o => el('button', { class: `q-chip${o.id === current ? ' on' : ''}`, type: 'button', 'aria-pressed': String(o.id === current), text: o.label, onclick: () => o.id !== current && onPick(o.id) })));
// A search field that calls back as it's typed (not on every redraw).
export function searchField(value, placeholder, onInput) {
  const input = el('input', { class: 'search', type: 'search', value, placeholder, 'aria-label': placeholder, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'search' });
  let timer = 0;
  input.addEventListener('input', () => (clearTimeout(timer), (timer = setTimeout(() => onInput(input.value), 120))));
  input.addEventListener('keydown', e => e.key === 'Enter' && input.blur());
  return input;
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
