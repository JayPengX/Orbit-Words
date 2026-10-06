# Orbit Words

English words that stay with you. An Orbit app (Orbit: the everyday tools,
beside Quadra's Securities and Play), signed in with the Quadra Pass like
every app. It uses no money and pays none.

**https://jaypengx.github.io/Orbit-Words/** (was Quadra Hub)

## What's in it

The 大考中心 high-school English reference list, levels 1 to 6 (6,169
words), every word recorded in Microsoft's Jenny voice. Five tabs:

- **今天 Today**: the day's goal (20 answers), the streak and level; what's
  waiting in the chosen levels (due, not yet learnt, mastered) and a round
  of 10, 20 or 30 a tap away; new words studied as cards and quizzed a
  batch at a time; last time's missed words as flash cards; the word of the
  day.
- **練習 Practice**: the levels, the way to learn (smart, meaning, word,
  by ear, letters, cloze, dictation) and the sound's speed (0.75×, 1×,
  1.25×).
- **複習 Review**: the words to go back over, one category at a time:
  答錯 (last answer missed, with where it was misspelt), 該複習 (due),
  學習中 (learning) and 收藏 (bookmarked); searched in English or Chinese,
  sorted weakest, recent, most missed or A–Z. Flash cards of the weakest
  (10, 20 or up to 50): flip, swipe, then a test on the deck, which is
  what updates the memory model. The tab's badge counts the missed words.
- **單字 Words**: the whole list by level and state (new, learning,
  mastered, bookmarked), searched.
- **進度 Progress**: the four counts; accuracy (all, last 7 days), seconds
  an answer, days practised; each level mastered / learning / new; the
  last 14 days' answers against the goal; reviews falling due in the next
  7 days; how long learnt words stay remembered; how this person's memory
  compares with FSRS's average (the fitted factor); the words forgotten
  most.

Any word anywhere opens its **sheet**: the word and sound, the whole
meaning, a line to remember it by, the words you mixed it up with and the
ones it's commonly confused with (a tap opens theirs), how you misspelt it,
answers, accuracy, the chance you still know it, how long it stays, a
bookmark (☆) and 「我會了」 to put it away. `#word=<word>` opens it from a
link.

These were 英單力's (2026-09) review tab, flash cards, bookmarks, word
table, dashboard, speed setting and AI mnemonics, built again on the kit.
The mnemonics and common confusions are `data/hints.json` (levels 4–6, the
old `ai_signals.json`, written once with Gemini; nothing is generated live).

What Quadra Hub also did now lives in the **Quadra Pass sheet**, behind the
account button of every app (the kit's `pass.mjs`): the account and its
devices, Quadra Plus and a member's looks, 真相 (how Quadra's money moves),
every app, and every app's guide (`#help=<app>:<topic>`).

## How the words are taught (`lib/words.mjs`)

Hard on purpose: what takes effort to recall is what's remembered.

- **The wrong options** (`distractors`) are the likeliest mix-ups for the
  kind of question: spelt alike (edit distance, shared start and end, the
  same length), close in meaning (the meaningful characters of the Chinese
  glosses), the same part of speech and shape (a phrase among phrases), and
  first of all a word this person has already mixed this one up with,
  then the words learners commonly confuse it with (`data/hints.json`). Two
  options are never both right (no shared meaning term) and never read the
  same.
- **The kind of question** (`smartType`): every box allows several kinds
  and a round takes the one it has asked least, so one round goes through
  them all; recognising (meaning, English, by ear) leads for new words,
  producing (unscramble, fill in the missing letters, dictation) as a word
  is learnt; a new word is never dictated, and a word that keeps slipping
  is asked as if it were two boxes on. A word missed in a round comes back
  at its end to be written, not picked.
- **The memory model** (`grade`): FSRS-5 with its published defaults. Each
  word has a stability (days until recall falls to 90%, when it's due) and
  a difficulty (1-10). The grade comes from the answer and its time (slow
  is "hard", a quick typed answer "easy"); a right answer's gain is
  weighted by how it was asked (dictation 1.1 to picking a meaning 0.55);
  a miss cuts stability and raises difficulty. The box (1-5) is read from
  stability; 10 days and up (box 4) is mastered.
- **A round** (`pickRound`): the words likeliest forgotten by now first,
  the words they were mixed up with, new words only while fewer than 60
  are still being learnt (fewer the closer, and fewer when much is due),
  and never two look-alikes side by side.
- **Studying** (`toStudy`): new words as cards (word, sound, meaning), the
  next ones in the same order a round would bring them; a batch (a round's
  size) unlocks a quiz on it, and the quiz's answers start their schedule.
- **Points** (`lib/practice.mjs`): 2 XP a right answer, 15 a first mastery,
  read from the progress itself; the level and title from them. A day with
  20 answers keeps the streak; a notice at 20:00 when it's about to end.
  Points buy nothing.

## Saved data

Only this app's payload on the pass (`vocab-progress-sync`): `z3:` + gzip
base64 of `{ v: 3, w: { word: [box, due day, answers, right, last answer
(s), mastered once, lapses, [mistaken for], stability, difficulty, last
outcome 1 right / 2 missed, [misspellings]] }, levels, mode, days, study,
cal, log, marks, opt }` (a row stops after the last part it has; `study`:
the studied batch waiting for its quiz; `cal`: reviews for fitting the
memory model; `log`: `{ day: [right, seconds] }`; `marks`: `{ word: [1 on /
0 off, when (s)] }`, the latest choice winning across devices; `opt`:
`{ rate }`). Copies saved before `log`, `marks`, `opt` and the last two row
parts open as before. It writes no wallet entries or settings.

## How it works

A static site (GitHub Pages), no build step, Quadra Pass required. The
shared kit isn't copied in: the page loads it from Shared-Proxy's Pages
(`index.html`'s kit:head and kit:boot, `Shared-Proxy/kit/loader.html`), and
modules import it as `#kit/quadra.mjs` (tests through `package.json`'s
imports and a `.kit` link to `../Shared-Proxy/kit`, made by `npm test`).

```
public/
  index.html, app.js (starting, saving, the tabs), shell.js (the shared
  state, text and hooks), audio.js (the sound), ui.js, styles.css, sw.js,
  manifest.webmanifest, favicon.svg, icons/, share/ (link previews; all of
  them written by Shared-Proxy/brand/generate.mjs)
  views/             today, practice, review, browse (單字), progress, the
                     word's sheet, and session (rounds, studying, flash cards)
  data/words.json    [word, part of speech, level, meaning, phonetic]
  data/hints.json    { word: [a line to remember it by, [often confused with]] }
  data/audio/*.mp3   a recording of every word (Microsoft's en-US Jenny neural
                     voice; Shared-Proxy/tools/word-audio.py makes missing ones)
  lib/words.mjs      the memory model, rounds, questions and their wrong options, saved progress
  lib/review.mjs     review categories, the word list, bookmarks, 進度's numbers
  lib/practice.mjs   points, levels, the day's goal, the streak, the day's log
  lib/voice.mjs      ranking the device's voices (when a recording is missing)
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
