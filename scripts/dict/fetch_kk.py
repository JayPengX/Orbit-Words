# One-off source step (2026-10-30), run in a scratch folder: fetch_kk.py pulls each word's
# Wiktionary entry from kaikki.org into kk/, extract.py adds Tatoeba pairs (tat/, the eng/cmn
# exports) and writes candidates; the 繁中 senses were then written from them (BRIEF.md)
# into entries.jsonl. To change a word, edit entries.jsonl and run build.py.
import json,os,sys,urllib.request,urllib.parse,concurrent.futures as cf
d=json.load(open('/home/user/Orbit-Words/public/data/words.json'))
def url(w):
    # kaikki: first char / first two chars / word (quoted)
    a=w[0]; b=w[:2]
    q=lambda s: urllib.parse.quote(s,safe='')
    return f"https://kaikki.org/dictionary/English/meaning/{q(a)}/{q(b)}/{q(w)}.jsonl"
def get(w):
    f=f'kk/{urllib.parse.quote(w,safe="")}.jsonl'
    if os.path.exists(f): return w,'cached'
    for cand in [w, w.lower()]:
        try:
            data=urllib.request.urlopen(url(cand),timeout=30).read()
            open(f,'wb').write(data); return w,'ok'
        except Exception as e: err=str(e)
    return w,err
with cf.ThreadPoolExecutor(24) as ex:
    res=list(ex.map(get,[x[0] for x in d]))
bad=[r for r in res if r[1] not in('ok','cached')]
print(len(res),len(bad)); json.dump(bad,open('kk_missing.json','w'),ensure_ascii=False)
