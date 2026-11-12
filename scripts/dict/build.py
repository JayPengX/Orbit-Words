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
# A word's forms only as its parts of speech make them (the dictionary lists
# every use: "and" as a verb gave ands, anding, anded; "child" childs and
# childing; "a" as): -ing/-ed for a verb, -s for a noun or a verb, -er/-est
# for an adjective or adverb, and a noun's regular plural left out when it
# has its own (children, not childs).
def fit_forms(w, pos_list, forms):
    P = ' '.join(pos_list)
    verb = re.search(r'\b(v|vt|vi|aux)\.', P) is not None
    noun = re.search(r'\bn\.', P) is not None
    # (-er/-est and irregular comparisons only for a word listed as an adjective or adverb: not baby's babier.)
    adj = re.search(r'\b(adj|adv)\.', pos_list[0]) is not None
    lw = w.lower()
    def kind(f):
        f = f.lower()
        if f.endswith('ing') or (f.endswith('ed') and not lw.endswith('ed')): return 'verb'
        if f.endswith("'s") or (f.endswith('s') and f.startswith(lw[:max(1, len(lw) - 1)]) and len(f) - len(lw) <= 3): return 's'
        if (f.endswith('er') or f.endswith('est')) and f.startswith(lw[:max(1, len(lw) - 1)]): return 'more'
        return 'own'
    keep = []
    for f in forms:
        k = kind(f)
        if k == 'verb' and not verb: continue
        if k == 's' and not (noun or verb): continue
        if k == 'more' and not adj: continue
        if k == 'own' and not (noun or verb or adj): continue
        keep.append(f)
    if noun and not verb and any(kind(f) == 'own' for f in keep):
        keep = [f for f in keep if kind(f) != 's']
    return keep
out, more, missing = [], {}, []
for w, pos, lv, zh, ph in rows:
    e = entries.get(w)
    if not e: missing.append(w); out.append([w, pos, lv, zh, ph]); continue
    out.append([w, pos, lv, '\n'.join(f'{p} {t.strip()}' for p, t in e['s']), kk(e['kk'], w)])
    ex = e.get('ex') or ['', '']
    forms = fit_forms(w, [pos] + [p for p, _ in e['s']], [f for f in e.get('forms', []) if f.lower() != w.lower()])[:5]
    if forms or ex[0]: more[key(w)] = [forms, ex[0], ex[1]]
def dump(obj, name):
    with open(os.path.join(data, name), 'w', encoding='utf8') as f:
        f.write(json.dumps(obj, ensure_ascii=False, separators=(',', ':')))
dump(out, 'words.json'); dump(more, 'more.json')
print(len(out), 'words,', len(more), 'with more;', len(missing), 'not in entries', missing[:10])
