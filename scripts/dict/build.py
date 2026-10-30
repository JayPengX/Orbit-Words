# entries.jsonl (the written dictionary: one word a line, {w, s: [[pos, 繁中]],
# kk, ex: [en, zh] | null, forms}) → public/data/words.json's meaning and KK
# columns, and public/data/more.json (key → [forms, example, its Chinese]).
# The list itself (words, parts of speech, levels) stays as it is.
#   python3 scripts/dict/build.py
import json, re, os
here = os.path.dirname(os.path.abspath(__file__))
data = os.path.join(here, '..', '..', 'public', 'data')
rows = json.load(open(os.path.join(data, 'words.json')))
entries = {}
for line in open(os.path.join(here, 'entries.jsonl'), encoding='utf8'):
    if line.strip():
        e = json.loads(line); entries[e['w']] = e
key = lambda w: w.lower().replace('’', "'").strip()
VOWEL = re.compile('[aeiouæɑɔəɛɪʊʌɝɚ]+|[nlm]̩')
def kk(s, w=''):
    s = s.strip()
    # wh- as hw, the way Taiwan's KK writes it (what hwɑt), one way across the list.
    if w.lower().startswith('wh'): s = re.sub(r'^([ˋˏ]?)w', r'\1hw', s)
    if ' ' not in s and len(VOWEL.findall(s)) == 1: s = s.replace('ˋ', '').replace('ˏ', '')
    # KK as Taiwan's books write it: a final unstressed -y is ɪ (city ˋsɪtɪ),
    # a stressed one stays i (agree əˋgri).
    def tail(m):
        word = m.group(0); cut = max(word.rfind('ˋ'), word.rfind('ˏ'))
        return word[:-1] + 'ɪ' if cut >= 0 and VOWEL.search(word[cut + 1:-1]) else word
    return re.sub(r'\S+?(?<=[^aeiouæɑɔəɛɪʊʌɝɚ])i(?=\s|$)', tail, s)
out, more, missing = [], {}, []
for w, pos, lv, zh, ph in rows:
    e = entries.get(w)
    if not e: missing.append(w); out.append([w, pos, lv, zh, ph]); continue
    out.append([w, pos, lv, '\n'.join(f'{p} {t.strip()}' for p, t in e['s']), kk(e['kk'], w)])
    ex = e.get('ex') or ['', '']
    forms = [f for f in e.get('forms', []) if f.lower() != w.lower()][:5]
    if forms or ex[0]: more[key(w)] = [forms, ex[0], ex[1]]
def dump(obj, name):
    with open(os.path.join(data, name), 'w', encoding='utf8') as f:
        f.write(json.dumps(obj, ensure_ascii=False, separators=(',', ':')))
dump(out, 'words.json'); dump(more, 'more.json')
print(len(out), 'words,', len(more), 'with more;', len(missing), 'not in entries', missing[:10])
