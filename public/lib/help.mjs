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
        'Quadra Pass 是你在所有 Quadra App 的帳號：Quadra Securities、Quadra Play、Quadra Rewards，和相關的 Quadra Fixtures、Orbit Class。每個 App 都用它登入，資料都存在它裡面。',
        '通行碼是一組 10 個字的代碼，就是這個帳號的鑰匙：知道它的人就能用，所以不要給別人。它只在建立或更換時顯示一次，裝置上不會保存，請記在安全的地方。',
        '在新裝置登入：輸入通行碼，或在已登入的裝置打開帳戶，按「新增裝置」取得 8 碼裝置代碼（10 分鐘內、只能用一次）。'
      ]],
      ['account', '帳戶明細', [
        '每個 App 右上角的人像按鈕打開帳戶：帳號、開戶日期、Quadra 餘額、這個月的收入與支出，以及最近的明細（每一筆是哪個 App、做了什麼）。',
        '帳戶裡也能切換 App、新增裝置、開關通知和管理安全設定。'
      ]],
      ['one', '一次只用一個 App', [
        '同一個通行碼一次只在一個 App、一台裝置上使用。打開另一個 App（或另一台裝置），原本那個會暫停並顯示「在別處使用中」，按一下就能拿回來，資料不會互相蓋掉。',
        '從一個 App 跳到另一個（例如從 Rewards 的任務到 Securities）會自動帶著登入。'
      ]],
      ['safe', '安全', [
        '伺服器只保存通行碼的雜湊值；裝置上只有會過期、可以撤銷的登入憑證，不會有通行碼本身。',
        '帳戶裡可以「登出其他所有裝置」（這台保持登入），或「更換通行碼」（新的只顯示一次，舊的立刻失效）。忘記通行碼時，在還登入的裝置更換一組就好。'
      ]],
      ['plus', 'Quadra Plus 會員', [
        '一個會員、所有 Quadra App：月繳 NT$490（第一次加入的那個月免費），或年繳 NT$4,900，等於每月約 NT$408、省下兩個月。從 Quadra 餘額扣款，在帳戶裡加入或管理；會員的帳戶按鈕有金色星星。',
        'Play：每週一送 NT$200 免費投注（每月約 NT$867）、提前兌現只扣 2%（一般 5%）。Securities：手續費 2.8 折、換匯點差減半、融資利率少 1%、台幣活存前 NT$100,000 享 2%（一般 0.8%）、新定存利率 +0.1%、借券出借券商只抽 20%（一般 30%）。Rewards：積分 ×1.5、每月 2 張連續紀錄保護卡（商店價 NT$600）、積分兌換 9 折。會員卡上會顯示本月和加入以來回饋了多少。每週免費投注入帳時會通知你；續訂前三天（第一個免費月也一樣）會提醒扣款金額，想停就到帳戶 › Quadra Plus › 管理會員。每月 1 日從餘額自動扣款，沒打開 App 也照扣；餘額不足扣款失敗，會員就停止，要重新加入。取消後用到期滿，已付不退費，價格含 5% 營業稅。免費投注照運彩業者的規則：每個選項賠率 1.50 以上、不能提前兌現、7 天內用完。',
        '月繳隨時可以取消，已付的月份照常享有權益；年繳到期自動續約，也可以在「管理會員」取消續約。'
      ]],
      ['vip', 'VIP 投注回饋與新手禮', [
        'VIP 不用加入也不用付費：每個月在 Play 的投注（運彩、彩券、刮刮樂，退款不算）決定當月等級，下個月第一次打開 App 時回饋當月投注額的一部分：🥉 銅卡 NT$10,000 起 0.5%、🥈 銀卡 NT$50,000 起 0.8%、🥇 金卡 NT$150,000 起 1.2%、◆ 黑卡 NT$500,000 起 1.5%。Play 首頁的餘額卡上看得到本月等級和離下一級還差多少。',
        '新手禮：在 Play 第一次用自己的錢下注後，送一張 NT$200 免費投注（7 天內有效）；在 Securities 的第一筆交易免手續費（稅和規費照收）。'
      ]],
      ['money', '錢怎麼算', [
        '所有 App 共用一個新台幣錢包。新帳號開戶金 NT$30,000；每個月 1 日固定發薪 NT$6,000，跟薪水一樣，存多存少都一樣。系統發的錢只有三種：開戶金、月薪，和財富等級獎勵（身價第一次到達一個等級時送一次，小資族 NT$1,000 到億萬大亨 NT$30,000；見 Rewards 的說明）。月薪在那個月第一次打開任何 App 時入帳，沒打開的月份下次補發。Rewards 的「任務 › 錢從哪裡來」把你的錢分成三方：系統發的、Quadra 收走的（Play 的莊家優勢、Plus、加值、透支利息），和你自己的成績。',
        '餘額可以是負的（透支），每月計息 1%。就像交割款沒付，2 天內沒補足就是違約交割：扣透支金額 7% 的違約金、自動賣出持股補足，而且 5 年內不能融資、融券。自己先賣就沒事。融資借來的錢只能留在 Securities 買賣，不能拿去 Play 或補透支。',
        'Securities 投資、Play 下注和買彩券、Rewards 的單字和任務給積分（XP）不給錢，只有加值商店會花錢；Fixtures 和 Orbit Class 不用錢。錢只存在 Quadra Pass，不能在帳號之間轉。'
      ]]
    ],
    en: [
      ['what', 'What the Quadra Pass is', [
        'The Quadra Pass is your account in every Quadra app: Quadra Securities, Quadra Play, Quadra Rewards and the related Quadra Fixtures and Orbit Class. Each signs in with it and keeps its data on it.',
        'The pass is a 10-character code, the key to the account: anyone who knows it can use it, so keep it to yourself. It’s shown only when it’s made or changed and never kept on a device: write it down somewhere safe.',
        'On a new device, enter the pass, or on a signed-in device open the account and choose “Add a device” for an 8-character device code (10 minutes, once).'
      ]],
      ['account', 'Account details', [
        'The person button at the top right of every app opens the account: its number, when it was opened, the Quadra balance, this month’s money in and out, and the latest entries (which app, what for).',
        'The account also switches apps, adds devices, turns notices on and off and holds the security settings.'
      ]],
      ['one', 'One app at a time', [
        'A pass is used in one app on one device at a time. Opening another app (or device) pauses the first, which says it’s in use elsewhere; one tap takes it back, so nothing overwrites anything.',
        'Going from one app to another (from a Rewards mission to Securities, say) arrives signed in.'
      ]],
      ['safe', 'Security', [
        'The server keeps only a hash of the pass; devices keep only sign-ins that expire and can be revoked, never the pass itself.',
        'The account can sign out every other device (this one stays in) or change the pass (the new one is shown once, the old one stops at once). Forgot it? Change it from a device that’s still signed in.'
      ]],
      ['plus', 'Quadra Plus', [
        'One membership for every Quadra app: NT$490 a month (the first month you ever join is free), or NT$4,900 a year, about NT$408 a month with two months free. It comes from the Quadra balance; join or manage it in the account, and a member’s account button has a gold star.',
        'Play: a NT$200 free bet every Monday (about NT$867 a month), and cash out keeps 2% instead of 5%. Securities: commission at 28% of the usual rate, half the FX spread, loans 1 point cheaper, 2% on the first NT$100,000 of NT$ cash (0.8% otherwise), +0.1% on new time deposits, and the broker keeps 20% of a lending fee instead of 30%. Rewards: points ×1.5, 2 streak protections a month (NT$600 in the shop) and 10% off the points catalogue. The Plus card shows what it gave back this month and since you joined. You’re told when each weekly free bet arrives, and three days before a renewal (the free month too) what it will charge; to stop, go to account › Quadra Plus › Manage membership. It’s charged from your balance on the 1st of every month, whether or not you open an app; if the balance can’t cover it the charge fails and the membership stops until you join again. Cancelling keeps what’s paid, nothing is refunded, and prices include 5% VAT. Free bets follow a sportsbook’s terms: odds of 1.50 or more on every pick, no cash out, used within 7 days.',
        'Monthly stops whenever you like, keeping the perks for months paid; yearly renews each year, and renewal can be turned off under Manage membership.'
      ]],
      ['vip', 'VIP cashback and welcome offers', [
        'VIP is free and needs no sign-up: what you stake in Play in a month (bets, lottery and scratch cards; refunds don’t count) sets that month’s tier, and a share of it comes back the first time you open an app the next month: 🥉 Bronze from NT$10,000 0.5%, 🥈 Silver from NT$50,000 0.8%, 🥇 Gold from NT$150,000 1.2%, ◆ Black from NT$500,000 1.5%. Play’s balance card shows this month’s tier and what’s left to the next.',
        'Welcome offers: your first bet in Play with your own money brings a NT$200 free bet (7 days), and your first trade in Securities pays no commission (taxes and fees as usual).'
      ]],
      ['money', 'Money', [
        'Every app shares one NT$ wallet. A new pass opens with NT$30,000; the 1st of every month pays a fixed NT$6,000, like a salary: the same however much you hold. The system gives money three ways only: the opening money, the pay, and wealth level rewards (paid once, the first time what you’re worth reaches a level: NT$1,000 for Saver up to NT$30,000 for Tycoon; see Rewards). The pay comes the first time that month you open any app; a month you miss is paid when you’re back. Rewards’ Missions › Where your money comes from splits your money three ways: what the system gave, what Quadra took (Play’s house edge, Plus, purchases, overdraft interest), and your own result.',
        'The balance can go below zero (an overdraft) at 1% a month. Like an unpaid settlement, if it isn’t covered within 2 days it’s a default: a 7% penalty on what’s owed, holdings sold for it, and no margin or short selling for 5 years. Sell something first and none of that happens. Money borrowed on margin stays in Securities for trading: it can’t be bet in Play or cover an overdraft.',
        'Securities invests, Play bets and sells lottery tickets, Rewards gives points (XP) for words and missions, never money (only its shop spends); Fixtures and Orbit Class don’t use money. Money lives on the Quadra Pass only and can’t move between passes.'
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
        '「換匯・融資」：四個畫面：換匯（你付出／你會收到，兩邊都能輸入）、匯率看板、融資（已借、維持率、還款）、理財（定存、借券出借）。',
        '定存：最少 NT$10,000，1 到 12 個月，臺灣銀行牌告固定利率（1 年 1.72%），到期本息回到現金，也可以設自動轉存。提前解約未滿 1 個月沒有利息，滿 1 個月以上按存滿的期別利率打 8 折。借券出借：整張、已交割、不是融資買進的台股或 ETF 可以借出去收借券費（股票年 1.2%、ETF 0.6%，券商收 3 成），借出去的股票不能賣，召回要 3 個營業日。單筆利息或借券費超過 NT$20,000 扣繳 10% 和 2.11% 二代健保。違約交割時銀行會先把定存解約抵債、券商召回借出的股票來賣。',
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
        '買進時可以選「融資」：成交時券商借你一部分，買的股票就是擔保，賣出時先還融資（沒有單獨借現金這回事）。融資成數和券商一樣：台股上市 6 成、上櫃 5 成，其他市場 5 成（美國 Reg T），陸股、印度股、加密貨幣、基金、黃金存摺不能融資；公債 9 成、公司債 7 成。利息加在融資上，還款或賣出時一起付。',
        '台股的融資、融券要先開「信用帳戶」（換匯・融資 › 融資）：證券帳戶滿 3 個月、最近一年成交 10 筆以上、成交金額達額度的一半；額度 50 萬、100 萬、200 萬、300 萬、500 萬，50 萬以上還要財力證明（總資產達額度 3 成）。融資、融券各用自己的額度。2026 年 10 月以前開的帳戶已經有 50 萬額度。',
        '融資、融券期限 6 個月，到期前一個月內可以按「展延」再延 6 個月；到期沒展延，融資的股票會被賣出、融券會被買回。融券：要繳賣出金額 9 成的保證金，賣出的錢也押在券商，買回時一起退；另收 0.08% 融券手續費，不收借券利息。其他市場的放空照國外券商：借券年費 3%，開倉要 150% 擔保。',
        '現股當沖：當天買進再賣出，證交稅減半（0.15%）。先賣後買要證券帳戶滿一年、最近一年成交 10 筆，收盤前一定要買回，沒買回會被自動買回。收盤後到 14:30 下的台股單進「盤後交易」（整股盤後定價、零股盤後），14:30 以收盤價撮合一次，沒成交就取消；盤中零股 9:10 開始。',
        '維持率收盤時低於 130% 會追繳，兩個營業日內要補到 166%；到期還低於 130%，融資買進的持股全部賣出（斷頭）；低於 100% 馬上強制處理。'
      ]],
      ['time', '時光機', [
        '在「紀錄」試算：幾年前投入一筆錢（或每月定期定額）到某個標的，現在會變多少，中間最大跌幅多少。'
      ]],
      ['fees', '費用', [
        '台股手續費 0.1425%（最低 NT$20，折扣後也一樣；零股最低 NT$1），賣出另收 0.3% 證交稅（ETF 0.1%、當沖 0.15%），元以下無條件捨去；每筆交易都看得到交割日（台股 T+2）；美股、日股等海外市場照複委託常見網路費率；共同基金透過基金平台申購，收 1% 申購手續費，贖回不收費。股利照各國規定預扣稅。',
        '換匯用市場中間價加減銀行價差；週末外匯休市時價差加倍。融資按天計息。',
        'Quadra Plus 會員手續費（含基金申購手續費）2.8 折、點差減半、融資利率少 1%、台幣活存前 NT$100,000 享 2%、新定存 +0.1%、借券券商只抽 20%。Rewards 的積分可以換手續費折抵券（每筆最多折 NT$100）和定存加碼券（+0.5%）。'
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
        'FX & loans: four views: exchange (you pay / you get, type either), the rates board, loans (borrowed, the ratio, repaying) and savings (time deposits, lending shares).',
        'Time deposits: NT$10,000 or more for 1 to 12 months at Bank of Taiwan’s posted fixed rates (1.72% for a year); principal and interest come back to cash at maturity, or roll over if you choose. Closed early: no interest under a month, past that 80% of the rate for the term held. Lending shares: whole lots of settled Taiwan stocks or ETFs not bought on margin earn a lending fee (1.2% a year for stocks, 0.6% for ETFs; the broker keeps 30%); lent shares can’t be sold and take 3 business days to recall. Interest or a fee over NT$20,000 at once has 10% tax and 2.11% health premium withheld. In a default the bank breaks your deposits against the debt and the broker recalls lent shares to sell.',
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
        'Buy on margin by choosing 融資 on the order: the broker lends part of it as it fills, the shares its collateral, and selling repays it first (there’s no borrowing cash on its own). How much is lent is a broker’s: Taiwan 60% listed, 50% OTC; 50% elsewhere (US Reg T); none on A-shares, Indian stocks, crypto, funds or the gold passbook; government bonds 90%, corporate 70%. Interest is added to the loan and paid when it’s repaid or the shares are sold.',
        'In Taiwan, margin and short selling need a credit account (FX & loans › Loans): the brokerage account open 3 months, 10 trades in the last year, and that year’s turnover at least half the limit. Limits are NT$500k, 1M, 2M, 3M and 5M; above 500k a broker asks for proof of means (30% of the limit). Margin and shorts each have the limit. Accounts opened before October 2026 have NT$500k already.',
        'Margin and shorts run 6 months; in the last month Extend adds 6 more, otherwise they’re closed when due. A Taiwan short (融券) puts up 90% of the sale, and the sale money is held too, both back when bought back; a 0.08% handling fee, no borrowing interest. Elsewhere shorts work as abroad: a 3% yearly borrowing fee and 150% cover to open.',
        'Day trading in Taiwan: bought and sold the same day pays half the tax (0.15%). Selling first needs the account open a year with 10 trades in the last year, and must be bought back by the close, or it’s bought back for you. Orders after the 13:30 close and before 14:30 go to the after-hours sessions: matched once at 14:30 at the close, or cancelled. Odd lots trade from 09:10.',
        'Under a 130% ratio at the close, the broker calls: two business days to get back to 166%; still under 130% at the deadline, everything bought on margin is sold; under 100% it closes positions at once.'
      ]],
      ['time', 'Time machine', [
        'Under History: what a lump sum (or a monthly plan) put into anything years ago would be worth now, and its worst drop on the way.'
      ]],
      ['fees', 'Fees', [
        'Taiwan trades pay 0.1425% commission (NT$20 at least) and a sale 0.3% tax; US, Japanese and other markets a Taiwan broker’s usual online rate; mutual funds go through a fund platform, 1% to buy and nothing to sell. Dividends have each country’s withholding.',
        'Exchange is the mid-market rate plus or minus the bank’s spread, doubled at weekends while FX markets are shut. Margin loans charge interest daily.',
        'Quadra Plus members pay 28% of the usual commission (fund fees too) and half the spread, borrow 1 point cheaper, earn 2% on the first NT$100,000 of NT$ cash, get +0.1% on new time deposits and leave the broker 20% of a lending fee. Rewards’ points buy commission vouchers (up to NT$100 off a trade) and deposit bonuses (+0.5%).'
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
        '提前兌現：比賽還沒結束也能先把投注單換成現金。金額是這張單現在的公平價值（依莊家目前估的機率，不含賠率裡的抽成），再扣 5%（Plus 扣 2%）；所以沒什麼變化時兌現會比繼續持有少一點，只有選項真的變得更可能贏時才會比本金多。',
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
        'Cash out: turn a slip into cash before the games end. It’s priced at the slip’s fair worth now (the house’s current chances, without the margin in the odds) less 5% (2% with Plus): while little has changed it pays a bit less than holding, and more than the stake only when the picks have really got likelier.',
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
        'Quadra 的運動資料中心：所有運動的比分、賽程、排名、球隊和球員，每場比賽的詳細數據，還有依你追蹤的運動排好的推薦。和 Orbit Class 一樣是 Quadra 的相關服務：不用錢，也不連到 Play。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：選一天（前三天到下週），當天每場比賽依你的喜好排好：先是不撞時間的精選，再來是其他比賽；可以只看追蹤的、你的球隊或某個運動。',
        '「賽事」：依運動和聯賽找比賽，打開就在離現在最近的比賽日；季後賽、季前賽、盃賽可以篩選。賽車、高爾夫、網球、格鬥顯示整季賽程。',
        '「直播」：現在進行中的比賽，和三小時內開打的。',
        '「追蹤」：你的運動、聯賽、球隊和選手的比賽、結果和排名。',
        '右上角：說明、重新整理和你的 Quadra Pass；再點一次目前的分頁會回到頂端。'
      ]],
      ['follow', '追蹤', [
        '依喜好順序追蹤運動（第一個最優先），再選每種運動的聯賽，都在「我的設定」；球隊在比賽或球隊頁按「+ 追蹤」，網球、高爾夫、F1、MotoGP、UFC 的選手在選手頁追蹤，F1 車隊在車隊頁追蹤（有它車手的比賽都算你的）。「追蹤」分頁列出每隊上一場、下一場和近五場，選手和聯賽在後面。追蹤的球隊開賽和完賽會通知你。',
        '「直播」分頁上方可以只看某個轉播服務的比賽；排名可以看過去五季（聯賽冠軍標在最上面），球隊頁有歷年戰績；MotoGP 有車手積分榜和車手頁（生涯和每一季），Formula E 有完賽名次，F1 Academy 和 GT 世界挑戰賽有賽程和各節時間。'
      ]],
      ['watch', '台灣轉播', [
        '比賽頁和推薦卡片會列出台灣可以收看的頻道與平台（愛爾達、緯來、DAZN、博斯、各聯盟的官方訂閱…），在「我的設定」選你有的服務。YouTube 只在聯盟頻道真的有那場比賽的影片時才列出（GT 世界挑戰賽全部免費直播）。轉播權會變動，以各平台公告為準。'
      ]],
      ['money', '錢怎麼算', [
        'Fixtures 不用錢：看比賽、追蹤都免費。每天打開一場比賽可以完成 Rewards 的每日任務。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Fixtures is', [
        'Quadra’s sports data centre: every sport’s scores, schedules, tables, teams and players, each match’s details, and picks ranked by what you follow. Like Orbit Class, it’s a related add-on: no money, and no links to Play.'
      ]],
      ['tabs', 'The tabs', [
        'Home: pick a day (three days back to a week ahead): every match of it, ranked for you, a no-clash plan first, then the rest; narrow it to what you follow, your teams or one sport.',
        'Matches: by sport and league, opening on the game day nearest to now; filter playoffs, preseason or cups. Racing, golf, tennis and fighting show the whole season.',
        'Live: everything in progress now, and what starts in the next three hours.',
        'Following: your sports, leagues, teams and players: their games, results and tables.',
        'Top right: help, refresh and your Quadra Pass; tap the open tab again to go back to its top.'
      ]],
      ['follow', 'Following', [
        'Follow sports in order of priority (the first counts most), then leagues in each; follow teams with “+ Follow” on a match or team page, and tennis, golf, F1 and UFC players on their page. A followed team’s start and final score come as notices.'
      ]],
      ['watch', 'Watching in Taiwan', [
        'Match pages and pick cards list where to watch in Taiwan (ELTA, Videoland, DAZN, Sportcast, league passes…). Rights change; each service’s own listings are the final word.'
      ]],
      ['money', 'Money', [
        'Fixtures is free: watching and following cost nothing. Opening a match each day completes a daily mission in Rewards.'
      ]]
    ]
  },
  vocab: {
    zh: [
      ['what', 'Quadra Rewards 是什麼', [
        'Quadra 獎勵努力的地方：背單字、完成每日任務，拿積分（XP）、連續紀錄和徽章。積分會提升你的 Quadra 等級和稱號（每個 App 的帳戶都看得到），也能在這裡兌換保護卡、單字加倍和單字包；積分不是錢，Rewards 不發錢。所有 App 的說明也都在這裡。'
      ]],
      ['tabs', '每個分頁', [
        '「首頁」：財富等級、今天的積分、接下來的任務、積分商店和今日單字。',
        '「單字」：選級別或單字包和學習方式，開始一輪。',
        '「任務」：每日任務、等級與連續紀錄、每週目標、徽章、財富等級和錢從哪裡來；完成待領取的數量會標在分頁上。',
        '右上角的「?」：每個 Quadra App 的說明（就是這裡）。'
      ]],
      ['words', '背單字', [
        '大考中心高中英文參考詞彙第 1 到 6 級，共 6,170 字，每個字都有真人發音錄音（Microsoft Jenny）。每一輪 10、20 或 30 個字，混合該複習的字和新字；答錯的字會在這一輪最後再問一次。',
        '「智慧」模式依熟練度出題，一輪會輪流用到五種題型：新字用選意思、選英文、聽音選字或拼字母，學過的字再加上聽寫；不會出「你知道這個字嗎」的字卡（那是自己選的「字卡」模式）。',
        '答對升一格、答錯回第一格，第 4 格算「精熟」。一個字一天最多升一格，所以精熟看的是你好幾天的紀錄，不會在同一輪就精熟。第一次見到就答對的字代表你本來就會，直接跳到第 3 格，隔天再答對就精熟；每一輪會先排這些快精熟的字。之後在 1、5、14 天後再複習。'
      ]],
      ['missions', '每日任務與每週目標', [
        '每日任務：每天從任務池換 6 個（3 個在 Rewards：回答 20 或 50 題單字、精熟 3 個單字、答對 10 題聽音選字／拼字母／聽寫、一輪全對；3 個在其他 App：在 Securities 打開 3 檔股票、在 Fixtures 點開 1 或 3 場比賽、打開 Orbit Class 看課表、今天打開 Securities、Fixtures 和 Rewards）。完成後按「領取」拿積分。',
        '加碼任務每天都有，要花錢：在 Securities 下一筆委託、在 Play 下 3 關以上的串關（免費投注也算）、買刮刮樂、買樂透。積分最多（40–60 XP），每天最多 2 個也算進連續紀錄；不做也沒關係。',
        '連續紀錄：一天領取 5 個任務，連續天數就 +1（6 個每日任務裡有 3 個在其他 App；加碼任務每天最多算 2 個）；只賺一點積分不會算。漏掉的那天有保護卡會自動補上。連續越久積分越多：每天 +2%，15 天起 +30%。連續 7、30、100 天各送一個專屬頭像（🐯、🦅、🏆）和一張保護卡（看的是最長紀錄，斷了也不會收回）。',
        '每週目標（週一到週日）：5 天保住連續紀錄、單字拿 1,000 XP、完成 10 個任務；三個都領取就送一張保護卡。開啟通知後，可以領取時和連續紀錄快斷時會提醒你。'
      ]],
      ['extras', '加值', [
        '連續紀錄保護卡（NT$300 或 600 XP，最多持有 3 張）：哪天沒保住連續紀錄，它會自動用掉一張，連續紀錄照樣算下去。Plus 會員每月送兩張。',
        '單字加倍（NT$150 或 300 XP）：接下來 30 分鐘每題單字積分 ×2；在加倍中再買，會接在後面再延 30 分鐘。',
        '單字包（「單字」分頁）：多益 TOEIC NT$990、雅思 IELTS NT$1,490、商務英文 NT$1,990（或 8,000 / 12,000 / 16,000 XP），一次買斷，每個字都有真人發音。買了就和級別一樣可以勾選；和主單字表重複的字共用進度，答對一樣有積分。'
      ]],
      ['catalog', '積分兌換', [
        '首頁的「積分商店」把積分換成 Quadra 自己的東西，像信用卡或航空哩程：Play 免費投注 NT$100（5,000 XP）或 NT$500（22,000 XP），7 天內用、每個選項賠率 1.50 以上、不能提前兌現，每月最多換 NT$1,000；證券手續費折抵券（4,000 XP），下一筆有手續費的交易最多折 NT$100，用不完不退，30 天內有效，每月 3 張；定存加碼券（12,000 XP），一筆 NT$100,000 以內的新定存利率 +0.5%，只算第一期、提前解約就取消，30 天內使用，每月 1 張；Quadra Plus 一個月（20,000 XP），試用過免費月之後每季一次，這個月不是會員就換這個月，已經是就換下個月。',
        'Plus 會員兌換 9 折。每次兌換都會先問你；換到的券會出現在要用的 App（Play 的投注單、Securities 的下單和定存），用掉或過期就沒了。'
      ]],
      ['money', '積分怎麼算', [
        '單字每答對一題 2 XP，第一次精熟一個字再加 15 XP（字卡不算）；任務 10–30 XP、每週目標 30–45 XP；Plus 會員全部 ×1.5，連續紀錄最多再 +30%。單字每天前 600 XP 全額、接下來 600 XP 減半、之後只有一成（Plus、連續紀錄和加倍會一起拉高這些門檻），隔天恢復；任務和每週目標不受影響。',
        '等級：累計積分決定等級（Lv 2 要 100 XP、Lv 5 要 1,600、Lv 10 要 8,100、Lv 20 要 36,100、Lv 30 要 84,100、Lv 50 要 240,100，每天認真用大約一年到頂），每幾級換一個稱號：新手、學徒、好手、高手、達人、大師、傳奇、神話。兌換東西花的是「可用積分」，不會降級。可用積分有效期限一年：每個月拿到的積分在隔年同月底到期，兌換時先扣最早的，快到期會提醒。',
        '等級獎勵與頭像（「任務 › 等級與頭像」）：Lv 5、10、15、20、30、50 各解鎖一個頭像，Lv 5、15、25…每十級送一張連續紀錄保護卡；也能用積分換頭像（300 到 5,000 XP），Plus 會員有專屬的 ✦。戴上的頭像會出現在每個 Quadra App 的帳戶按鈕上。',
        '積分還能換：頭像框（Lv 10 青銅、Lv 40 傳奇、Lv 50 神話，或用 2,000 到 30,000 XP 換白銀、翡翠、黃金、霓虹、極光）、換掉一個每日任務（100 XP，一天最多 2 次）、補回昨天斷掉的連續紀錄（1,500 XP，斷掉前已連續 3 天以上、手上沒有保護卡時）。每次兌換都會先問你。',
        '積分全部在首頁的「積分商店」用：Quadra 商品（免費投注、手續費折抵券、定存加碼券、Plus 月份）、保護卡和單字加倍、單字包、頭像和相框。',
        '系統發的錢有開戶金、每月薪水和財富等級獎勵（在 Quadra Pass 的說明裡）；在 Rewards 花錢的只有積分商店裡的加值和單字包。',
        '財富等級看身價（錢包加上 Securities 的持股），分成八級：起步、小資族（NT$5 萬）、穩健（10 萬）、小康（25 萬）、富裕（50 萬）、有錢人（100 萬）、千萬富翁（500 萬）、億萬大亨（2,000 萬）。第一次到達一個等級，系統送一次等級獎勵：NT$1,000、2,000、3,000、5,000、8,000、15,000、30,000；之後掉下去不會收回，再回來也不會再送。「任務 › 錢從哪裡來」把你的錢分成三方：系統發的、Quadra 收走的，和你自己的成績。'
      ]]
    ],
    en: [
      ['what', 'What Quadra Rewards is', [
        'Where Quadra rewards effort: words and daily missions earn points (XP), streaks and badges. Points raise your Quadra level and title (shown in every app’s account) and buy streak cards, word boosts and word packs here; they aren’t money, and Rewards pays none. Every app’s help lives here too.'
      ]],
      ['tabs', 'The tabs', [
        'Home: your wealth level, today’s points, the next missions, the points shop and the word of the day.',
        'Words: pick levels or word packs and a way to learn, and start a round.',
        'Missions: daily missions, weekly goals, badges and your wealth rank; the tab shows how many are ready to claim.',
        'The ? at the top right: every Quadra app’s guide (this page).'
      ]],
      ['words', 'Words', [
        'The high-school English reference list, levels 1 to 6: 6,170 words, each with a recording (Microsoft’s Jenny voice). A round is 10, 20 or 30 words, reviews and new ones mixed; a missed word comes back once at the end of the round.',
        'Smart mode asks by how well you know a word, and uses five kinds of question in a round: a new word by meaning, meaning → word, by ear or unscrambling; words you’ve learnt get dictation too. Never a “do you know it?” flash card (that’s Cards mode, if you choose it).',
        'Right moves a word up a box, wrong back to box 1; box 4 is mastered. A word moves up one box a day at most, so mastering comes from your record over days, never from a single round. A new word right the first time is one you know: it jumps to box 3, and right again tomorrow it’s mastered; rounds ask those first. After that, words return in 1, 5 and 14 days.'
      ]],
      ['missions', 'Missions and weekly goals', [
        'Daily missions: six a day from a pool, three in Rewards (answer 20 or 50 word questions, master 3 words, get 10 right by ear, from letters or by dictation, a round without a miss) and three in the other apps (open 3 stocks in Securities, open 1 or 3 matches in Fixtures, open Orbit Class, open Securities, Fixtures and Rewards today). Claim each for its points when done.',
        'Bonus missions are there every day and spend money: an order in Securities, a parlay of 3+ picks in Play (a free bet counts), a scratch card, a lottery ticket. The most points (40–60 XP), and up to 2 a day count for the streak; skip them if you like.',
        'Your streak: claim 5 missions in a day and it grows by a day (three of the six daily ones are in the other apps; up to 2 bonus ones count); a few points alone don’t keep it. A missed day is covered by a protection card if you hold one. The longer it runs, the more points: +2% a day, +30% from 15 days. 7, 30 and 100 days each bring an avatar of their own (🐯, 🦅, 🏆) and a protection card (by your longest streak, so they stay if it breaks).',
        'Weekly goals (Monday to Sunday): keep your streak on 5 days, 1,000 XP from words, finish 10 missions; claim all three for a protection card. With notices on, you’re told when there’s something to claim and when a streak is about to end.'
      ]],
      ['extras', 'Extras', [
        'Streak protection (NT$300 or 600 XP, hold up to 3): on a day the streak wasn’t kept, one is used by itself and the streak goes on. Plus members get two every month.',
        'Word points ×2 (NT$150 or 300 XP): every word earns double points for the next 30 minutes; one bought during another runs 30 minutes after it.',
        'Word packs (in Words): TOEIC NT$990, IELTS NT$1,490, Business English NT$1,990 (or 8,000 / 12,000 / 16,000 XP), bought once, every word recorded. Once yours, pick a pack like a level; words the main list shares keep one progress, and right answers earn points as usual.'
      ]],
      ['catalog', 'Points catalogue', [
        'The points catalogue on Home turns points into Quadra’s own products, like a card’s or an airline’s: a Play free bet of NT$100 (5,000 XP) or NT$500 (22,000 XP), used within 7 days at odds of 1.50 or more on every pick and never cashed out, NT$1,000 of them a month at most; a Securities commission voucher (4,000 XP), up to NT$100 off the next trade that pays commission, the rest lost, 30 days, 3 a month; a deposit bonus (12,000 XP), +0.5% on one new time deposit of up to NT$100,000 for its first term (gone if it’s closed early), 30 days to use, 1 a month; a month of Quadra Plus (20,000 XP), once a quarter after your free month: this month if you’re not a member, next month if you are.',
        'Plus members pay 10% fewer points. Each redemption asks first; what you get waits in the app it’s for (Play’s slip, Securities’ order ticket and deposits) until it’s used or expires.'
      ]],
      ['money', 'Points', [
        'Words: 2 XP a right answer, 15 XP more for a first mastery (flash cards give none); missions 10–30 XP, weekly goals 30–45 XP; ×1.5 for Plus members, and up to +30% with the streak. Each day the first 600 XP from words come in full, the next 600 at half, the rest at a tenth (Plus, the streak and the ×2 boost raise those steps too), back to full the next day; missions and weekly goals aren’t counted.',
        'Levels: every point you earn counts (level 2 at 100 XP, 5 at 1,600, 10 at 8,100, 20 at 36,100, 30 at 84,100, 50 at 240,100: about a year of daily use to the top), with a new title every few levels: Rookie, Apprentice, Skilled, Expert, Master, Grandmaster, Legend, Mythic. Buying things spends your points to spend, never your level. Points to spend last a year: each month’s points expire at the end of the same month the next year, the oldest are spent first, and you’re told before any run out.',
        'Level rewards and avatars (Missions › Level and avatars): levels 5, 10, 15, 20, 30 and 50 each unlock an avatar, and levels 5, 15, 25… bring a streak protection card; points buy more avatars (300 to 5,000 XP), and Plus members get ✦. The avatar you wear shows on your account button in every Quadra app.',
        'Points also buy frames (bronze at level 10, legend at 40, mythic at 50; silver, jade, gold, neon and aurora for 2,000 to 30,000 XP), a swap of a daily mission (100 XP, twice a day at most) and yesterday’s streak bought back (1,500 XP, when it had run 3 days or more and you hold no protection card). Each asks first.',
        'Points are all spent in the Points shop on Home: Quadra’s products (free bets, fee vouchers, deposit boosts, Plus months), streak cards and the word boost, word packs, avatars and frames.',
        'The system gives money as the opening money, the monthly pay and wealth level rewards (see Quadra Pass); in Rewards only the shop’s items and word packs spend it.',
        'Wealth levels go by what you’re worth (your wallet and Securities holdings), eight of them: Starter, Saver (NT$50k), Steady (100k), Comfortable (250k), Wealthy (500k), Rich (1M), Multi-millionaire (5M) and Tycoon (20M). The first time you reach one, the system pays its reward once: NT$1,000, 2,000, 3,000, 5,000, 8,000, 15,000 and 30,000; falling back keeps it, and coming back pays nothing more. Missions › Where your money comes from splits your money three ways: what the system gave, what Quadra took, and your own result.'
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
