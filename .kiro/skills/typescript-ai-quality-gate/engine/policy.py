import json
from pathlib import Path
from .canonical import sha256_json
LEVELS={'LOW':0,'MEDIUM':1,'HIGH':2,'CRITICAL':3}

def load(path):
    d=json.loads(Path(path).read_text()); return d,sha256_json(d)

def resolve(root):
    root=Path(root).resolve(); candidates=[]; cur=root
    while True:
        for name in ('quality-gate.json','.quality-gate.json'):
            p=cur/name
            if p.exists(): candidates.append(p)
        if cur==cur.parent: break
        cur=cur.parent
    cfg=root/'config'/'quality-gate.json'
    if cfg.exists(): candidates.append(cfg)
    if not candidates: candidates=[Path(__file__).parents[1]/'policies'/'default.json']
    ordered=[]
    for p in reversed(candidates):
        if p not in ordered: ordered.append(p)
    merged={}; conflicts=[]
    def merge(a,b,prefix=''):
        for k,v in b.items():
            key=f'{prefix}.{k}' if prefix else k
            if k in a and isinstance(a[k],dict) and isinstance(v,dict): merge(a[k],v,key)
            elif k in a and a[k]!=v: conflicts.append(key); a[k]=v
            else: a[k]=v
    source_hashes=[]
    for p in ordered:
        d,h=load(p); source_hashes.append({'path':str(p),'sha256':h,'content':d}); merge(merged,d)
    return merged,sha256_json(merged),source_hashes,conflicts

def required(policy, name, default=True):
    return bool(policy.get('required',{}).get(name, default))

def risk(paths,policy,semantic=None):
    score=0; rules=policy.get('risk_rules',{})
    for p in paths:
        s=p.lower(); key='medium'
        if s.endswith(('.md','.txt')): key='documentation_only'
        if any(x in s for x in ('auth','security','credential','permission')): key='auth_security'
        elif any(x in s for x in ('.rs','cargo.toml','native/')): key='native_binding'
        elif any(x in s for x in ('package.json','composer.json','lock','tsconfig','.github/workflows','build')): key='build_pipeline'
        score=max(score,LEVELS.get(rules.get(key,'MEDIUM'),1))
    if semantic:
        for c in semantic.get('categories',[]):
            score=max(score,LEVELS.get(rules.get(c, 'MEDIUM'),1))
    return next(k for k,v in LEVELS.items() if v==score)
