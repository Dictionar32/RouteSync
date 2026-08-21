from pathlib import Path
from .canonical import sha256_json
import hashlib

IGNORES={'.git','node_modules','target','dist','build','__pycache__','.pytest_cache','.turbo','.venv','vendor/.cache'}

def digest_file(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
    return h.hexdigest()

def snapshot(root):
    root=Path(root).resolve(); rows=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file(): continue
        rel=p.relative_to(root).as_posix()
        if set(Path(rel).parts)&IGNORES: continue
        rows.append({'path':rel,'sha256':digest_file(p)})
    return {'sha256':sha256_json(rows),'files':rows}

def diff(a,b):
    aa={x['path']:x['sha256'] for x in a['files']}; bb={x['path']:x['sha256'] for x in b['files']}
    return sorted(k for k in set(aa)|set(bb) if aa.get(k)!=bb.get(k))
