// The English voice words are read in: the best one the device has.
//
// Browsers list many voices; the default is often a flat, robotic one (or
// none at all until the list has loaded). The natural neural voices sound
// far better: Microsoft's online ones (Edge on every system: "Microsoft Aria
// Online (Natural)", Jenny, Guy…), Apple's premium and enhanced ones (Ava,
// Samantha…), Google's. They're ranked and the best is kept; the person can
// pick another in the settings.

export function voiceScore(v) {
  if (!v || !/^en([-_]|$)/i.test(v.lang || '')) return -1;
  const name = v.name || '';
  let s = 0;
  if (/microsoft/i.test(name) && /natural|online|neural/i.test(name)) s += 100;
  else if (/microsoft/i.test(name)) s += 70;
  if (/premium/i.test(name)) s += 90;
  else if (/enhanced/i.test(name)) s += 80;
  if (/google/i.test(name)) s += 60;
  if (/\b(aria|jenny|guy|ava|samantha|allison|susan|zoe|evan|nathan|joelle|noelle|emma|brian|andrew|christopher|michelle|ana)\b/i.test(name)) s += 25;
  if (/^en[-_]US/i.test(v.lang)) s += 20;
  else if (/^en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang)) s += 10;
  // Novelty and low-quality voices last.
  if (/(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy)/i.test(name)) s -= 80;
  if (v.default) s += 2;
  return s;
}

export function rankVoices(voices) {
  return [...(voices || [])].filter(v => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a) || String(a.name).localeCompare(String(b.name)));
}

// The voice to use: the chosen one (by name) when the device has it, else the best.
export function pickVoice(voices, chosen = '') {
  const ranked = rankVoices(voices);
  return ranked.find(v => v.name === chosen) || ranked[0] || null;
}
