// Pronunciation: every word has a recording in Microsoft's neural voice
// (data/audio, en-US Jenny), played through Web Audio in iOS's "ambient"
// audio session: it mixes with whatever is playing (music goes on) and is
// never the phone's Now Playing (no player on the Dynamic Island or the lock
// screen), as a game's sounds. (An <audio> element took the phone's audio
// over: music stopped, and the clip showed as Now Playing.) Like any ambient
// sound, the ring/silent switch silences it. The context is woken in the tap
// that asks for a word (iOS starts sound only from a tap), and stays awake,
// so later words play from code too. Without the clip (offline, a missing
// file, no Web Audio): the device's best English voice (lib/voice.mjs).
// The speed is the person's (state.opt.rate, 0.75 to 1.25).
import { pickVoice } from './lib/voice.mjs';
import { el } from './ui.js';
import { state, t } from './shell.js';

export const RATES = [0.75, 1, 1.25];
const rate = () => (RATES.includes(state.opt.rate) ? state.opt.rate : 1);
const clipUrl = word => `./data/audio/${encodeURIComponent(word.word)}.mp3`;

// Safari 16.4+: the page's sound is ambient (mixes, not Now Playing).
try {
  if (navigator.audioSession) navigator.audioSession.type = 'ambient';
} catch {}
const Ctx = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
let ctx = null;
const context = () => {
  if (!Ctx) return null;
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  // Suspended (never tapped) or interrupted (a call, the app sent away): woken here, in the tap.
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
};
// Each word's decoded clip, kept for the session (a few dozen words at most).
const buffers = new Map();
const decoded = (ac, url) => {
  if (!buffers.has(url))
    buffers.set(
      url,
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`clip ${r.status}`);
          return r.arrayBuffer();
        })
        .then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no)))
        .catch(e => {
          buffers.delete(url);
          throw e;
        })
    );
  return buffers.get(url);
};
let playing = null;
let asked = 0;
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
  const ac = context();
  if (!ac) return voiceSpeak(word.word);
  const mine = ++asked;
  try {
    playing?.stop();
  } catch {}
  playing = null;
  if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  decoded(ac, clipUrl(word))
    .then(buffer => {
      // A newer word asked meanwhile: that one plays, not this.
      if (mine !== asked) return;
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = rate();
      src.connect(ac.destination);
      src.start();
      playing = src;
    })
    .catch(() => mine === asked && voiceSpeak(word.word));
}
// The next word's clip fetched ahead (the service worker keeps it), so it
// plays at once when its question comes. Quietly: a failure is the clip's
// own fallback later.
const fetched = new Set();
export function prefetch(word) {
  if (!word || fetched.has(word.key) || typeof fetch !== 'function') return;
  fetched.add(word.key);
  // Once sound has been woken: decoded ahead too, ready to start in the tap.
  if (ctx && ctx.state !== 'closed') decoded(ctx, clipUrl(word)).catch(() => fetched.delete(word.key));
  else fetch(clipUrl(word), { priority: 'low' }).catch(() => fetched.delete(word.key));
}
export const speakButton = (word, big = false) => el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), text: '🔊', onclick: e => (e.stopPropagation(), speak(word)) });
