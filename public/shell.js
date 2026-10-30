// What every screen shares: the state, the text, and the hooks app.js fills
// in (save, redraw). The screens (views/*.js) draw from here; app.js owns
// starting, saving and the tabs.
import { lang as locale, makeT } from '#kit/lang.mjs';
import { STRINGS } from './lib/i18n.mjs';
import { el } from './ui.js';

// The kit's lang.mjs: the language and the string table's t.
export { locale };
export const t = makeT(STRINGS, locale);

export const state = {
  tab: 'today',
  words: null,
  byKey: new Map(),
  // Hints (data/hints.json): key → { tip, common }; loaded after the words.
  hints: new Map(),
  // A word's example and forms (data/more.json): key → { forms, en, zh }; loaded after the words.
  more: new Map(),
  progress: {},
  days: {},
  // Right answers and seconds per day (practice.mjs logResult).
  log: {},
  // Bookmarks (review.mjs).
  marks: {},
  // Options: { rate } the sound's speed.
  opt: {},
  // Contests taken (lib/contest.mjs contestRow), the latest first.
  ct: [],
  levels: [1, 2, 3],
  mode: 'smart',
  size: 10,
  loaded: false,
  // New words studied as cards, waiting for their quiz (keys).
  study: [],
  // Reviews for fitting the memory model to this person (words.mjs personalFactor).
  cal: [],
  // When the settings (levels, mode, the sound's speed) were last set, in
  // seconds: the newer copy's win across devices (copy.mjs mergeCopy).
  st: 0,
  // What's running in a tab, over its usual screen: { kind: 'round' |
  // 'study' | 'flash', home: the tab it runs in, … }.
  session: null
};

// Filled in by app.js: changed() saves soon, render() redraws the open tab,
// sync() saves now.
export const hooks = { changed() {}, render() {}, sync() {} };
// A setting changed here: dated, so it wins over an older copy's, and saved.
export const settingsChanged = () => ((state.st = Math.round(Date.now() / 1000)), hooks.changed());

export const levelName = l => t('level', { n: l });
export const joined = items => items.join(locale === 'en' ? ', ' : '、');
export const hintOf = key => state.hints.get(key) || null;
export const moreOf = key => state.more.get(key) || null;
// The line under a word: [KK] · part of speech · level.
export const metaLine = word => [word.ph ? `[${word.ph}]` : '', word.pos, levelName(word.level)].filter(Boolean).join(' · ');
export const percent = x => (x == null ? '—' : `${Math.round(x * 100)}%`);
// 3 天後, 今天, 2 天前 (a due date against today).
export function dueText(days) {
  if (days == null) return '';
  if (days <= 0) return days === 0 ? t('dueToday') : t('overdueN', { n: -days });
  return days === 1 ? t('dueTomorrow') : t('dueInN', { n: days });
}
// A word as a headline, on one line beside its 🔊: the longer it is, the
// smaller (styles.css reads --len), never broken mid-word.
export const wordEl = (word, cls = '') => el('strong', { lang: 'en', class: `word q-fit ${cls}`.trim(), style: `--len:${word.word.length}`, text: word.word });
