# Quadra Rewards

Where Quadra pays for effort and explains itself (formerly Quadra Words).

**https://jaypengx.github.io/Quadra-Rewards/**

## What's in it

- **Home**: your wealth rank (from the Quadra Pass wallet's total), the word
  of the day, next steps, today's game challenge, daily missions across the
  apps, weekly goals, today's earnings against each cap, badges, and how to
  grow the money.
- **Words**: the 大考中心 high-school English reference list, levels 1 to 6
  (6,170 words, every one recorded in Microsoft's Jenny voice). Rounds of
  10, 20 or 30 mix reviews due and new words, and a missed word comes back
  once at the end; six ways to learn (flash cards, English → meaning,
  meaning → English, listen and pick, unscramble, dictation) or Smart mode,
  which asks by how well you know a word (never unscrambling a phrase).
  Leitner boxes: right moves a word up (due again in 1, 2, 5, 14 days),
  wrong sends it back; box 4 is mastered. A new word right the first time
  is already known and goes straight to box 3. The sound starts inside the
  tap (iOS silences sound started later) through one reused audio element;
  without the clip, the device's best English voice.
- **Games**: word games (word pairs, speed match, hangman) and a break from
  words (2048, mini sudoku, colour memory, home run derby, free throws; the
  last two came from Quadra Play's arcade), plus 35 arcade games that aren't
  about words (`lib/arcade.mjs`, one screen each in `public/arcade/`, loaded
  when opened): puzzles (minesweeper, lights out, sliding puzzle, code
  breaker, nonograms, flood it, Hanoi, sokoban, mazes, six queens), action
  (snake, falling blocks, breakout, flappy bird, dino run, stack, dodge,
  fruit catch, whack-a-mole, pong, aim), board games against Quadra
  (tic-tac-toe, connect four, reversi, gomoku, nim) and brain games (quick
  maths, reaction time, Schulte table, odd colour, number and grid memory,
  Stroop, quick count, bigger or smaller). Each pays its score at its own
  rate up to its own most a round (`arcadePay`). The games list has a
  search, categories, favourites (★) and what you played lately. A daily challenge (one game a day,
  `dailyGame`) adds a bonus to its first paid round that grows with the days
  in a row (NT$10 to NT$40, paid as a game, so inside the games' cap), and
  each game's best round is kept in the wallet setting `bests:vocab`.
- **Notices** (the kit's `notify`): a mission or weekly goal newly ready to
  claim, and a streak that ends tonight (after 20:00 Taiwan time).
- **Long games** (`lib/long.mjs`, category 長局): 9×9 sudoku, Klondike
  solitaire, a 10×14 minesweeper and checkers against Quadra, ten minutes
  and more a game, paid up to NT$120; and **word search** (your words, found
  by their meanings). A game in play takes the whole screen: the page
  underneath is locked and canvases size to the space left, so nothing
  scrolls under a thumb; a round's result slides up over the game.
- **Help**: every Quadra app's guide, all in the same shape: what it is,
  the tabs, a few topics, how it touches the money. Other apps link here with
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

Weekly goals (Monday to Sunday, ids `vocab:wk:<Monday>:<goal>`) are paid as
missions, inside the missions' cap. Badges are read from the record (wallet
entries, words mastered, bests), so nothing extra is stored.

Missions (Orbit Class included: checking the day's classes) read each app's activity counts in the wallet (`act:<app>`) and
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
  data/audio/*.mp3   a recording of every word (Microsoft's en-US Jenny neural
                     voice; Shared-Proxy/tools/word-audio.py makes missing ones)
  lib/voice.mjs      ranking the device's voices (a fallback, or chosen)
  lib/long.mjs       the long games' rules
  lib/words.mjs      boxes, rounds, questions, saved progress
  lib/earn.mjs       earnings, missions, wealth ranks
  lib/games.mjs      game rules and pay
  lib/arcade.mjs     the arcade games' list, rules and pay
  arcade/*.js        each arcade game's screen (arcade/kit.js: shared parts)
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
