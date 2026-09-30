// The help centre: how every Quadra app works, in one place. Each app's
// page opens here with #help=<app> (helpUrl in quadra.mjs), or
// #help=<app>:<topic> for one topic.
//
// Every app's guide has the same shape, in the same words:
//   what    「X 是什麼」: its part in Quadra, in two or three lines
//   tabs    「每個分頁」: one line per tab, in the tab bar's order
//   …       what's particular to it (a few topics)
//   money   「錢怎麼算」: how it touches the one Quadra wallet
// (The Quadra Pass's own guide: what, account, one, safe, plus, money.)
//
// HELP[app][lang] = [[topic id, title, [paragraphs]], …]

export const HELP_ORDER = ['pass', 'stock', 'odds', 'match', 'vocab', 'orbit'];

export const HELP = {
  pass: {
    zh: [
      ['what', 'Quadra Pass 是什麼', [
        'Quadra Pass 是你在所有 Quadra App 的帳號：Quadra Securities、Quadra Play、Quadra Fixtures、Quadra Rewards，和相關的 Orbit Class。每個 App 都用它登入，資料都存在它裡面。',
        '通行碼是一組 10 個字的代碼，就是這個帳號的鑰匙：知道它的人就能用，所以不要給別人。它只在建立或更換時顯示一次，裝置上不會保存，請記在安全的地方。',
        '在新裝置登入：輸入通行碼，或在已登入的裝置打開帳戶，按「新增裝置」取得 8 碼裝置代碼（10 分鐘內、只能用一次）。'
      ]],
      ['account', '帳戶明細', [
        '每個 App 右上角的人像按鈕打開帳戶：帳號、開戶日期、Quadra 餘額、這個月的收入與支出，以及最近的明細（每一筆是哪個 App、做了什麼）。',
        '帳戶裡也能切換 App、新增裝置、開關通知和管理安全設定。'
      ]],
      ['one', '一次只用一個 App', [
        '同一個通行碼一次只在一個 App、一台裝置上使用。打開另一個 App（或另一台裝置），原本那個會暫停並顯示「在別處使用中」，按一下就能拿回來，資料不會互相蓋掉。',
        '從一個 App 跳到另一個（例如 Fixtures 的「到 Play 下注」）會自動帶著登入。'
      ]],
      ['safe', '安全', [
        '伺服器只保存通行碼的雜湊值；裝置上只有會過期、可以撤銷的登入憑證，不會有通行碼本身。',
        '帳戶裡可以「登出其他所有裝置」（這台保持登入），或「更換通行碼」（新的只顯示一次，舊的立刻失效）。忘記通行碼時，在還登入的裝置更換一組就好。'
      ]],
      ['plus', 'Quadra Plus 會員', [
        '一個會員、所有 Quadra App：月繳 NT$990（第一次加入的那個月免費），或年繳 NT$9,900，等於每月 NT$825、省下兩個月。從 Quadra 餘額扣款，在帳戶裡加入或管理；會員的帳戶按鈕有金色星星。',
        'Play：每天一張 NT$500 以內的投注獎金 +10%（多的部分在明細裡是「✦ Plus 獎金加成」）、每週一送 NT$100 免費投注、提前兌現只扣 2%（一般 5%）。Securities：手續費 2.8 折、換匯點差減半、融資利率少 1%、台幣活存 2%（一般 0.8%）。Rewards：單字包 5 折（買了永久保留）、每月一張連續紀錄保護卡。會員卡上會顯示本月回饋了多少。',
        '月繳隨時可以取消，已付的月份照常享有權益；年繳到期自動續約，也可以在「管理會員」取消續約。'
      ]],
      ['vip', 'VIP 投注回饋與新手禮', [
        'VIP 不用加入也不用付費：每個月在 Play 的投注（運彩、彩券、刮刮樂，退款不算）決定當月等級，下個月第一次打開 App 時回饋當月投注額的一部分：🥉 銅卡 NT$10,000 起 0.5%、🥈 銀卡 NT$50,000 起 0.8%、🥇 金卡 NT$150,000 起 1.2%、◆ 黑卡 NT$500,000 起 1.5%。Play 首頁的餘額卡上看得到本月等級和離下一級還差多少。',
        '新手禮：在 Play 第一次用自己的錢下注後，送一張 NT$200 免費投注（7 天內有效）；在 Securities 的第一筆交易免手續費（稅和規費照收）。'
      ]],
      ['money', '錢怎麼算', [
        '所有 App 共用一個新台幣錢包。新帳號開戶金 NT$30,000；每個月 1 日發津貼，依你的資產（現金加上 Securities 持股）：NT$4 萬以下 NT$8,000、10 萬以下 4,000、25 萬以下 1,500，再多是 500。開戶金和津貼是 Quadra 唯一會給的錢。那個月第一次打開任何 App 時入帳，沒打開的月份下次補發。',
        '餘額可以是負的（透支），每月計息 1%；到 Securities 賣出持股或用融資就能補足。',
        'Securities 投資、Play 下注和買彩券、Rewards 的單字、遊戲和任務給積分（XP）不給錢，只有加值商店會花錢；Fixtures 和 Orbit Class 不用錢。錢只存在 Quadra Pass，不能在帳號之間轉。'
      ]]
    ],
    en: [
      ['what', 'What the Quadra Pass is', [
        'The Quadra Pass is your account in every Quadra app: Quadra Securities, Quadra Play, Quadra Fixtures, Quadra Rewards and the related Orbit Class. Each signs in with it and keeps its data on it.',
        'The pass is a 10-character code, the key to the account: anyone who knows it can use it, so keep it to yourself. It’s shown only when it’s made or changed and never kept on a device: write it down somewhere safe.',
        'On a new device, enter the pass, or on a signed-in device open the account and choose “Add a device” for an 8-character device code (10 minutes, once).'
      ]],
      ['account', 'Account details', [
        'The person button at the top right of every app opens the account: its number, when it was opened, the Quadra balance, this month’s money in and out, and the latest entries (which app, what for).',
        'The account also switches apps, adds devices, turns notices on and off and holds the security settings.'
      ]],
      ['one', 'One app at a time', [
        'A pass is used in one app on one device at a time. Opening another app (or device) pauses the first, which says it’s in use elsewhere; one tap takes it back, so nothing overwrites anything.',
        'Going from one app to another (Bet in Play from Fixtures, say) arrives signed in.'
      ]],
      ['safe', 'Security', [
        'The server keeps only a hash of the pass; devices keep only sign-ins that expire and can be revoked, never the pass itself.',
        'The account can sign out every other device (this one stays in) or change the pass (the new one is shown once, the old one stops at once). Forgot it? Change it from a device that’s still signed in.'
      ]],
      ['plus', 'Quadra Plus', [
        'One membership for every Quadra app: NT$990 a month (the first month you ever join is free), or NT$9,900 a year, NT$825 a month with two months free. It comes from the Quadra balance; join or manage it in the account, and a member’s account button has a gold star.',
        'Play: +10% on the winnings of one slip a day up to NT$500 (the extra shows as “✦ Plus boost” in your statement), a NT$100 free bet every Monday, and cash out keeps 2% instead of 5%. Securities: commission at 28% of the usual rate, half the FX spread, loans 1 point cheaper, 2% on NT$ cash (0.8% otherwise). Rewards: word packs at half price (yours to keep) and a streak protection every month. The Plus card shows what it gave back this month.',
        'Monthly stops whenever you like, keeping the perks for months paid; yearly renews each year, and renewal can be turned off under Manage membership.'
      ]],
      ['vip', 'VIP cashback and welcome offers', [
        'VIP is free and needs no sign-up: what you stake in Play in a month (bets, lottery and scratch cards; refunds don’t count) sets that month’s tier, and a share of it comes back the first time you open an app the next month: 🥉 Bronze from NT$10,000 0.5%, 🥈 Silver from NT$50,000 0.8%, 🥇 Gold from NT$150,000 1.2%, ◆ Black from NT$500,000 1.5%. Play’s balance card shows this month’s tier and what’s left to the next.',
        'Welcome offers: your first bet in Play with your own money brings a NT$200 free bet (7 days), and your first trade in Securities pays no commission (taxes and fees as usual).'
      ]],
      ['money', 'Money', [
        'Every app shares one NT$ wallet. A new pass opens with NT$30,000; the 1st of every month brings an allowance by what you’re worth (cash plus Securities holdings): NT$8,000 under NT$40,000, 4,000 under 100,000, 1,500 under 250,000, 500 above. The opening money and the allowance are the only money Quadra gives. It’s paid the first time that month you open any app; a month you miss is paid when you’re back.',
        'The balance can go below zero (an overdraft) at 1% a month; selling holdings or borrowing in Securities covers it.',
        'Securities invests, Play bets and sells lottery tickets, Rewards gives points (XP) for words, games and missions, never money (only its shop spends); Fixtures and Orbit Class don’t use money. Money lives on the Quadra Pass only and can’t move between passes.'
      ]]
    ]
  },
  stock: {
    zh: [
      ['what', 'Quadra Securities 是什麼', [
        'Quadra 讓錢長大的地方：用錢包裡的新台幣投資全世界的股票、ETF、各國公債、共同基金、加密貨幣、黃金白銀存摺和外匯，價格都是真實市場價格。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：帳戶摘要、為你推薦、漲跌幅並排、各分類清單（每張 15 檔）和搜尋；點任何標的看走勢、公司資料和下單。',
        '「資產」：淨值與走勢、配置、持股、現金與各幣別錢包、股利利息收入、定期定額和到價提醒。',
        '「換匯・融資」：三個畫面：換匯（你付出／你會收到，兩邊都能輸入）、匯率看板、融資（已借、維持率、額度）。',
        '「紀錄」：每筆交易與異動、委託單、投資統計，以及「時光機」。'
      ]],
      ['orders', '委託單', [
        '市價單：開盤時立刻用現價成交；休市時送出的在開盤後第一個報價成交，會多保留 3%，沒用到的退回。',
        '限價單：買進到限價或更低、賣出到限價或更高才成交，沒成交前一直有效。停損／觸價單：價格穿過觸發價時用市價成交。',
        '頁面關著也照算：下次打開時，用你不在期間的歷史價格找出第一個碰到你價格的時間成交。'
      ]],
      ['fx', '換匯與外幣', [
        '每種貨幣有自己的錢包：美股用美元、日股用日圓…只有新台幣時，下單會直接換好剛好需要的金額。',
        '換匯用市場中間價再扣銀行價差；週末外匯休市照樣能換，但價差加倍，跟真的銀行一樣。'
      ]],
      ['more', '公債、融資、放空', [
        '公債有票面利率和到期日，價格跟殖利率反向；買進要付應計利息，到期自動還本。',
        '可以用持股借錢（融資），也可以放空股票、ETF 和加密貨幣。維持率跌破 130% 會追繳，跌破 115% 會被強制處理。'
      ]],
      ['time', '時光機', [
        '在「紀錄」試算：幾年前投入一筆錢（或每月定期定額）到某個標的，現在會變多少，中間最大跌幅多少。'
      ]],
      ['fees', '費用', [
        '台股手續費 0.1425%（最低 NT$20），賣出另收 0.3% 證交稅；美股、日股等海外市場照複委託常見網路費率。股利照各國規定預扣稅。',
        '換匯用市場中間價加減銀行價差；週末外匯休市時價差加倍。融資按天計息。',
        'Quadra Plus 會員手續費 2.8 折、點差減半、融資利率少 1%、台幣活存 2%。'
      ]],
      ['money', '錢怎麼算', [
        'Securities 的新台幣就是 Quadra 餘額：買進時從錢包出去，賣出時回來。手續費和稅照各市場真實規定（台股最低 NT$20，海外是複委託常見網路費率）；股利照各國規定預扣稅，除息日取得權利，幾週後現金入帳。',
        '定期定額和股利再投入，讓錢一點一點長大。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Securities is', [
        'Where Quadra’s money grows: invest the NT$ in your wallet in stocks, ETFs, government bonds, mutual funds, crypto, gold and silver passbooks and forex worldwide, at real market prices.'
      ]],
      ['tabs', 'The tabs', [
        'Home: your account at a glance, for you, gainers and losers side by side, lists by kind (15 each) and search; tap anything for its chart, company facts and the order ticket.',
        'Portfolio: net worth and its history, allocation, holdings, cash and each currency’s wallet, income, monthly plans and price alerts.',
        'FX & loans: three views: exchange (you pay / you get, type either), the rates board, and loans (borrowed, the ratio, the limit).',
        'History: every trade and change, orders, stats, and the time machine.'
      ]],
      ['orders', 'Orders', [
        'Market: fills at once while the market is open; placed while it’s closed, at the first price after the open, holding 3% extra (the unused part comes back).',
        'Limit: a buy fills at your price or lower, a sell at your price or higher, until filled or cancelled. Stop: a market order once the price passes your stop.',
        'Closed pages still count: next time, the price history of the time away finds the first moment that reached your price.'
      ]],
      ['fx', 'Exchange and currencies', [
        'Each currency has its own wallet: US stocks in US$, Japanese in yen… With only NT$, an order exchanges just what it needs.',
        'Exchange is the mid-market rate less the bank’s spread; at weekends it still works, at double the spread, like a real bank.'
      ]],
      ['more', 'Bonds, margin, shorting', [
        'Bonds have a coupon and a maturity, and their price moves against yields; buying pays accrued interest, and they repay at maturity.',
        'Borrow against holdings, or sell stocks, ETFs and crypto short. Under a 130% ratio the broker calls; under 115% it closes positions.'
      ]],
      ['time', 'Time machine', [
        'Under History: what a lump sum (or a monthly plan) put into anything years ago would be worth now, and its worst drop on the way.'
      ]],
      ['fees', 'Fees', [
        'Taiwan trades pay 0.1425% commission (NT$20 at least) and a sale 0.3% tax; US, Japanese and other markets a Taiwan broker’s usual online rate. Dividends have each country’s withholding.',
        'Exchange is the mid-market rate plus or minus the bank’s spread, doubled at weekends while FX markets are shut. Margin loans charge interest daily.',
        'Quadra Plus members pay 28% of the usual commission and half the spread, borrow 1 point cheaper and earn 2% on NT$ cash.'
      ]],
      ['money', 'Money', [
        'Securities’ NT$ is the Quadra balance: buying takes from the wallet, selling brings it back. Fees and taxes follow each market’s real rules (Taiwan at least NT$20; abroad a Taiwan broker’s usual online rate); dividends have each country’s withholding, earned on the ex-date, paid weeks later.',
        'Monthly plans and reinvested dividends grow money a little at a time.'
      ]]
    ]
  },
  odds: {
    zh: [
      ['what', 'Quadra Play 是什麼', [
        'Quadra 玩樂的地方：台灣運動彩券和台灣彩券的玩法。各種運動的比賽、冠軍盤、F1 玩法，還有電腦彩券和刮刮樂。',
        '運彩賠率由 DraftKings、Polymarket 等市場價格估算；彩券用台灣彩券的真實開獎號碼。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：餘額、各大聯賽的焦點比賽和賠率、你的投注（可以提前兌現）和彩券頭獎。',
        '「賽事」：每個運動、每場還沒開始的比賽和冠軍盤；點選項加入投注單。',
        '「彩券」：每種電腦彩券和刮刮樂，快選或自選。',
        '「投注單」：單場或串關，確認後送出。',
        '「紀錄」：投注和彩券的結果、統計分析。'
      ]],
      ['bet', '怎麼下注', [
        '點選項加到投注單，單場或串關，按「投注」送出。比賽結束自動結算；延期或取消的比賽會退款。結算時會通知你。'
      ]],
      ['lottery', '彩券', [
        '大樂透、威力彩、今彩539、3星彩、4星彩、38／39／49樂合彩、BINGO BINGO、雙贏彩、大福彩，和 6 種刮刮樂。每張遊戲卡都能「快選 1 注」，打開可以自選或快選 5 注。中獎自動入帳並通知你。'
      ]],
      ['boost', '串關加成與提前兌現', [
        '串關加成：3 場以上的串關全過時多給獎金，3 場 +5%、4 場 +8%、5 場 +12%、6 場 +15%、7 場以上 +20%。',
        '提前兌現：比賽還沒結束也能先把投注單換成現金，金額依目前賠率計算，扣 5%（Plus 扣 2%）。',
        '首頁的「精選串關」幫你挑好大聯賽的熱門組合，一鍵加到投注單。',
        '免費投注：Plus 會員每週的免費投注和新手禮，在投注單上點一下就用在這張單（串關或單一選項），不扣本金，贏了拿獎金（不含本金），7 天內有效；不能提前兌現。'
      ]],
      ['money', '錢怎麼算', [
        '下注和買彩券從錢包扣款，中獎自動入帳並通知你。彩券中獎超過 NT$5,000 照規定扣 20% 所得稅和 0.4% 印花稅。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Play is', [
        'Quadra’s place to play: the Taiwan Sports Lottery’s and Taiwan Lottery’s games. Matches in many sports, futures, F1 markets, number games and scratch cards.',
        'Odds are estimated from DraftKings, Polymarket and other markets; the lottery uses Taiwan Lottery’s real draws.'
      ]],
      ['tabs', 'The tabs', [
        'Home: the balance, featured big-league games with prices, your bets (with cash out) and the lottery jackpots.',
        'Games: every sport, every match not yet started and the futures; tap a pick to add it to the slip.',
        'Lottery: every number game and scratch card, quick pick or your own numbers.',
        'Slip: singles or a parlay, placed when you confirm.',
        'History: bet and ticket results, and stats.'
      ]],
      ['bet', 'Placing bets', [
        'Tap picks onto the slip, as singles or a parlay, and place it. Bets settle after the game (with a notice); postponed or cancelled games are refunded.'
      ]],
      ['lottery', 'Lottery', [
        'Lotto 6/49, Super Lotto, Daily Cash 539, 3 and 4 Digits, the 38, 39 and 49 M games, BINGO BINGO, Lotto 12/24 and more, and 6 scratch cards. Every card has a one-tap quick pick; open one to pick numbers or quick pick 5. Winnings are paid automatically, with a notice.'
      ]],
      ['boost', 'Parlay boost and cash out', [
        'Parlay boost: a winning parlay of 3 or more legs pays extra: +5% for 3, +8% for 4, +12% for 5, +15% for 6, +20% for 7 or more.',
        'Cash out: turn a slip into cash before the games end, priced at the current odds less 5% (2% with Plus).',
        'Featured parlays on the home screen put together big-league picks, added to the slip in one tap.',
        'Free bets: Plus’s weekly one and the welcome offer; tap one on the slip to use it on that slip (a parlay or one pick). Nothing comes off your balance, a win pays the winnings (not the stake), and it lasts 7 days; no cash out.'
      ]],
      ['money', 'Money', [
        'Bets and tickets come out of the wallet, and winnings go straight back in, with a notice. Lottery prizes over NT$5,000 have 20% tax and 0.4% stamp duty taken, as the rules say.'
      ]]
    ]
  },
  match: {
    zh: [
      ['what', 'Quadra Fixtures 是什麼', [
        'Quadra 的運動資料中心：所有運動的比分、賽程、排名、球隊和球員，每場比賽的詳細數據，還有依你追蹤的運動排好的推薦。Play 有開賣的比賽有「到 Play 下注」。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：選一天（前三天到下週），當天每場比賽依你的喜好排好：先是不撞時間的精選，再來是其他比賽；可以只看追蹤的、你的球隊或某個運動。',
        '「賽事」：依運動和聯賽找比賽，打開就在離現在最近的比賽日；季後賽、季前賽、盃賽可以篩選。賽車、高爾夫、網球、格鬥顯示整季賽程。',
        '「直播」：現在進行中的比賽，和三小時內開打的。',
        '「追蹤」：你的運動、聯賽、球隊和選手的比賽、結果和排名。',
        '右上角：說明、重新整理和你的 Quadra Pass；再點一次目前的分頁會回到頂端。'
      ]],
      ['follow', '追蹤', [
        '依喜好順序追蹤運動（第一個最優先），再選每種運動的聯賽；球隊在比賽或球隊頁按「+ 追蹤」，網球、高爾夫、F1、UFC 的選手在選手頁追蹤。追蹤的球隊開賽和完賽會通知你；Play 的推薦也用你的追蹤。'
      ]],
      ['watch', '台灣轉播', [
        '比賽頁和推薦卡片會列出台灣可以收看的頻道與平台（愛爾達、緯來、DAZN、博斯、各聯盟的官方訂閱…）。轉播權會變動，以各平台公告為準。'
      ]],
      ['play', '到 Play 下注', [
        'Play 有開賣的比賽，旁邊有「投注」（進行中是「場中」）小按鈕，比賽頁有「到 Play 下注」：一點就到 Play 的那場比賽，已經登入。'
      ]],
      ['money', '錢怎麼算', [
        'Fixtures 不用錢：看比賽、追蹤都免費。每天打開一場比賽可以完成 Rewards 的每日任務。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Fixtures is', [
        'Quadra’s sports data centre: every sport’s scores, schedules, tables, teams and players, each match’s details, and picks ranked by what you follow. Matches Play sells have Bet in Play.'
      ]],
      ['tabs', 'The tabs', [
        'Home: pick a day (three days back to a week ahead): every match of it, ranked for you, a no-clash plan first, then the rest; narrow it to what you follow, your teams or one sport.',
        'Matches: by sport and league, opening on the game day nearest to now; filter playoffs, preseason or cups. Racing, golf, tennis and fighting show the whole season.',
        'Live: everything in progress now, and what starts in the next three hours.',
        'Following: your sports, leagues, teams and players: their games, results and tables.',
        'Top right: help, refresh and your Quadra Pass; tap the open tab again to go back to its top.'
      ]],
      ['follow', 'Following', [
        'Follow sports in order of priority (the first counts most), then leagues in each; follow teams with “+ Follow” on a match or team page, and tennis, golf, F1 and UFC players on their page. A followed team’s start and final score come as notices, and Play’s picks use your follows too.'
      ]],
      ['watch', 'Watching in Taiwan', [
        'Match pages and pick cards list where to watch in Taiwan (ELTA, Videoland, DAZN, Sportcast, league passes…). Rights change; each service’s own listings are the final word.'
      ]],
      ['play', 'Betting in Play', [
        'Games Play sells have a small Bet chip (Live while in play), and a game page has “Bet in Play”: one tap opens that game in Play, signed in.'
      ]],
      ['money', 'Money', [
        'Fixtures is free: watching and following cost nothing. Opening a match each day completes a daily mission in Rewards.'
      ]]
    ]
  },
  vocab: {
    zh: [
      ['what', 'Quadra Rewards 是什麼', [
        'Quadra 獎勵努力的地方：背單字、玩遊戲、完成每日任務，拿積分（XP）、連續紀錄和徽章。積分不是錢，Rewards 不發錢。所有 App 的說明也都在這裡。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：今天的積分、今日挑戰、接下來的任務、加值（保護卡、單字加倍、Plus）和今日單字。',
        '「單字」：選級別或單字包和學習方式，開始一輪。',
        '「遊戲」：單字遊戲、長局、謎題、動作、棋盤、腦力，可以搜尋和加入最愛；每天有一款今日挑戰。',
        '「任務」：每日任務、每週目標、徽章和財富等級；完成待領取的數量會標在分頁上。',
        '右上角的「?」：每個 Quadra App 的說明（就是這裡）。'
      ]],
      ['words', '背單字', [
        '大考中心高中英文參考詞彙第 1 到 6 級，共 6,170 字，每個字都有真人發音錄音（Microsoft Jenny）。每一輪 10、20 或 30 個字，混合該複習的字和新字；答錯的字會在這一輪最後再問一次。',
        '「智慧」模式依熟練度出題：新字先認意思，接著看中文選英文、聽音選字、字母排序，最後聽寫。',
        '答對升一格、答錯回第一格，第 4 格算「精熟」，該複習時再出現（1、2、5、14 天後）。第一次見到就答對的字代表你本來就會，直接跳到第 3 格，再答對一次就精熟。'
      ]],
      ['games', '遊戲', [
        '103 款遊戲，分成單字、邏輯、益智、動作、反應、棋類、牌類、記憶和數字九類。遊戲頁一排排瀏覽，點「全部」看整類，也能搜尋或加入最愛；一局結束會推薦接著玩的遊戲。',
        '短局一到兩分鐘；「長局」（數獨、接龍、新接龍、蜘蛛接龍、大盤踩地雷、跳棋）和找單字要十分鐘以上，玩得越好積分越多。',
        '遊戲開始後佔滿整個畫面，不會捲動；右上角的「?」隨時看玩法。',
        '今日挑戰：當天第一局有得分就加積分（5 XP 起，連續幾天多一點，最多 20 XP）。每款遊戲的最佳紀錄跨裝置保留。'
      ]],
      ['missions', '每日任務與每週目標', [
        '每天幾個小任務（背 20 題、精熟 3 個字、玩一局遊戲、在 Securities 交易或加入觀察、在 Fixtures 看一場比賽、在 Orbit Class 看課表、打開三個 App），在 Play 串 3 場以上、買一張刮刮樂、在 Securities 設定新的定期定額，完成後按「領取」拿積分。',
        '每週目標（週一到週日）：5 天有練習、單字和遊戲拿 1,000 XP、完成 10 個任務、玩 10 局遊戲。開啟通知後，可以領取時和連續天數快斷時會提醒你。'
      ]],
      ['extras', '加值', [
        '連續紀錄保護卡（NT$300，最多持有 3 張）：哪天沒練習也沒玩遊戲，它會自動用掉一張，連續紀錄照樣算下去。Plus 會員每月送一張。',
        '單字加倍（NT$150）：接下來 30 分鐘每題單字積分 ×2；在加倍中再買，會接在後面再延 30 分鐘。',
        '單字包（「單字」分頁）：多益 TOEIC NT$990、雅思 IELTS NT$1,490、商務英文 NT$1,990，一次買斷，每個字都有真人發音。買了就和級別一樣可以勾選；和主單字表重複的字共用進度，答對一樣有積分。Plus 會員 5 折。'
      ]],
      ['money', '積分怎麼算', [
        '單字每答對一題 2 XP，第一次精熟一個字再加 15 XP（字卡不算）；遊戲一分鐘大約 10 XP，玩得好更多；任務 10–30 XP、每週目標 30–45 XP。積分沒有上限，會算進每週目標和徽章；它不是錢，不能花。',
        '錢只有開戶金和每月津貼（在 Quadra Pass 的說明裡）；在 Rewards 花錢的只有加值商店。',
        '財富等級依錢包總額分成八級，從「起步」（NT$5 萬以下）到「億萬」（NT$2,000 萬以上）。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Rewards is', [
        'Where Quadra rewards effort: words, games and daily missions earn points (XP), streaks and badges. Points aren’t money: Rewards pays none. Every app’s help lives here too.'
      ]],
      ['tabs', 'The tabs', [
        'Home: today’s points, today’s challenge, the next missions, extras (streak protection, word points ×2, Plus) and the word of the day.',
        'Words: pick levels or word packs and a way to learn, and start a round.',
        'Games: word games, long games, puzzles, action, board and brain games, with search and favourites; one game a day is today’s challenge.',
        'Missions: daily missions, weekly goals, badges and your wealth rank; the tab shows how many are ready to claim.',
        'The ? at the top right: every Quadra app’s guide (this page).'
      ]],
      ['words', 'Words', [
        'The high-school English reference list, levels 1 to 6: 6,170 words, each with a recording (Microsoft’s Jenny voice). A round is 10, 20 or 30 words, reviews and new ones mixed; a missed word comes back once at the end of the round.',
        'Smart mode asks by how well you know a word: its meaning first, then meaning → word, by ear, unscrambling, and dictation last.',
        'Right moves a word up a box, wrong back to box 1; box 4 is mastered, and each word returns when due (1, 2, 5, 14 days). A new word right the first time is one you know: it jumps to box 3, and one more right answer masters it.'
      ]],
      ['games', 'Games', [
        '103 games in nine kinds: words, logic, puzzles, action, reflex, board, cards, memory and numbers. Browse them row by row, open a whole kind with See all, search, or keep favourites; a finished round suggests what to play next.',
        'Short games take a minute or two; the long ones (sudoku, solitaire, FreeCell, Spider, big minesweeper, checkers) and word search ten minutes or more. Play well and they give more points.',
        'A game in play has the whole screen and nothing scrolls; the ? at the top shows how to play.',
        'Today’s challenge: its first round that scores adds a bonus (from 5 XP, a little more each day in a row, up to 20 XP). Each game’s best is kept on every device.'
      ]],
      ['missions', 'Missions and weekly goals', [
        'A few small things a day (20 word answers, 3 words mastered, a game, a trade or watch in Securities, a match in Fixtures, your classes in Orbit Class, three apps opened, a parlay of 3 or more in Play, a scratch card, a new monthly plan in Securities); claim each for its points when done.',
        'Weekly goals (Monday to Sunday): practise on 5 days, 1,000 XP from words and games, finish 10 missions, play 10 games. With notices on, you’re told when there’s something to claim and when a streak is about to end.'
      ]],
      ['extras', 'Extras', [
        'Streak protection (NT$300, hold up to 3): on a day with no practice and no game, one is used by itself and the streak goes on. Plus members get one every month.',
        'Word points ×2 (NT$150): every word earns double points for the next 30 minutes; one bought during another runs 30 minutes after it.',
        'Word packs (in Words): TOEIC NT$990, IELTS NT$1,490, Business English NT$1,990, bought once, every word recorded. Once yours, pick a pack like a level; words the main list shares keep one progress, and right answers earn points as usual. Half price for Plus members.'
      ]],
      ['money', 'Points', [
        'Words: 2 XP a right answer, 15 XP more for a first mastery (flash cards give none); games about 10 XP a minute, more when you play well; missions 10–30 XP, weekly goals 30–45 XP. Points have no daily limit and count towards weekly goals and badges; they aren’t money and can’t be spent.',
        'Money comes only from the opening money and the monthly allowance (see Quadra Pass); in Rewards only the shop spends it.',
        'Eight wealth ranks by the wallet’s total, from Starter (under NT$50,000) to Tycoon (NT$20 million and up).'
      ]]
    ]
  },
  orbit: {
    zh: [
      ['what', 'Orbit Class 是什麼', [
        'Quadra 的相關 App：課表。打開就知道現在是哪一節、還剩幾分鐘、下一節是什麼。課表存在 Quadra Pass，登入的每台裝置都一樣。'
      ]],
      ['tabs', '畫面', [
        '主畫面：目前這一節、倒數和下一節；下面是今天的全部課程，點一節看詳細資料。',
        '設定面板：新增或修改課表，也可以拍課表照片讓 AI 匯入，或用一句話請 AI 修改；外觀和備份也在這裡。'
      ]],
      ['share', '分享課表', [
        '課表只有建立它的 Quadra Pass 能編輯。要分享時按「產生分享金鑰」（24 小時內有效），對方在自己的 Orbit Class 輸入就得到一份自己的副本。'
      ]],
      ['money', '錢怎麼算', [
        'Orbit Class 不用錢。每天看課表可以完成 Rewards 的每日任務。'
      ]]
    ],
    en: [
      ['what', 'What Orbit Class is', [
        'Quadra’s related app for class schedules: open it to see the period now, the minutes left and what’s next. The schedule lives on your Quadra Pass, the same on every device you sign in on.'
      ]],
      ['tabs', 'The screens', [
        'The main screen: the current period, its countdown and the next; below, the whole day, each period tappable for details.',
        'The settings panel: add or change the schedule, import it from a photo with AI or change it in a sentence; appearance and backups too.'
      ]],
      ['share', 'Sharing a schedule', [
        'Only the Quadra Pass that made a schedule edits it. To share it, make a share key (valid 24 hours): entering it in their own Orbit Class gives a classmate their own copy.'
      ]],
      ['money', 'Money', [
        'Orbit Class is free. Checking your classes each day completes a daily mission in Rewards.'
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
