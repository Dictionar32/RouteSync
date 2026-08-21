from __future__ import annotations
import platform,shutil,subprocess,hashlib
from pathlib import Path

def info(cmd):
    path=shutil.which(cmd)
    if not path: return {'path':None,'sha256':None,'version':None}
    digest=None
    try:
        h=hashlib.sha256();
        with open(path,'rb') as f:
            for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
        digest=h.hexdigest()
    except (OSError, PermissionError): pass
    try:
        r=subprocess.run([cmd,'--version'],text=True,capture_output=True,timeout=10)
        ver=(r.stdout or r.stderr).splitlines()[0][:300]
    except (OSError, subprocess.SubprocessError): ver=None
    return {'path':path,'sha256':digest,'version':ver}

def collect():
    return {'python':platform.python_version(),'platform':platform.platform(),'tools':{c:info(c) for c in ('node','npm','rustc','cargo','php','composer','bash','python3')}}
