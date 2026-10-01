# Quadra Hub

A related add-on of Quadra, like Quadra Fixtures and Orbit Class: a place to
learn English words, the place to manage your Quadra Pass and Quadra Plus,
and the plain truth about how Quadra's money moves and how the house earns
from you. It uses no money and pays none.

**https://jaypengx.github.io/Quadra-Hub/**

## What's in it

- **單字 Words**: the 大考中心 high-school English reference list, levels 1
  to 6 (6,170 words), and three packs (TOEIC, IELTS, Business English), every
  word recorded in Microsoft's Jenny voice. Rounds of 10, 20 or 30 words;
  today's goal (20 answers), the streak, the level, the words you forget
  most and the word of the day.
- **Pass**: the Quadra Pass (balance, this month, the statement and every
  setting through the kit's account sheet), Quadra Plus (join, go yearly,
  stop renewing, what it gave back), a member's avatar and frame, devices
  and security.
- **真相 Truth**: where the money comes from (the kit's `moneySides`), the
  house edge on singles and parlays, what the parlay boost and Plus's bigger
  boost give back, lottery and scratch card payback, what free bets and VIP
  cashback are really worth, why Plus exists, trading costs, margin and
  overdraft interest, and the designs that keep people playing, worked out
  from the real rules (`lib/truth.mjs`) and the account's own record.
- **App Apps**: every other Quadra app, when it was last used, a line of
  status (Securities' cash and holdings, Play's stakes this month, VIP and
  free bets), its guide and a way in.
- **Help**: every Quadra app's guide, in the same shape: a sheet over the
  app, opened by the ? at the top right (the kit's `topActions`) or by other
  apps' links, `#help=<app>` or `#help=<app>:<topic>` (`helpUrl` in the kit).

## How the words are taught (`lib/words.mjs`)

Hard on purpose: what takes effort to recall is what's remembered.

- **The wrong options** (`distractors`) are the likeliest mix-ups for the
  kind of question: spelt alike (edit distance, shared start and end, the
  same length), close in meaning (the meaningful characters of the Chinese
  glosses), the same part of speech and shape (a phrase among phrases), and
  first of all a word this person has already mixed this one up with. Two
  options are never both right (no shared meaning term) and never read the
  same.
- **The kind of question** (`smartType`) goes from recognising (meaning,
  English, by ear) to producing (unscramble, fill in the missing letters,
  dictation) as a word is learnt; a word that keeps slipping is asked as if
  it were two boxes on. A word missed in a round comes back at its end to
  be written, not picked.
- **Spaced repetition** (`grade`, `pickRound`): Leitner boxes, due again in
  1, 3, 7 and 21 days (box 4 is mastered), one box a day at most; a miss
  sends a word back to box 1, and each lapse (forgotten after it was
  learnt) shortens its gaps. A round leads with the words missed last time
  and forgotten most, brings the words they were mixed up with, takes
  fewer new words when much is due, and never puts two look-alikes side by
  side.
- **Points** (`lib/practice.mjs`): 2 XP a right answer, 15 a first mastery,
  read from the progress itself; the level and title from them. A day with
  20 answers keeps the streak; a notice at 20:00 when it's about to end.
  Points buy nothing.

## Saved data

Only this app's payload on the pass (`vocab-progress-sync`): `z3:` + gzip
base64 of `{ v: 3, w: { word: [box, due day, answers, right, last answer
(s), mastered once, lapses, [mistaken for]] }, levels, mode, days }`. The
only wallet settings it writes are a member's `avatar` and `frame`; it
writes no wallet entries.

## How it works

A static site (GitHub Pages), no build step, Quadra Pass required (the
shared kit in `public/lib/quadra.mjs`, `public/quadra.css` and
`public/boot.js`, copied from `Shared-Proxy/kit` by `node kit/sync.mjs`;
don't edit the copies).

```
public/
  index.html, app.js (the shell, words, help), hub-ui.js (Pass, Truth, Apps),
  ui.js, styles.css, sw.js, manifest.webmanifest
  data/words.json    [word, part of speech, level, meaning, phonetic]
  data/packs.json    { toeic | ielts | biz: [[word, part of speech, meaning]] }
  data/audio/*.mp3   a recording of every word (Microsoft's en-US Jenny neural
                     voice; Shared-Proxy/tools/word-audio.py makes missing ones)
  lib/words.mjs      boxes, rounds, questions and their wrong options, saved progress
  lib/practice.mjs   points, levels, the day's goal and the streak
  lib/truth.mjs      the house's numbers and the account's own record
  lib/voice.mjs      ranking the device's voices (when a recording is missing)
  lib/help.mjs       every app's guide
  lib/i18n.mjs       Traditional Chinese and English
```

Levels 4–6 meanings come from Quadra Words' list; levels 1–3 from ECDICT
(MIT), converted to Traditional Chinese with OpenCC; the word list and
levels are the 108-curriculum reference list.

## Develop

```
npm test
python3 -m http.server -d public
```

Pushing to `main` runs the tests, stamps a cache-busting version on every
file and deploys `public/` to Pages.
