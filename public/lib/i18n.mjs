// Orbit Words' text, Traditional Chinese and English (the page follows the
// browser's language, or the language picked in any Quadra app).
export const STRINGS = {
  zh: {
    tab_today: '今天', tab_practice: '練習', tab_progress: '進度',
   
    statusLine: '今天 {n}/{goal} 題 · 🔥 {s} 天', close: '關閉',
    // Words
    wordsTitle: '背單字', pickLevel: '先選要練習的級別', roundSize: '一回', wordsN: '{n} 個字', startRound: '開始這一輪', studyTitle: '背新字', studySub: '先一張一張背新字，背滿一批（{n} 個）就考這批字。', studyLeft: '再背 {n} 個就能測驗', studyReady: '這批背好了，趁還記得考一下', studyQuiz: '測驗這 {n} 個字', studyStart: '開始背', studyMore: '繼續背', studyNone: '這些級別沒有新字可以背', studyGot: '記住了', studyPrev: '上一個', studySaved: '背到這裡，下次接著背', nothingLeft: '這些級別現在沒有要練的字',
    levels: '級別', level: '第 {n} 級', dueN: '{n} 個該複習',
    levelHint1: '最基本', levelHint2: '基礎', levelHint3: '國中到高一', levelHint4: '高中', levelHint5: '學測', levelHint6: '進階',
    modes: '學習方式', modesSub: '題目故意出得難：錯的選項都是最容易搞混的字。',
    mode_smart: '智慧', mode_meaning: '選意思', mode_word: '選英文', mode_listen: '聽音選字', mode_letters: '拼字母', mode_cloze: '填空', mode_spell: '聽寫',
    modeHint_smart: '各種題型輪流出', modeHint_meaning: '看英文選中文', modeHint_word: '看中文選英文', modeHint_listen: '只聽發音', modeHint_letters: '把字母排好', modeHint_cloze: '補上缺的字母', modeHint_spell: '聽了拼出來',
    progress: '學習進度', stMastered: '精熟', stLearning: '學習中', stDue: '該複習', stLeft: '還沒學',
    levelWord: '等級', streakWord: '連續', daysN: '{n} 天', goalDone: '✓ 今天的目標達成了', goalLeft: '今天再答 {n} 題達成目標', weekDots: '最近 7 天', levelNext: '再 {v} 升到 Lv {n}', bestStreak: '最長 {n} 天',
    hardTitle: '最常忘的字', hardSub: '學會又忘掉的字，和你把它們跟哪些字搞混。這些字會最先出現。', mixedWith: '搞混成 {words}', lapsesN: '忘了 {n} 次',
    wotd: '今日單字', listen: '聽發音', tapToHear: '點一下再聽一次',
    state_new: '新字', state_learning: '學習中', state_mastered: '精熟',
    ask_meaning: '這個字是什麼意思？', ask_word: '哪個英文是這個意思？', ask_listen: '聽到的是哪個字？', ask_letters: '把字母排成這個字', ask_cloze: '補上缺的字母，寫出整個字', ask_spell: '聽發音，拼出這個字',
    letters: '{n} 個字母', undo: '退一格', check: '確認', dontKnow: '不認識這個字', tooEasy: '太簡單，我會了', endRound: '結束這一輪',
    fbRight: '答對了', fbWrong: '答錯了', fbMastered: '精熟了！', youPicked: '你選的是', next: '下一題', seeResult: '看結果',
    summaryLine: '這輪拿到 {v} · 精熟 {m} 個字', summaryAll: '全對：答得越快，下次越晚才會再考。', summaryMissed: '答錯的字很快會再出現，搞混的字會排在一起考。', again: '再來一輪',
    noticeStreak: '連續 {n} 天的紀錄今晚到期', noticeStreakSoon: '今天還沒練單字', noticeStreakBody: '再答 {goal} 題就保住',
    // The rebuilt tabs: review, the word list, the sheet, flash cards, progress
    tab_review: '複習', tab_list: '單字',
    done: '完成', startDue: '開始：先複習 {n} 個字', tipLabel: '💡 記憶小撇步', mark: '加入收藏', unmark: '取消收藏',
    missedCardTitle: '上次答錯的 {n} 個字', missedCardSub: '先用卡片看一遍，再考就記得住',
    cat_wrong: '答錯', cat_due: '該複習', cat_learning: '學習中', cat_marked: '收藏',
    catHint_wrong: '最後一次答錯的字，你拼錯的地方標成紅色。', catHint_due: '記憶模型算出快要忘的字，今天複習最划算。', catHint_learning: '學過、上次答對，但還沒精熟的字。', catHint_marked: '你按了 ☆ 的字，在題目、卡片或單字表都能收藏。',
    catEmpty_wrong: '沒有答錯的字，繼續保持！', catEmpty_due: '今天沒有該複習的字。', catEmpty_learning: '還沒有學習中的字，先開始一輪吧。', catEmpty_marked: '還沒有收藏的字。看到想記的字，按 ☆ 收藏。',
    flashTitle: '卡片複習', flashSub: '一張一張翻，看完再測驗這批字', deckSize: '張數', allN: '全部 {n}', flashStart: '開始翻卡片', testThese: '直接測驗',
    flashEmpty: '這裡沒有字可以複習', flashNext: '下一張', flashPrev: '上一張', lastMissed: '上次答錯', tapToFlip: '點一下翻面，左右滑換下一張', flashTest: '測驗這 {n} 個字', flashTestHint: '翻卡片不算分，測驗的結果才會更新記憶模型。', flashSeeAll: '再看 {n} 張就能測驗',
    sort_weak: '最弱的先', sort_recent: '最近的先', sort_missed: '最常錯', sort_az: 'A–Z',
    searchReview: '搜尋英文或中文', searchWords: '搜尋 6,000 字：英文或中文', noMatch: '沒有符合的字', showMore: '顯示更多', wordsCount: '{n} 個字',
    allLevels: '全部', filter_all: '全部', filter_new: '新字', filter_learning: '學習中', filter_mastered: '精熟', filter_marked: '收藏',
    dueToday: '今天該複習', dueTomorrow: '明天複習', dueInN: '{n} 天後複習', overdueN: '過期 {n} 天',
    youSpelt: '你拼成',
    missSpelt: '拼錯', missMixed: '選成', missHeard: '聽成', missUnknown: '不認識', missEar: '沒聽出來', missWrong: '答錯', missesN: '錯 {n} 次', lastMiss: '上次怎麼錯的', mixedYours: '你搞混過的字', mixedCommon: '常被搞混的字', howItGoes: '學習紀錄', neverAsked: '還沒考過這個字。',
    stAnswers: '作答', stAccuracy: '正確率', stRecall: '現在記得', stStability: '記憶天數', daysShort: '{n} 天', lapsesLine: '學會後又忘了 {n} 次', iKnowIt: '我會了，不用再考',
    soundTitle: '發音', rateLabel: '語速', rateTry: '▶ 試聽',
    levelsTitle: '各級別', activityTitle: '最近 14 天', activityFoot: '虛線是每天 {goal} 題的目標 · 最長連續 {best} 天', goalLine: '目標 {n} 題',
    forecastTitle: '接下來要複習', forecastSub: '每天會到期的字數（今天包含已經過期的）。', todayShort: '今天',
    memoryTitle: '記憶', mem0: '不到 2 天', mem1: '2–10 天', mem2: '10–30 天', mem3: '一個月以上', memoryEmpty: '學過的字會照記得多久分組顯示在這裡。',
    fitSoon: '再複習 {n} 次（隔天以上），記憶模型就會調整成你的記憶力。', fitBetter: '你的記性比一般人好（×{f}），複習間隔會拉長。', fitWorse: '你比一般人容易忘（×{f}），複習會排得密一點。', fitAverage: '你的記性跟一般人差不多，照標準間隔複習。',
    stAccuracyAll: '總正確率', stAccuracyWeek: '7 天正確率', stPerAnswer: '每題平均', stDaysPractised: '練習天數', secN: '{n} 秒',
  },
  en: {
    tab_today: 'Today', tab_practice: 'Practice', tab_progress: 'Progress',
   
    statusLine: 'Today {n}/{goal} · 🔥 {s} days', close: 'Close',
    wordsTitle: 'Words', pickLevel: 'Pick the levels to practise', roundSize: 'A round', wordsN: '{n} words', startRound: 'Start a round', studyTitle: 'Study new words', studySub: 'Learn new words card by card; a full batch ({n}) unlocks a quiz on them.', studyLeft: '{n} more to unlock the quiz', studyReady: 'Batch learnt: quiz it while it’s fresh', studyQuiz: 'Quiz these {n} words', studyStart: 'Start studying', studyMore: 'Keep studying', studyNone: 'No new words left in these levels', studyGot: 'Got it', studyPrev: 'Back', studySaved: 'Saved: carry on next time', nothingLeft: 'Nothing to practise in these levels right now',
    levels: 'Levels', level: 'Level {n}', dueN: '{n} to review',
    levelHint1: 'The basics', levelHint2: 'Foundation', levelHint3: 'Junior high', levelHint4: 'High school', levelHint5: 'College entrance', levelHint6: 'Advanced',
    modes: 'Ways to learn', modesSub: 'Questions are hard on purpose: every wrong option is the word you’re most likely to mix it up with.',
    mode_smart: 'Smart', mode_meaning: 'Meaning', mode_word: 'English', mode_listen: 'By ear', mode_letters: 'Letters', mode_cloze: 'Fill in', mode_spell: 'Dictation',
    modeHint_smart: 'Every kind, in turn', modeHint_meaning: 'English to meaning', modeHint_word: 'Meaning to English', modeHint_listen: 'Sound only', modeHint_letters: 'Unscramble it', modeHint_cloze: 'Missing letters', modeHint_spell: 'Hear it, spell it',
    progress: 'Progress', stMastered: 'Mastered', stLearning: 'Learning', stDue: 'Due', stLeft: 'Not yet',
    levelWord: 'Level', streakWord: 'Streak', daysN: '{n} days', goalDone: '✓ Today’s goal is met', goalLeft: '{n} more answers for today’s goal', weekDots: 'The last 7 days', levelNext: '{v} to level {n}', bestStreak: 'best {n} days',
    hardTitle: 'Words you forget most', hardSub: 'Words learnt and then forgotten, and what you mixed them up with. These come first.', mixedWith: 'mixed up with {words}', lapsesN: 'forgot {n}×',
    wotd: 'Word of the day', listen: 'Listen', tapToHear: 'Tap to hear it again',
    state_new: 'New', state_learning: 'Learning', state_mastered: 'Mastered',
    ask_meaning: 'What does it mean?', ask_word: 'Which word means this?', ask_listen: 'Which word did you hear?', ask_letters: 'Put the letters in order', ask_cloze: 'Fill in the missing letters: type the whole word', ask_spell: 'Listen and spell it',
    letters: '{n} letters', undo: 'Undo', check: 'Check', dontKnow: "I don't know it", tooEasy: 'Too easy, I know it', endRound: 'End the round',
    fbRight: 'Right', fbWrong: 'Not quite', fbMastered: 'Mastered!', youPicked: 'You picked', next: 'Next', seeResult: 'See the result',
    summaryLine: '{v} this round · {m} mastered', summaryAll: 'No misses: the quicker you answered, the later each word comes back.', summaryMissed: 'Missed words come back soon, next to the words you mixed them up with.', again: 'Another round',
    noticeStreak: 'Your {n}-day streak ends tonight', noticeStreakSoon: 'No words practised today', noticeStreakBody: '{goal} answers keep it going',
    tab_review: 'Review', tab_list: 'Words',
    done: 'Done', startDue: 'Start: {n} reviews first', tipLabel: '💡 A way to remember it', mark: 'Bookmark', unmark: 'Remove bookmark',
    missedCardTitle: '{n} words you missed last time', missedCardSub: 'Look them over as cards before they come back',
    cat_wrong: 'Missed', cat_due: 'Due', cat_learning: 'Learning', cat_marked: 'Saved',
    catHint_wrong: 'Words whose last answer was wrong; where you misspelt them is in red.', catHint_due: 'Words the memory model says you’re about to forget: today is the best day to review them.', catHint_learning: 'Learnt and last answered right, not yet mastered.', catHint_marked: 'Words you starred ☆, in a question, a card or the word list.',
    catEmpty_wrong: 'Nothing missed. Keep it up!', catEmpty_due: 'Nothing is due today.', catEmpty_learning: 'No words being learnt yet: start a round.', catEmpty_marked: 'No saved words yet. Tap ☆ on a word to save it.',
    flashTitle: 'Flash cards', flashSub: 'Flip through them, then take a test on the deck', deckSize: 'Cards', allN: 'All {n}', flashStart: 'Flip cards', testThese: 'Test now',
    flashEmpty: 'No words to review here', flashNext: 'Next', flashPrev: 'Back', lastMissed: 'Missed last time', tapToFlip: 'Tap to flip, swipe for the next', flashTest: 'Test these {n} words', flashTestHint: 'Flipping cards isn’t scored; the test updates the memory model.', flashSeeAll: '{n} more cards to unlock the test',
    sort_weak: 'Weakest', sort_recent: 'Recent', sort_missed: 'Most missed', sort_az: 'A–Z',
    searchReview: 'Search in English or Chinese', searchWords: 'Search 6,000 words in English or Chinese', noMatch: 'No matching words', showMore: 'Show more', wordsCount: '{n} words',
    allLevels: 'All', filter_all: 'All', filter_new: 'New', filter_learning: 'Learning', filter_mastered: 'Mastered', filter_marked: 'Saved',
    dueToday: 'Due today', dueTomorrow: 'Due tomorrow', dueInN: 'Due in {n} days', overdueN: '{n} days overdue',
    youSpelt: 'You wrote',
    missSpelt: 'Spelt', missMixed: 'Took it for', missHeard: 'Heard it as', missUnknown: "Didn't know it", missEar: 'Missed by ear', missWrong: 'Missed', missesN: '{n} misses', lastMiss: 'How it went wrong', mixedYours: 'Words you mixed it up with', mixedCommon: 'Often confused with', howItGoes: 'Your record', neverAsked: 'Not asked yet.',
    stAnswers: 'Answers', stAccuracy: 'Accuracy', stRecall: 'Recall now', stStability: 'Stays for', daysShort: '{n} d', lapsesLine: 'Forgotten {n}× after learning it', iKnowIt: 'I know it, stop asking',
    soundTitle: 'Sound', rateLabel: 'Speed', rateTry: '▶ Try it',
    levelsTitle: 'By level', activityTitle: 'The last 14 days', activityFoot: 'Dashed: the {goal}-answer goal · best streak {best} days', goalLine: 'Goal {n}',
    forecastTitle: 'Reviews coming', forecastSub: 'Words falling due each day (today includes overdue).', todayShort: 'Today',
    memoryTitle: 'Memory', mem0: 'Under 2 days', mem1: '2–10 days', mem2: '10–30 days', mem3: 'A month+', memoryEmpty: 'Learnt words show here by how long they stay remembered.',
    fitSoon: '{n} more reviews (a day or more apart) and the model fits your memory.', fitBetter: 'You remember better than average (×{f}): longer gaps.', fitWorse: 'You forget faster than average (×{f}): reviews come sooner.', fitAverage: 'Your memory is about average: standard gaps.',
    stAccuracyAll: 'Accuracy', stAccuracyWeek: 'Last 7 days', stPerAnswer: 'Per answer', stDaysPractised: 'Days', secN: '{n} s',
  }
};
export function detectLocale() {
  try {
    const saved = localStorage.getItem('quadra.lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {}
  const langs = globalThis.navigator?.languages || [globalThis.navigator?.language || 'zh-TW'];
  return langs.some(l => /^zh/i.test(l)) || !langs.some(l => /^en/i.test(l)) ? 'zh' : 'en';
}
export function makeT(locale) {
  const dict = STRINGS[locale] || STRINGS.zh;
  return (key, vars = {}) => String(dict[key] ?? STRINGS.zh[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
