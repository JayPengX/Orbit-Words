// Quadra Hub's other tabs: Pass (the account, Quadra Plus and a member's
// looks), Truth (how Quadra's money moves and how the house earns, in real
// numbers and this account's own record) and Apps (every Quadra app, with
// its guide). `hub`: { q, t, locale, state, wornOf, wear, openHelp } from app.js.
import { APPS, AVATARS, FRAMES, PLUS, VIP, WELCOME, money, plusMember, plusCard, openPlus, plusPerks, plusReturns, plusTenure, accountDetails, accountSheet, showNewPass, ask, formatPass, freeBets, vipStatus, vipName, worthOf, WEALTH_RANKS, OVERDRAFT_RATE, ECONOMY } from './lib/quadra.mjs';
import { PLAY, STOCK, houseKeep, boostedKeep, freeBetWorth, roundTrip, plusMath, record, overdraftYear, vipShare } from './lib/truth.mjs';
import { el, put, section, toast, bar } from './ui.js';

const pct = (x, digits = 1) => `${(Math.round(x * 100 * 10 ** digits) / 10 ** digits).toFixed(digits).replace(/\.0+$/, '')}%`;
const row = (label, value, sub = '', cls = '') => el('div', { class: `t-row ${cls}` }, [el('span', { class: 't-label' }, [el('strong', { text: label }), sub ? el('small', { class: 'muted', text: sub }) : null]), el('strong', { class: 'num t-value', text: value })]);
const facts = (rows, foot = '') => el('div', { class: 'q-card list facts' }, [...rows.filter(Boolean), foot ? el('p', { class: 'facts-foot', text: foot }) : null]);
const date = (t, locale) => new Date(t).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });

// ---- Pass -----------------------------------------------------------------------------------

export function renderPass(box, { q, t, locale, state, wornOf, wear }) {
  const w = state.wallet;
  const member = plusMember(w);
  const d = accountDetails(w, locale);
  const days = d.created ? Math.max(1, Math.round((Date.now() - d.created) / 86_400_000)) : 0;
  const hero = el('div', { class: 'pass-hero' }, [
    el('div', { class: 'pass-top' }, [el('span', { class: 'pass-brand', text: 'QUADRA PASS' }), member ? el('span', { class: 'pass-plus', text: '✦ PLUS' }) : null]),
    el('small', { text: t('passBalance') }),
    el('strong', { class: 'pass-balance num', text: money(q.pool) }),
    el('div', { class: 'pass-month' }, [el('span', { class: 'num', text: `${t('monthIn')} ${money(d.in, { sign: true })}` }), el('span', { class: 'num', text: `${t('monthOut')} ${money(d.out)}` })]),
    el('small', { class: 'pass-since', text: d.created ? t('passSince', { date: date(d.created, locale), n: days }) : '' }),
    el('button', { class: 'q-btn block pass-open', type: 'button', text: t('passDetails'), onclick: () => accountSheet(q) })
  ]);
  put(box, hero, plusSection(q, t, locale, w, member), looksSection(q, t, w, member, wornOf, wear), deviceSection(q, t));
}

function plusSection(q, t, locale, w, member) {
  const perks = plusPerks(locale);
  const group = (app, title) =>
    el('div', { class: 'perk-group' }, [el('small', { class: 'perk-h', text: title }), ...perks.filter(p => p[0] === app).map(([, a, b]) => el('div', { class: 'perk' }, [el('span', { class: 'perk-mark', 'aria-hidden': 'true', text: '✦' }), el('span', {}, [el('strong', { text: a }), el('small', { class: 'muted', text: b })])]))]);
  const month = plusReturns(w);
  const all = plusReturns(w, Date.now(), { all: true });
  const back = member
    ? el('div', { class: 'q-card pad plus-back' }, [
        el('div', { class: 'stat-row three' }, [
          el('div', { class: 'stat' }, [el('strong', { class: 'num', text: money(month.total) }), el('small', { text: t('plusMonth') })]),
          el('div', { class: 'stat' }, [el('strong', { class: 'num', text: money(all.total) }), el('small', { text: t('plusAll') })]),
          el('div', { class: 'stat' }, [el('strong', { class: 'num', text: t('monthsN', { n: plusTenure(w) }) }), el('small', { text: t('plusTenure') })])
        ]),
        el('small', { class: 'muted', text: t('plusBackNote') })
      ])
    : null;
  return section(t('plusTitle'), el('div', { class: 'plus-box' }, [plusCard(q), back, el('div', { class: 'q-card pad perks' }, [group('odds', 'Quadra Play'), group('stock', 'Quadra Securities'), group('looks', t('looksTitle'))])]), {
    sub: t('plusSub'),
    action: el('button', { type: 'button', text: `${t('plusManage')} ›`, onclick: () => openPlus(q) })
  });
}

// Avatars and frames: a member wears one (or none); anyone else sees them
// locked, and a tap opens Plus.
function looksSection(q, t, w, member, wornOf, wear) {
  const avatar = wornOf('avatar');
  const frame = wornOf('frame');
  const glyph = AVATARS.find(a => a.id === avatar)?.glyph || '🙂';
  const pick = (key, id) => (member ? wear(key, id === wornOf(key) ? null : id) : openPlus(q));
  const tile = (key, item, face) => {
    const on = member && wornOf(key) === item.id;
    return el('button', { class: `av-tile${on ? ' on' : ''}${member ? '' : ' locked'}`, type: 'button', 'aria-pressed': String(on), 'aria-label': key === 'frame' ? t(`frame_${item.id}`) : item.glyph, onclick: () => pick(key, item.id) }, [face, el('small', { text: on ? t('lookOn') : key === 'frame' ? t(`frame_${item.id}`) : '' })]);
  };
  return section(
    t('looksTitle'),
    el('div', { class: 'q-card pad looks' }, [
      member ? null : el('button', { class: 'looks-lock', type: 'button', onclick: () => openPlus(q) }, [el('strong', { text: t('looksLocked') }), el('small', { text: t('looksLockedSub') })]),
      el('small', { class: 'lv-h', text: t('avatarsTitle') }),
      el('div', { class: 'av-grid' }, AVATARS.map(a => tile('avatar', a, el('span', { class: 'av-glyph', 'aria-hidden': 'true', text: a.glyph })))),
      el('small', { class: 'lv-h', text: t('framesTitle') }),
      el('div', { class: 'av-grid' }, FRAMES.map(f => tile('frame', f, el('span', { class: `fr-preview q-framed q-frame-${f.id}${frame === f.id ? ' on' : ''}`, 'aria-hidden': 'true', text: glyph }))))
    ]),
    { sub: t('looksSub') }
  );
}

function deviceSection(q, t) {
  const note = el('p', { class: 'note', role: 'status' });
  const code = el('div', { class: 'device-code', hidden: true });
  const act = (label, fn, cls = 'q-btn block') =>
    el('button', {
      class: cls,
      type: 'button',
      text: label,
      onclick: async e => {
        const b = e.currentTarget;
        b.disabled = true;
        note.textContent = '';
        try {
          await fn();
        } catch (error) {
          note.textContent = error?.message || t('failed');
        } finally {
          b.disabled = false;
        }
      }
    });
  return section(
    t('devicesTitle'),
    el('div', { class: 'q-card pad device-rows' }, [
      act(t('addDevice'), async () => {
        const { code: c } = await q.deviceCode();
        put(code, el('small', { text: t('deviceCode') }), el('strong', { class: 'num', text: formatPass(c) }), el('small', { class: 'muted', text: t('deviceCodeHow') }));
        code.hidden = false;
      }),
      code,
      act(t('signOutOthers'), async () => {
        if (!(await ask({ lang: q.lang, icon: '🔒', title: t('signOutOthersAsk'), body: t('signOutOthersBody'), ok: t('signOutOthersOk'), danger: true }))) return;
        await q.signOutEverywhere();
        toast(t('signOutOthersDone'), 'good');
      }),
      act(t('rotate'), async () => {
        if (!(await ask({ lang: q.lang, icon: '🔑', title: t('rotateAsk'), body: t('rotateBody'), ok: t('rotateOk'), danger: true }))) return;
        await showNewPass(q, await q.rotate());
      }),
      act(t('moreSettings'), () => accountSheet(q), 'q-btn block ghost'),
      note
    ]),
    { sub: t('devicesSub') }
  );
}

// ---- Truth ----------------------------------------------------------------------------------

export function renderTruth(box, { t, state }) {
  const w = state.wallet;
  const r = record(w);
  const s = r.sides;
  const legs = [1, 2, 3, 5, 7];
  const plus = plusMath();
  const plusBoost = PLUS.odds.boost;
  // A 3-pick parlay at 2.00 each (8.00): what the boost gives back of the cut.
  const parlay = { legs: 3, odds: 8 };
  const trip = roundTrip(100_000);
  const tripPlus = roundTrip(100_000, true);
  const vip = vipStatus(w);
  put(
    box,
    el('div', { class: 'truth-hero' }, [el('strong', { text: t('truthTitle') }), el('p', { text: t('truthLead') })]),
    section(
      t('sidesTitle'),
      el('div', { class: 'q-card list sides' }, [
        sideRow('🌤️', t('sideGod'), money(s.given), t('sideGodSub', { start: money(s.gave.start), pay: money(s.gave.pay), rank: money(s.gave.rank), other: money(s.gave.other) })),
        sideRow('🏛️', t('sideQuadra'), `−${money(s.took)}`, t('sideQuadraSub'), 'took'),
        sideRow('🙋', t('sideYou'), money(s.own, { sign: true }), t('sideYouSub'), s.own >= 0 ? 'up' : 'down'),
        el('div', { class: 'side-total' }, [el('span', { text: t('sideWorth') }), el('strong', { class: 'num', text: money(s.worth) })])
      ]),
      { sub: t('sidesSub', { pay: money(ECONOMY.monthly) }) }
    ),
    section(
      t('edgeTitle'),
      facts(
        [
          ...legs.map(n => row(n === 1 ? t('edgeSingle') : t('edgeLegs', { n }), pct(houseKeep(n)), n === 1 ? t('edgeSingleSub', { cut: PLAY.cut }) : '')),
          row(t('edgeBoost', { n: parlay.legs }), pct(boostedKeep(parlay.legs, parlay.odds)), t('edgeBoostSub', { plus: pct(boostedKeep(parlay.legs, parlay.odds, plusBoost)) })),
          r.staked > 0 ? row(t('yourBets'), r.betBack == null ? '—' : pct(r.betBack), t('yourBetsSub', { staked: money(r.staked), won: money(r.won) }), r.won >= r.staked ? 'up' : 'down') : null
        ],
        t('edgeFoot', { tax: pct(PLAY.tax), free: money(PLAY.taxFree), keep: pct(PLAY.cashOutKeep, 0), plus: pct(PLUS.odds.cashOutKeep, 0) })
      ),
      { sub: t('edgeSub') }
    ),
    section(
      t('lotteryTitle'),
      facts(
        [
          row(t('lotteryDraw'), pct(PLAY.draw, 0), t('lotteryDrawSub')),
          ...PLAY.scratch.map(([price, back]) => row(t('scratchAt', { price: money(price) }), pct(back, 0), t('scratchKeeps', { v: money(Math.round(price * (1 - back))) }))),
          r.tickets > 0 ? row(t('yourTickets'), r.ticketBack == null ? '—' : pct(r.ticketBack), t('yourTicketsSub', { paid: money(r.tickets), won: money(r.prizes) }), r.prizes >= r.tickets ? 'up' : 'down') : null
        ],
        t('lotteryFoot')
      ),
      { sub: t('lotterySub') }
    ),
    section(
      t('freeTitle'),
      facts(
        [
          row(t('freeBet', { v: money(WELCOME.bet) }), money(freeBetWorth(WELCOME.bet)), t('freeBetSub', { min: PLAY.freeMinOdds.toFixed(2) })),
          ...VIP.tiers.map(tier => row(vipName(tier, state.locale), pct(tier.back), t('vipSub', { min: money(tier.min), per: money(Math.round(vipShare(tier) * 100)) }))),
          vip.tier ? row(t('yourVip'), vipName(vip.tier, state.locale), t('yourVipSub', { stakes: money(vip.stakes), back: money(vip.back) })) : null,
          r.freeBets > 0 ? row(t('yourFree'), money(r.freeBets), t('yourFreeSub')) : null
        ],
        t('freeFoot')
      ),
      { sub: t('freeSub') }
    ),
    section(
      t('plusTruthTitle'),
      facts(
        [
          row(t('plusFee'), money(plus.fee), t('plusFeeSub', { yearly: money(plus.yearly) })),
          row(t('plusBets'), money(plus.betsWorth), t('plusBetsSub', { face: money(plus.betsFace) })),
          row(t('plusTrades'), t('timesN', { n: plus.tradesToBreakEven }), t('plusTradesSub', { saved: money(plus.savedPerTrade) })),
          row(t('plusBoostRow', { x: plusBoost }), pct(boostedKeep(parlay.legs, parlay.odds) - boostedKeep(parlay.legs, parlay.odds, plusBoost)), t('plusBoostSub')),
          r.plusPaid > 0 ? row(t('yourPlus'), money(r.plusPaid), t('yourPlusSub', { back: money(plusReturns(w, Date.now(), { all: true }).total) })) : null
        ],
        t('plusFoot')
      ),
      { sub: t('plusTruthSub') }
    ),
    section(
      t('stockTitle'),
      facts(
        [
          row(t('tripCost'), money(trip.total), t('tripCostSub', { fee: money(trip.fee), tax: money(trip.tax), share: pct(trip.share, 2) })),
          row(t('tripPlus'), money(tripPlus.total), t('tripPlusSub')),
          row(t('tripMonth'), money(trip.total * 4 * 12), t('tripMonthSub')),
          row(t('marginRate'), pct(STOCK.loanRate), t('marginRateSub', { plus: pct(STOCK.loanRate - PLUS.stock.loanCut) })),
          row(t('overdraftRow'), pct(overdraftYear()), t('overdraftSub', { month: pct(OVERDRAFT_RATE, 0), penalty: pct(STOCK.penalty, 0) })),
          r.od > 0 ? row(t('yourOd'), money(r.od), '', 'down') : null
        ],
        t('stockFoot')
      ),
      { sub: t('stockSub') }
    ),
    section(t('tricksTitle'), el('div', { class: 'q-card list tricks' }, TRICKS.map(id => el('div', { class: 'trick' }, [el('strong', { text: t(`trick_${id}`) }), el('small', { class: 'muted', text: t(`trickHow_${id}`, { fee: money(PLUS.fee), year: money(PLUS.year), bet: money(PLUS.odds.bonusBet) }) })]))), { sub: t('tricksSub') }),
    section(t('ranksTitle'), ranksCard(t, w), { sub: t('ranksSub') })
  );
}
const TRICKS = ['trial', 'yearly', 'leave', 'expire', 'minodds', 'boost', 'vip', 'nearmiss', 'notify'];
const sideRow = (icon, label, value, sub, cls = '') => el('div', { class: `side-row ${cls}` }, [el('span', { class: 'side-icon', 'aria-hidden': 'true', text: icon }), el('span', { class: 'side-text' }, [el('strong', { text: label }), el('small', { class: 'muted', text: sub })]), el('strong', { class: 'num', text: value })]);

// 財富等級: every level and its one-time reward, and where the account is.
function ranksCard(t, w) {
  const worth = worthOf(w);
  let at = 0;
  while (at + 1 < WEALTH_RANKS.length && worth >= WEALTH_RANKS[at + 1].min) at++;
  const next = WEALTH_RANKS[at + 1];
  const paid = id => (w?.entries || []).some(e => e.app === 'eco' && e.id === `eco:rank:${id}`);
  return el('div', { class: 'q-card list ranks' }, [
    next ? el('div', { class: 'rank-progress' }, [el('small', { class: 'muted', text: t('rankNext', { v: money(next.min - worth), rank: t(`rank_${next.id}`) }) }), bar(worth - WEALTH_RANKS[at].min, next.min - WEALTH_RANKS[at].min, 'accent')]) : null,
    ...WEALTH_RANKS.map((rk, i) =>
      el('div', { class: `rank-row${i === at ? ' current' : i < at ? ' passed' : ''}` }, [
        el('span', { class: 'rank-icon', text: rk.icon }),
        el('span', { class: 'rank-name' }, [el('strong', { text: t(`rank_${rk.id}`) }), el('small', { class: 'num muted', text: rk.min ? money(rk.min) : '—' })]),
        rk.reward ? el('span', { class: `rank-reward num${paid(rk.id) ? ' paid' : ''}`, text: paid(rk.id) ? t('rankPaid', { v: money(rk.reward) }) : `+${money(rk.reward)}` }) : null
      ])
    )
  ]);
}

// ---- Apps -----------------------------------------------------------------------------------

// Each app's logo, made once and moved between redraws, so it never loads
// (or flashes) again.
const logos = new Map();
const logoOf = (id, a) => logos.get(id) || logos.set(id, el('img', { class: 'app-logo', src: `${a.path}favicon.svg`, alt: '', width: 48, height: 48, decoding: 'async' })).get(id);
const ago = (t, then) => {
  const days = Math.floor((Date.now() - then) / 86_400_000);
  return days <= 0 ? t('usedToday') : t('usedDaysAgo', { n: days });
};
export function renderApps(box, { q, t, locale, state, openHelp }) {
  const w = state.wallet;
  const status = {
    stock: () => (w.snap?.stock ? t('statusStock', { cash: money(w.snap.stock.cash || 0), held: money(w.snap.stock.holdings || 0) }) : ''),
    odds: () => {
      const v = vipStatus(w);
      const bets = freeBets(w).length;
      return [t('statusStakes', { v: money(v.stakes) }), v.tier ? vipName(v.tier, locale) : '', bets ? t('statusFree', { n: bets }) : ''].filter(Boolean).join(' · ');
    }
  };
  const card = ([id, a]) => {
    const last = w.apps?.[id]?.last;
    return el('div', { class: 'q-card pad app-card' }, [
      el('div', { class: 'app-top' }, [
        logoOf(id, a),
        el('div', { class: 'app-name' }, [el('strong', { text: a.name }), el('small', { class: 'muted', text: [a.role[locale === 'en' ? 'en' : 'zh'], a.related ? t('related') : ''].filter(Boolean).join(' · ') })]),
        el('small', { class: 'muted app-last', text: last ? ago(t, last) : t('neverUsed') })
      ]),
      status[id]?.() ? el('p', { class: 'app-status num', text: status[id]() }) : null,
      el('div', { class: 'two-btn' }, [el('button', { class: 'q-btn', type: 'button', text: t('guide'), onclick: () => openHelp(id) }), el('button', { class: 'q-btn primary', type: 'button', text: t('open'), onclick: () => q.go(id) })])
    ]);
  };
  const others = Object.entries(APPS).filter(([id]) => id !== 'vocab');
  put(
    box,
    section(t('appsMoney'), el('div', { class: 'app-list' }, others.filter(([, a]) => !a.related).map(card)), { sub: t('appsMoneySub') }),
    section(t('appsRelated'), el('div', { class: 'app-list' }, others.filter(([, a]) => a.related).map(card)), { sub: t('appsRelatedSub') }),
    el('button', { class: 'q-btn block ghost pass-guide', type: 'button', text: t('passGuide'), onclick: () => openHelp('pass') })
  );
}
