// 用新字聊天 (the family's AI, Jay 11-10): a short chat in English that has
// the student use the words they've just been learning. The words are shown
// on top as chips, ticked as each is used well; each line they send comes
// back fixed with the fewest changes (the change in bold, one line why) and
// the AI's next line, a question inviting a word not used yet (the AI door's
// words-chat, Haiku). The chat stays on the phone; only its last turns and
// the words are sent, on each send.
import * as kitUI from '#kit/ui.mjs';
import { el } from '../ui.js';
import { state, t, locale } from '../shell.js';
import { shortMeaning, dayNum } from '../lib/words.mjs';
import { wordDiff } from '../lib/cards.mjs';
import { chatWords, turnsToSend, opener } from '../lib/chat.mjs';

export async function openChat(next = []) {
  const ai = await import('#kit/ai.mjs').catch(() => null);
  if (!ai?.aiBar) return kitUI.toast?.(t('photoOld'));
  const words = chatWords(state.words, state.progress, { next });
  if (!words.length) return kitUI.toast?.(t('chatNone'));
  const used = new Set();
  const turns = [{ who: 'ai', text: opener(dayNum()) }];
  const chips = el('div', { class: 'chat-words' });
  const drawChips = () =>
    chips.replaceChildren(
      ...words.map(w => el('span', { class: `chat-word${used.has(w.word) ? ' on' : ''}`, lang: 'en', title: shortMeaning(w.zh) }, [used.has(w.word) ? el('span', { class: 'chat-tick', 'aria-hidden': 'true', text: '✓ ' }) : null, w.word, el('small', { lang: 'zh-Hant', text: shortMeaning(w.zh) })]))
    );
  const log = el('div', { class: 'chat-log', 'aria-live': 'polite' });
  const bubble = (who, text, extra = []) => el('div', { class: `chat-b ${who}` }, [el('p', { lang: 'en', text }), ...extra]);
  log.append(bubble('ai', turns[0].text));
  const done = () => used.size >= words.length;
  let told = false;
  const bar = ai.aiBar({
    placeholder: t('chatPlaceholder'),
    label: t('chatTitle'),
    onSend: async said => {
      bar.busy(true);
      bar.clear();
      const mine = bubble('me', said);
      log.append(mine);
      turns.push({ who: 'me', text: said });
      const think = ai.aiAnswerWait?.({ text: t('chatBusy'), rows: 1, pics: false }) || ai.aiThinking(t('chatBusy'));
      log.append(think);
      think.scrollIntoView?.({ block: 'nearest' });
      const r = await ai.aiCall('words-chat', { words: words.map(w => w.word), used: [...used], turns: turnsToSend(turns), lang: locale });
      think.remove();
      bar.busy(false);
      if (r.error || !r.out) {
        turns.pop();
        mine.append(el('small', { class: 'chat-err', text: ai.aiSays(r.error, r.left) }));
        return;
      }
      const { fixed, why, used: got, reply } = r.out;
      for (const w of got) used.add(w);
      // Their line, its fix under it (the change in bold) and why.
      if (fixed && fixed.trim() !== said.trim()) {
        mine.append(
          el('p', { lang: 'en', class: 'chat-fix' }, wordDiff(said, fixed).flatMap((w, i) => [i ? document.createTextNode(' ') : null, w.changed ? el('strong', { text: w.text }) : document.createTextNode(w.text)])),
          why ? el('small', { class: 'chat-why', text: why }) : null
        );
        turns[turns.length - 1] = { who: 'me', text: fixed };
      }
      drawChips();
      if (done() && !told) (told = true), log.append(el('p', { class: 'chat-done', text: t('chatDone', { n: words.length }) }));
      turns.push({ who: 'ai', text: reply });
      log.append(bubble('ai', reply));
      log.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
    }
  });
  drawChips();
  const foot = el('div', { class: 'q-sheet-foot chat-foot' }, [bar, ai.aiNote(t('chatNote'))]);
  kitUI.sheet({ title: t('chatTitle'), detent: 'large', cls: 'chat-sheet', body: [el('p', { class: 'muted chat-lede', text: t('chatLede') }), chips, log], foot });
}
