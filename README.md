<p align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="">
</p>

<h1 align="center">Orbit Words</h1>

<p align="center">
  <b>Words that stay.</b><br>
  <a href="https://orbit.jaypengx.com/app/"><b>Use it in Orbit</b></a> · on its own at <a href="https://orbit.jaypengx.com/words/">orbit.jaypengx.com/words</a>
</p>

<p align="center">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES_modules-F7DF1E?logo=javascript&logoColor=000"> <img alt="PWA" src="https://img.shields.io/badge/PWA-works_offline-5A0FC8?logo=pwa&logoColor=fff"> <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=fff"> <img alt="Tests" src="https://img.shields.io/badge/Tests-node_--test-339933?logo=nodedotjs&logoColor=fff">
</p>

English vocabulary that sticks: the full 大考中心 list, levels 1 to 6 (6,169 words), each with a recorded voice. Part of **Orbit**, a family of apps for life in Taiwan that share one sign-in, the Orbit Pass.

> **Best in Orbit.** Add [Orbit](https://orbit.jaypengx.com/app/) to your home screen: every Orbit app in one, signed in once, switching between them without reloading. Orbit Words also works on its own at [orbit.jaypengx.com/words](https://orbit.jaypengx.com/words/) if it's the only one you want.

<p align="center">
  <img src="docs/screenshots/words-1.webp" width="30%" alt="Today's words, the moment you open it">
  <img src="docs/screenshots/words-2.webp" width="30%" alt="6,169 exam words, each in a real voice">
  <img src="docs/screenshots/words-3.webp" width="30%" alt="New words one card at a time, read aloud">
</p>

<p align="center">
  <img src="docs/screenshots/words-4.webp" width="30%" alt="Fill in sentences: words in context">
  <img src="docs/screenshots/words-5.webp" width="30%" alt="8 ways to practise">
  <img src="docs/screenshots/words-6.webp" width="30%" alt="Your mix-ups, shown to you next time">
</p>

<details>
<summary>中文畫面</summary>

<p align="center">
  <img src="docs/screenshots/words-1.zh.webp" width="30%" alt="今天該背的字，一打開就知道">
  <img src="docs/screenshots/words-2.zh.webp" width="30%" alt="6,169 個大考單字，真人發音">
  <img src="docs/screenshots/words-3.zh.webp" width="30%" alt="新字一張一張背，真人唸給你聽">
</p>

<p align="center">
  <img src="docs/screenshots/words-4.zh.webp" width="30%" alt="句子填空，在句子裡記字">
  <img src="docs/screenshots/words-5.zh.webp" width="30%" alt="8 種練習方式，記得更牢">
  <img src="docs/screenshots/words-6.zh.webp" width="30%" alt="搞混過的字，下次直接提醒你">
</p>

</details>

## Features

- **Orbit AI:** 用新字聊天, a short English chat that asks for the words you just learned, each line fixed with the fewest changes and why; 拍照找單字 stars a textbook page's words that are on the list; every word has AI examples and a memory hook made once, and 用它造句 checks your sentence.
- **With the family:** words due show on the Orbit Pass's 今天, a break in Orbit Class offers 下課背五個, and Orbit News underlines the words you're learning in its English stories.
- **The whole 大考中心 list:** levels 1 to 6, 6,169 words, each recorded in a natural voice.
- **Today:** a daily goal of 20 and a streak; new words as cards, the weak words, a word of the day. Pick 10, 20 or 30 words, the levels, the way to learn and the sound speed.
- **Hard on purpose:** the wrong options are the likeliest mix-ups (spelt alike, close in meaning, or words you already confused).
- **A quick check first:** a word you know at a glance goes away for weeks; one you miss is learnt.
- **Eight ways to practise, picked on the home screen:** smart (by memory), meaning, word, by ear, dictation, sentences (the word's example with a blank), letters and fill-in.
- **Review:** wrong answers, what's due, what you're learning and your saved words, as flash cards and then a test.
- **A word's page,** from a dictionary written for Taiwan students (meanings from Wiktionary in Taiwan wording, the main sense first): sound, KK, the senses a student needs first, an example sentence with its Chinese, the word's forms, what you mixed it up with, your misspellings and the chance you still know it.
- **拼字比賽:** a timed paper of spelling by ear (each word said twice) then multiple choice, in three sizes: 20+20, 50+50 (40 minutes, the national contest's) and 50+100.
- **Progress:** level and points, accuracy, the last 14 days, each level, and the words you forget most.
- **Fully offline**, synced between devices through the Orbit Pass.
- **Every screen, either way up:** 今天 and 進度 in two columns (three on a computer), 複習 and 單字 with the word open beside the list, a question beside its answers.

## Tech stack

| Layer | What |
| --- | --- |
| App | Plain JavaScript (ES modules), HTML and CSS; no framework, no build step, no dependencies |
| Platform | Installable web app; the service worker keeps every word and recording, so it works with no network |
| Shared | Look, Orbit Pass sync (`pass-sync.mjs`) and the 20:00 streak notice from the kit in [Orbit-Core](https://github.com/JayPengX/Orbit-Core) |
| Memory model | FSRS-5 (stability and difficulty); 10 days' stability counts as mastered |
| Data | `data/words.json` (the list, its senses and KK), `data/more.json` (examples and forms), `data/hints.json` (mnemonics and mix-ups, written once offline), `data/audio/` (one recording per word) |
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
├── data/             words.json, more.json, hints.json, audio/
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

Push to `main`. GitHub Actions runs the tests, stamps every file with its content hash (so a phone downloads only what changed) and publishes `public/` to Cloudflare at its orbit.jaypengx.com address (Orbit-Core `deploy/cf-site.mjs`). There are no pull requests or release branches.

## Part of Orbit

Every app below is in **[Orbit](https://orbit.jaypengx.com/app/)**, one home-screen app for them all; each also works on its own.

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

## Credits

Meanings and pronunciations draw on [Wiktionary](https://en.wiktionary.org) (via [kaikki.org](https://kaikki.org), CC BY-SA 4.0); example sentences come from [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR). The dictionary files `public/data/words.json`'s meanings and `public/data/more.json` are shared under CC BY-SA 4.0.
