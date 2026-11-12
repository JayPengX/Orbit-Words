// Orbit Words' own switches in the kit's 測試工具 (hidden until unlocked:
// Orbit Pass › seven taps on 除錯紀錄). Each is read where that state is
// decided, as globalThis.ORBIT_TEST?.flags?.<name>; the kit's clock, network
// and test-notice switches work here as everywhere. A switch changes only what
// is shown or read: nothing is saved to the pass, nothing new is sent.
//   vocabGoal 'risk' | 'met': 今天's card with a streak about to break / the day's goal met (views/today.js goalHero)
//   vocabDue: 繼續's 該複習 row with many words due (views/today.js continueList; the round is on the real ones)
//   vocabNoMore: data/more.json can't be read: the contest's card says so, with 再試一次 (app.js loadMoreList)
//   vocabNoSound: no clip and no voice: the 發音放不出來 message (audio.js speak)
const T = (zh, en) => (/^zh/i.test(document.documentElement.lang || 'zh') ? zh : en);
const app = 'vocab';
(globalThis.ORBIT_TEST_TOOLS ||= []).push(
  {
    app,
    title: T('今天的目標', 'Today’s goal'),
    sub: T('連續快斷了，或今天已達標（只換今天卡片的顯示）', 'A streak about to end, or the goal met (today’s card only)'),
    flag: 'vocabGoal',
    options: [
      { id: 'risk', label: T('快斷了', 'At risk') },
      { id: 'met', label: T('已達標', 'Met') }
    ]
  },
  { app, title: T('很多字該複習', 'Many words due'), sub: T('繼續裡的「該複習」顯示 240 個（開始時用真的字）', 'Continue’s Due now row shows 240 (a round uses the real ones)'), flag: 'vocabDue' },
  { app, title: T('考卷例句讀不到', 'Contest sentences fail'), sub: T('拼字比賽的卡片說沒有載入，可以再試一次', 'The contest card says so, with Try again'), flag: 'vocabNoMore' },
  { app, title: T('發音放不出來', 'No sound'), sub: T('沒有錄音也沒有系統語音', 'No clip and no system voice'), flag: 'vocabNoSound' }
);
