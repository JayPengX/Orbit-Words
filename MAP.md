# Orbit Words: the map

English words that stay with you: the 大考中心 list, levels 1–6 (6,169 words),
each recorded in Microsoft's Jenny voice. Signs in with the Orbit Pass; no
money in or out. Live: https://orbit.jaypengx.com/words/

## Rules

Jay's, dated (Taiwan day), newest wins; the family's are in Orbit-Core `docs/RULEBOOK.md`.

- 10-31 A general practice app with its modes in view (練習模式 on 今天); the contest paper is one mode, 拼字比賽, named for no specific competition.
- 10-31 Only the memory model decides a word is known, from the answers: no 我會了 / 太簡單 / "I know it" anywhere.
- 10-31 Every answer option one text size, never shrunk to fit (a shrunk one gives the answer away); a long one wraps.
- 11-03 The home is a home, never a round by itself: 今天 says what the app is at a glance (今天的字: the next round's own words, so 開始 asks exactly those; `nextRound`).
- 11-05 A word always sounds: its recording, else the phone's English voice, else a toast saying so (`tests/sound.test.mjs`).
- 11-06 The phone's own day: the streak, today's count, due dates and the 20:00 reminder follow the phone's clock (kit `localDay`).
- 11-10 Memory hooks only where one truly helps (a real root, a sound-alike or a picture), else none: never an English restatement (the 10-31 failure).
- The device's language, no switcher. Recorded voices, never the device's when a recording exists. Cloze and unscrambling only as their own modes, never in smart mode. The dictionary and the usual confusions are written once offline; nothing generated live but the family's AI below.

## How it works

- **Tabs:** 今天 (今天的字 and 開始, 我的字庫, the word of the day, 繼續, 練習模式, 拼字比賽, the streak, weak words, decks) · 複習 (答錯, 該複習, 學習中, 收藏) · 單字 (the whole list) · 進度. A word's sheet from anywhere or `#word=<word>`. Wide screens: a lead band, the rest in the kit's flow columns (今天's recent and weak words give rows so the columns end level, `evenUp`), a word open beside the list (`wordPane`) under 複習's categories; on a computer 進度 is one row of one height with 最常忘的字 in the page, and the page starts level with the side bar; `tests/wide.test.mjs`, `tests/look.test.mjs` hold them.
- **Teaching** (`lib/words.mjs`), hard on purpose: wrong options are the likeliest mix-ups (spelt alike, close in meaning, or this person's own confusions); a new word's first question is a quick check; meaning, word and ear while learning, dictation once held; FSRS-5, 10 days' stability is mastered. Ways (`MODES`): 智慧練習, 選中文, 選英文, 聽音選字, 聽寫, 句子填空, 拼字母, 補字母.
- **拼字比賽** (`lib/contest.mjs`): a timed paper shaped like the national high-school contest's (聽英拼寫, then 詞彙題 單題 and 題組), three sizes, about 40% this person's weak words; nothing shown until it's handed in; the last 20 scores kept. The 單題/題組 split is a guess.
- **The family's AI:** a word's AI examples, hook and mix-ups are made once for the whole list by Orbit-Core `builders/ai.js` into `/data/words/cards/<letter>.json` (kit `packJson`); 用它造句 (`words-check`), 拍照找單字 (`words-photo`, only the list's own words kept), 用新字聊天 (`words-chat`; the chat stays on the phone, only its words and last 8 turns are sent).
- **The family's notebook** (kit `family.mjs`): `vocab.due` and `vocab.learning` (for News' 新聞學單字); Class's 下課背五個 opens `#five`, a five-word round.
- **Points** (`lib/practice.mjs`): XP, levels, the streak (20 answers a day), a 20:00 notice. Points buy nothing.
- **Sound** (`audio.js`, `lib/sound.mjs`): Web Audio (music keeps playing; the silent switch mutes); the recording gets 2.5 s before the phone's voice.
- **Offline and sync:** everything works offline (words and recordings are the site's files, kept by `sw.js`). Progress is saved on the phone at every change and merged with the Pass through the kit's `pass-sync.mjs`. Payload `vocab-progress-sync`: `z3:` + gzip of `{ v: 3, w: { word: [box, due, answers, right, …] }, ct, st }`; every row part optional so older copies open; newer settings win a merge (`lib/copy.mjs mergeCopy`); a day's answers are at least what each device answered on its own, added up (`dd`, `lib/practice.mjs logDevice`), so two devices used the same day keep the streak.
- **The dictionary** (`scripts/dict/`, its brief `BRIEF.md`): senses and KK from Wiktionary, examples from Tatoeba, Taiwan wording; sense 1 is what the quiz asks. Edit `scripts/dict/entries.jsonl`, then `python3 scripts/dict/build.py`. The confusions: `data/hints.json`.

## Files (`public/`)

| File | What |
| --- | --- |
| `app.js`, `shell.js`, `ui.js`, `audio.js` | Start, saving, tabs; shared state; drawing; sound |
| `testing.js` | Words' switches in the kit's hidden 測試工具 (display and reads only, nothing saved): `vocabGoal` (risk/met), `vocabDue`, `vocabNoMore` (contest sentences fail), `vocabNoSound` |
| `views/` | Each tab, the round's choices, the word sheet, rounds and flash cards; `chrome.js` the shared pieces |
| `lib/words.mjs` | Memory model, rounds, questions, wrong options, saved progress |
| `lib/copy.mjs` | The payload (encode, decode, merge); the kit's `pass-sync.mjs` keeps it in step with the Pass |
| `lib/contest.mjs` | The 拼字比賽 paper (its sizes, words, marking, scores kept); 句子填空's question |
| `lib/cards.mjs` | The AI's cards (examples, hook, mix-ups) as the sheet keeps them; a checked sentence's changes |
| `lib/chat.mjs` | 用新字聊天: which words, which turns are sent, the opener |
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
to `main` tests, stamps versions and deploys to Cloudflare.

## If you change…

| This | Also check |
| --- | --- |
| The saved row's shape | Older copies still open; merging across devices (`tests/sync.test.mjs`) |
| `data/words.json` | A recording per word, `hints.json` keys |
| The grade or FSRS weights | 進度's numbers, rounds |
