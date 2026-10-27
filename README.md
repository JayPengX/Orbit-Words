<p align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="">
</p>

<h1 align="center">Orbit Words</h1>

<p align="center">
  <b>Words that stay.</b><br>
  <a href="https://orbit.jaypengx.com/words/"><b>orbit.jaypengx.com/words</b></a>
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES_modules-F7DF1E?logo=javascript&logoColor=000"> <img alt="PWA" src="https://img.shields.io/badge/PWA-works_offline-5A0FC8?logo=pwa&logoColor=fff"> <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=fff"> <img alt="GitHub" src="https://img.shields.io/badge/GitHub-Pages-24292F?logo=github&logoColor=fff"> <img alt="Tests" src="https://img.shields.io/badge/Tests-node_--test-339933?logo=nodedotjs&logoColor=fff">
</p>

English vocabulary that sticks: the full 大考中心 list, levels 1 to 6 (6,169 words), each with a recorded voice. Part of **Orbit**, a family of phone apps for life in Taiwan that share one sign-in, the Orbit Pass. See them all at [orbit.jaypengx.com](https://orbit.jaypengx.com/pass/).

<p align="center">
  <img src="docs/screenshots/words-1.webp" width="30%" alt="Today">
  <img src="docs/screenshots/words-2.webp" width="30%" alt="A word">
</p>

## Features

- **The whole 大考中心 list:** levels 1 to 6, 6,169 words, each recorded in a natural voice.
- **Today:** a daily goal of 20 and a streak; new words as cards, the weak words, a word of the day. Pick 10, 20 or 30 words, the levels, the way to learn and the sound speed.
- **Hard on purpose:** the wrong options are the likeliest mix-ups (spelt alike, close in meaning, or words you already confused).
- **A quick check first:** a word you know at a glance goes away for weeks; one you miss is learnt.
- **Every way of asking:** meaning, word, by ear, and dictation once a word is held.
- **Review:** wrong answers, what's due, what you're learning and your saved words, as flash cards and then a test.
- **A word's page:** sound, meaning, a line to remember it by, what you mixed it up with, your misspellings and the chance you still know it.
- **Progress:** level and points, accuracy, the last 14 days, each level, and the words you forget most.
- **Fully offline**, synced between devices through the Orbit Pass.

## Tech stack

| Layer | What |
| --- | --- |
| App | Plain JavaScript (ES modules), HTML and CSS; no framework, no build step, no dependencies |
| Platform | Installable web app; the service worker keeps every word and recording, so it works with no network |
| Shared | Look, Orbit Pass sync (`pass-sync.mjs`) and the 20:00 streak notice from the kit in [Orbit-Core](https://github.com/JayPengX/Orbit-Core) |
| Memory model | FSRS-5 (stability and difficulty); 10 days' stability counts as mastered |
| Data | `data/words.json` (the list), `data/hints.json` (mnemonics and mix-ups, written once offline), `data/audio/` (one recording per word) |
| Tests | `node --test`, including merging progress across devices |

## How it works

- **Progress is a small compressed row per word** (`z3:` + gzip), saved on the phone at every answer and merged with the Pass's copy before anything is written. A copy that can't be read is never written over; the newer settings win a merge.
- **Rounds** (`lib/words.mjs`) put the new words most likely to be missed first, then schedule each by its FSRS stability.
- **Nothing generated live:** hints and mix-ups are files, and recorded voices always win over the device's.

Details and the decisions still in force: **[MAP.md](MAP.md)**.

## Project structure

```
public/
├── index.html, app.js, shell.js, ui.js, audio.js   start, saving, tabs, drawing, sound
├── views/            each tab, the round, flash cards, the word sheet
├── lib/
│   ├── words.mjs     memory model, rounds, questions, wrong options
│   ├── copy.mjs      the saved payload: encode, decode, merge
│   └── review.mjs, practice.mjs   review lists; points and streak
├── data/             words.json, hints.json, audio/
└── sw.js
tests/                node --test
MAP.md                how it works
```

## Getting started

The app loads the shared kit from a sibling folder, so clone this repo next to [Orbit-Core](https://github.com/JayPengX/Orbit-Core):

```bash
git clone https://github.com/JayPengX/Orbit-Core.git
git clone https://github.com/JayPengX/Orbit-Words.git
cd Orbit-Words
```

Requirements: Node.js 22 or newer. There is nothing to install: no framework, no `node_modules`.

```bash
npm test   # links ../Orbit-Core/kit as .kit, then runs node --test
```

See it on a phone-sized screen, signed in with a made-up wallet and real data (needs Playwright):

```bash
# a screenshot, saved in /tmp/orbit-preview
node ../Orbit-Core/tools/preview.mjs words --live --width 375
# serve it, then open http://localhost:8123/Orbit-Words/
node ../Orbit-Core/tools/preview.mjs words --live --serve --port 8123
```

`--dark`, `--lang en`, `--webkit` (Safari's engine) and the other flags are listed in [Orbit-Core/tools/README.md](https://github.com/JayPengX/Orbit-Core/blob/main/tools/README.md).

Missing recordings: `python3 ../Orbit-Core/tools/word-audio.py`.

## Deploying

Push to `main`. GitHub Actions runs the tests, stamps every file with its content hash (so a phone downloads only what changed) and publishes `public/` to GitHub Pages; the site Worker serves it at its orbit.jaypengx.com address. There are no pull requests or release branches.

## Part of Orbit

| App | What it is |
| --- | --- |
| [Orbit Sports](https://github.com/JayPengX/Orbit-Sports) | Every game you can watch in Taiwan, live |
| [Orbit Transit](https://github.com/JayPengX/Orbit-Transit) | Bus, train, metro and YouBike, planned and navigated |
| [Orbit Weather](https://github.com/JayPengX/Orbit-Weather) | One clear forecast, to the township |
| [Orbit Words](https://github.com/JayPengX/Orbit-Words) | English vocabulary that stays |
| [Orbit Securities](https://github.com/JayPengX/Orbit-Securities) | A Taiwan broker on play money |
| [Orbit Class](https://github.com/JayPengX/Orbit-Class) | Today's classes at a glance |
| [Orbit Beats](https://github.com/JayPengX/Orbit-Beats) | Endless music and your own beats |
| [Orbit Law](https://github.com/JayPengX/Orbit-Law) | Laws, rulings and bills, linked |
| [Orbit Money](https://github.com/JayPengX/Orbit-Money) | Your own books |
| [Orbit-Core](https://github.com/JayPengX/Orbit-Core) | The kit, the Orbit Pass and the Workers behind them all |

How it was all built, in pictures and numbers: [jaypengx.com/showcase](https://jaypengx.com/showcase/).
