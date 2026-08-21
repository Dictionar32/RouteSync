from .canonical import sha256_json

def make(id,kind,status,command,exit_code=None,content=None,depends_on=None,behavior_ids=None,execution=None):
    content=content or {}
    return {'id':id,'kind':kind,'status':status,'command':command,'exit_code':exit_code,'content':content,'content_sha256':sha256_json(content),'depends_on':depends_on or [],'behavior_ids':behavior_ids or [],'execution':execution or {}}

def validate(items):
    by={x['id']:x for x in items}; errors=[]
    for e in items:
        for d in e.get('depends_on',[]):
            if d not in by: errors.append(f'missing-dependency:{e["id"]}->{d}')
    return errors
