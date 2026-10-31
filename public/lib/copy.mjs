// The saved progress as the pass and the phone keep it: 'z3:' + gzip (base64)
// of packProgress (words.mjs), and two copies made one. Pure (no DOM), so
// it's tested directly; gzip is the platform's CompressionStream (Safari
// 16.4+, Node 18+).
import { packProgress, unpackProgress, mergeProgress, mergeCal } from './words.mjs';
import { mergeDays, mergeLog } from './practice.mjs';
import { mergeMarks } from './review.mjs';
import { mergeContests } from './contest.mjs';

async function gzipB64(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gunzipB64(b64) {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

// A payload → the progress (unpackProgress), or null when it isn't one this
// app can read (never saved over: see pass-sync.mjs).
export async function decodePayload(payload) {
  if (typeof payload !== 'string' || !payload.startsWith('z3:')) return null;
  try {
    return unpackProgress(JSON.parse(await gunzipB64(payload.slice(3))));
  } catch {
    return null;
  }
}
export const encodePayload = async state => `z3:${await gzipB64(JSON.stringify(packProgress(state)))}`;

// Another copy (the pass's, the phone's, one a merge brought in) into this
// one: per word the one answered last; days and logs the larger; bookmarks
// the latest choice; the contests taken on either; the reviews for fitting the model together. The
// settings (levels, the way to learn, the sound's speed) are the newer
// copy's (`st`, when they were set; a copy from before `st` counts as the
// oldest, and the other copy's then stand, as they always did). The studied
// batch waiting for its quiz is both copies' words, less any already
// answered (a batch quizzed on one device isn't brought back by the other).
// Returns the fields to set on `state`.
export function mergeCopy(state, theirs) {
  if (!theirs) return {};
  const progress = mergeProgress(state.progress, theirs.progress);
  const out = {
    progress,
    days: mergeDays(state.days, theirs.days),
    log: mergeLog(state.log, theirs.log),
    marks: mergeMarks(state.marks, theirs.marks),
    cal: mergeCal(state.cal, theirs.cal),
    ct: mergeContests(state.ct, theirs.ct),
    study: [...new Set([...(state.study || []), ...(theirs.study || [])])].filter(k => !progress[k]?.b)
  };
  if ((theirs.st || 0) >= (state.st || 0)) {
    if (theirs.levels) out.levels = theirs.levels;
    if (theirs.mode) out.mode = theirs.mode;
    if (theirs.opt?.rate || theirs.opt?.paper) out.opt = { ...state.opt, ...(theirs.opt.rate ? { rate: theirs.opt.rate } : {}), ...(theirs.opt.paper ? { paper: theirs.opt.paper } : {}) };
    // (A newer copy without a size means the usual 10.)
    if ([10, 20, 30].includes(theirs.opt?.size)) out.size = theirs.opt.size;
    else if ((theirs.st || 0) > (state.st || 0)) out.size = 10;
    out.st = Math.max(state.st || 0, theirs.st || 0);
  }
  return out;
}
