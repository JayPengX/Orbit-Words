# Orbit Words: the map

English words that stay with you: the 大考中心 list, levels 1–6 (6,169
words), each recorded in Microsoft's Jenny voice. Signs in with the Orbit
Pass; no money in or out.

Live: https://orbit.jaypengx.com/words/

## How it works

- **Tabs:** 今天 (the day's goal of 20 and the streak, the round; its
  choices are a sheet from the hero: 10/20/30 words, levels, the way to
  learn, sound speed; new words as cards, the 單字比賽 practice paper, the
  weak words, word of the day)
  · 複習 (答錯, 該複習, 學習中, 收藏; flash cards then a test) · 單字 (the
  whole list) · 進度 (level and points, accuracy, the 14 days and what's
  due, each level, the memory fit, the words forgotten most).
- **A word's sheet** (from anywhere, or `#word=<word>`): sound, KK, the
  senses (most useful first), an example with its Chinese, the word's forms, a
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
- **單字比賽** (`lib/contest.mjs`, `views/contest.js`): a practice paper in
  the shape of the national contest's 區域決賽 (國教署's 115 plan): levels
  1–6, 聽英拼寫 50 (said twice, 20 s each, marked exactly and in lower
  case) and 詞彙題 50 (30 單題 like the 學測's, from the word's example with
  three options of its kind; 20 題組 in sets of five sharing a bank of six),
  40 minutes, 2 points each of 200. About 40% of each part is this person's
  weak words (missed, misspelt, overdue), the rest by level, the top levels
  heaviest. Every answer goes into the word's memory; nothing is shown until
  it's handed in, then the points, each part and each miss. The plan doesn't
  publish the 單題/題組 split: 30/20 is a guess. The last 20 scores are kept (`ct`).
- **Points** (`lib/practice.mjs`): XP, levels, the streak (20 answers a
  day), a 20:00 notice when it's about to end. Points buy nothing.
- **Offline:** everything works. Words and recordings are the site's own
  files, kept by `sw.js`. Progress is saved on the phone at every change,
  and merged with the Pass before anything is written. The Pass's copy is
  read again before a write whenever another device may have written
  (back on screen, the live session changed, a write refused):
  the kit's `pass-sync.mjs`. A copy that can't be read is never written over.
  A return reads it once, after the kit's claim; not at all after under
  10 s away; a copy the same as the last one merged isn't merged again.
- **Saved:** the payload `vocab-progress-sync`, `z3:` + gzip of
  `{ v: 3, w: { word: [box, due, answers, right, …] }, ct: [contests], … }`. Every row part
  is optional, so older copies open. Settings carry their own time (`st`):
  the newer settings win a merge (`lib/copy.mjs` `mergeCopy`).

## Decisions in force

- The device's language; no switcher.
- Recorded voices, never the device's when a recording exists.
- The dictionary is written once offline (`scripts/dict/`): senses and KK
  from Wiktionary (kaikki.org), examples from Tatoeba, Taiwan wording; sense
  1 is what the quiz asks. Edit `scripts/dict/entries.jsonl`, then
  `python3 scripts/dict/build.py`. Credit line at the foot of the sheet.
- Mnemonics and confusions are `data/hints.json`, written once offline;
  nothing generated live.
- Cloze and unscrambling are not asked in smart mode (only as their own
  modes).

## Files (`public/`)

| File | What |
| --- | --- |
| `app.js`, `shell.js`, `ui.js`, `audio.js` | Start, saving, tabs; shared state; drawing; sound |
| `views/` | Each tab, the round's choices, the word sheet, rounds and flash cards; `chrome.js` the shared pieces |
| `lib/words.mjs` | Memory model, rounds, questions, wrong options, saved progress |
| `lib/copy.mjs` | The payload (encode, decode, merge); the kit's `pass-sync.mjs` keeps it in step with the Pass |
| `lib/contest.mjs` | The 單字比賽 paper: its words, marking, scores kept |
| `lib/review.mjs`, `practice.mjs` | Review lists and 進度's numbers; points and streak |
| `data/words.json`, `more.json`, `hints.json`, `audio/` | The list (senses, KK), examples and forms, the hints, a recording per word |

## Run and test

```bash
npm test
```

```bash
node ../Orbit-Core/tools/preview.mjs words --width 375
```

Missing recordings: `python3 ../Orbit-Core/tools/word-audio.py`. A push
to `main` tests, stamps versions and deploys to Pages.

## If you change…

| This | Also check |
| --- | --- |
| The saved row's shape | Older copies still open; merging across devices (`tests/sync.test.mjs`) |
| `data/words.json` | A recording per word, `hints.json` keys |
| The grade or FSRS weights | 進度's numbers, rounds |
