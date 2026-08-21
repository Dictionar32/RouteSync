from .canonical import sha256_json
import json

def build(state):
    state=dict(state); state.pop('attestation_sha256',None); state['attestation_sha256']=sha256_json(state); return state

def write(state,path):
    with open(path,'w') as f: json.dump(state,f,indent=2,sort_keys=True); f.write('\n')
