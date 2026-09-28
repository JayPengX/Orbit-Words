# Quadra Rewards

Where Quadra pays for effort and explains itself (formerly Quadra Words).

**https://jaypengx.github.io/Quadra-Rewards/**

## What's in it

- **Home**: your wealth rank (from the Quadra Pass wallet's total), next
  steps, daily missions across the apps, today's earnings against each cap,
  and how to grow the money.
- **Words**: the 大考中心 high-school English reference list, levels 1 to 6
  (6,170 words). Rounds of 10 mix reviews due and new words; six ways to
  learn (flash cards, English → meaning, meaning → English, listen and pick,
  unscramble, dictation) or Smart mode, which picks per word by how well you
  know it. Leitner boxes: right moves a word up (due again in 1, 3, 7, 21
  days), wrong sends it back; box 4 is mastered.
- **Games**: word pairs, 2048, home run derby and free throws (the last two
  came from Quadra Play's arcade).
- **Help**: every Quadra app's guide. Other apps link here with
  `#help=<app>` or `#help=<app>:<topic>` (`helpUrl` in the kit).

## Money

Everything pays into the pass's shared wallet as entries (app `vocab`,
fixed ids, so nothing is paid twice), capped per Taiwan day
(`ECONOMY` in the kit):

| | pays | daily cap |
|---|---|---|
| Words | NT$3 a right answer, NT$25 a first mastery | NT$600 |
| Games | about NT$15 a minute of typical play | NT$400 |
| Missions | NT$40–60 each, claimed | NT$300 |

Missions read each app's activity counts in the wallet (`act:<app>`) and
when each app was last opened; none is about betting.

## How it works

A static site (GitHub Pages), no build step, Quadra Pass required (the
shared kit in `public/lib/quadra.mjs` and `public/quadra.css`, copied from
`Shared-Proxy/kit` by `node kit/sync.mjs`; don't edit the copies).

- Word progress is this app's payload on the pass: `z3:` + gzip base64 of
  `{ v: 3, w: { word: [box, due day, seen, right, last seen s, mastered] }, levels, mode }`.
  Quadra Words' synced snapshots and its on-device progress
  (`vocab_progress_v1`) are migrated on first open.
- Money entries wait in `quadra.rewards.out` until the pass has them.

```
public/
  index.html, app.js, games-ui.js, styles.css, sw.js, manifest.webmanifest
  data/words.json    [word, part of speech, level, meaning, phonetic]
  data/audio/*.mp3   recordings for levels 4-6 (others use the browser's voice)
  lib/words.mjs      boxes, rounds, questions, saved progress
  lib/earn.mjs       earnings, missions, wealth ranks
  lib/games.mjs      game rules and pay
  lib/help.mjs       the help centre's text
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
