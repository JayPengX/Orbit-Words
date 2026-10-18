# Orbit Words

English words that stay with you: the 大考中心 list, levels 1–6 (6,169
words), each recorded in Microsoft's Jenny voice. Signs in with the Quadra
Pass; no money in or out.

Live: https://jaypengx.github.io/Orbit-Words/ (was Quadra Hub)

## How it works

- **Tabs:** 今天 (the day's goal of 20, streak, a round of 10/20/30, new
  words as cards, word of the day) · 練習 (levels, the way to learn, sound
  speed) · 複習 (答錯, 該複習, 學習中, 收藏; flash cards then a test) · 單字
  (the whole list) · 進度 (accuracy, levels, the 14 days, what's due, the
  memory fit).
- **A word's sheet** (from anywhere, or `#word=<word>`): sound, meaning, a
  line to remember it by, what you mixed it up with, your misspellings,
  the chance you still know it.
- **Teaching** (`lib/words.mjs`), hard on purpose:
  - Wrong options are the likeliest mix-ups: spelt alike, close in meaning,
    or words this person already confused.
  - A new word's first question is a quick check: known at a glance → away
    for weeks; missed → learnt.
  - While learning: meaning, word and by ear; once held: dictation.
  - New words most likely to be missed come first.
  - Memory model: FSRS-5 (stability, difficulty); 10 days' stability is
    mastered.
- **Weak-word round** (今天): a quick round on the words missed in the last 3 days, up to the round size.
- **Points** (`lib/practice.mjs`): XP, levels, the streak (20 answers a
  day), a 20:00 notice when it's about to end. Points buy nothing.
- **Offline:** everything works. Words and recordings are the site's own
  files, kept by `sw.js`. Progress is saved on the phone at every change,
  and merged with the Pass before anything is written. The Pass's copy is
  read again before a write whenever another device may have written
  (back on screen, the live session changed, a write refused):
  `lib/pass-sync.mjs`. A copy that can't be read is never written over.
  A return reads it once, after the kit's claim; not at all after under
  10 s away; a copy the same as the last one merged isn't merged again.
- **Saved:** the payload `vocab-progress-sync`, `z3:` + gzip of
  `{ v: 3, w: { word: [box, due, answers, right, …] }, … }`. Every row part
  is optional, so older copies open. Settings carry their own time (`st`):
  the newer settings win a merge (`lib/copy.mjs` `mergeCopy`).

## Decisions in force

- The device's language; no switcher.
- Recorded voices, never the device's when a recording exists.
- Mnemonics and confusions are `data/hints.json`, written once offline;
  nothing generated live.
- Cloze and unscrambling are not asked in smart mode (only as their own
  modes).

## Files (`public/`)

| File | What |
| --- | --- |
| `app.js`, `shell.js`, `ui.js`, `audio.js` | Start, saving, tabs; shared state; drawing; sound |
| `views/` | Each tab, the word sheet, rounds and flash cards |
| `lib/words.mjs` | Memory model, rounds, questions, wrong options, saved progress |
| `lib/copy.mjs`, `pass-sync.mjs` | The payload (encode, decode, merge); keeping it in step with the Pass |
| `lib/review.mjs`, `practice.mjs` | Review lists and 進度's numbers; points and streak |
| `data/words.json`, `hints.json`, `audio/` | The list, the hints, a recording per word |

## Run and test

```bash
npm test
```

```bash
node ../Shared-Proxy/tools/preview.mjs words --width 375
```

Missing recordings: `python3 ../Shared-Proxy/tools/word-audio.py`. A push
to `main` tests, stamps versions and deploys to Pages.

## If you change…

| This | Also check |
| --- | --- |
| The saved row's shape | Older copies still open; merging across devices (`tests/sync.test.mjs`) |
| `lib/pass-sync.mjs` | Its twin in Orbit Weather (the same file) |
| `data/words.json` | A recording per word, `hints.json` keys |
| The grade or FSRS weights | 進度's numbers, rounds |
