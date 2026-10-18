// The premium look's small pieces (the kit's quadra.css "Premium layer"),
// written as markup with its class names so an older kit still runs the app.
import * as kitUI from '#kit/ui.mjs';
import { el } from '../ui.js';
import { locale, t } from '../shell.js';

export const ico = name => kitUI.icons?.[name] ?? '';
const glyph = (node, g) => (typeof g === 'string' && g.trim().startsWith('<svg') ? (node.innerHTML = g) : (node.textContent = g ?? ''));

export const dayLine = () => new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-TW', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Taipei' });
export const pageHead = (title, over = '') => el('header', { class: 'q-page-head' }, [over ? el('p', { class: 'q-over', text: over }) : null, el('h1', { text: title })]);

// A colour tile holding a glyph: name of a kit icon, or a short text.
export function tile(icon, color = '', size = '', soft = false) {
  const n = el('span', { class: `q-tile${size ? ` ${size}` : ''}${soft ? ' soft' : ''}`, 'aria-hidden': 'true' });
  if (color) n.style.setProperty('--t', color);
  glyph(n, kitUI.icons?.[icon] ?? icon);
  return n;
}
export const tag = (text, tone = '') => el('span', { class: `q-tag ${tone}`.trim(), text });
export const heroTag = (icon, text) => {
  const n = el('span', { class: 'hc-tag' });
  if (icon) n.append(el('i', {}));
  if (icon) glyph(n.firstChild, ico(icon));
  n.append(el('span', { text }));
  return n;
};
export const heroBar = (value, max) => el('div', { class: 'hc-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(Math.min(value, max)) }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);
export const heroEyebrow = (icon, text) => {
  const n = el('span', { class: 'q-hc-eyebrow' });
  const i = el('i', { class: 'hc-ico' });
  glyph(i, ico(icon));
  n.append(i, el('span', { text }));
  return n;
};

// A row of a card: { icon, color, title, sub, value, tags, body, onClick, pressed, soft }.
export function row(r) {
  const tag = r.onClick ? 'button' : 'div';
  const n = el(tag, { class: `q-ritem${r.onClick && r.chevron !== false ? ' chevron' : ''}`, ...(tag === 'button' ? { type: 'button', onclick: r.onClick } : {}), ...(r.pressed != null ? { 'aria-pressed': String(r.pressed) } : {}), ...(r.disabled ? { disabled: '' } : {}) });
  if (r.icon) n.append(tile(r.icon, r.color, r.size || '', r.soft));
  n.append(el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: r.title }), r.sub ? el('small', { text: r.sub }) : null, r.tags?.length ? el('span', { class: 'q-tags' }, r.tags) : null, r.body || null]));
  if (r.value !== undefined && r.value !== '') n.append(el('span', { class: 'q-ritem-value', text: String(r.value) }));
  if (r.trailing) n.append(r.trailing);
  return n;
}
export const rowCard = (rows, cls = '') => el('div', { class: `q-rowcard ${cls}`.trim() }, rows.filter(Boolean));
export const miniBar = (value, max, color = '') => {
  const n = el('div', { class: 'mini-bar' }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);
  if (color) n.style.setProperty('--t', color);
  return n;
};
export const checkDot = on => {
  const n = el('span', { class: `pick-dot${on ? ' on' : ''}`, 'aria-hidden': 'true' });
  if (on) n.innerHTML = ico('check');
  return n;
};
// Big numbers with their names: [{ label, value, icon, color, tint }].
export function statsRow(items) {
  const s = el('div', { class: 'q-stats' });
  s.style.setProperty('--q-stats-n', String(items.length === 4 ? 2 : Math.min(items.length, 3)));
  for (const it of items) s.append(el('div', { class: 'q-stat' }, [it.icon ? tile(it.icon, it.color, 'sm') : null, el('small', { text: it.label }), el('strong', { class: it.tint ? 'tint' : '', text: it.value })]));
  return s;
}
export const SIZES = [10, 20, 30];
export const t_ = t;
