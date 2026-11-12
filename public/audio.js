// Pronunciation: every word has a recording in Microsoft's neural voice
// (data/audio, en-US Jenny), played through Web Audio in iOS's "ambient"
// audio session: it mixes with whatever is playing (music goes on) and is
// never the phone's Now Playing (no player on the Dynamic Island or the lock
// screen), as a game's sounds. (An <audio> element took the phone's audio
// over: music stopped, and the clip showed as Now Playing.) Like any ambient
// sound, the ring/silent switch silences it. The context is woken in the tap
// that asks for a word (iOS starts sound only from a tap), and stays awake,
// so later words play from code too. Without the clip in 2.5 s (a slow or
// no connection, a missing file, no Web Audio, a context iOS stopped): the
// device's best English voice (lib/voice.mjs); with neither, a short notice
// (lib/sound.mjs).
// The speed is the person's (state.opt.rate, 0.75 to 1.25).
import * as kit from '#kit/orbit.mjs';
import { pickVoice } from './lib/voice.mjs';
import { sayWord, late } from './lib/sound.mjs';
import { el, toast } from './ui.js';
import { ico } from './views/chrome.js';
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
  // Interrupted (a call, the app sent away): iOS can keep such a context
  // silent however often it's resumed, so a new one is made, here in the tap.
  if (ctx && ctx.state === 'interrupted') {
    try {
      ctx.close();
    } catch {}
    ctx = null;
    buffers.clear();
  }
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  // Suspended (never tapped): woken here, in the tap.
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
        // (Safari also returns a promise from it, rejected with the callback: caught, or each bad clip was an unhandled rejection.)
        .then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no)?.catch?.(() => {})))
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
const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
if (hasSpeech) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
// iOS speaks only from a tap at first: an empty line said in the first tap
// lets the voice stand in later, when the recording is slow.
let spoke = false;
const wakeVoice = () => {
  if (spoke || !hasSpeech) return;
  spoke = true;
  try {
    speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  } catch {}
};
function voiceSpeak(text) {
  if (!hasSpeech) return false;
  if (!voices.length) loadVoices();
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(voices);
    if (v) u.voice = v;
    u.lang = v?.lang || 'en-US';
    u.rate = 0.95 * rate();
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}
// The clip plays only on a running context; one still waking gets a moment.
async function startClip(ac, buffer) {
  if (ac.state !== 'running') await late(ac.resume(), 600).catch(() => {});
  if (ac.state !== 'running') return false;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate();
  src.connect(ac.destination);
  src.start();
  playing = src;
  return true;
}
let told = 0;
const tellNoSound = (why, word) => {
  kit.rec?.('words-sound', { why, word: word.word, online: navigator.onLine, ctx: ctx?.state || 'none' });
  if (Date.now() - told < 4000) return;
  told = Date.now();
  toast(t(why === 'context' ? 'noSoundAgain' : 'noSound'), 'bad');
};
// btn: the speaker tapped, shown busy while its clip is on the way.
export function speak(word, btn) {
  if (!word) return;
  wakeVoice();
  const ac = context();
  const mine = ++asked;
  try {
    playing?.stop();
  } catch {}
  playing = null;
  if (hasSpeech && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  const busy = btn && setTimeout(() => btn.setAttribute('aria-busy', 'true'), 250);
  // (測試工具 vocabNoSound: neither the clip nor the voice; testing.js.)
  const mute = globalThis.ORBIT_TEST?.flags?.vocabNoSound;
  sayWord({
    clip: () => (ac && !mute ? decoded(ac, clipUrl(word)) : Promise.reject(new Error('no web audio'))),
    start: buffer => startClip(ac, buffer),
    voice: () => !mute && voiceSpeak(word.word),
    current: () => mine === asked,
    notice: why => tellNoSound(why, word)
  }).finally(() => {
    clearTimeout(busy);
    btn?.removeAttribute('aria-busy');
  });
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
export const speakButton = (word, big = false) => {
  const b = el('button', { class: `speak${big ? ' big' : ''}`, type: 'button', 'aria-label': t('listen'), onclick: e => (e.stopPropagation(), speak(word, b)) });
  b.innerHTML = ico('sound');
  return b;
};
