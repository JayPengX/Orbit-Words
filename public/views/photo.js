// 拍一頁變單字卡 (Jay 11-10, the family's AI): a photo of a textbook page, a
// word list or a worksheet. The AI (words-photo, Gemini Flash) reads off the
// English words it teaches; the phone keeps only the list's own (a form
// counts as its word) and offers them, all ticked, to star into 收藏, where
// 複習 practises them. Only the picture is sent, on the tap.
import * as kitUI from '#kit/ui.mjs';
import { el } from '../ui.js';
import { state, t, hooks } from '../shell.js';
import { shortMeaning } from '../lib/words.mjs';
import { isMarked } from '../lib/review.mjs';
import { pageWords } from '../lib/cards.mjs';
import { row, rowCard, checkDot } from './chrome.js';

// A form's key → its word's key (data/more.json's forms), made once.
let formsMap = null;
const formsOf = () => {
  if (formsMap && formsMap.size) return formsMap;
  formsMap = new Map();
  for (const [key, m] of state.more || []) for (const f of m.forms || []) if (!formsMap.has(f.toLowerCase())) formsMap.set(f.toLowerCase(), key);
  return formsMap;
};

export async function photoWords() {
  const ai = await import('#kit/ai.mjs').catch(() => null);
  if (!ai?.pickPicture) return kitUI.toast?.(t('photoOld'));
  const file = await ai.pickPicture();
  if (!file) return;
  const body = el('div', { class: 'photo-words', 'aria-live': 'polite' }, [ai.aiAnswerWait?.({ text: t('photoReading'), rows: 5, pics: false }) || ai.aiThinking(t('photoReading'))]);
  const s = kitUI.sheet({ title: t('photoTitle'), detent: 'large', cls: 'photo-sheet', body: [body] });
  const image = await ai.aiPicture(file, { side: 1800 });
  const r = image ? await ai.aiCall('words-photo', { image }, { timeout: 60_000 }) : { error: 'picture' };
  if (!body.isConnected) return;
  if (r.error || !r.out) return body.replaceChildren(el('p', { class: 'muted photo-err', text: r.error === 'picture' ? t('photoCant') : ai.aiSays(r.error, r.left) }));
  const { found, other } = pageWords(r.out.words, state.byKey, formsOf());
  if (!found.length) return body.replaceChildren(el('p', { class: 'muted photo-err', text: t('photoNone') }));
  const on = new Set(found.filter(w => !isMarked(state.marks, w.key)).map(w => w.key));
  const go = el('button', { class: 'q-btn primary large block', type: 'button' });
  const count = () => (go.textContent = t('photoStar', { n: on.size }), (go.disabled = !on.size));
  const rows = found.map(w => {
    const was = isMarked(state.marks, w.key);
    const r2 = row({
      title: w.word,
      sub: shortMeaning(w.zh),
      lang: true,
      value: was ? t('photoHad') : '',
      icon: checkDot(on.has(w.key)),
      chevron: false,
      disabled: was,
      onClick: () => {
        on.has(w.key) ? on.delete(w.key) : on.add(w.key);
        r2.querySelector('.pick').replaceWith(checkDot(on.has(w.key)));
        count();
      }
    });
    return r2;
  });
  count();
  go.onclick = () => {
    const now = Math.round(Date.now() / 1000);
    for (const k of on) state.marks = { ...state.marks, [k]: [1, now] };
    hooks.changed();
    hooks.render();
    kitUI.toast?.(t('photoStarred', { n: on.size }));
    s.close();
  };
  body.replaceChildren(
    el('p', { class: 'muted photo-lead', text: t('photoFound', { n: found.length }) + (other ? t('photoOther', { n: other }) : '') }),
    rowCard(rows, 'photo-list'),
    ai.aiNote(t('photoNote')),
    go
  );
}
