from __future__ import annotations
import hashlib
from .canonical import sha256_json

SEVERITIES={'info','low','medium','high','critical'}
def finding(analyzer, rule, path='', message='', severity='medium', evidence=None, extra=None):
    severity=severity if severity in SEVERITIES else 'medium'
    base={'analyzer':analyzer,'rule':rule,'path':path,'message':message,'severity':severity}
    if evidence is not None: base['evidence']=evidence
    if extra: base.update(extra)
    base['id']=hashlib.sha256(sha256_json(base).encode()).hexdigest()[:20]
    return base

def normalize(report, analyzer):
    out=[]
    for x in report.get('findings',[]):
        out.append(finding(analyzer,x.get('rule') or x.get('kind','unknown'),x.get('path',''),
                           x.get('message',''),x.get('severity','medium'),
                           extra={k:v for k,v in x.items() if k not in {'rule','kind','path','message','severity'}}))
    return sorted(out,key=lambda x:x['id'])
