// 用新字聊天 (the family's AI, Jay 11-10): which words a chat asks for, and
// what of the chat the AI is told. The AI side is Orbit-Core's AI door
// ('words-chat'); the chat itself stays on the phone.

export const CHAT_WORDS = 4;
export const CHAT_TURNS = 8;
const DAYS3 = 3 * 86_400_000;

// The words answered in the last three days, newest first (the ones just
// learned are the ones worth using); short of that, the words up next.
export function chatWords(words, progress, { now = Date.now(), next = [], n = CHAT_WORDS } = {}) {
  const recent = words
    .filter(w => progress[w.key]?.t > now - DAYS3)
    .sort((a, b) => progress[b.key].t - progress[a.key].t)
    .slice(0, n);
  const seen = new Set(recent.map(w => w.key));
  return [...recent, ...next.filter(w => !seen.has(w.key))].slice(0, n);
}

// The turns sent: the last few, the opener kept (it set the topic).
export function turnsToSend(turns, most = CHAT_TURNS) {
  return turns.length <= most ? turns : [turns[0], ...turns.slice(-(most - 1))];
}

// The chat's opener, code's own (no AI call to start), one of a few by the day.
const OPENERS = ['Hi! What did you do today? Tell me a little about it.', 'Hi! What are you looking forward to this week?', 'Hi! What was the best part of your day so far?'];
export const opener = (day = 0) => OPENERS[Math.abs(day) % OPENERS.length];
