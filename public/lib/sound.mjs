// How a word is said when its speaker is tapped, without the page (tested in
// tests/sound.test.mjs). Jay 2026-11-05: the speaker played nothing. The
// recording waited on the network with no limit, so a slow connection was
// silence; a sound context iOS had stopped (a call, the app sent away) took
// the clip and played nothing; and a failure said nothing at all.
//
// Now: the recording gets CLIP_MS; past that (or failed, or no running
// context) the device's own English voice says it; with neither, the person
// is told (notice), never left with a silent tap.
export const CLIP_MS = 2500;

export const late = (promise, ms) =>
  new Promise((ok, no) => {
    const timer = setTimeout(() => no(new Error('slow')), ms);
    promise.then(
      v => (clearTimeout(timer), ok(v)),
      e => (clearTimeout(timer), no(e))
    );
  });

// clip(): the decoded recording (a promise); start(buffer): true once it
// plays, or a promise of it (false: the context isn't running); voice(): true if the device's
// voice took it; current(): this tap is still the newest; notice(why): tell
// the person. Answers how the word was said: 'clip', 'voice', 'none' or
// 'stale' (a newer tap took over).
export async function sayWord({ clip, start, voice, current = () => true, notice = () => {}, ms = CLIP_MS }) {
  let why = 'clip';
  try {
    const buffer = await late(clip(), ms);
    if (!current()) return 'stale';
    if (await start(buffer)) return 'clip';
    why = 'context';
  } catch (e) {
    if (!current()) return 'stale';
    why = e?.message === 'slow' ? 'slow' : 'clip';
  }
  if (voice()) return 'voice';
  notice(why);
  return 'none';
}
