// Orbit Words' text, Traditional Chinese and English (the page follows the
// browser's language, or the language picked in any Quadra app).
export const STRINGS = {
  zh: {
    tab_today: '今天', tab_practice: '練習', tab_progress: '進度',
    tab_words: '單字',
    statusLine: '今天 {n}/{goal} 題 · 🔥 {s} 天', close: '關閉', failed: '沒有成功，請再試一次',
    // Words
    wordsTitle: '背單字', wordsSub: '{levels} · {due} 個該複習', pickLevel: '先選要練習的級別', roundSize: '一回', wordsN: '{n} 個字', startRound: '開始這一輪', studyTitle: '背新字', studySub: '先一張一張背新字，背滿一批（{n} 個）就考這批字。', studyLeft: '再背 {n} 個就能測驗', studyReady: '這批背好了，趁還記得考一下', studyQuiz: '測驗這 {n} 個字', studyStart: '開始背', studyMore: '繼續背', studyNone: '這些級別沒有新字可以背', studyGot: '記住了', studyPrev: '上一個', studySaved: '背到這裡，下次接著背', nothingLeft: '這些級別現在沒有要練的字',
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
    letters: '{n} 個字母', undo: '退一格', check: '確認', tooEasy: '太簡單，我會了', endRound: '結束這一輪',
    fbRight: '答對了', fbWrong: '答錯了', fbMastered: '精熟了！', youPicked: '你選的是', next: '下一題', seeResult: '看結果',
    summaryLine: '這輪拿到 {v} · 精熟 {m} 個字', summaryAll: '全對：答得越快，下次越晚才會再考。', summaryMissed: '答錯的字很快會再出現，搞混的字會排在一起考。', backToWords: '回單字', again: '再來一輪',
    noticeStreak: '🔥 連續 {n} 天今晚就要斷了', noticeStreakSoon: '🔥 今天還沒練單字', noticeStreakBody: '答 {goal} 題就能保住連續天數。',
  },
  en: {
    tab_today: 'Today', tab_practice: 'Practice', tab_progress: 'Progress',
    tab_words: 'Words',
    statusLine: 'Today {n}/{goal} · 🔥 {s} days', close: 'Close', failed: 'That didn’t work; please try again',
    wordsTitle: 'Words', wordsSub: '{levels} · {due} to review', pickLevel: 'Pick the levels to practise', roundSize: 'A round', wordsN: '{n} words', startRound: 'Start a round', studyTitle: 'Study new words', studySub: 'Learn new words card by card; a full batch ({n}) unlocks a quiz on them.', studyLeft: '{n} more to unlock the quiz', studyReady: 'Batch learnt: quiz it while it’s fresh', studyQuiz: 'Quiz these {n} words', studyStart: 'Start studying', studyMore: 'Keep studying', studyNone: 'No new words left in these levels', studyGot: 'Got it', studyPrev: 'Back', studySaved: 'Saved: carry on next time', nothingLeft: 'Nothing to practise in these levels right now',
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
    letters: '{n} letters', undo: 'Undo', check: 'Check', tooEasy: 'Too easy, I know it', endRound: 'End the round',
    fbRight: 'Right', fbWrong: 'Not quite', fbMastered: 'Mastered!', youPicked: 'You picked', next: 'Next', seeResult: 'See the result',
    summaryLine: '{v} this round · {m} mastered', summaryAll: 'No misses: the quicker you answered, the later each word comes back.', summaryMissed: 'Missed words come back soon, next to the words you mixed them up with.', backToWords: 'Back to words', again: 'Another round',
    noticeStreak: '🔥 Your {n}-day streak ends tonight', noticeStreakSoon: '🔥 No words today yet', noticeStreakBody: '{goal} answers keep your streak.',
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
