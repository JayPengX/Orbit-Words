# One-off source step (2026-10-30), run in a scratch folder: fetch_kk.py pulls each word's
# Wiktionary entry from kaikki.org into kk/, extract.py adds Tatoeba pairs (tat/, the eng/cmn
# exports) and writes candidates; the 繁中 senses were then written from them (BRIEF.md)
# into entries.jsonl. To change a word, edit entries.jsonl and run build.py.
import json,re,os,urllib.parse,collections,opencc
cc=opencc.OpenCC('s2twp')
W=json.load(open('/home/user/Orbit-Words/public/data/words.json'))
BAD={'archaic','obsolete','rare','dated','dialectal','nonstandard','colloquial','slang','vulgar','derogatory','offensive','historical','Internet','humorous','poetic','proscribed','informal','eye-dialect','misspelling','obsolete-form','table-tags','inflection-template','alternative','pronunciation-spelling','uncommon'}
POSMAP={'noun':'n.','verb':'v.','adj':'adj.','adv':'adv.','prep':'prep.','conj':'conj.','pron':'pron.','intj':'interj.','det':'det.','article':'art.','num':'num.','name':'n.','phrase':'phr.','particle':'part.','aux':'aux.'}
def kk(ipa):
    s=ipa.strip('/[] ')
    s=s.split(',')[0].split('~')[0].split('/')[0].strip(' []')
    for a in '̟̠̪̬̝̥̊͡˔-': s=s.replace(a,'')
    s=s.replace('ä','a').replace('ç','h')
    s=re.sub(r'\(ɹ\)|\(r\)','r',s)
    s=re.sub(r'[()]','',s)
    rep=[('eɪ','e'),('oʊ','o'),('əʊ','o'),('ɝː','ɝ'),('ɜː','ɝ'),('ɜɹ','ɝ'),('ɜ˞','ɝ'),('ɚ','ɚ'),('ə˞','ɚ'),('ɹ','r'),('ɡ','g'),('ɫ','l'),('ɒ','ɑ'),('ɐ','ə'),('ɾ','t'),('ʔ','t'),('ʉ','u'),('ɵ','o'),('ɘ','ə'),('ɜ','ɝ'),('ɨ','ɪ'),('ɪ̈','ɪ'),('ᵻ','ɪ'),('ᵿ','ʊ'),('ˈ','ˋ'),('ˌ','ˏ'),('.',''),('‿',''),('ˑ',''),('ʍ','hw'),('ɔːr','ɔr'),('ɑːr','ɑr'),('iː','i'),('uː','u'),('ɑː','ɑ'),('ɔː','ɔ'),('ː',''),('ʰ',''),('̃',''),('̚',''),('̯',''),('ɪɚ','ɪr'),('ɛɚ','ɛr'),('ʊɚ','ʊr'),('ɔɚ','ɔr'),('ɑɚ','ɑr')]
    for a,b in rep: s=s.replace(a,b)
    s=s.replace('n̩','n̩').replace('l̩','l̩').replace('m̩','m̩')
    return s
OKKK=set("abdefghijklmnoprstuvwzæɑɔəɛɪʊʌʃʒθðŋɝɚˋˏ̩ ")
def us_ipa(rows):
    best=None; best_t=True
    for r in rows:
        for s in r.get('sounds',[]):
            if 'ipa' not in s: continue
            t=s.get('tags',[])
            if any(x in t for x in ('General-American','US','GA')): return s['ipa']
            if best is None or (not t and best_t): best=s['ipa']; best_t=bool(t)
    return best
FT={'v':[('third-person',),('past',),('participle','past'),('participle','present')],'n':[('plural',)],'a':[('comparative',),('superlative',)]}
def forms(rows,w):
    out=[]
    for r in rows:
        for f in r.get('forms',[]):
            t=set(f.get('tags',[])); fm=f['form']
            if t&BAD or fm==w or ' ' in fm and ' ' not in w or fm in out: continue
            if t&{'plural','past','participle','third-person','comparative','superlative'} and not t&{'first-person','second-person'}:
                if 'participle' in t or t&{'plural','comparative','superlative','third-person'} or t=={'past'}: out.append(fm)
    return out[:6]
# tatoeba index
eng={};cmn={}
for l in open('tat/eng_sentences.tsv',encoding='utf8'):
    p=l.rstrip('\n').split('\t'); eng[p[0]]=p[2]
for l in open('tat/cmn_sentences.tsv',encoding='utf8'):
    p=l.rstrip('\n').split('\t'); cmn[p[0]]=p[2]
pairs=collections.defaultdict(list)
for l in open('tat/eng-cmn_links.tsv'):
    a,b=l.split()
    if a in eng and b in cmn: pairs[a].append(b)
idx=collections.defaultdict(set)
tok=lambda s: re.findall(r"[a-z]+(?:['’.-][a-z]+)*\.?",s.lower())
for sid in pairs:
    for t in set(tok(eng[sid])): idx[t].add(sid); idx[t.rstrip('.')].add(sid)
def tatoeba(w,fs):
    keys={w.lower()}|{f.lower() for f in fs}
    c=set()
    if ' ' in w:
        c={s for s in idx.get(w.split()[0].lower(),()) if w.lower() in eng[s].lower()}
    else:
        for k in keys: c|=idx.get(k,set())
    def score(s):
        n=len(eng[s].split()); return (abs(n-8)+(0 if n<=14 else 20), -len(pairs[s]), len(eng[s]))
    out=[]
    for s in sorted(c,key=score)[:6]:
        out.append([eng[s],cc.convert(cmn[pairs[s][0]])])
    return out[:4]
res=[]
for w,pos,lv,zh,ph in W:
    f='kk/'+urllib.parse.quote(w,safe='')+'.jsonl'
    rows=[json.loads(l) for l in open(f)] if os.path.exists(f) else []
    rows=[r for r in rows if r.get('lang_code')=='en']
    ipa=us_ipa(rows); k=kk(ipa) if ipa else ''
    if k and not set(k)<=OKKK: k='?'+k
    gl=[]
    for r in rows:
        for s in r.get('senses',[]):
            t=set(s.get('tags',[]))
            if t&BAD or 'form_of' in s or 'alt_of' in s: continue
            g=(s.get('glosses') or [''])[-1]
            if g: gl.append(POSMAP.get(r['pos'],r['pos'])+' '+g[:110])
            if len(gl)>=10: break
    zhs=[]
    for r in rows:
        for t in r.get('translations',[]):
            if t.get('lang_code') in('cmn','zh') and t.get('word'):
                v=cc.convert(t['word'].split(' /')[0].split('/')[0].strip())
                item=v+' ('+(t.get('sense') or '')[:40]+')'
                if item not in zhs: zhs.append(item)
    fs=forms(rows,w)
    wex=[]
    for r in rows:
        for s in r.get('senses',[]):
            if set(s.get('tags',[]))&BAD: continue
            for e in s.get('examples',[]):
                if e.get('type')=='example' and 3<len(e.get('text','').split())<16 and not e.get('translation'):
                    wex.append(e['text'])
    res.append(dict(w=w,pos=pos,lv=lv,old=zh,ipa=ipa or '',kk=k,forms=fs,gl=gl,zh=zhs[:14],ex=tatoeba(w,fs),wex=wex[:3]))
json.dump(res,open('cand.json','w'),ensure_ascii=False)
print(len(res),'kk',sum(1 for r in res if r['kk'] and r['kk'][0]!='?'),'bad kk',sum(1 for r in res if r['kk'][:1]=='?'),'no kk',sum(1 for r in res if not r['kk']),'tat',sum(1 for r in res if r['ex']),'wex',sum(1 for r in res if r['wex']),'gl',sum(1 for r in res if r['gl']))
