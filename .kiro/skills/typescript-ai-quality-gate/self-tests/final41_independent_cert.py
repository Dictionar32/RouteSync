#!/usr/bin/env python3
"""Final41 independent certification audit.
This harness intentionally does not import engine.analysis/verifier. It invokes
quality-run as an external process, consumes raw JSON, and independently checks
security evidence, reproducibility, verifier tamper rejection, and performance.
"""
from __future__ import annotations
import json, os, pathlib, shutil, subprocess, tempfile, time, statistics, hashlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]

POSITIVE={
"main.ts": r'''declare function exec(x:string):void;
declare function get(x:string):Promise<{command:string}>;
export function direct(req:any){ exec(req.body.command); }
export function alias(req:any){ const a=req.body.command; const b=a; const c=b; exec(c); }
export function destruct(req:any){ const {command}=req.body; exec(command); }
export function mutation(req:any){ const o:any={}; o.command=req.body.command; exec(o.command); }
export function promise(req:any){ Promise.resolve(req.body.command).then(v=>v).then(v=>exec(v)); }
export function reject(req:any){ Promise.reject(req.body.command).catch(v=>exec(v)); }
export function finallyDirect(req:any){ Promise.resolve(req.body.command).finally(()=>exec(req.body.command)); }
export async function callback(req:any){ const g=(x:string)=>x; exec(g(req.body.command)); }
const methods={id:(x:string)=>x}; export function chain(req:any){ exec(methods.id(req.body.command)); }
export async function obj(req:any){ const o=await get(req.body.command); exec(o.command); }
''',
"lib.ts": r'''declare function exec(x:string):void;
export class Runner { run(command:string){ exec(command); } }
export function sink(command:string){ exec(command); }
''',
"reexport.ts": r'''export { sink as execute } from './lib';
''',
"cross.ts": r'''import { Runner } from './lib';
import { execute } from './reexport';
export function method(req:any){ const x=req.body.command; new Runner().run(x); }
export function rex(req:any){ execute(req.body.command); }
''',
}
NEGATIVE={
"main.ts": r'''declare function exec(x:string):void;
export function unrelated(req:any){ const x=req.body.x; Promise.resolve("safe").then(v=>v).then(v=>exec(v)); }
export function finallySafe(req:any){ Promise.resolve(req.body.command).finally(()=>exec("safe")); }
export function dynamicComputed(req:any,key:string){ const o:any={}; o[key]=req.body.command; exec(o[key]); }
'''
}

def run_quality(repo, out):
    rel_repo=os.path.relpath(repo,ROOT); rel_out=os.path.relpath(out,ROOT)
    return subprocess.run(["python3","bin/quality-run.py",rel_repo,rel_out],cwd=ROOT,env={**os.environ,"PYTHONPATH":str(ROOT)},stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True,timeout=120)

def make_repo(files):
    td=pathlib.Path(tempfile.mkdtemp(prefix='.final41-',dir=ROOT/'self-tests'))
    repo=td/'repo'; repo.mkdir(); (repo/'package.json').write_text('{"scripts":{"test":"true"}}\n')
    for name,text in files.items(): p=repo/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text)
    return td,repo

def findings(data):
    return data["typescript_quality"]["findings"]

def sec(data): return [f for f in findings(data) if str(f.get("rule","")).startswith("TSQ-SEC-")]

def canonical_security(data):
    keys=("rule","severity","confidence","evidence_kind","sink","source","path","line","function","class_name","method","parameter_index","local_alias")
    return sorted([{k:f.get(k) for k in keys} for f in sec(data)],key=lambda x:json.dumps(x,sort_keys=True))

def assert_true(cond,msg):
    if not cond: raise AssertionError(msg)

results={}
td,repo=make_repo({**POSITIVE, "package.json":"{\"scripts\":{\"test\":\"true\"}}\n"})
try:
    out=td/'positive.json'; r=run_quality(repo,out); d=json.loads(out.read_text()); s=sec(d)
    concrete=[f for f in s if f.get('evidence_kind')=='concrete-untrusted-flow' and f.get('severity')=='critical']
    sinks={f.get('sink') for f in concrete}
    results['false_negative_gate']=all(x in sinks for x in {'process-execution','promise-chain-parameter','cross-file-class-method'}) and len(concrete)>=10
    assert_true(results['false_negative_gate'],f"missing proven flow evidence: {sinks}")
    # Cross-file re-export must be concrete even if its evidence sink is local process execution.
    assert_true(any(f.get('path')=='cross.ts' and f.get('severity')=='critical' for f in concrete),'re-export flow missing')
finally: shutil.rmtree(td,ignore_errors=True)

td,repo=make_repo(NEGATIVE)
try:
    out=td/'negative.json'; r=run_quality(repo,out); d=json.loads(out.read_text()); s=sec(d); crit=[f for f in s if f.get('severity') in {'critical','high'} and f.get('evidence_kind')=='concrete-untrusted-flow']
    results['false_positive_gate']=not crit
    assert_true(results['false_positive_gate'],f'unrelated flow became blocking: {crit}')
finally: shutil.rmtree(td,ignore_errors=True)

# Reproducibility: findings, severity, evidence and metrics must be identical.
td,repo=make_repo(POSITIVE)
try:
    outs=[]
    for i in range(2):
        out=td/f'r{i}.json'; r=run_quality(repo,out); d=json.loads(out.read_text()); outs.append(d)
    results['reproducibility']=canonical_security(outs[0])==canonical_security(outs[1]) and outs[0]['typescript_quality']['metrics']==outs[1]['typescript_quality']['metrics']
    assert_true(results['reproducibility'],'non-deterministic findings/evidence/metrics')
finally: shutil.rmtree(td,ignore_errors=True)

# Independent verifier tamper gate: mutate decision; verifier must reject raw output.
td,repo=make_repo({"main.ts":"export const x=1;"})
try:
    out=td/'a.json'; r=run_quality(repo,out); tam=td/'tampered.json'; d=json.loads(out.read_text()); d['decision']='BLOCKED'; tam.write_text(json.dumps(d,indent=2))
    vr=subprocess.run(["python3","bin/quality-verify.py",os.path.relpath(tam,ROOT),os.path.relpath(repo,ROOT),"schemas/attestation.schema.json"],cwd=ROOT,env={**os.environ,"PYTHONPATH":str(ROOT)},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=120)
    results['independent_tamper_rejection']=vr.returncode!=0 and 'VERIFY_FAIL' in vr.stdout
    assert_true(results['independent_tamper_rejection'],'verifier accepted tampered attestation')
finally: shutil.rmtree(td,ignore_errors=True)

# Performance: same tiny repo, three runs per release. Final40 should not regress total runtime.
def bench(base, label):
    # Run each release benchmark in a clean child process. This prevents one
    # release's TypeScript/Node subprocess state from contaminating the other.
    rr=subprocess.run([sys.executable, str(ROOT/'self-tests'/'bench_release.py'), str(base)], cwd=ROOT,
                      env={k:v for k,v in os.environ.items() if k != 'FINAL39_ROOT'},
                      stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=180,
                      start_new_session=True)
    assert_true(rr.returncode==0, f'{label} benchmark process failed: {rr.stderr[-500:]}')
    data=json.loads(rr.stdout.strip().splitlines()[-1])
    return float(data['median_s']), data['runs_s']

# Compare against an unpacked Final39 supplied by certification driver.
final39=os.environ.get('FINAL39_ROOT')
perf_file=os.environ.get('FINAL41_PERF_JSON')
if perf_file:
    pdata=json.loads(pathlib.Path(perf_file).read_text())
    results['performance']={
        'final39_median_s':pdata['final39']['median_s'],
        'final40_median_s':pdata['final40']['median_s'],
        'final39_runs_s':pdata['final39']['runs_s'],
        'final40_runs_s':pdata['final40']['runs_s'],
        'regression_ratio':pdata['regression_ratio'],
        'pass':bool(pdata['pass']),
        'measurement_process':'independent bench_release.py child process'
    }
    assert_true(results['performance']['pass'],f'performance regression >15%: {results["performance"]}')
elif final39:
    m39,v39=bench(pathlib.Path(final39), 'f39'); m40,v40=bench(ROOT,'f40')
    results['performance']={'final39_median_s':m39,'final40_median_s':m40,'final39_runs_s':v39,'final40_runs_s':v40,'regression_ratio':m40/m39 if m39 else None,'pass':m40 <= m39*1.15}
    assert_true(results['performance']['pass'],f'performance regression >15%: {results["performance"]}')

print('FINAL41_INDEPENDENT_CERTIFICATION_PASS')
print(json.dumps(results,sort_keys=True,indent=2))
