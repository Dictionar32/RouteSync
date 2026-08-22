from __future__ import annotations
import json,subprocess,sys,uuid,shlex,shutil,hashlib,time
from pathlib import Path
from .snapshot import snapshot,diff
from .policy import resolve,risk,LEVELS
from .evidence import make,validate
from .attestation import build,write
from .provenance import collect
from .analysis import complexity,complexity_delta,style,reuse,architecture,semantic_change,typescript_quality,routesync_extensions
from .project_model import build_project_model
from .adapters import available,adapter_commands,adapters,adapter_contracts
from .identity import identity
from .failures import classify,records
from .verifier import _intrinsic_errors, _schema_path

SCHEMA_VERSION='28.4.0'
# These are command/argument tokens, not arbitrary substrings.  Matching whole
# tokens avoids blocking harmless names such as ``production-ready.txt`` while
# still rejecting destructive or production-targeting commands.
BLOCKED_EXACT_TOKENS={
    'deploy','publish','release','destroy','drop','reset','prod','production',
    'migrate:fresh',
}
BLOCKED_TOKEN_PAIRS={
    ('git','push'),
}


def _normalized_tokens(argv):
    """Return shell-free argv tokens suitable for conservative policy checks."""
    return [str(x).strip().lower() for x in (argv or [])]


def safe_argv(argv):
    """Reject commands that explicitly target destructive/production actions.

    ``subprocess.run(..., shell=False)`` already gives us argv boundaries, so
    policy checks should use those boundaries instead of substring matching.
    This keeps the gate fail-closed for known dangerous tokens without turning
    innocent paths/labels containing words like ``production`` into blocks.
    """
    tokens=_normalized_tokens(argv)
    if not tokens:
        return False,'empty-command'
    if any(t in BLOCKED_EXACT_TOKENS for t in tokens):
        return False,'destructive-or-production-command'
    if any(tuple(tokens[:len(pair)])==pair for pair in BLOCKED_TOKEN_PAIRS):
        return False,'destructive-or-production-command'
    # Explicit production environment selectors remain blocked even when
    # represented as KEY=value rather than a bare token.
    for token in tokens:
        if token in ('--prod','--production','--env=prod','--env=production',
                     'env=prod','env=production'):
            return False,'destructive-or-production-command'
    return True,None

def discover_commands(repo):
    out=[]
    specs=adapter_commands(repo)
    for name,argv,source,adapter in available(repo):
        ok,reason=safe_argv(argv)
        parser=next((x.get('parser') for x in specs if x.get('name')==name and x.get('adapter')==adapter and x.get('argv')==argv),None)
        if ok:
            out.append({'name':name,'argv':argv,'source':source,'adapter':adapter,'parser':parser})
    # Required adapters whose executable is absent become explicit evidence in execute().
    for spec in specs:
        argv=spec.get('argv') or []
        if not argv or shutil.which(argv[0]): continue
        if spec.get('required',False):
            out.append({'name':spec.get('name','unknown'),'argv':argv,'source':spec.get('source','adapter'),
                        'adapter':spec.get('adapter'),'parser':spec.get('parser'),'required':True,'required_unavailable':True})
    return out

def execute(repo,name,argv,source,seq,adapter=None,parser=None):
    started=time.time(); path=shutil.which(argv[0])
    content={'argv':argv,'cwd':str(repo),'source':source,'adapter':adapter,'parser':parser,'tool':argv[0],'tool_path':path}
    cmd=' '.join(shlex.quote(x) for x in argv)
    if not path:
        content['error']='tool-not-found'; content['failure_code']='ADAPTER_UNAVAILABLE' if adapter else 'TOOL_UNAVAILABLE'
        return make('exec-'+name,'execution','BLOCKED',cmd,None,content,execution={'seq':seq,'started':started,'ended':time.time()})
    try: content['binary_sha256']=hashlib.sha256(Path(path).read_bytes()).hexdigest()
    except (OSError, PermissionError): content['binary_sha256']=None
    try:
        r=subprocess.run(argv,shell=False,cwd=repo,text=True,capture_output=True,timeout=300)
        content['stdout']=r.stdout[-20000:]; content['stderr']=r.stderr[-20000:]
        parser=content.get('parser')
        from .parsers import normalize
        content['normalized_result']=normalize(parser or argv[0],r.stdout,r.stderr,r.returncode)
        try: content['tool_version']=subprocess.run([argv[0],'--version'],text=True,capture_output=True,timeout=10).stdout.splitlines()[0][:300]
        except (OSError, subprocess.SubprocessError, IndexError): content['tool_version']=None
        return make('exec-'+name,'execution','PASS' if r.returncode==0 else 'FAIL',cmd,r.returncode,content,execution={'seq':seq,'started':started,'ended':time.time()})
    except subprocess.TimeoutExpired:
        content['error']='timeout'; return make('exec-'+name,'execution','BLOCKED',cmd,None,content,execution={'seq':seq,'started':started,'ended':time.time()})
    except Exception as e:
        content['error']=repr(e); return make('exec-'+name,'execution','BLOCKED',cmd,None,content,execution={'seq':seq,'started':started,'ended':time.time()})

def chain_hash(before,evidence,final):
    h=hashlib.sha256(before['sha256'].encode()).hexdigest()
    for e in sorted(evidence,key=lambda x:x.get('execution',{}).get('seq',10**9)):
        ex=e.get('execution',{}); h=hashlib.sha256((h+e['id']+e['content_sha256']+str(ex.get('seq'))+str(ex.get('started'))+str(ex.get('ended'))).encode()).hexdigest()
    return hashlib.sha256((h+final['sha256']).encode()).hexdigest()

def load_baseline(path):
    if not path or not path.exists(): return None,None,None
    try:
        b=json.loads(path.read_text()); claimed=b.get('attestation_sha256'); x=dict(b); x.pop('attestation_sha256',None)
        valid=bool(claimed) and hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()==claimed
        intrinsic=_intrinsic_errors(b,_schema_path(None)) if valid else ['baseline-attestation-digest-mismatch']
        if b.get('decision')!='PASS' or b.get('errors')!=[]:
            intrinsic.append('baseline-must-be-pass')
        valid = valid and not intrinsic
        lineage={'parent_attestation_sha256':claimed,'attestation_valid':valid,'repo_identity':b.get('repo_identity'),
                 'policy_sha256':b.get('policy',{}).get('sha256'),'schema_version':b.get('schema_version'),
                 'snapshot_sha256':(b.get('final_snapshot') or b.get('snapshot') or {}).get('sha256'),
                 'complexity':b.get('complexity'),'repo_identity':b.get('repo_identity'),'policy_sources':b.get('policy',{}).get('sources',[]) }
        return b,lineage,None if valid else 'baseline-intrinsic-validation-failed'
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as e: return None,None,repr(e)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='TypeScript AI Quality Gate')
    parser.add_argument('--project-root', type=Path, required=True, help='Project root directory')
    parser.add_argument('--output', type=Path, help='Output attestation file')
    parser.add_argument('--output-format', choices=['json', 'text'], default='json', help='Output format')
    parser.add_argument('--baseline', type=Path, help='Baseline attestation file')
    
    args = parser.parse_args()
    repo = args.project_root.resolve()
    out = args.output or repo / 'quality-gate-attestation.json'
    baseline_path = args.baseline
    policy,ph,sources,conflicts=resolve(repo)
    before=snapshot(repo); b,bl,berr=load_baseline(baseline_path)
    # A supplied baseline is a trust boundary. If its intrinsic attestation
    # validation fails, stop before running analyzers/tools against an untrusted
    # baseline. This is both fail-closed and deterministic under CI time limits.
    if baseline_path and berr:
        return 1
    base_snap=(b.get('final_snapshot') or b.get('snapshot')) if b else None; base_risk=b.get('risk') if b else None
    evidence=[]
    for i,c in enumerate(discover_commands(repo),1):
        evidence.append(execute(repo,c['name'],c['argv'],c['source'],i,c['adapter'],c.get('parser')))
    style_r,reuse_r,arch_r=style(repo),reuse(repo),architecture(repo); complexity_r=complexity(repo)
    tsq_r=typescript_quality(repo,policy)
    rse_r=routesync_extensions(repo,policy)
    for rid,kind,report in [('style-analysis','style',style_r),('reuse-analysis','reuse',reuse_r),('architecture-analysis','architecture',arch_r),('complexity-analysis','complexity',complexity_r),('typescript-quality-analysis','typescript_quality',tsq_r),('routesync-extensions-analysis','routesync_extensions',rse_r)]:
        status='PASS' if report.get('ok', True) else 'FAIL'
        if kind=='typescript_quality': status='PASS' if report.get('status')=='PASS' else 'FAIL'
        evidence.append(make(rid,'analysis',status,kind+' analyzer',0 if status=='PASS' else 1,report,execution={'seq':len(evidence)+1,'started':time.time(),'ended':time.time()}))
    final=snapshot(repo); errors=list(conflicts)+validate(evidence)
    tq_policy=policy.get('typescript_quality',{}) if isinstance(policy,dict) else {}
    if tq_policy.get('enabled',False):
        tq=tsq_r
        if int(tq.get('score',0)) < int(tq_policy.get('minimum_score',85)):
            errors.append('typescript-quality-threshold')
    if berr: errors.append('baseline-invalid')
    if final['sha256']!=before['sha256']: errors.append('repository-mutated-during-validation')
    if not evidence or not any(e['kind']=='execution' for e in evidence): errors.append('required-execution-evidence-missing')
    if any(e['status']=='FAIL' for e in evidence): errors.append('required-evidence-failed')
    if any(e['status']=='BLOCKED' and e['kind']=='execution' for e in evidence): errors.append('execution-not-verifiable')
    base=base_snap or before; sem=semantic_change(base,before,repo); current_risk=risk(diff(base,before),policy,sem)
    raw_complexity=(b or {}).get('complexity') or {'files':0,'lines':0,'functions':0,'branches':0,'max_nesting':0,'findings':[]}
    base_complexity=raw_complexity if base_snap else {'files':0,'lines':0,'functions':0,'branches':0,'max_nesting':0,'findings':[],'per_function':{},'metric_backend':'python-ast/typescript-compiler-api-ast/token-aware-fallback'}
    cd=complexity_delta(base_complexity,complexity_r)
    if base_risk is not None and LEVELS.get(current_risk,-1)>LEVELS.get(base_risk,-1): errors.append('risk-regression')
    if base_snap is None and policy.get('required',{}).get('baseline_for_pass',False): errors.append('baseline-missing')
    if base_snap and bl and not bl.get('attestation_valid',False): errors.append('baseline-attestation-invalid')
    if base_snap and bl and bl.get('policy_sha256') and bl['policy_sha256']!=ph: errors.append('baseline-policy-lineage-mismatch')
    if base_snap and bl and bl.get('snapshot_sha256')!=base_snap.get('sha256'): errors.append('baseline-snapshot-lineage-mismatch')
    if base_snap and bl and bl.get('schema_version') != SCHEMA_VERSION: errors.append('baseline-schema-lineage-mismatch')
    decision='PASS' if not errors else 'BLOCKED'; errs=sorted(set(errors))
    policy_bundle={'version':policy.get('version','24.0.0'),'sha256':ph,'sources':sources,'resolved':policy}
    state={'schema_version':SCHEMA_VERSION,'skill_version':SCHEMA_VERSION,'engine_version':SCHEMA_VERSION,'run_id':str(uuid.uuid4()),
      'project_model':build_project_model(repo),'baseline_snapshot':base_snap,'baseline_complexity':base_complexity if base_snap else None,'semantic_api':__import__('engine.analysis',fromlist=['_api_index'])._api_index(repo),
      'snapshot':before,'final_snapshot':final,'semantic_change':sem,'complexity':complexity_r,'complexity_delta':cd,'typescript_quality':tsq_r,
      'workspace_analysis':rse_r.get('workspace_analysis',{}),'export_validation':rse_r.get('export_validation',{}),
      'adapter_commands':adapter_commands(repo),'adapters':adapters(repo),'adapter_contracts':adapter_contracts(repo),
      'policy':policy_bundle,'provenance':collect(),'repo_identity':identity(repo),'baseline_lineage':bl or {},
      'execution_chain_sha256':chain_hash(before,evidence,final),'risk':current_risk,'baseline_risk':base_risk,
      'decision':decision,'errors':errs,'failure_types':sorted({classify(e) for e in errs}),
      'failures':records(errs),'evidence':evidence,
      'trust':{'level':'UNTRUSTED' if decision!='PASS' else 'UNVERIFIED','integrity_verified':False},
      'finding_summary':_finding_summary(evidence),
      'verification':{'status':'UNVERIFIED','verified_at':None}}
    out.parent.mkdir(parents=True,exist_ok=True); write(build(state),out)
    return 0 if decision=='PASS' else 2

def _finding_summary(evidence):
    findings=[]
    blocking={'critical','high','blocker','error'}
    for e in evidence:
        if e.get('kind')=='analysis':
            findings.extend(e.get('content',{}).get('findings',[]) or [])
        if e.get('kind')=='execution' and e.get('status') not in ('PASS','pass',None):
            findings.append({'severity':'high','rule':'execution-failure'})
    b=sum(1 for f in findings if str(f.get('severity','')).lower() in blocking or f.get('blocking') is True)
    return {'total':len(findings),'blocking':b,'advisory':len(findings)-b}

if __name__=='__main__': raise SystemExit(main())
