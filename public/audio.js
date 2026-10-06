// Pronunciation: every word has a recording in Microsoft's neural voice
// (data/audio, en-US Jenny). One <audio> element is reused, so once a tap
// has played it (iOS only lets sound start from a tap) later words play
// from code too, and each word is started right in the tap that asks for it
// (never after a delay, which iOS would silence). Without the clip
// (offline, a missing file): the device's best English voice (lib/voice.mjs).
// The speed is the person's (state.opt.rate, 0.75 to 1.25).
import { pickVoice } from './lib/voice.mjs';
import { el } from './ui.js';
import { state, t } from './shell.js';

export const RATES = [0.75, 1, 1.25];
const rate = () => (RATES.includes(state.opt.rate) ? state.opt.rate : 1);
const clipUrl = word => `./data/audio/${encodeURIComponent(word.word)}.mp3`;

const clip = typeof Audio === 'function' ? new Audio() : null;
if (clip) clip.preload = 'auto';
let voices = [];
const loadVoices = () => {
  try {
    voices = speechSynthesis.getVoices();
  } catch {}
};
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
function voiceSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  if (!voices.length) loadVoices();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(voices);
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-US';
  u.rate = 0.95 * rate();
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
export function speak(word) {
  if (!word) return;
  if (!clip) return voiceSpeak(word.word);
  try {
    clip.pause();
  } catch {}
  let fell = false;
  const fallback = () => {
    if (fell) return;
    fell = true;
    voiceSpeak(word.word);
  };
  clip.onerror = fallback;
  clip.src = clipUrl(word);
  clip.playbackRate = rate();
  clip.defaultPlaybackRate = rate();
  clip.play().catch(e => e?.name !== 'AbortError' && fallback());
}
// The next word's clip fetched ahead (the service worker keeps it), so it
// plays at once when its question comes. Quietly: a failure is the clip's
// own fallback later.
const fetched = new Set();
export function prefetch(word) {
  if (!word || fetched.has(word.key) || typeof fetch !== 'function') return;
  fetched.add(word.key);
  fetch(clipUrl(word), { priority: 'low' }).catch(() => fetched.delete(word.key));
}
export const speakButton = (word, big = false) => el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), text: '🔊', onclick: e => (e.stopPropagation(), speak(word)) });
