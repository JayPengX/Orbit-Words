// This app's payload on the Quadra Pass, kept in step with the phone's own
// copy: the pass's copy is read and merged in before anything is written
// over it, every time it may have changed since (TRUTH §7: never an older
// copy over a newer one; a copy that can't be read is never written over).
//
// Only one app on one device is live on a pass at a time (the Worker refuses
// a write from any other), but an app sent to the background isn't told when
// another device (or the same app elsewhere) took over and wrote: it still
// holds `active` from before when it comes back, and the kit's claim on
// return doesn't say anything changed. So the pass's copy counts as unread
// again (`stale`) whenever this app may have stopped being the live one: on
// coming back to the screen, at any change of `active`, and after a write the
// Worker refused. The next write reads it first.
//
// Each read brings the whole payload (a few hundred KB; the Pass has no
// "only if changed" read yet), so a return reads it once, not more:
// - away under BRIEF_MS (a look at another app): not read at all. Only the
//   app's own live session writes its payload, so it can only have changed
//   if another device opened Words and saved an answer in those seconds.
// - otherwise read once the kit's claim on return has landed (its reply's
//   wallet), not before it too: a read before the claim saw "not live" and
//   was read again when the claim came back (2 reads; the moved banner
//   flashed).
// - a copy the same as the one last merged or written here (its updateTime)
//   isn't decoded, merged or redrawn again.
//
// (The same file in Orbit Words and Orbit Weather: a candidate for the kit.)
//
//   const sync = passSync(q, { decode, apply, encode });
//   await sync.first(await q.start(), { local })  the sign-in's reply
//   sync.changed()   something here changed: written at the next sync
//   sync.sync()      read if stale, then write if changed (one at a time)
//   sync.stale()     the pass's copy may have changed (called by `watch`)
//
// decode(payload) → a copy or null (unreadable); apply(copy) merges it into
// the app's state; encode() → the payload. Each may return a promise.
export const BRIEF_MS = 10_000;
// The claim's reply waited for at most this long (offline, signed out: no reply).
export const CLAIM_WAIT_MS = 3_000;
export function passSync(q, { decode, apply, encode, now = Date.now }) {
  let pulled = false;
  // The pass copy's updateTime this phone last merged or wrote ('' unknown).
  let known = '';
  let unreadable = false;
  let dirty = false;
  // Bumped by every `stale`: a read that started before it doesn't count.
  let era = 0;
  let chain = Promise.resolve();

  async function take(payload, at, time = '') {
    if (time && time === known && !unreadable) {
      if (at === era) pulled = true;
      return;
    }
    const theirs = payload ? await decode(payload) : null;
    if (payload && !theirs) {
      unreadable = true;
      return;
    }
    if (theirs) await apply(theirs);
    known = time;
    if (at === era) pulled = true;
  }
  async function push() {
    if (!q.active || unreadable) return;
    if (!pulled) {
      const at = era;
      const res = await q.read({ data: true });
      await take(res?.payload, at, res?.updateTime);
      if (unreadable || !pulled) return;
    }
    if (!dirty) return;
    dirty = false;
    try {
      known = (await q.write({ payload: await encode() }))?.updateTime || '';
    } catch (error) {
      dirty = true;
      // Refused (another session is live): what it wrote is read first next time.
      if (error?.code === 'ECO_SESSION_MOVED') stale();
      throw error;
    }
  }
  function stale() {
    era++;
    pulled = false;
  }
  return {
    get pulled() {
      return pulled;
    },
    get unreadable() {
      return unreadable;
    },
    get dirty() {
      return dirty;
    },
    // The sign-in's first reply (q.start()): its payload merged in; `local`:
    // the app opened on its own copy, which goes up if the pass's lacks
    // anything of it. Offline, the pass is read once it's back.
    async first(reply, { local = false } = {}) {
      if (!reply || reply.offline) {
        if (local) dirty = true;
        return;
      }
      await take(reply.payload, era, reply.updateTime);
      if (!unreadable && local && (await encode()) !== (reply.payload || '')) dirty = true;
    },
    changed() {
      dirty = true;
    },
    stale,
    sync() {
      chain = chain.then(push).catch(() => {});
      return chain;
    },
    // Stale (and read again) whenever this app may have stopped being the live one.
    watch(doc = globalThis.document) {
      let hiddenAt = 0;
      let eraHidden = -1;
      let wait = null;
      const go = () => {
        clearTimeout(wait?.timer);
        wait = null;
        this.sync();
      };
      q.on?.('active', live => {
        stale();
        if (live) this.sync();
      });
      // The kit's claim on return came back (its reply carries the wallet).
      q.on?.('wallet', () => wait && go());
      doc?.addEventListener?.('visibilitychange', () => {
        if (doc.visibilityState === 'hidden') {
          hiddenAt = now();
          eraHidden = pulled ? era : -1;
          return;
        }
        if (eraHidden === era && pulled && now() - hiddenAt < BRIEF_MS) return;
        stale();
        clearTimeout(wait?.timer);
        wait = { timer: setTimeout(go, CLAIM_WAIT_MS) };
        wait.timer.unref?.();
      });
      return this;
    }
  };
}
