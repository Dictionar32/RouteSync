TYPES={
'TEST_FAILED','TOOL_UNAVAILABLE','POLICY_CONFLICT','UNSAFE_COMMAND',
'BASELINE_INVALID','REPOSITORY_MUTATED','ANALYZER_FAILED','ENVIRONMENT_UNSUPPORTED',
'RISK_REGRESSION','VERIFICATION_FAILED','SCHEMA_INVALID','LINEAGE_INVALID',
'POLICY_DRIFT','COMPLEXITY_MISMATCH','ADAPTER_FAILED','FINDING_BLOCKED',
'FINDING_ADVISORY'
}
CODES={
'COMPLEXITY_MISMATCH','COMPLEXITY_DELTA_RECOMPUTATION_MISMATCH','FAILURE_RECOMPUTATION_MISMATCH',
'PARENT_ATTESTATION_DIGEST_MISMATCH','PARENT_REPOSITORY_IDENTITY_MISMATCH',
'POLICY_DRIFT','POLICY_SOURCE_LINEAGE_MISMATCH'
}
def classify(error):
    m=str(error).lower()
    if 'schema' in m: return 'SCHEMA_INVALID'
    if 'policy-drift' in m or 'policy-source' in m: return 'POLICY_DRIFT'
    if 'parent-' in m or 'lineage' in m: return 'LINEAGE_INVALID'
    if 'failure' in m and 'mismatch' in m: return 'FAILURE_RECOMPUTATION_MISMATCH'
    if 'complexity' in m and ('mismatch' in m or 'delta' in m): return 'COMPLEXITY_MISMATCH'
    if 'adapter' in m: return 'ADAPTER_FAILED'
    if 'policy' in m: return 'POLICY_CONFLICT'
    if 'tool-not-found' in m or 'tool-unavailable' in m: return 'TOOL_UNAVAILABLE'
    if 'destructive' in m or 'unsafe' in m: return 'UNSAFE_COMMAND'
    if 'baseline' in m: return 'BASELINE_INVALID'
    if 'repository-mutated' in m or 'repo-identity' in m: return 'REPOSITORY_MUTATED'
    if 'risk-regression' in m: return 'RISK_REGRESSION'
    if 'analyzer' in m or 'analysis-recomputation' in m: return 'ANALYZER_FAILED'
    if 'finding' in m or 'quality-' in m: return 'FINDING_BLOCKED'
    return 'TEST_FAILED'
def records(errors):
    out=[]
    for e in sorted(set(errors)):
        t=classify(e)
        sev='critical' if t in {'SCHEMA_INVALID','LINEAGE_INVALID','REPOSITORY_MUTATED','POLICY_DRIFT'} else ('high' if t in {'COMPLEXITY_MISMATCH','RISK_REGRESSION','ANALYZER_FAILED','ADAPTER_FAILED'} else 'medium')
        out.append({'code':e,'type':t,'severity':sev})
    return out
