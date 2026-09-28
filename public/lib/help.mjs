// The help centre: how every Quadra app works, in one place. Each app's
// page opens here with #help=<app> (helpUrl in quadra.mjs), or
// #help=<app>:<topic> for one topic.
//
// HELP[app][lang] = [[topic id, title, [paragraphs]], …]

export const HELP_ORDER = ['pass', 'stock', 'odds', 'match', 'vocab', 'orbit'];

export const HELP = {
  pass: {
    zh: [
      ['what', 'Quadra Pass 是什麼', [
        'Quadra Pass 是一組 10 個字的通行碼，是你在所有 Quadra 服務的帳號：Quadra Securities、Quadra Play、Quadra Fixtures、Quadra Rewards，還有相關服務 Orbit Class。每個服務都一定要用 Quadra Pass 登入，資料都存在它裡面。',
        '通行碼就是鑰匙：知道它的人就能用這個帳號，所以不要給別人。通行碼只在建立或更換時顯示一次，裝置上不會保存，請自己記在安全的地方。',
        '在新裝置登入：輸入通行碼，或在已登入的裝置打開帳戶選單按「新增裝置」，取得 8 碼裝置代碼（10 分鐘內有效、只能用一次）來登入。'
      ]],
      ['money', '一個錢包', [
        '所有服務共用一個新台幣錢包（都是模擬的錢）。新帳號有 NT$110,000；之後每個月 1 日發薪 NT$7,000，那個月第一次打開任何一個服務時就會入帳，沒打開的月份下次打開時補發（帳戶選單的餘額下面有寫下次發薪日）。',
        'Securities 是讓錢長大的地方（投資）；Play 是錢會變少的地方（運彩和彩券平均都會輸）；Rewards 是靠努力賺錢的地方（背單字、小遊戲、每日任務）；Fixtures 只看資料不花錢。'
      ]],
      ['one', '一次只用一個服務', [
        '同一個通行碼一次只能在一個服務、一台裝置上使用。打開另一個服務（或在另一台裝置打開），原本那個會暫停並顯示「在別處使用中」，按一下就能拿回來。這樣資料不會互相蓋掉。',
        '在服務之間跳轉（例如從 Fixtures 按「到 Play 下注」）會自動帶著登入，不用再輸入通行碼。'
      ]],
      ['safe', '安全', [
        '伺服器只保存通行碼的雜湊值；裝置上只有會過期、可以撤銷的登入憑證，不會有通行碼本身。',
        '帳戶選單可以「登出其他所有裝置」（這台保持登入），或「更換通行碼」（新的只顯示一次，舊的立刻失效，其他裝置也會登出）。忘記通行碼時，在還登入的裝置更換一組就好。',
        '所有資料都只存在 Quadra Pass：沒有其他存檔方式，也不能在帳號之間轉錢。'
      ]]
    ],
    en: [
      ['what', 'What the Quadra Pass is', [
        'The Quadra Pass is a 10-character code: your account for every Quadra service, Quadra Securities, Quadra Play, Quadra Fixtures, Quadra Rewards, and the related Orbit Class. Every one of them needs it, and keeps its data on it.',
        'The code is the key: anyone who knows it can use the account, so keep it to yourself. It’s shown only when it’s made or changed and never kept on a device: write it down somewhere safe.',
        'On a new device, enter the pass, or on a signed-in device choose “Add a device” in the account menu for an 8-character device code (10 minutes, once).'
      ]],
      ['money', 'One wallet', [
        'All the services share one NT$ wallet (play money). A new pass starts with NT$110,000; then payday brings NT$7,000 on the 1st of every month, the first time that month you open any service; a month you miss is paid when you’re back (the account menu shows the next payday under your balance).',
        'Securities is where money grows (investing); Play is where it shrinks (sports bets and the lottery lose on average); Rewards is where effort earns it (words, mini games, daily missions); Fixtures is data only.'
      ]],
      ['one', 'One service at a time', [
        'A pass is used in one service on one device at a time. Opening another (or another device) pauses the first, which says it’s in use elsewhere; one tap takes it back. That way nothing overwrites anything.',
        'Links between the services (Bet in Play from Fixtures, say) arrive signed in.'
      ]],
      ['safe', 'Security', [
        'The server keeps only a hash of the code; devices keep only sign-ins that expire and can be revoked, never the code itself.',
        'The account menu can sign out every other device (this one stays in) or change the pass (the new one is shown once, the old one stops at once and other devices are signed out). Forgot it? Change it from a device that’s still signed in.',
        'Everything is saved on the Quadra Pass only: there’s no other way to save, and no moving money between passes.'
      ]]
    ]
  },
  stock: {
    zh: [
      ['start', '怎麼玩', [
        '用 Quadra Pass 錢包裡的新台幣投資全世界：股票、ETF、各國公債、共同基金、加密貨幣、黃金白銀存摺、外匯。錢是虛擬的，價格是真的。',
        '每種貨幣有自己的錢包：美股用美元、日股用日圓…下單時如果只有新台幣，會直接幫你換好剛好需要的金額（顯示在下單視窗的「需要」一行，連手續費和市價單保留的 3% 都算進去）。',
        '首頁有「為你推薦」和很多分類的標的；點一檔就能看走勢和下單。'
      ]],
      ['orders', '委託單', [
        '市價單：開盤時立刻用現價成交；休市時送出的會在開盤後第一個報價成交，所以會多保留 3% 的錢，成交後退回沒用到的部分。',
        '限價單：買進時價格到你的限價或更低才成交，賣出時到限價或更高才成交，沒成交前一直有效。',
        '停損 / 觸價單：價格跌破（賣）或漲破（買）觸發價時用市價成交。',
        '頁面關著也照樣算：下次打開時，用你不在期間的歷史價格找出第一個碰到你價格的時間成交。'
      ]],
      ['fx', '換匯', [
        '用市場中間價，再扣銀行價差（買賣價差的一半）。週末外匯休市，照樣能換，但價差加倍，跟真的銀行一樣。'
      ]],
      ['fees', '手續費與稅', [
        '台股是國內券商的一般費率（最低 20 元），海外是複委託的常見網路費率，各地的交易稅照當地規定。加密貨幣 0.1%。',
        '股利會照各國規定預扣稅；股利在除息日入帳權利，現金幾週後才真的入帳。'
      ]],
      ['more', '公債、融資、放空', [
        '公債有票面利率和到期日，價格跟殖利率反向；買進時要付應計利息，到期自動還本。',
        '可以用持股向券商借錢（融資）買更多，也可以放空股票、ETF 和加密貨幣。放空後總資產要至少是欠款的 150%，跌破 115% 會被強制處理。'
      ]],
      ['time', '時光機', [
        '在「紀錄」裡的時光機可以試算：如果幾年前投入一筆錢（或每月定期定額）到某個標的，現在會變多少，中間最大跌幅多少。'
      ]]
    ],
    en: [
      ['start', 'How it works', [
        'Invest the NT$ in your Quadra Pass wallet around the world: stocks, ETFs, government bonds, mutual funds, crypto, gold and silver passbooks, forex. The money is pretend; the prices are real.',
        'Each currency has its own wallet: US stocks in US$, Japanese in yen… If you only hold NT$, an order exchanges just what it needs (the ticket’s “Needed” line counts fees and the 3% a market order holds).',
        'Home has For you and many rows of ideas; tap anything for its chart and the order ticket.'
      ]],
      ['orders', 'Orders', [
        'Market: fills at once while the market is open; placed while it’s closed, at the first price after the open, holding 3% extra in case of a gap (the unused part comes back).',
        'Limit: a buy fills at your price or lower, a sell at your price or higher, until filled or cancelled.',
        'Stop: turns into a market order once the price falls through (sell) or rises through (buy) your stop.',
        'While the page is closed orders still count: next time, the price history of the time away finds the first moment that reached your price.'
      ]],
      ['fx', 'Exchange', [
        'The mid-market rate less the bank’s spread (half its buy–sell gap). At weekends the spread doubles, like a real bank.'
      ]],
      ['fees', 'Fees and taxes', [
        'Taiwan uses a local broker’s standard rate (at least NT$20); other markets a Taiwan broker’s usual online sub-brokerage rate, with each market’s own taxes. Crypto 0.1%.',
        'Dividends have each country’s withholding tax; you earn them on the ex-date, the cash arrives weeks later.'
      ]],
      ['more', 'Bonds, margin, shorting', [
        'Bonds have a coupon and a maturity, and their price moves against yields; buying pays accrued interest, and they repay at maturity.',
        'Borrow against your holdings to buy more, or sell stocks, ETFs and crypto short. After shorting, assets must stay at least 150% of what’s owed; under 115% the broker closes positions.'
      ]],
      ['time', 'Time machine', [
        'Under History, the time machine works out what a lump sum (or a monthly plan) put into anything years ago would be worth now, and its worst drop on the way.'
      ]]
    ]
  },
  odds: {
    zh: [
      ['what', 'Quadra Play 是什麼', [
        '用錢包裡的錢模擬台灣運動彩券和台灣彩券：各種運動的比賽、冠軍盤、F1 的各種玩法，還有 11 種電腦彩券和 6 種刮刮樂。',
        '賠率是用 DraftKings、Polymarket 等市場價格估算的運彩賠率；彩券開獎用台灣彩券的真實開獎號碼（沒有真實開獎的遊戲由系統開獎）。'
      ]],
      ['bet', '怎麼下注', [
        '點選項加到投注單，可以單場或串關，按「投注」送出。比賽結束後自動結算；延期或取消的比賽會退款。結算時會通知你。',
        '首頁的推薦會先看你在 Quadra Fixtures 追蹤的運動、聯賽和球隊。'
      ]],
      ['math', '為什麼長期一定輸', [
        '運彩每注大約抽 13%：每下 NT$100，平均拿回 NT$87。串越多關，抽成疊越多。',
        '彩券更少：電腦彩券平均只還約五到七成，刮刮樂約 58%。「差一點就中」是設計出來的感覺，不代表下次比較容易中。',
        'Play 是用來體驗和理解機率的，不是賺錢的地方。想讓錢變多，去 Securities 長期投資，或到 Rewards 靠努力賺。'
      ]],
      ['lottery', '彩券', [
        '大樂透、威力彩、今彩539、3星彩、4星彩、38樂合彩、39樂合彩、49樂合彩、BINGO BINGO、雙贏彩、大福彩；刮刮樂有 6 種。',
        '每個遊戲卡都能「快選 1 注」；打開遊戲可以自選號碼、按「加入這注」或「快選 5 注」一次買好幾注。',
        '「我的彩券」分成待開獎和已開獎，中獎自動入帳並通知你。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Play is', [
        'Simulated Taiwan Sports Lottery and Taiwan Lottery with your wallet’s money: matches in many sports, futures, lots of F1 markets, 11 number games and 6 scratch cards.',
        'Odds are sports-lottery prices estimated from DraftKings, Polymarket and other markets; lottery draws use Taiwan Lottery’s real numbers (games without a real draw are drawn by the app).'
      ]],
      ['bet', 'Placing bets', [
        'Tap picks onto the slip, as singles or a parlay, and place it. Bets settle after the game (with a notice); postponed or cancelled games are refunded.',
        'Home’s picks start from the sports, leagues and teams you follow in Quadra Fixtures.'
      ]],
      ['math', 'Why it loses in the long run', [
        'The sports lottery keeps about 13% of each bet: every NT$100 gets back NT$87 on average, and parlays stack the cut.',
        'The lottery gives back less: number games about 50–75%, scratch cards about 58%. A near miss is a feeling by design; it doesn’t make the next win likelier.',
        'Play is for seeing how odds work, not for making money. To grow money, invest in Securities or earn in Rewards.'
      ]],
      ['lottery', 'Lottery', [
        'Lotto 6/49, Super Lotto, Daily Cash 539, 3 and 4 Digits, the 38, 39 and 49 M games, BINGO BINGO, Lotto 12/24 and more, plus 6 scratch cards.',
        'Every game card has a one-tap quick pick; a game’s sheet lets you pick numbers and add several bets (or quick pick 5) to buy at once.',
        'My tickets shows those waiting and those drawn; winnings are paid automatically, with a notice.'
      ]]
    ]
  },
  match: {
    zh: [
      ['what', 'Quadra Fixtures 是什麼', [
        '所有支援運動的資料中心：比分、賽程、排名、球隊、球員，還有每場比賽的詳細數據（兩隊比較、逐局比分、球隊數據、球員數據、比賽過程、先發陣容、勝率走勢）。',
        'Quadra Play 有開賣的比賽會有「到 Play 下注」按鈕。'
      ]],
      ['follow', '追蹤與今日推薦', [
        '依喜好順序追蹤運動（第一個最優先），再選每種運動要追蹤的聯賽；球隊在比賽或球隊頁按「+ 追蹤」。「追蹤」分頁集中顯示它們的比賽、結果和排名。',
        '「今日推薦」依你的運動順序、追蹤的球隊、兩隊排名與實力差距、關鍵戰和你的習慣，排出看得完、不撞時間的一天。追蹤的球隊開賽和完賽會通知你；Play 的推薦也會用你的追蹤。'
      ]],
      ['use', '怎麼找', [
        '「比分」依運動和聯賽找比賽，日期列只顯示有比賽的日子（‹ › 看更早或更晚）；賽車、高爾夫、格鬥顯示目前這一站。「排名」可以選聯賽。點任何球隊、球員名字都能打開詳細資料。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Fixtures is', [
        'The data centre for every supported sport: scores, schedules, standings, teams, players, and each match’s details (the two sides compared, line score, team and player stats, plays, line-ups, win probability).',
        'Matches Quadra Play sells have a Bet in Play button.'
      ]],
      ['follow', 'Following, and today’s picks', [
        'Follow sports in order of priority (the first counts most), then the leagues in each; follow teams with “+ Follow” on a match or team. The Following tab gathers their games, results and tables.',
        'Today’s picks plan a day you can watch without clashes, from your sports’ order, your teams, both sides’ places and how even they are, big games and your habits. A followed team’s start and final score come as notices, and Play’s picks use your follows too.'
      ]],
      ['use', 'Finding things', [
        'Scores goes by sport and league; the date strip shows only days with games (‹ › for earlier or later). Racing, golf and fighting show the current event. Standings picks a league. Any team or player name opens its details.'
      ]]
    ]
  },
  vocab: {
    zh: [
      ['what', 'Quadra Rewards 是什麼', [
        'Quadra 的賺錢中心和說明中心：背單字、玩小遊戲、完成每日任務都能賺錢，錢直接進 Quadra Pass 的錢包；所有服務的說明也都在這裡。'
      ]],
      ['words', '背單字', [
        '大考中心高中英文參考詞彙表第 1 到 6 級，共 6,170 字。每一輪 10 個字，混合該複習的字和新字。',
        '學習方式：字卡、看英文選中文、看中文選英文、聽音選字、字母排序、聽寫拼字。「智慧」模式會依每個字的熟練度自動選擇：新字先認意思，越熟越難，最後用聽寫確認。',
        '答對一次升一格，答錯回到第一格；升到第 4 格算「精熟」。每個字會在該複習的時候再出現（1、3、7、21 天後）。',
        '每答對一題 NT$3，第一次精熟一個字再加 NT$25，一天最多 NT$600。字卡（自己判斷會不會）不算錢。'
      ]],
      ['games', '小遊戲', [
        '單字遊戲：單字配對、單字快配、猜單字。換換腦袋：2048、迷你數獨、顏色記憶、全壘打大賽、罰球。每局約一到一分半鐘，玩得越好賺越多，一天最多 NT$400。',
        '今日挑戰：每天指定一款遊戲，當天第一局有入帳就再加獎金（NT$10 起，連續幾天玩就多一點，最多 NT$40），算在遊戲的每日上限內。',
        '每款遊戲的最佳一局會記在「你的最佳紀錄」，跨裝置保留。'
      ]],
      ['missions', '每日任務', [
        '每天幾個小任務：背 20 題、精熟 3 個字、玩一局遊戲、在 Securities 交易或加入觀察、在 Fixtures 看一場比賽、在 Orbit Class 看今天的課表、打開三個服務。完成後按「領取」，一天最多 NT$300。',
        '每週目標（週一到週日）：5 天有練習、賺 NT$1,500、完成 10 個任務、玩 10 局遊戲，完成後領取，也算在任務的每日上限內。',
        '成就徽章記錄里程碑（精熟字數、連續天數、每種遊戲都玩過…），首頁還有每天換一個的「今日單字」。',
        '在帳號選單開啟通知後，任務或每週目標可以領取時、連續天數當晚快斷時會提醒你。'
      ]],
      ['rich', '財富等級', [
        '依錢包總額分成八個等級，從「起步」到「億萬」。最穩的方法：每天在 Rewards 賺一點，放進 Securities 長期投資，避開 Play 的抽成。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Rewards is', [
        'Quadra’s place to earn and to learn how things work: words, mini games and daily missions pay straight into your Quadra Pass wallet, and every service’s help lives here.'
      ]],
      ['words', 'Words', [
        'The high-school English reference list, levels 1 to 6: 6,170 words. Each round is 10 words, reviews due and new ones mixed.',
        'Ways to learn: flash cards, English → meaning, meaning → English, listen and pick, unscramble the letters, and dictation. Smart mode picks per word: meaning first for new words, harder as you know it, dictation to finish.',
        'A right answer moves a word up a box, a wrong one back to box 1; box 4 is mastered. Each word comes back when it’s due (1, 3, 7, 21 days).',
        'NT$3 a right answer, NT$25 more the first time a word is mastered, NT$600 a day at most. Flash cards (grading yourself) don’t pay.'
      ]],
      ['games', 'Mini games', [
        'Word games: word pairs, speed match and hangman. A break from words: 2048, mini sudoku, colour memory, home run derby and free throws. A minute or so a round; play well and it pays more, NT$400 a day at most.',
        'Today’s challenge: one game a day; its first paid round adds a bonus (from NT$10, a little more for each day in a row, up to NT$40), inside the games’ daily limit.',
        'Each game’s best round is kept under “Your bests”, on every device.'
      ]],
      ['missions', 'Daily missions', [
        'A few small things a day: 20 word answers, 3 words mastered, a game, a trade or watch in Securities, a match in Fixtures, today’s classes in Orbit Class, three services opened. Claim each when done, NT$300 a day at most.',
        'Weekly goals (Monday to Sunday): practise on 5 days, earn NT$1,500, finish 10 missions, play 10 games; claimed like missions, inside the same daily limit.',
        'Badges mark milestones (words mastered, days in a row, every game played…), and home shows a new word of the day every day.',
        'With notifications on (the account sheet), you’re told when a mission or weekly goal is ready to claim and when a streak is about to end tonight.'
      ]],
      ['rich', 'Wealth ranks', [
        'Eight ranks by your wallet’s total, from Starter to Tycoon. The steady way up: earn a little in Rewards every day, invest it in Securities for the long run, and skip Play’s cut.'
      ]]
    ]
  },
  orbit: {
    zh: [
      ['what', 'Orbit Class 是什麼', [
        'Quadra 的相關服務：課表。資料存在你的 Quadra Pass 裡，登入就能在任何裝置看到同一份課表。'
      ]],
      ['share', '分享課表', [
        '課表只有建立它的 Quadra Pass 能編輯。要分享時，按「產生分享金鑰」（24 小時內有效）給同學；對方在自己的 Orbit Class 輸入後，會得到一份自己的副本。',
        '每天在 Orbit Class 看課表，可以在 Rewards 領每日任務獎勵。'
      ]]
    ],
    en: [
      ['what', 'What Orbit Class is', [
        'Quadra’s related service for class schedules. It keeps your schedule on your Quadra Pass, so every device you sign in on shows the same one.'
      ]],
      ['share', 'Sharing a schedule', [
        'Only the Quadra Pass that made a schedule edits it. To share it, make a share key (valid 24 hours) for a classmate: entering it in their own Orbit Class gives them their own copy.',
        'Checking your classes in Orbit Class each day counts for a daily mission in Rewards.'
      ]]
    ]
  }
};

export function helpFor(app, lang = 'zh') {
  return HELP[app]?.[lang === 'en' ? 'en' : 'zh'] || [];
}
// '#help=stock:orders' → { app: 'stock', topic: 'orders' }.
export function parseHelpHash(hash) {
  const m = /(?:^|[#&])help=([a-z]+)(?::([a-z0-9]+))?/.exec(String(hash || ''));
  return m && HELP[m[1]] ? { app: m[1], topic: m[2] || null } : null;
}
