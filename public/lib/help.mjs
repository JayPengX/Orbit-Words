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
        '一個會員、所有 Quadra App：每月 NT$290，從 Quadra 餘額扣款，第一次加入的那個月免費，隨時可以取消（用到月底）。在帳戶裡加入或管理；會員的帳戶按鈕有金色星星。',
        'Securities：手續費 5 折、換匯點差減半、融資利率少 1%、台幣活存 2%（一般 0.8%）。Play：串關加成加倍、提前兌現只扣 2%（一般 5%）。',
        '划不划算看你用多少：Securities 要每月交易量很大才回本，Play 的加成再多也還是輸。Rewards 的「說明」裡每個 App 的「它怎麼賺你的錢」有算給你看。'
      ]],
      ['money', '錢怎麼算', [
        '所有 App 共用一個新台幣錢包（都是模擬的錢）。新帳號有 NT$110,000；每個月 1 日發薪 NT$7,000，那個月第一次打開任何 App 時入帳，沒打開的月份下次補發。',
        'Securities 讓錢長大（投資）；Play 讓錢變少（運彩和彩券平均都會輸）；Rewards 靠努力賺錢（單字、遊戲、任務）；Fixtures 和 Orbit Class 不用錢。錢只存在 Quadra Pass，不能在帳號之間轉。'
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
        'One membership for every Quadra app: NT$290 a month from the Quadra balance, the first month you ever join free, cancel any time (it lasts to the end of the month). Join or manage it in the account; a member’s account button has a gold star.',
        'Securities: half commission, half the FX spread, loans 1 point cheaper, 2% on NT$ cash (0.8% otherwise). Play: the parlay boost doubled, and cash out keeps 2% instead of 5%.',
        'Whether it pays depends on use: Securities needs a lot of trading each month to earn the fee back, and Play still loses with the bigger boost. Each app’s “How it makes money from you” in Rewards’ help works it out.'
      ]],
      ['money', 'Money', [
        'Every app shares one NT$ wallet (play money). A new pass starts with NT$110,000; payday brings NT$7,000 on the 1st of every month, the first time that month you open any app; a month you miss is paid when you’re back.',
        'Securities grows money (investing); Play shrinks it (sports bets and the lottery lose on average); Rewards earns it with effort (words, games, missions); Fixtures and Orbit Class don’t use it. Money lives on the Quadra Pass only and can’t move between passes.'
      ]]
    ]
  },
  stock: {
    zh: [
      ['what', 'Quadra Securities 是什麼', [
        'Quadra 讓錢長大的地方：用錢包裡的新台幣投資全世界的股票、ETF、各國公債、共同基金、加密貨幣、黃金白銀存摺和外匯。錢是模擬的，價格是真的。'
      ]],
      ['tabs', '每個分頁', [
        '「市場」：帳戶摘要、為你推薦、漲跌幅並排、各分類清單（每張 15 檔）和搜尋；點任何標的看走勢、公司資料和下單。',
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
      ['truth', '它怎麼賺你的錢', [
        '券商靠你交易賺錢，不是靠你賺錢：每一筆買賣都收手續費（台股 0.1425%，最低 NT$20），賣出再收 0.3% 證交稅；美股、日股的手續費更高。漲幅榜、熱門排行和為你推薦，都是為了讓你多交易。',
        'Quadra Plus（每月 NT$290）手續費 5 折、點差減半，聽起來很划算，但要每月手續費超過 NT$580 才回本，也就是台股每月買賣約 NT$40 萬；活存 2% 比一般多 1.2%，要放著約 NT$29 萬現金才抵得過月費。「每筆都在省錢」的感覺，本身就會讓人交易得更多。第一個月免費，是為了讓你習慣它。',
        '換匯的「銀行賣」和「銀行買」之間的差價就是費用，換過去再換回來，錢就少一截。',
        '融資借款按天收利息，而且放大的不只是獲利：跌到維持率不夠會被強制賣出（斷頭），賠的比自己的本金還多。',
        '長期來說，大多數人的報酬輸給「買一檔指數 ETF 放著不動」：手續費、稅、價差和追高殺低一點一點吃掉報酬。分析師的目標價常常猜錯，而且大多偏樂觀。'
      ]],
      ['money', '錢怎麼算', [
        'Securities 的新台幣就是 Quadra 餘額：買進時從錢包出去，賣出時回來。手續費和稅照各市場真實規定（台股最低 NT$20，海外是複委託常見網路費率）；股利照各國規定預扣稅，除息日取得權利，幾週後現金入帳。',
        '長期分散投資是讓錢變多最穩的方法。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Securities is', [
        'Where Quadra’s money grows: invest the NT$ in your wallet in stocks, ETFs, government bonds, mutual funds, crypto, gold and silver passbooks and forex worldwide. The money is pretend; the prices are real.'
      ]],
      ['tabs', 'The tabs', [
        'Markets: your account at a glance, for you, gainers and losers side by side, lists by kind (15 each) and search; tap anything for its chart, company facts and the order ticket.',
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
      ['truth', 'How it makes money from you', [
        'A broker earns from your trading, not your gains: every buy and sell pays a commission (0.1425% in Taiwan, NT$20 at least), a sale also 0.3% tax, and US and Japanese trades cost more. The movers, most-traded and “for you” rows are there to make you trade more.',
        'Quadra Plus (NT$290 a month) halves commission and the FX spread, which sounds like a deal, but it only pays for itself once your commission tops NT$580 a month: about NT$400,000 of Taiwan trades. The 2% on cash (1.2 points more) needs about NT$290,000 sitting idle to cover the fee. Feeling that every trade saves money is itself what makes people trade more; the free first month is there to make it a habit.',
        'The gap between the bank’s selling and buying rates is the FX fee: change money there and back and some of it is gone.',
        'Margin loans charge interest every day, and they magnify losses as well as gains: fall below the maintenance ratio and your holdings are sold for you, possibly losing more than you put in.',
        'Over the long run most people do worse than simply buying one index ETF and leaving it: commissions, taxes, spreads and buying high and selling low eat the returns. Analysts’ price targets are often wrong, and mostly too optimistic.'
      ]],
      ['money', 'Money', [
        'Securities’ NT$ is the Quadra balance: buying takes from the wallet, selling brings it back. Fees and taxes follow each market’s real rules (Taiwan at least NT$20; abroad a Taiwan broker’s usual online rate); dividends have each country’s withholding, earned on the ex-date, paid weeks later.',
        'Investing widely for the long run is the steadiest way to grow money.'
      ]]
    ]
  },
  odds: {
    zh: [
      ['what', 'Quadra Play 是什麼', [
        'Quadra 玩樂的地方：模擬台灣運動彩券和台灣彩券。各種運動的比賽、冠軍盤、F1 玩法，還有電腦彩券和刮刮樂。',
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
      ['truth', '它怎麼賺你的錢', [
        '運彩的賠率比真實機率低：兩選一的玩法每下 NT$100，長期平均只拿回約 NT$86；足球不讓分約 83；比分、最高單局這類更少。依法運彩的獎金支出不能超過銷售額的 78%。',
        '串關每多一場就再被抽一次：2 關平均回約 75，3 關約 64，5 關不到 50。賠率偏低的選項「限過關」，就是逼你串關。',
        '彩券抽得更多：電腦彩券每 NT$100 平均回 50–60，刮刮樂 63–75（越貴的越高）；中獎超過 NT$5,000 還要扣 20% 稅和 0.4% 印花稅。',
        '「串關加成」是讓你多串幾關的誘餌：3 關加 5%，NT$100 平均從約 64 變成約 66；就算串到 7 關加 20%，也只從 38 變成約 45。Plus 會員加倍，3 關約 71、7 關約 53，還是輸。',
        '「提前兌現」用莊家自己的賠率（已含抽成）算你這張單現在值多少，再扣 5%（Plus 扣 2%）：怕輸想先拿錢，等於再付一次手續費。',
        '首頁的焦點比賽、頭獎金額和 Fixtures 每場比賽旁的「投注」小按鈕，都是要你多下注。短期會有人贏，但下得越久，結果越接近上面那些平均：幾乎每個長期下注的人都是輸的。'
      ]],
      ['money', '錢怎麼算', [
        '下注和買彩券從錢包扣款，中獎自動入帳。運彩每注平均抽約 13%（NT$100 平均拿回 NT$87），串越多關抽成疊越多；電腦彩券平均只還五到七成，刮刮樂約 58%。',
        'Play 是體驗和理解機率的地方，長期一定會輸；想讓錢變多，去 Securities 投資或到 Rewards 賺。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Play is', [
        'Quadra’s place to play: a simulated Taiwan Sports Lottery and Taiwan Lottery. Matches in many sports, futures, F1 markets, number games and scratch cards.',
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
      ['truth', 'How it makes money from you', [
        'The odds pay less than the real chances: on a two-way market every NT$100 brings back about NT$86 in the long run, soccer’s win-draw-win about 83, correct scores and top innings less. By law the Sports Lottery can pay out at most 78% of what it sells.',
        'Every extra game in a parlay is cut again: 2 legs return about 75, 3 about 64, 5 under 50. Short prices sold only in parlays (限過關) are there to push you into them.',
        'The lottery takes more: draw games return 50–60 per NT$100, scratch cards 63–75 (dearer ones more), and prizes over NT$5,000 lose 20% tax and 0.4% stamp duty.',
        'The parlay boost is bait to add more legs: +5% on 3 legs moves NT$100 from about 64 back to about 66; even 7 legs at +20% only go from 38 to about 45. Plus doubles it (about 71 and 53): still a loss.',
        'Cash out prices your slip with the house’s own odds (its cut included) and then keeps 5% (2% with Plus): taking the money early out of fear pays the house again.',
        'The featured games and jackpots on the home screen, and the small Bet chip beside every game in Fixtures, are there to make you bet more. Some people win for a while, but the longer you bet the closer you get to those averages: almost everyone who bets for long loses.'
      ]],
      ['money', 'Money', [
        'Bets and tickets come out of the wallet, and winnings go straight back in. The sports lottery keeps about 13% of each bet (NT$100 returns NT$87 on average), more in parlays; number games return about 50–75%, scratch cards about 58%.',
        'Play is for seeing how odds work, and it loses in the long run; to grow money, invest in Securities or earn in Rewards.'
      ]]
    ]
  },
  match: {
    zh: [
      ['what', 'Quadra Fixtures 是什麼', [
        'Quadra 的運動資料中心：所有運動的比分、賽程、排名、球隊和球員，每場比賽的詳細數據，還有依你追蹤的運動排好的推薦。Play 有開賣的比賽有「到 Play 下注」。'
      ]],
      ['tabs', '每個分頁', [
        '「推薦」：選一天（前三天到下週），當天每場比賽依你的喜好排好：先是不撞時間的精選，再來是其他比賽；可以只看追蹤的、你的球隊或某個運動。',
        '「賽事」：依運動和聯賽找比賽，打開就在離現在最近的比賽日；季後賽、季前賽、盃賽可以篩選。賽車、高爾夫、網球、格鬥顯示整季賽程。',
        '「直播」：現在進行中的比賽，和三小時內開打的。',
        '「追蹤」：你的運動、聯賽、球隊和選手的比賽、結果和排名。',
        '「排名」：每個聯賽的排名，含與第一名的差距（積分或勝差）。'
      ]],
      ['follow', '追蹤', [
        '依喜好順序追蹤運動（第一個最優先），再選每種運動的聯賽；球隊在比賽或球隊頁按「+ 追蹤」，網球、高爾夫、F1、UFC 的選手在選手頁追蹤。追蹤的球隊開賽和完賽會通知你；Play 的推薦也用你的追蹤。'
      ]],
      ['watch', '台灣轉播', [
        '比賽頁和推薦卡片會列出台灣可以收看的頻道與平台（愛爾達、緯來、DAZN、博斯、各聯盟的官方訂閱…）。轉播權會變動，以各平台公告為準。'
      ]],
      ['truth', '它怎麼賺你的錢', [
        'Fixtures 本身不收錢，它是 Play 的櫥窗：每場有開賣的比賽旁都有一顆安靜的「投注」／「場中」小按鈕，比賽頁有「到 Play 下注」。做得越低調、越像資訊的一部分，越不會讓人警覺，目的都是把看比賽變成下注。'
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
        'For you: pick a day (three days back to a week ahead): every match of it, ranked for you, a no-clash plan first, then the rest; narrow it to what you follow, your teams or one sport.',
        'Matches: by sport and league, opening on the game day nearest to now; filter playoffs, preseason or cups. Racing, golf, tennis and fighting show the whole season.',
        'Live: everything in progress now, and what starts in the next three hours.',
        'Following: your sports, leagues, teams and players: their games, results and tables.',
        'Tables: every league’s table, with the gap to the top (points or games behind).'
      ]],
      ['follow', 'Following', [
        'Follow sports in order of priority (the first counts most), then leagues in each; follow teams with “+ Follow” on a match or team page, and tennis, golf, F1 and UFC players on their page. A followed team’s start and final score come as notices, and Play’s picks use your follows too.'
      ]],
      ['watch', 'Watching in Taiwan', [
        'Match pages and pick cards list where to watch in Taiwan (ELTA, Videoland, DAZN, Sportcast, league passes…). Rights change; each service’s own listings are the final word.'
      ]],
      ['truth', 'How it makes money from you', [
        'Fixtures costs nothing itself: it’s Play’s shop window. A quiet Bet / Live chip sits beside every game Play sells, and a game page has “Bet in Play”. The more it looks like part of the information, the less it feels like an ad, and it’s all there to turn watching into betting.'
      ]],
      ['money', 'Money', [
        'Fixtures is free: watching and following cost nothing. Opening a match each day completes a daily mission in Rewards.'
      ]]
    ]
  },
  vocab: {
    zh: [
      ['what', 'Quadra Rewards 是什麼', [
        'Quadra 靠努力賺錢的地方：背單字、玩遊戲、完成每日任務，錢直接進錢包。所有 App 的說明也都在這裡。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：今天賺了多少、今日單字、每日任務、每週目標、徽章和財富等級。',
        '「單字」：選級別和學習方式，開始一輪。',
        '「遊戲」：單字遊戲、長局、謎題、動作、棋盤、腦力，可以搜尋和加入最愛；每天有一款今日挑戰。',
        '「說明」：每個 Quadra App 的說明（就是這裡）。'
      ]],
      ['words', '背單字', [
        '大考中心高中英文參考詞彙第 1 到 6 級，共 6,170 字，每個字都有真人發音錄音（Microsoft Jenny）。每一輪 10、20 或 30 個字，混合該複習的字和新字；答錯的字會在這一輪最後再問一次。',
        '「智慧」模式依熟練度出題：新字先認意思，接著看中文選英文、聽音選字、字母排序，最後聽寫。',
        '答對升一格、答錯回第一格，第 4 格算「精熟」，該複習時再出現（1、2、5、14 天後）。第一次見到就答對的字代表你本來就會，直接跳到第 3 格，再答對一次就精熟。'
      ]],
      ['games', '遊戲', [
        '短局一到兩分鐘；「長局」（數獨、接龍、大盤踩地雷、跳棋）和找單字要十分鐘以上，玩得越好賺越多。',
        '遊戲開始後佔滿整個畫面，不會捲動；右上角的「?」隨時看玩法。',
        '今日挑戰：當天第一局有入帳就加獎金（NT$10 起，連續幾天多一點，最多 NT$40）。每款遊戲的最佳紀錄跨裝置保留。'
      ]],
      ['missions', '每日任務與每週目標', [
        '每天幾個小任務（背 20 題、精熟 3 個字、玩一局遊戲、在 Securities 交易或加入觀察、在 Fixtures 看一場比賽、在 Orbit Class 看課表、打開三個 App），完成後按「領取」。',
        '每週目標（週一到週日）：5 天有練習、賺 NT$1,500、完成 10 個任務、玩 10 局遊戲。開啟通知後，可以領取時和連續天數快斷時會提醒你。'
      ]],
      ['money', '錢怎麼算', [
        '單字：每答對一題 NT$3，第一次精熟一個字再加 NT$25，一天最多 NT$600（字卡不算錢）。遊戲：短局最多 NT$60、長局最多 NT$120，一天最多 NT$400。任務與每週目標：一天最多 NT$300。',
        '財富等級依錢包總額分成八級，從「起步」到「億萬」。最穩的方法：每天在 Rewards 賺一點，放進 Securities 長期投資。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Rewards is', [
        'Where effort earns money in Quadra: words, games and daily missions pay straight into the wallet. Every app’s help lives here too.'
      ]],
      ['tabs', 'The tabs', [
        'Home: today’s earnings, the word of the day, daily missions, weekly goals, badges and your wealth rank.',
        'Words: pick levels and a way to learn, and start a round.',
        'Games: word games, long games, puzzles, action, board and brain games, with search and favourites; one game a day is today’s challenge.',
        'Help: every Quadra app’s guide (this page).'
      ]],
      ['words', 'Words', [
        'The high-school English reference list, levels 1 to 6: 6,170 words, each with a recording (Microsoft’s Jenny voice). A round is 10, 20 or 30 words, reviews and new ones mixed; a missed word comes back once at the end of the round.',
        'Smart mode asks by how well you know a word: its meaning first, then meaning → word, by ear, unscrambling, and dictation last.',
        'Right moves a word up a box, wrong back to box 1; box 4 is mastered, and each word returns when due (1, 2, 5, 14 days). A new word right the first time is one you know: it jumps to box 3, and one more right answer masters it.'
      ]],
      ['games', 'Games', [
        'Short games take a minute or two; the long ones (sudoku, solitaire, big minesweeper, checkers) and word search ten minutes or more. Play well and they pay more.',
        'A game in play has the whole screen and nothing scrolls; the ? at the top shows how to play.',
        'Today’s challenge: its first paid round adds a bonus (from NT$10, a little more each day in a row, up to NT$40). Each game’s best is kept on every device.'
      ]],
      ['missions', 'Missions and weekly goals', [
        'A few small things a day (20 word answers, 3 words mastered, a game, a trade or watch in Securities, a match in Fixtures, your classes in Orbit Class, three apps opened); claim each when done.',
        'Weekly goals (Monday to Sunday): practise on 5 days, earn NT$1,500, finish 10 missions, play 10 games. With notices on, you’re told when there’s something to claim and when a streak is about to end.'
      ]],
      ['money', 'Money', [
        'Words: NT$3 a right answer, NT$25 more for a first mastery, NT$600 a day at most (flash cards don’t pay). Games: up to NT$60 a short round, NT$120 a long one, NT$400 a day. Missions and weekly goals: NT$300 a day.',
        'Eight wealth ranks by the wallet’s total, from Starter to Tycoon. The steady way up: earn a little here every day and invest it in Securities.'
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
