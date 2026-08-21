from __future__ import annotations
import hashlib, subprocess
from pathlib import Path
from .snapshot import snapshot

def identity(repo):
    repo=Path(repo).resolve(); s=snapshot(repo)
    git=repo/'.git'
    if git.exists():
        try:
            head=subprocess.run(['git','rev-parse','HEAD'],cwd=repo,text=True,capture_output=True,timeout=10).stdout.strip()
            remote=subprocess.run(['git','config','--get','remote.origin.url'],cwd=repo,text=True,capture_output=True,timeout=10).stdout.strip()
            return {'type':'git','head':head or None,'remote_sha256':hashlib.sha256(remote.encode()).hexdigest() if remote else None,'content_sha256':s['sha256']}
        except (OSError, subprocess.SubprocessError):
            return {'type':'git','head':None,'remote_sha256':None,'content_sha256':s['sha256'],'identity_error':'git-metadata-unavailable'}
    return {'type':'filesystem','content_sha256':s['sha256']}
