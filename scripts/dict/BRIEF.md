# Writing Orbit Words' dictionary entries (one part)

Orbit Words teaches Taiwanese high-school students the 大考中心 English list (levels 1–6).
You write each word's entry in Traditional Chinese, Taiwan usage. These are written once and shipped.

Input: `/home/user/dictwork/in/part-NN.jsonl`, one word per line:
- `w` word, `pos` its parts of speech in the 大考 list, `lv` level 1–6
- `old` the old ECDICT meaning (senses often badly ordered, archaic or wrong; use it only as a hint)
- `gl` Wiktionary English glosses with POS (the factual reference for what the word means)
- `zh` Wiktionary Chinese translations with the English sense they belong to
- `kk` KK phonetics converted automatically from Wiktionary's US IPA (may be blank or wrong)
- `ex` Tatoeba example pairs [English, 中文] (human translations, already converted to Taiwan wording)
- `wex` Wiktionary example sentences (English only)

Output: write `/home/user/dictwork/out/part-NN.jsonl`, one JSON object per input word, same order, nothing else:
`{"w":"mean","s":[["v.","意思是、意指"],["v.","打算、有意"],["adj.","吝嗇的、刻薄的"]],"kk":"min","ex":["What do you mean?","你是什麼意思？"]}`

Rules
1. `s`: 1–4 senses, the ones a 大考 student needs, most useful first. Sense 1 is what the quiz asks, so it
   must be the word's main everyday meaning, and its POS must be the first one in `pos` unless that is plainly
   a minor use. Only POS from `pos` (n. v. adj. adv. prep. conj. pron. art. interj. aux.; `abbr.` for things like
   a.m.). Each sense is short: one to three Chinese equivalents joined by 、, at most about 12 characters. No
   archaic, rare or slang senses, no English, no explanations in brackets unless a word needs one
   (e.g. 「（用於否定句）」). Taiwan wording and characters (軟體 not 软件/軟件, 計程車, 資訊, 影片, 網路).
   Two senses with the same POS are fine when they really differ (bank: 銀行 / 河岸).
2. `kk`: KK as taught in Taiwan, US pronunciation. Use the given `kk` when right; fix it or write it when
   blank or wrong (e.g. sow the verb is `so`, not `saʊ`). Symbols only from:
   a b d e f g h i j k l m n o p r s t u v w z æ ɑ ɔ ə ɛ ɪ ʊ ʌ ʃ ʒ θ ð ŋ ɝ ɚ, stress ˋ (primary) ˏ (secondary)
   written before the stressed syllable, syllabic n̩ l̩ m̩, a space between words. e for eɪ, o for oʊ, r not ɹ.
   No stress mark on a one-syllable word. Several words (a.m., O.K.): write it as spoken.
3. `ex`: one example for sense 1 (or the most useful sense), short and natural for a student.
   Prefer a Tatoeba pair from `ex` that uses the word in that sense; fix its Chinese if it's wrong or
   unnatural in Taiwan. Otherwise take a `wex` sentence and translate it. Otherwise write a simple one
   yourself (under 12 words). Use `null` only if nothing fits at all. The English must contain the word
   or one of its forms.
4. Every input word gets exactly one output line, with `w` copied exactly.

Work through the file in batches (about 50 words at a time with Read offset/limit), appending to the
output with Bash heredocs (`cat >> out/part-NN.jsonl <<'EOF' ... EOF`, quote the heredoc marker).
Check with `cd /home/user/dictwork && python3 validate.py NN` and fix every ERR; read the WARN lines and fix
the real problems (a warning that s2twp would change a character you meant, like 著/着, can stay).
Don't touch any other file. When done, reply with the validate summary line and anything you were unsure of.
