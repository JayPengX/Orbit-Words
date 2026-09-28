// Quadra Rewards' text, Traditional Chinese and English (the page follows
// the browser's language, or the language picked in any Quadra app).
export const STRINGS = {
  zh: {
    tab_home: '首頁', tab_words: '單字', tab_games: '遊戲', tab_help: '說明',
    statusLine: '今天賺了 {v}',
    // Home
    yourRank: '你的財富等級', streak: '🔥 連續 {n} 天', toNext: '還差 {v} 到「{rank}」', topRank: '已經是最高等級',
    rank_start: '起步', rank_saver: '小資族', rank_steady: '穩健', rank_comfort: '小康', rank_wealthy: '富裕', rank_rich: '有錢人', rank_multi: '千萬富翁', rank_tycoon: '億萬大亨',
    nextSteps: '下一步', stepReview: '複習 {n} 個該複習的字', stepLearn: '學新單字', stepWordsSub: '今天還能賺 {v}', stepClaim: '領取任務獎金', stepGame: '玩一局小遊戲', stepGameSub: '今天還能賺 {v}', stepInvest: '把錢拿去投資', stepInvestSub: '在 Securities 讓錢長大',
    missions: '每日任務', missionsSub: '完成後領取，一天最多 {v}。', claim: '領取 {v}', claimed: '已領取', go: '去做', claimedToast: '已領取 {v}',
    mission_words20: '練習 20 題單字', mission_master3: '精熟 3 個單字', mission_game1: '玩完一局小遊戲', mission_invest: '在 Securities 交易或加入觀察', mission_match: '在 Fixtures 看一場比賽或追蹤球隊', mission_tour: '今天打開 Securities、Fixtures 和 Rewards', mission_orbit: '在 Orbit Class 看今天的課表',
    todayEarned: '今天賺的錢', allTime: '在 Rewards 總共賺了 {v}', earn_words: '單字', earn_game: '遊戲', earn_mission: '任務',
    ranks: '財富等級', growTitle: '怎麼變有錢', growText: '每天在這裡靠努力賺一點，再放到 Securities 長期投資，讓時間和複利幫你。Play 的運彩和彩券平均都會輸錢，只適合當娛樂。',
    openHelp: '看說明', openSecurities: '打開 Securities', openApp: '打開 {app}',
    // Words
    wordsTitle: '背單字', wordsSub: '第 {levels} 級 · {due} 個該複習', pickLevel: '先選要練習的級別', todayWords: '今天單字', startRound: '開始一輪（10 個字）',
    levels: '級別', levelsSub: '大考中心高中英文參考詞彙表，每級約 1,000 字。可以複選。', level: '第 {n} 級', dueN: '{n} 個該複習',
    levelHint1: '最基本', levelHint2: '基礎', levelHint3: '國中到高一', levelHint4: '高中', levelHint5: '學測', levelHint6: '進階',
    modes: '學習方式', progress: '學習進度', stMastered: '精熟', stLearning: '學習中', stDue: '該複習', stLeft: '還沒學',
    mode_smart: '智慧', mode_card: '字卡', mode_meaning: '選意思', mode_word: '選英文', mode_listen: '聽音選字', mode_letters: '拼字母', mode_spell: '聽寫',
    modeHint_smart: '依熟練度自動變換', modeHint_card: '翻卡自我檢查', modeHint_meaning: '看英文選中文', modeHint_word: '看中文選英文', modeHint_listen: '只聽發音', modeHint_letters: '把字母排好', modeHint_spell: '聽了拼出來',
    ask_card: '你知道這個字的意思嗎？', ask_meaning: '這個字是什麼意思？', ask_word: '哪個英文是這個意思？', ask_listen: '你聽到的是哪個字？', ask_letters: '把字母排成這個字', ask_spell: '聽發音，拼出這個字',
    showMeaning: '看意思', notYet: '還不熟', knewIt: '我會了', tapToHear: '點一下再聽一次', listen: '聽發音', undo: '退一格', check: '確認', letters: '{n} 個字母',
    fbRight: '答對了！', fbKnew: '好，記下來了', fbWrong: '答錯了', fbMastered: '🏅 精熟！', next: '下一題', seeResult: '看結果', endRound: '結束這一輪',
    state_new: '新字', state_learning: '學習中', state_mastered: '精熟',
    summaryLine: '這輪賺了 {v}，精熟 {m} 個字', capReached: '今天這項已經賺滿，明天再來。', backToWords: '回單字', again: '再一輪', nothingLeft: '這些級別都學完了，選別的級別吧！',
    // Games
    gamesTitle: '今天遊戲收入', gamesEarned: '{v} / {cap}', gamesCapped: '今天已經賺滿了', gamesIntro: '靠努力賺錢，每局約一分鐘，一天最多 {cap}。',
    game_pairs: '單字配對', game_merge: '2048', game_derby: '全壘打大賽', game_freethrow: '罰球',
    gameKind_pairs: '記憶 · 單字', gameKind_merge: '策略 · 90 秒', gameKind_derby: '抓時機 · 高風險', gameKind_freethrow: '抓時機 · 高風險',
    gameUpTo: '一局最多約 {v}', gameClose: '收起', gameStart: '開始', gameAgain: '再玩一局', gamePaid: '入帳 {v}', gameCapNote: '超過今天上限的部分不入帳。',
    gameWage: '這局花了 {m} 分 {s} 秒，賺到的錢等於做基本工資（時薪 {wage}）的工作 {work} 分鐘。',
    hudCount: '{n} / {of}', hudStreak: '🔥 {n}', hudLevel: '難度', hudBonus: '連續獎金 +{v}', hudPenalty: '扣 {v}',
    streakRule: '連續 {every} 次加 {bonus}；錯一次扣 {penalty}。', streakRuleSafe: '失誤不扣錢；連續 {every} 次加 {bonus}。', streakRuleLadder: '連續第 2 次加 {a}，之後每次加 {b}；失手扣 {penalty}。', scoreLine: '連續獎金 +{bonus}，扣款 −{penalty}。',
    derbyTitle: '全壘打大賽', derbyTap: '按「開始」，球到本壘時點畫面揮棒', derbySwing: '揮棒', derbyMeters: '{m} 公尺', derby_hr: '全壘打！', derby_hit: '安打', derby_miss: '揮空', derby_strike: '好球！沒揮',
    derbyDone: '{hr} 支全壘打、{hits} 支安打。', derbyRules: '{n} 球，黃圈亮時揮棒：全壘打 {hr}、安打 {hit}。打得越好球越快。',
    ftTitle: '罰球', ftTap: '按「開始」，箭頭到綠色時點畫面出手', ftShoot: '出手', ft_swish: '空心！', ft_make: '進了', ft_miss: '沒進',
    ftDone: '投進 {made} 球，其中 {swish} 球空心。', ftRules: '{n} 球，箭頭停在綠色出手：深綠空心 {swish}、淺綠進球 {make}。投越準越快。',
    pairsRules: '把英文和它的中文意思配成一對，共 {n} 對，每對 {v}。兩張都看過還配錯才扣錢。', pairsDone: '配對 {n} 組，配錯 {miss} 次。',
    mergeRules: '滑動或用方向鍵，一樣的數字會合併。合出 16 以上就賺錢，越大越多。限時 {s} 秒。', mergeDone: '最大的方塊是 {best}。', secondsLeft: '剩 {n} 秒'
  },
  en: {
    tab_home: 'Home', tab_words: 'Words', tab_games: 'Games', tab_help: 'Help',
    statusLine: 'Earned today {v}',
    yourRank: 'Your wealth rank', streak: '🔥 {n} days in a row', toNext: '{v} to go to {rank}', topRank: 'The top rank',
    rank_start: 'Starter', rank_saver: 'Saver', rank_steady: 'Steady', rank_comfort: 'Comfortable', rank_wealthy: 'Wealthy', rank_rich: 'Rich', rank_multi: 'Multi-millionaire', rank_tycoon: 'Tycoon',
    nextSteps: 'Next steps', stepReview: 'Review {n} words due', stepLearn: 'Learn new words', stepWordsSub: '{v} left to earn today', stepClaim: 'Claim a mission reward', stepGame: 'Play a mini game', stepGameSub: '{v} left to earn today', stepInvest: 'Put money to work', stepInvestSub: 'Grow it in Securities',
    missions: 'Daily missions', missionsSub: 'Claim each when done, {v} a day at most.', claim: 'Claim {v}', claimed: 'Claimed', go: 'Go', claimedToast: 'Claimed {v}',
    mission_words20: 'Answer 20 word questions', mission_master3: 'Master 3 words', mission_game1: 'Finish a mini game', mission_invest: 'Trade or watch in Securities', mission_match: 'Open a match or follow a team in Fixtures', mission_tour: 'Open Securities, Fixtures and Rewards today', mission_orbit: 'Check today’s classes in Orbit Class',
    todayEarned: 'Earned today', allTime: '{v} earned in Rewards so far', earn_words: 'Words', earn_game: 'Games', earn_mission: 'Missions',
    ranks: 'Wealth ranks', growTitle: 'How to get rich', growText: 'Earn a little here every day, then invest it in Securities for the long run and let time and compounding work. Play’s bets and lottery lose on average: fun, not a plan.',
    openHelp: 'Read more', openSecurities: 'Open Securities', openApp: 'Open {app}',
    wordsTitle: 'Words', wordsSub: 'Levels {levels} · {due} due', pickLevel: 'Pick the levels to practise', todayWords: 'Words today', startRound: 'Start a round (10 words)',
    levels: 'Levels', levelsSub: 'The high-school English reference list, about 1,000 words a level. Pick any.', level: 'Level {n}', dueN: '{n} due',
    levelHint1: 'Basics', levelHint2: 'Elementary', levelHint3: 'Lower secondary', levelHint4: 'High school', levelHint5: 'Exam level', levelHint6: 'Advanced',
    modes: 'Ways to learn', progress: 'Progress', stMastered: 'Mastered', stLearning: 'Learning', stDue: 'Due', stLeft: 'Not started',
    mode_smart: 'Smart', mode_card: 'Cards', mode_meaning: 'Meaning', mode_word: 'English', mode_listen: 'Listen', mode_letters: 'Letters', mode_spell: 'Dictation',
    modeHint_smart: 'Changes with how well you know it', modeHint_card: 'Flip and check yourself', modeHint_meaning: 'English → meaning', modeHint_word: 'Meaning → English', modeHint_listen: 'Sound only', modeHint_letters: 'Unscramble it', modeHint_spell: 'Hear it, spell it',
    ask_card: 'Do you know what it means?', ask_meaning: 'What does it mean?', ask_word: 'Which word means this?', ask_listen: 'Which word did you hear?', ask_letters: 'Put the letters in order', ask_spell: 'Listen and spell it',
    showMeaning: 'Show meaning', notYet: 'Not yet', knewIt: 'I knew it', tapToHear: 'Tap to hear it again', listen: 'Listen', undo: 'Undo', check: 'Check', letters: '{n} letters',
    fbRight: 'Right!', fbKnew: 'Noted', fbWrong: 'Not quite', fbMastered: '🏅 Mastered!', next: 'Next', seeResult: 'See results', endRound: 'End the round',
    state_new: 'New', state_learning: 'Learning', state_mastered: 'Mastered',
    summaryLine: 'Earned {v} this round, {m} words mastered', capReached: 'Today’s limit for this is reached: back tomorrow.', backToWords: 'Back to words', again: 'Another round', nothingLeft: 'Nothing left in these levels: pick others!',
    gamesTitle: 'Games today', gamesEarned: '{v} of {cap}', gamesCapped: 'Today’s limit reached', gamesIntro: 'Earn by effort, about a minute a round, {cap} a day at most.',
    game_pairs: 'Word pairs', game_merge: '2048', game_derby: 'Home run derby', game_freethrow: 'Free throws',
    gameKind_pairs: 'Memory · words', gameKind_merge: 'Strategy · 90 s', gameKind_derby: 'Timing · high risk', gameKind_freethrow: 'Timing · high risk',
    gameUpTo: 'Up to about {v} a round', gameClose: 'Close', gameStart: 'Start', gameAgain: 'Play again', gamePaid: 'paid {v}', gameCapNote: 'Anything over today’s limit isn’t paid.',
    gameWage: 'That took {m} min {s} s; the pay equals {work} minutes of a minimum-wage job ({wage} an hour).',
    hudCount: '{n} / {of}', hudStreak: '🔥 {n}', hudLevel: 'Level', hudBonus: 'streak +{v}', hudPenalty: '−{v}',
    streakRule: '{every} in a row adds {bonus}; a mistake costs {penalty}.', streakRuleSafe: 'Mistakes cost nothing; {every} in a row adds {bonus}.', streakRuleLadder: '2nd in a row adds {a}, then {b} each; a miss costs {penalty}.', scoreLine: 'Streak bonuses +{bonus}, penalties −{penalty}.',
    derbyTitle: 'Home run derby', derbyTap: 'Press Start, tap as the ball reaches the plate', derbySwing: 'Swing', derbyMeters: '{m} m', derby_hr: 'Home run!', derby_hit: 'Base hit', derby_miss: 'Swing and a miss', derby_strike: 'Strike, looking',
    derbyDone: '{hr} home runs, {hits} hits.', derbyRules: '{n} pitches; swing when the ring lights: home run {hr}, hit {hit}. Hit well and it gets faster.',
    ftTitle: 'Free throws', ftTap: 'Press Start, tap when the arrow is in the green', ftShoot: 'Shoot', ft_swish: 'Swish!', ft_make: 'Good', ft_miss: 'No good',
    ftDone: '{made} made, {swish} of them swishes.', ftRules: '{n} shots; stop the arrow in the green: dark green swish {swish}, light green {make}. Shoot well and it gets faster.',
    pairsRules: 'Match each English word with its meaning: {n} pairs, {v} each. A wrong pair costs only once you’ve seen both cards.', pairsDone: '{n} pairs, {miss} misses.',
    mergeRules: 'Swipe or use the arrow keys; equal numbers merge. Merges of 16 and up pay, bigger ones more. {s} seconds.', mergeDone: 'Biggest tile: {best}.', secondsLeft: '{n} s left'
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
