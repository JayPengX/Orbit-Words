// The pieces every screen is drawn with: the kit's premium classes
// (quadra.css "Premium layer": q-page-head, q-hero-card, q-tile, q-rowcard,
// q-tag, q-stats, q-ambient) written as markup, so an older kit still runs
// the app; plus this app's own few glyphs (a speaker, cards, sliders).
import * as kitUI from '#kit/ui.mjs';
import { el } from '../ui.js';

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const OWN = {
  sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.3a7.8 7.8 0 0 1 0 11.4"/>'),
  cards: svg('<rect x="3.5" y="7" width="12" height="13.5" rx="2.5"/><path d="M8 4.5h9a2.5 2.5 0 0 1 2.5 2.5v10"/>'),
  sliders: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  down: svg('<path d="m7 10 5 5 5-5"/>'),
  left: svg('<path d="m14.5 6-6 6 6 6"/>'),
  right: svg('<path d="m9.5 6 6 6-6 6"/>'),
  flip: svg('<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>')
};
// A glyph by name: this app's own, else the kit's (empty on a kit without it).
export const ico = name => OWN[name] ?? kitUI.icons?.[name] ?? '';
const glyph = (node, name) => {
  const g = ico(name);
  if (g) node.innerHTML = g;
  else node.textContent = name.length <= 2 ? name : '';
  return node;
};


// A colour tile: a glyph's name, or a short text (a level's number).
export function tile(icon, color = '', size = '', soft = false) {
  const n = el('span', { class: `q-tile${size ? ` ${size}` : ''}${soft ? ' soft' : ''}`, 'aria-hidden': 'true' });
  if (color) n.style.setProperty('--t', color);
  return glyph(n, String(icon));
}
export const tag = (text, tone = '') => el('span', { class: `q-tag ${tone}`.trim(), text });
// An icon then a text, in one (a hero's eyebrow, a pill, a button).
export const iconText = (cls, icon, text, props = {}) => el(props.onclick ? 'button' : 'span', { class: cls, ...(props.onclick ? { type: 'button' } : {}), ...props }, [glyph(el('i', { class: 'gl' }), icon), el('span', { text })]);
export const bar = (value, max, cls = 'bar') => el('div', { class: cls, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(max), 'aria-valuenow': String(Math.min(value, max)) }, [el('i', { style: `width:${Math.min(100, max ? (value / max) * 100 : 0)}%` })]);

// The one card a tab leads with, on the app's rose: its top line (an
// eyebrow, and a pill on its right), then whatever the tab puts in it.
export const hero = (eyebrowIcon, eyebrow, pill, kids) =>
  el('div', { class: 'q-hero-card hero' }, [el('div', { class: 'hero-top' }, [iconText('q-hc-eyebrow', eyebrowIcon, eyebrow), pill]), ...kids]);
export const heroPill = (icon, text, onclick, label = '') => iconText('hero-pill q-press', icon, text, { onclick, 'aria-label': label || null });
export const heroBtn = (text, onclick, { ghost = false, disabled = false, icon = '' } = {}) =>
  el('button', { class: `q-hc-btn q-press${ghost ? ' ghost' : ''}`, type: 'button', disabled, onclick }, [icon ? glyph(el('i', { class: 'gl' }), icon) : null, text]);
export const big = (value, rest = '') => el('strong', { class: 'q-hc-big' }, [value, rest ? el('span', { class: 'dim', text: rest }) : null]);

// A section: a 20px head (and a button on its right), then its body.
export const section = (title, body, action = null) => {
  const head = kitUI.sectionHead?.(title) ?? el('div', { class: 'q-section-head' }, [el('h2', { text: title })]);
  if (action) head.append(action);
  return el('section', { class: 'q-section' }, [head, ...[].concat(body)]);
};
// A button in a section's head that opens a menu of choices (the kit's;
// on a kit without one, each tap moves to the next choice).
export function menuButton(options, current, onPick) {
  const now = options.find(o => o.id === current) || options[0];
  const b = el('button', { class: 'head-menu', type: 'button', 'aria-haspopup': 'menu' }, [el('span', { text: now.label }), glyph(el('i', { class: 'gl' }), 'down')]);
  b.addEventListener('click', () => {
    if (kitUI.menu) kitUI.menu(b, options.map(o => ({ label: o.label, icon: o.id === current ? '✓' : '', onClick: () => o.id !== current && onPick(o.id) })));
    else onPick(options[(options.indexOf(now) + 1) % options.length].id);
  });
  return b;
}

// A row of a card: { icon, color, soft, title, sub, value, tags, body, trailing, onClick, chevron, pressed, disabled }.
export function row(r) {
  const tagName = r.onClick ? 'button' : 'div';
  const n = el(tagName, { class: `q-ritem${r.onClick && r.chevron !== false ? ' chevron' : ''}${r.cls ? ` ${r.cls}` : ''}`, ...(r.onClick ? { type: 'button', onclick: r.onClick } : {}), ...(r.pressed != null ? { 'aria-pressed': String(r.pressed) } : {}), disabled: r.disabled || null });
  if (r.icon != null) n.append(r.icon instanceof Node ? r.icon : tile(r.icon, r.color, r.size || '', r.soft));
  n.append(el('span', { class: 'q-ritem-text' }, [el('span', { class: 'q-ritem-title', text: r.title }), r.sub ? el('small', { text: r.sub }) : null, r.tags?.length ? el('span', { class: 'q-tags' }, r.tags) : null, r.body || null]));
  if (r.value != null && r.value !== '') n.append(el('span', { class: 'q-ritem-value', text: String(r.value) }));
  if (r.trailing) n.append(r.trailing);
  return n;
}
export const rowCard = (rows, cls = '') => el('div', { class: `q-rowcard ${cls}`.trim() }, rows.filter(Boolean));
export const checkDot = on => {
  const n = el('span', { class: `pick${on ? ' on' : ''}`, 'aria-hidden': 'true' });
  if (on) n.innerHTML = ico('check');
  return n;
};
// Big numbers with their names, two to a line: [{ label, value, icon, color }].
export const stats = items =>
  el('div', { class: 'q-stats' }, items.map(it => el('div', { class: 'q-stat' }, [it.icon ? tile(it.icon, it.color, 'sm') : null, el('small', { text: it.label }), el('strong', { class: 'num', text: it.value })])));
