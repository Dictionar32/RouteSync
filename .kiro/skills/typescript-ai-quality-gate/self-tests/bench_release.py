#!/usr/bin/env python3
import json, pathlib, subprocess, tempfile, time, statistics, shutil, sys, os
base=pathlib.Path(sys.argv[1]).resolve()
td=pathlib.Path(tempfile.mkdtemp(prefix='final41-perf-'))
repo=td/'repo'; repo.mkdir()
(repo/'package.json').write_text('{"scripts":{"test":"true"}}\n')
(repo/'a.ts').write_text('export function f(x:string){return x;}\n')
vals=[]
try:
    env={k:v for k,v in os.environ.items() if k != 'FINAL39_ROOT'}
    env['PYTHONPATH']=str(base)
    for i in range(3):
        out=td/f'{i}.json'
        t=time.perf_counter()
        rr=subprocess.run([sys.executable,str(base/'bin/quality-run.py'),str(repo),str(out)],cwd=base,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,timeout=120,start_new_session=True)
        vals.append(time.perf_counter()-t)
        if rr.returncode != 0:
            print(json.dumps({'error':rr.stderr[-1000:],'returncode':rr.returncode}),flush=True)
            raise SystemExit(rr.returncode)
    print(json.dumps({'median_s':statistics.median(vals),'runs_s':vals},sort_keys=True))
finally:
    shutil.rmtree(td,ignore_errors=True)
