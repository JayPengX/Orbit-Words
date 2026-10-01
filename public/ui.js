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
