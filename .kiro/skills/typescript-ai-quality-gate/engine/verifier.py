from __future__ import annotations
import json,sys,hashlib
from pathlib import Path
from .canonical import sha256_json
from .snapshot import snapshot,diff
from .evidence import validate
from .policy import LEVELS,risk
from .schema import validate_attestation
from .analysis import complexity,complexity_delta,style,reuse,architecture,semantic_change,_api_index
from .provenance import collect
from .identity import identity
from .project_model import build_project_model
from .verifier_tsq import recompute as recompute_tsq_metrics, recompute_semantic, recompute_security_invariants

SCHEMA_VERSION='28.4.0'

def chain_hash(before,evidence,final):
    h=hashlib.sha256(before['sha256'].encode()).hexdigest()
    for e in sorted(evidence,key=lambda x:x.get('execution',{}).get('seq',10**9)):
        ex=e.get('execution',{}); h=hashlib.sha256((h+e['id']+e['content_sha256']+str(ex.get('seq'))+str(ex.get('started'))+str(ex.get('ended'))).encode()).hexdigest()
    return hashlib.sha256((h+final['sha256']).encode()).hexdigest()

def att_digest(obj):
    x=dict(obj); x.pop('attestation_sha256',None); return sha256_json(x)

def _parent_ref_identity(p):
    return p.get('repo_identity') or {}

def verify_parent(parent_path, child, errors, schema_path=None):
    if not parent_path:
        if child.get('baseline_snapshot') is not None: errors.append('parent-attestation-not-supplied')
        return
    try:
        p=json.loads(Path(parent_path).read_text()); claimed=p.get('attestation_sha256')
        if not claimed or att_digest(p)!=claimed: errors.append('parent-attestation-digest-mismatch')
        else:
            errors.extend('parent-intrinsic-'+e for e in _intrinsic_errors(p,schema_path))
        bl=child.get('baseline_lineage') or {}
        if bl.get('parent_attestation_sha256')!=claimed: errors.append('parent-attestation-lineage-mismatch')
        ps=(p.get('final_snapshot') or p.get('snapshot') or {}).get('sha256')
        if ps != child.get('baseline_snapshot',{}).get('sha256'): errors.append('parent-snapshot-lineage-mismatch')
        if p.get('policy',{}).get('sha256') != bl.get('policy_sha256'): errors.append('parent-policy-lineage-mismatch')
        if p.get('schema_version') != bl.get('schema_version'): errors.append('parent-schema-lineage-mismatch')
        if p.get('complexity') != child.get('baseline_complexity'): errors.append('parent-complexity-lineage-mismatch')
        if _parent_ref_identity(p) != bl.get('repo_identity'): errors.append('parent-repo-identity-lineage-mismatch')
        # Parent identity is the identity of the baseline, not the current child.
        # A valid change is expected to produce a different current repo identity.
    except Exception: errors.append('parent-attestation-invalid')


BLOCKING_SEVERITIES={'critical','high','blocker','error'}

def recompute_findings(evidence):
    findings=[]
    for e in evidence:
        if e.get('kind')=='analysis':
            findings.extend(e.get('content',{}).get('findings',[]) or [])
        if e.get('kind')=='execution' and e.get('status') not in ('PASS','pass',None):
            findings.append({
                'id': 'execution:'+str(e.get('id','unknown')),
                'analyzer':'execution','rule':'execution-failure',
                'path':e.get('content',{}).get('cwd',''),
                'message':e.get('content',{}).get('stderr') or e.get('content',{}).get('error') or 'execution failed',
                'severity':'high'
            })
    return findings

def recompute_summary(evidence):
    findings=recompute_findings(evidence)
    blocking=sum(1 for f in findings if str(f.get('severity','')).lower() in BLOCKING_SEVERITIES or f.get('blocking') is True)
    return {'total':len(findings),'blocking':blocking,'advisory':len(findings)-blocking}

def recompute_failures(errors):
    from .failures import records
    return records(errors)

def recompute_failure_types(failures):
    return sorted({str(x.get('type')) for x in failures})

def expected_decision(errors, summary, policy, evidence=None):
    required=(policy or {}).get('required',{}) if isinstance(policy,dict) else {}
    if errors and required.get('fail_closed',True): return 'BLOCKED'
    if summary.get('blocking',0)>0: return 'BLOCKED'
    tq=(policy or {}).get('typescript_quality',{}) if isinstance(policy,dict) else {}
    if tq.get('enabled',False):
        threshold=int(tq.get('minimum_score',85))
        report=next((e.get('content',{}) for e in (evidence or []) if e.get('id')=='typescript-quality-analysis'),None)
        if report is not None and (int(report.get('score',0)) < threshold or report.get('status') == 'FAIL'):
            return 'BLOCKED'
    return 'PASS'

def _bundled_schema_path():
    return Path(__file__).resolve().parents[1] / 'schemas' / 'attestation.schema.json'


def _schema_path(schema_path):
    path=Path(schema_path) if schema_path else _bundled_schema_path()
    return path if path.exists() else None


def _reconstruct_attested_policy(policy_obj):
    """Reconstruct policy only from attested embedded sources.

    The live repository policy may be checked separately for drift, but it is
    never an input to risk or decision recomputation.
    """
    ap=policy_obj if isinstance(policy_obj,dict) else {}
    resolved=ap.get('resolved')
    if not isinstance(resolved,dict):
        raise ValueError('resolved-policy-missing')
    if sha256_json(resolved)!=ap.get('sha256'):
        raise ValueError('resolved-policy-digest-mismatch')
    merged={}
    def merge_into(dst,src):
        for k,v in src.items():
            if isinstance(v,dict) and isinstance(dst.get(k),dict):
                merge_into(dst[k],v)
            else:
                dst[k]=v
    sources=ap.get('sources',[])
    if not isinstance(sources,list) or not sources:
        raise ValueError('policy-sources-empty')
    for src in sources:
        content=src.get('content')
        if not isinstance(content,dict):
            raise ValueError('policy-source-content-missing:'+str(src.get('path')))
        if sha256_json(content)!=src.get('sha256'):
            raise ValueError('policy-source-content-digest-mismatch:'+str(src.get('path')))
        merge_into(merged,content)
    if sources and sha256_json(merged)!=ap.get('sha256'):
        raise ValueError('policy-bundle-reconstruction-mismatch')
    return resolved


def _intrinsic_errors(a, schema_path=None):
    """Validate an attestation without trusting the current repository.

    This is used for source attestations and baselines. It deliberately does not
    compare snapshots, provenance, or repo identity with the live repository.
    """
    errors=[]
    claimed=a.get('attestation_sha256')
    if not claimed or att_digest(a)!=claimed:
        errors.append('attestation-digest-mismatch')
    sp=_schema_path(schema_path)
    if sp is None:
        errors.append('schema-unavailable')
    else:
        errors.extend(validate_attestation(a,sp))
    for key in ('schema_version','skill_version','engine_version'):
        if a.get(key)!=SCHEMA_VERSION: errors.append(key+'-mismatch')
    if a.get('policy',{}).get('version')!=SCHEMA_VERSION: errors.append('policy-version-mismatch')
    ap=a.get('policy',{})
    try:
        resolved=_reconstruct_attested_policy(ap)
    except ValueError as exc:
        resolved=ap.get('resolved') if isinstance(ap.get('resolved'),dict) else None
        errors.append(str(exc))
    except Exception:
        resolved=ap.get('resolved') if isinstance(ap.get('resolved'),dict) else None
        errors.append('policy-bundle-reconstruction-failed')
    ev=a.get('evidence',[])
    for e in ev:
        if sha256_json(e.get('content',{}))!=e.get('content_sha256'): errors.append('evidence-digest-mismatch:'+str(e.get('id')))
        ex=e.get('execution',{})
        if ex.get('started') is not None and ex.get('ended') is not None and ex['ended']<ex['started']:
            errors.append('execution-time-invalid:'+str(e.get('id')))
    errors.extend(validate(ev))
    seqs=[e.get('execution',{}).get('seq') for e in ev if e.get('execution',{}).get('seq') is not None]
    if len(seqs)!=len(set(seqs)): errors.append('execution-sequence-invalid')
    if a.get('execution_chain_sha256') != chain_hash(a.get('snapshot',{}),ev,a.get('final_snapshot',{})):
        errors.append('execution-chain-mismatch')
    baseline=a.get('baseline_snapshot') or a.get('snapshot')
    try:
        sem=semantic_change(baseline,a.get('snapshot') or {},current_api=a.get('semantic_api') or {})
        actual_risk=risk(diff(baseline,a.get('snapshot') or {}),resolved or {},sem)
        if actual_risk!=a.get('risk'): errors.append('risk-recomputation-mismatch')
        if a.get('baseline_risk') is not None and LEVELS.get(actual_risk,-1)>LEVELS.get(a.get('baseline_risk'),-1): errors.append('risk-regression')
        stored_sem=a.get('semantic_change') or {}
        # Baseline/source intrinsic validation has no live repository, so dependency affected-graph
        # metadata cannot be reconstructed from hashes alone. All hash-derived semantic fields remain strict.
        if {k:v for k,v in stored_sem.items() if k!='affected_graph'} != {k:v for k,v in sem.items() if k!='affected_graph'}:
            errors.append('semantic-change-recomputation-mismatch')
    except Exception:
        errors.append('risk-recomputation-failed')
    try:
        bc=a.get('baseline_complexity')
        if bc is None:
            bc={'files':0,'lines':0,'functions':0,'branches':0,'max_nesting':0,'findings':[]}
        cd=complexity_delta(bc,a.get('complexity') or {})
        if cd!=a.get('complexity_delta'): errors.append('complexity-delta-recomputation-mismatch')
    except Exception:
        errors.append('complexity-delta-recomputation-failed')
    summary=recompute_summary(ev)
    if a.get('finding_summary')!=summary: errors.append('finding-summary-mismatch')
    base_errors=sorted(set(errors))
    expected_failures=recompute_failures(base_errors)
    if a.get('failures',[])!=expected_failures: errors.append('failures-mismatch')
    expected_types=recompute_failure_types(expected_failures)
    if sorted(a.get('failure_types',[]))!=expected_types: errors.append('failure-types-mismatch')
    if [str(x) for x in a.get('errors',[])]!=base_errors: errors.append('errors-mismatch')
    expected_dec=expected_decision(base_errors,summary,resolved or {},ev)
    if a.get('decision')!=expected_dec: errors.append('decision-mismatch')
    status=(a.get('verification') or {}).get('status')
    trust=a.get('trust') or {}
    expected_trust='UNTRUSTED' if expected_dec!='PASS' else ('VERIFIED' if status=='PASS' else 'UNVERIFIED')
    if trust.get('level')!=expected_trust: errors.append('trust-state-mismatch')
    if expected_trust=='VERIFIED' and trust.get('integrity_verified') is not True:
        errors.append('trust-integrity-flag-mismatch')
    if status=='PASS' and expected_dec!='PASS': errors.append('verification-pass-on-blocked-attestation')
    return sorted(set(errors))


def _verify_source_file(source_path, repo, schema_path=None):
    try:
        source=json.loads(Path(source_path).read_text())
    except Exception:
        return ['verified-source-unreadable']
    errs=_intrinsic_errors(source,schema_path)
    if source.get('verification',{}).get('status')=='PASS' or source.get('trust',{}).get('level')=='VERIFIED':
        errs.append('verified-source-must-be-unverified')
    if source.get('decision')!='PASS' or source.get('errors')!=[]:
        errs.append('verified-source-must-be-pass')
    # The source is the attestation that was actually checked against the live repo.
    try:
        actual=snapshot(repo)
        if actual.get('sha256') != (source.get('snapshot') or {}).get('sha256'):
            errs.append('verified-source-snapshot-mismatch')
        if actual.get('sha256') != (source.get('final_snapshot') or {}).get('sha256'):
            errs.append('verified-source-final-snapshot-mismatch')
        if source.get('repo_identity') and source.get('repo_identity') != identity(repo):
            errs.append('verified-source-repo-identity-mismatch')
    except Exception:
        errs.append('verified-source-live-repo-validation-failed')
    return sorted(set(errs))


def verify(att,repo,schema_path=None,parent_path=None,source_path=None):
    a=json.loads(Path(att).read_text()); errors=[]; claimed=a.get('attestation_sha256')
    if att_digest(a)!=claimed: errors.append('attestation-digest-mismatch')
    sp=_schema_path(schema_path)
    if sp is None: errors.append('schema-unavailable')
    else: errors += validate_attestation(a,sp)
    for key in ('schema_version','skill_version','engine_version'):
        if a.get(key)!=SCHEMA_VERSION: errors.append(key+'-mismatch')
    if a.get('policy',{}).get('version')!=SCHEMA_VERSION: errors.append('policy-version-mismatch')
    actual=snapshot(repo)
    if actual['sha256']!=a['snapshot']['sha256']: errors.append('snapshot-mismatch')
    if actual['sha256']!=a['final_snapshot']['sha256']: errors.append('final-snapshot-mismatch')
    for e in a.get('evidence',[]):
        if sha256_json(e.get('content',{}))!=e.get('content_sha256'): errors.append('evidence-digest-mismatch:'+e['id'])
        ex=e.get('execution',{})
        if ex.get('started') is not None and ex.get('ended') is not None and ex['ended']<ex['started']: errors.append('execution-time-invalid:'+e['id'])
    errors+=validate(a.get('evidence',[]))
    # Reproduce run-time gate invariants so errors/decision remain independently
    # recomputable even when a repository has no executable adapter.
    ev=a.get('evidence',[])
    if not ev or not any(e.get('kind')=='execution' for e in ev):
        errors.append('required-execution-evidence-missing')
    if any(e.get('status')=='FAIL' for e in ev):
        errors.append('required-evidence-failed')
    if any(e.get('status')=='BLOCKED' and e.get('kind')=='execution' for e in ev):
        errors.append('execution-not-verifiable')
    ap=a.get('policy',{})
    try:
        resolved=_reconstruct_attested_policy(ap)
    except ValueError as exc:
        resolved=ap.get('resolved') if isinstance(ap.get('resolved'),dict) else None
        errors.append(str(exc))
    except Exception:
        resolved=ap.get('resolved') if isinstance(ap.get('resolved'),dict) else None
        errors.append('policy-bundle-reconstruction-failed')
    # Current filesystem policy is only used to detect drift, never as the source of the risk decision.
    try:
        from .policy import resolve
        current,current_hash,current_sources,conf=resolve(repo)
        if current_hash!=ap.get('sha256'): errors.append('policy-drift-since-attestation')
        if conf: errors.extend('policy-conflict:'+c for c in conf)
    except Exception: errors.append('policy-current-resolution-failed')
    baseline=a.get('baseline_snapshot') or a.get('snapshot')
    sem=semantic_change(baseline,a['snapshot'],repo); actual_risk=risk(diff(baseline,a['snapshot']),resolved or {},sem)
    if actual_risk!=a.get('risk'): errors.append('risk-recomputation-mismatch')
    if a.get('baseline_risk') is not None and LEVELS.get(actual_risk,-1)>LEVELS.get(a['baseline_risk'],-1): errors.append('risk-regression')
    if a.get('provenance') and a['provenance']!=collect(): errors.append('provenance-mismatch')
    if a.get('repo_identity') and a['repo_identity']!=identity(repo): errors.append('repo-identity-mismatch')
    if a.get('project_model') != build_project_model(repo): errors.append('project-model-mismatch')
    if a.get('semantic_api') != _api_index(repo): errors.append('semantic-api-attestation-mismatch')
    # Independent TSQ integrity recomputation. This deliberately uses a separate
    # verifier implementation and only checks invariant source metrics; the analyzer
    # remains responsible for rich semantic findings. This prevents a single analyzer
    # implementation from being the sole trust root for the attestation.
    tq_att=a.get('typescript_quality') or {}
    if tq_att.get('files',0) or tq_att.get('metrics'):
        try:
            ind=recompute_tsq_metrics(repo)
            attm=tq_att.get('metrics') or {}
            for k in ('files','lines','functions','any','ts_ignores','console_logs','todo_fixme','max_function_lines','max_complexity','max_nesting'):
                if int(attm.get(k,0)) != int(ind.get(k,0)):
                    errors.append('typescript-quality-independent-metric-mismatch:'+k)
        except Exception:
            errors.append('typescript-quality-independent-recompute-failed')
        try:
            sem_ind=recompute_semantic(repo)
            sem_att=attm
            if not sem_ind.get('available'):
                errors.append('typescript-semantic-independent-verification-unavailable')
            else:
                for k in ('files','semantic_diagnostics','resolved_imports','unresolved_relative_imports','unused_imports','exported_symbols'):
                    if int(sem_att.get(k,0)) != int(sem_ind.get(k,0)):
                        errors.append('typescript-semantic-independent-metric-mismatch:'+k)
        except Exception:
            errors.append('typescript-semantic-independent-recompute-failed')
        if any(k in attm for k in ('security_findings','security_high','security_critical')):
            try:
                sec_ind=recompute_security_invariants(repo)
                for k,sk in (('security_findings','total'),('security_high','high'),('security_critical','critical')):
                    if int(attm.get(k,0)) != int(sec_ind.get(sk,0)):
                        errors.append('security-independent-metric-mismatch:'+k)
            except Exception:
                errors.append('security-independent-recompute-failed')

    for name,fn in [('style',style),('reuse',reuse),('architecture',architecture),('complexity',complexity)]:
        eid=name+'-analysis'
        expected=next((e for e in a.get('evidence',[]) if e['id']==eid),None)
        if not expected: errors.append('missing-analysis-evidence:'+name)
        else:
            recomputed=fn(repo)
            if expected.get('content')!=recomputed: errors.append('analysis-recomputation-mismatch:'+name)
            if name=='complexity' and a.get('complexity')!=recomputed: errors.append('complexity-attestation-mismatch')
    # TypeScript quality is intentionally NOT recomputed with the production analyzer here.
    # Its evidence digest is covered by the attestation, while verifier_tsq.py independently
    # recomputes invariant source metrics above. This avoids sharing the analyzer as a trust root.
    if not any(e.get('id')=='typescript-quality-analysis' for e in a.get('evidence',[])):
        errors.append('missing-analysis-evidence:typescript_quality')
    baseline_complexity=a.get('baseline_complexity') or {'files':0,'lines':0,'functions':0,'branches':0,'max_nesting':0,'findings':[]}
    recomputed_delta=complexity_delta(baseline_complexity,a.get('complexity') or {})
    if recomputed_delta!=a.get('complexity_delta'): errors.append('complexity-delta-recomputation-mismatch')
    ev=a.get('evidence',[]); seqs=[e.get('execution',{}).get('seq') for e in ev if e.get('execution',{}).get('seq') is not None]
    if len(seqs)!=len(set(seqs)): errors.append('execution-sequence-invalid')
    if a.get('execution_chain_sha256')!=chain_hash(a['snapshot'],ev,a['final_snapshot']): errors.append('execution-chain-mismatch')

    # Independent semantic verification: claims are not trusted merely because
    # the attestation hash was recomputed.
    base_errors=sorted(set(errors))
    summary=recompute_summary(a.get('evidence',[]))
    if a.get('finding_summary') != summary:
        errors.append('finding-summary-mismatch')
    expected_failures=recompute_failures(base_errors)
    if a.get('failures',[]) != expected_failures:
        errors.append('failures-mismatch')
    expected_failure_types=recompute_failure_types(expected_failures)
    if sorted(a.get('failure_types',[])) != expected_failure_types:
        errors.append('failure-types-mismatch')
    if [str(x) for x in a.get('errors',[])] != base_errors:
        errors.append('errors-mismatch')
    expected=expected_decision(base_errors,summary,resolved or {},a.get('evidence',[]))
    if a.get('decision') != expected:
        errors.append('decision-mismatch')
    verification_status=(a.get('verification') or {}).get('status')
    if expected != 'PASS':
        expected_trust='UNTRUSTED'
    elif verification_status == 'PASS':
        expected_trust='VERIFIED'
    else:
        expected_trust='UNVERIFIED'
    trust=a.get('trust') or {}
    if trust.get('level') != expected_trust:
        errors.append('trust-state-mismatch')
    if expected_trust=='VERIFIED':
        if trust.get('integrity_verified') is not True:
            errors.append('trust-integrity-flag-mismatch')
        source=(a.get('verification') or {}).get('verified_attestation_of')
        if not source:
            errors.append('verified-source-digest-missing')
        elif source == a.get('attestation_sha256'):
            errors.append('verified-source-self-reference')
        if not source_path:
            errors.append('verified-source-not-supplied')
        else:
            try:
                pa=json.loads(Path(source_path).read_text())
                if att_digest(pa) != source:
                    errors.append('verified-source-digest-mismatch')
                errors.extend(_verify_source_file(source_path,repo,sp))
            except Exception:
                errors.append('verified-source-unreadable')
    elif (a.get('verification') or {}).get('status')=='PASS':
        errors.append('verification-pass-without-verified-trust')
    # For a normal UNVERIFIED attestation parent_path is the baseline parent.
    # For an already VERIFIED artifact source_path is the verified source and
    # baseline lineage is validated intrinsically in that source chain.
    if verification_status != 'PASS':
        verify_parent(parent_path,a,errors,sp)
    return sorted(set(errors))


def write_verified(att_path, output_path, errors):
    if errors:
        return False
    from datetime import datetime, timezone
    a=json.loads(Path(att_path).read_text())
    source_digest=a.get('attestation_sha256') or att_digest(a)
    a['trust']={
        'level':'VERIFIED',
        'integrity_verified':True,
        'verified_by':'quality-verify.py',
        'verification_errors':[]
    }
    a['verification']={
        'status':'PASS',
        'verified_at':datetime.now(timezone.utc).isoformat(),
        'verified_attestation_of':source_digest
    }
    a.pop('attestation_sha256',None)
    a['attestation_sha256']=sha256_json(a)
    Path(output_path).write_text(json.dumps(a,indent=2,sort_keys=True)+'\n')
    return True

def main():
    if len(sys.argv) not in (3,4,5,6,7): return 2
    schema=sys.argv[3] if len(sys.argv)>=4 else None
    parent=sys.argv[4] if len(sys.argv)>=5 else None
    # With 6 argv entries the final path is an output when the input is
    # UNVERIFIED, and a source attestation when the input is already VERIFIED.
    output=None; source=None
    if len(sys.argv)==6:
        try:
            input_obj=json.loads(Path(sys.argv[1]).read_text())
            if (input_obj.get('verification') or {}).get('status')=='PASS': source=sys.argv[5]
            else: output=sys.argv[5]
        except Exception:
            output=sys.argv[5]
    elif len(sys.argv)==7:
        output=sys.argv[5]; source=sys.argv[6]
    errors=verify(sys.argv[1],sys.argv[2],schema,parent,source)
    if errors: print('VERIFY_FAIL'); [print('-',e) for e in errors]; return 1
    if output is not None:
        write_verified(sys.argv[1],output,errors)
        print('VERIFIED_ATTESTATION_WRITTEN')
    print('VERIFY_PASS'); return 0
if __name__=='__main__': raise SystemExit(main())
