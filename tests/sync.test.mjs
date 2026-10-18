// The progress on the pass and on the phone: encoded, merged, and never
// written over a newer or unreadable copy (copy.mjs, pass-sync.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePayload, encodePayload, mergeCopy } from '../public/lib/copy.mjs';
import { passSync } from '../public/lib/pass-sync.mjs';

const T = Date.parse('2026-10-05T04:00:00Z');
const blank = () => ({ progress: {}, days: {}, log: {}, marks: {}, cal: [], study: [], levels: [1, 2, 3], mode: 'smart', opt: {}, st: 0 });
const word = (t, b = 2) => ({ b, d: 20000, n: 1, r: 1, t, s: 3, D: 5 });

// The Worker, as far as an app's payload goes: one live session; a write
// from any other refused (eco.js).
function worker() {
  const w = { payload: '', live: null, reads: 0, writes: 0 };
  w.session = name => {
    const listeners = {};
    const q = {
      // What this session believes (the kit's `active`): only a reply changes it.
      active: false,
      on: (ev, fn) => ((listeners[ev] ||= []).push(fn), q),
      emit: (ev, v) => (listeners[ev] || []).forEach(fn => fn(v)),
      set: live => {
        if (q.active === live) return;
        q.active = live;
        q.emit('active', live);
      },
      claim: () => ((w.live = name), q.set(true), { payload: w.payload }),
      read: async () => (w.reads++, q.set(w.live === name), { payload: w.payload }),
      write: async ({ payload }) => {
        if (!q.active || w.live !== name) {
          q.set(false);
          throw Object.assign(new Error('not live'), { code: 'ECO_SESSION_MOVED' });
        }
        w.writes++;
        w.payload = payload;
        return {};
      }
    };
    return q;
  };
  return w;
}
// A device running Orbit Words: its state, its sync, a fake document.
function device(w, name) {
  const q = w.session(name);
  const state = blank();
  const doc = { visibilityState: 'visible', listeners: [], addEventListener: (ev, fn) => doc.listeners.push(fn) };
  const sync = passSync(q, { decode: decodePayload, encode: () => encodePayload(state), apply: theirs => Object.assign(state, mergeCopy(state, theirs)) });
  return {
    q,
    state,
    sync,
    open: async () => (await sync.first(q.claim(), { local: Object.keys(state.progress).length > 0 }), sync.watch(doc), sync.sync()),
    answer: async (key, t) => ((state.progress = { ...state.progress, [key]: word(t) }), sync.changed(), sync.sync()),
    hide: () => (doc.visibilityState = 'hidden'),
    // Back on screen: the kit claims (no change of `active` if it never heard it was off).
    show: async () => {
      doc.visibilityState = 'visible';
      w.live = name;
      doc.listeners.forEach(fn => fn());
      await sync.sync();
    }
  };
}

test('a copy encodes and decodes; anything else is unreadable', async () => {
  const s = { ...blank(), progress: { apple: word(T) }, st: 1_790_000_000 };
  const back = await decodePayload(await encodePayload(s));
  assert.deepEqual(back.progress.apple, { ...word(T) });
  assert.equal(back.st, 1_790_000_000);
  for (const bad of ['', 'z3:', 'z3:!!!', 'w1:{}', null, 42]) assert.equal(await decodePayload(bad), null, String(bad));
});

test("an app back on screen reads the pass before it writes: another device's progress is never written over", async () => {
  const w = worker();
  const a = device(w, 'A');
  const b = device(w, 'B');
  await a.open();
  await a.answer('apple', T);
  assert.ok((await decodePayload(w.payload)).progress.apple);
  // A is put away (no heartbeat while hidden), B studies.
  a.hide();
  await b.open();
  await b.answer('banana', T + 60_000);
  await b.answer('cherry', T + 120_000);
  // A comes back: it still thinks it's live (it never heard otherwise).
  await a.show();
  assert.ok(a.state.progress.banana, 'B\'s words read in on coming back');
  await a.answer('date', T + 180_000);
  const saved = await decodePayload(w.payload);
  assert.deepEqual(Object.keys(saved.progress).sort(), ['apple', 'banana', 'cherry', 'date']);
});

test('a write the Worker refuses (another device live) reads the pass first next time', async () => {
  const w = worker();
  const a = device(w, 'A');
  const b = device(w, 'B');
  await a.open();
  await b.open(); // B takes over while A is on screen.
  await b.answer('banana', T);
  await a.answer('apple', T + 1000); // refused: A isn't live
  assert.equal(a.q.active, false);
  assert.ok(!(await decodePayload(w.payload)).progress.apple);
  // A taken back ("continue here"): the pass read, then A's answer written on top.
  w.live = 'A';
  a.q.set(true);
  await a.sync.sync();
  assert.deepEqual(Object.keys((await decodePayload(w.payload)).progress).sort(), ['apple', 'banana']);
});

test('opened offline: nothing written until the pass has been read and merged', async () => {
  const w = worker();
  const b = device(w, 'B');
  await b.open();
  await b.answer('banana', T);
  const a = device(w, 'A');
  a.state.progress = { apple: word(T + 5000) };
  await a.sync.first({ offline: true }, { local: true });
  a.sync.watch({ addEventListener() {} });
  await a.sync.sync(); // still offline: not live
  assert.ok(!(await decodePayload(w.payload)).progress.apple);
  // Back online: the kit claims; the pass is read, then the merged copy goes up.
  a.q.claim();
  await a.sync.sync();
  assert.deepEqual(Object.keys((await decodePayload(w.payload)).progress).sort(), ['apple', 'banana']);
});

test('a copy on the pass that this version cannot read is never written over', async () => {
  const w = worker();
  w.payload = 'z4:from-a-newer-version';
  const a = device(w, 'A');
  a.state.progress = { apple: word(T) };
  await a.open();
  await a.answer('banana', T + 1000);
  assert.equal(w.payload, 'z4:from-a-newer-version');
  assert.equal(a.sync.unreadable, true);
  assert.equal(w.writes, 0);
});

test('nothing changed: a read on coming back, no write', async () => {
  const w = worker();
  const a = device(w, 'A');
  await a.open();
  await a.answer('apple', T);
  const writes = w.writes;
  a.hide();
  await a.show();
  assert.equal(w.writes, writes);
});

test('two copies made one: newest answer per word, the settings set last, no quizzed batch brought back', () => {
  const mine = { ...blank(), progress: { apple: word(T + 1000), banana: word(T) }, study: [], levels: [4, 5], mode: 'spell', opt: { rate: 0.75 }, st: 200 };
  // The other device: banana answered later, apple earlier; its study batch
  // holds apple (since quizzed here) and kiwi; its settings older.
  const theirs = { ...blank(), progress: { apple: word(T), banana: { ...word(T + 5000), b: 1, o: 2 } }, study: ['apple', 'kiwi'], levels: [1], mode: 'meaning', opt: { rate: 1.25 }, st: 100 };
  const m = mergeCopy(mine, theirs);
  assert.equal(m.progress.apple.t, T + 1000);
  assert.equal(m.progress.banana.o, 2);
  assert.deepEqual(m.study, ['kiwi'], 'apple was quizzed: not studied again');
  assert.equal(m.levels, undefined, 'my settings are newer: kept');
  assert.equal(m.mode, undefined);
  // Theirs newer: theirs.
  const n = mergeCopy(mine, { ...theirs, st: 300 });
  assert.deepEqual([n.levels, n.mode, n.opt.rate, n.st], [[1], 'meaning', 1.25, 300]);
  // A copy from before settings were dated: as it always was, the other copy's settings.
  const legacy = mergeCopy({ ...mine, st: 0 }, { ...theirs, st: 0 });
  assert.deepEqual([legacy.levels, legacy.mode], [[1], 'meaning']);
  assert.deepEqual(mergeCopy(mine, null), {});
  // Days and logs: the larger; bookmarks: the latest choice.
  const d = mergeCopy({ ...blank(), days: { x: 5 }, log: { x: [3, 10] }, marks: { apple: [1, 10] } }, { ...blank(), days: { x: 9 }, log: { x: [2, 30] }, marks: { apple: [0, 20] } });
  assert.deepEqual([d.days.x, d.log.x, d.marks.apple], [9, [3, 30], [0, 20]]);
});
