# Features kept

Every feature a person uses in this app, with the code that makes it.
`tests/features.test.mjs` fails if any mark below disappears, so a refactor cannot
drop a feature silently (2026-11-03, after the lost-features audit).
To remove a feature on purpose, delete its line here in the same commit and say why.
- 今天's 練習模式 tiles, the round following the chosen mode — `public/views/today.js`: `練習模式`
- 拼字比賽 with three paper sizes — `public/views/contest.js`: `拼字比賽`
- 單字卡 and flash cards — `public/views/today.js`, `public/views/review.js`: `單字卡`, `flash`
- 複習 lists and 收藏 bookmarks — `public/views/review.js`: `複習`, `收藏`
- 背新字 and 不認識 — `public/lib/i18n.mjs`, `public/views/session.js`: `背新字`, `不認識`
- 句子填空 — `public/views/session.js`: `句子填空`
- A word's 學習紀錄 — `public/views/sheet.js`: `學習紀錄`
- 最常忘的字 and the review forecast — `public/lib/i18n.mjs`, `public/views/progress.js`: `最常忘的字`, `forecast`
- Streaks — `public/views/today.js`: `streak`
