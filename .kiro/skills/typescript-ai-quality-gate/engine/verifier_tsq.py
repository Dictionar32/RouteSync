from __future__ import annotations
import re
from pathlib import Path

EXTS={'.ts','.tsx'}
IGNORE={'.git','node_modules','vendor','dist','build','coverage'}

def _files(repo):
    root=Path(repo); out=[]
    for p in root.rglob('*'):
        if p.is_file() and p.suffix.lower() in EXTS and not any(x in p.parts for x in IGNORE): out.append(p)
    return sorted(out)

def _read(p):
    try:return p.read_text(encoding='utf-8')
    except (OSError, UnicodeError): return p.read_text(errors='ignore')

def _strip(text):
    return re.sub(r'//[^\n]*|/\*.*?\*/|("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`)', '', text, flags=re.S)

def recompute(repo):
    files=_files(repo); metrics={'files':len(files),'lines':0,'functions':0,'any':0,'ts_ignores':0,'console_logs':0,'todo_fixme':0,'max_function_lines':0,'max_complexity':0,'max_nesting':0,'unused_imports':0,'duplicate_types':0}
    for p in files:
        text=_read(p); clean=_strip(text); lines=text.splitlines(); metrics['lines']+=len(lines)
        metrics['any']+=len(re.findall(r'\bany\b',clean))
        metrics['ts_ignores']+=len(re.findall(r'@ts-(?:ignore|expect-error|nocheck)\b',text))
        metrics['console_logs']+=len(re.findall(r'\bconsole\.(?:log|debug|info)\s*\(',clean))
        metrics['todo_fixme']+=len(re.findall(r'\b(?:TODO|FIXME)\b',text,re.I))
        # Independent structural scan: function declarations/arrow/function expressions,
        # brace matching and control constructs. This intentionally does not call TSQ.
        patterns=[r'\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*[^\{]*\{',r'\b(?:async\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{',r'\b(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{']
        fn_matches=[]
        for pat in patterns: fn_matches.extend(re.finditer(pat,clean))
        uniq={}
        for m in fn_matches:
            name=next((g for g in m.groups() if g),'<anonymous>')
            if name in {'if','for','while','switch','catch'}: continue
            key=(clean.count('\n',0,m.start())+1,name)
            uniq[key]=m
        fn_matches=list(uniq.values())
        metrics['functions']+=len(fn_matches)
        for m in fn_matches:
            start=text.count('\n',0,m.start())+1; brace=m.end()-1; depth=0; end=len(text)
            for i,ch in enumerate(clean[brace:],brace):
                if ch=='{': depth+=1
                elif ch=='}':
                    depth-=1
                    if depth==0: end=i; break
            fl=max(1,text.count('\n',m.start(),end)+1); metrics['max_function_lines']=max(metrics['max_function_lines'],fl)
            body=clean[brace:end]
            controls=len(re.findall(r'\b(?:if|for|while|case|catch|switch)\b|&&|\|\||\?\?',body))
            metrics['max_complexity']=max(metrics['max_complexity'],1+controls)
            # Conservative nesting of control blocks only (function/object braces
            # are not counted). This mirrors the semantic meaning of the TSQ rule.
            control_open=[]
            for cm in re.finditer(r'\b(?:if|for|while|switch|catch)\b[^{};]{0,180}\{',body):
                control_open.append(cm.end()-1)
            opens=set(control_open); stack=[]; mx=0
            for i,ch in enumerate(body):
                if ch=='{':
                    stack.append(i in opens); mx=max(mx,sum(1 for x in stack if x))
                elif ch=='}' and stack:
                    stack.pop()
            metrics['max_nesting']=max(metrics['max_nesting'],mx)
    return metrics


def recompute_semantic(repo):
    """Independent semantic TypeScript verification using a fresh Node process.
    Returns a compact invariant summary; never imports production analysis.py.
    """
    import json, os, shutil, subprocess
    root=Path(repo).resolve()
    paths=[p for p in _files(root)]
    if not paths:
        return {'available': True, 'files': 0, 'diagnostics': 0, 'resolved_imports': 0, 'unresolved_relative_imports': 0, 'unused_imports': 0, 'exported_symbols': 0}
    if shutil.which('node') is None:
        return {'available': False, 'error': 'node-runtime-unavailable'}
    script=r"""const path=require('path');
const repo=path.resolve(process.argv[1]), files=process.argv.slice(2);
function resolveTS(){let cur=repo,c=[];while(true){c.push(path.join(cur,'node_modules','typescript'));let p=path.dirname(cur);if(p===cur)break;cur=p;}try{c.push(require.resolve('typescript',{paths:[repo]}));}catch(e){} if(process.env.NODE_PATH)for(const r of process.env.NODE_PATH.split(path.delimiter))c.push(path.join(r,'typescript'));for(const x of c){try{return require(x)}catch(e){}}return null;}
const ts=resolveTS(); if(!ts){console.log(JSON.stringify({available:false,error:'typescript-package-unavailable'}));process.exit(0);}
try{
 const cfg=ts.findConfigFile(repo,ts.sys.fileExists,'tsconfig.json');
 let opts={target:ts.ScriptTarget.Latest,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,skipLibCheck:true};
 let roots=files;
 if(cfg){const c=ts.readConfigFile(cfg,ts.sys.readFile);if(c.error)throw new Error('tsconfig-read-failed');const pc=ts.parseJsonConfigFileContent(c.config,ts.sys,path.dirname(cfg));opts={...pc.options,skipLibCheck:true};if(pc.fileNames?.length)roots=Array.from(new Set(pc.fileNames.concat(files))); }
 const program=ts.createProgram(roots,opts), checker=program.getTypeChecker(), diags=program.getSemanticDiagnostics();
 let resolved=0,unresolved=0,unused=0,exports=0;
 function refsFor(f,sym,skip){let n=0;function walk(x){if(x===skip)return;if(ts.isIdentifier(x)){try{const s2=checker.getSymbolAtLocation(x);if(s2===sym)n++;}catch(e){}}ts.forEachChild(x,walk);}ts.forEachChild(f,walk);return n;}
 for(const p of files){const f=program.getSourceFile(p);if(!f)continue;f.forEachChild(n=>{if(ts.isImportDeclaration(n)||ts.isExportDeclaration(n)){const spec=n.moduleSpecifier;if(spec&&ts.isStringLiteral(spec)){const r=ts.resolveModuleName(spec.text,p,program.getCompilerOptions(),ts.sys);if(r&&r.resolvedModule)resolved++;else if(spec.text.startsWith('.'))unresolved++;}} if((ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n)||ts.isVariableStatement(n)) && n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)) exports++; if(ts.isImportDeclaration(n)&&n.importClause){const clause=n.importClause;const locals=[];if(clause.name)locals.push(clause.name);if(clause.namedBindings){if(ts.isNamespaceImport(clause.namedBindings))locals.push(clause.namedBindings.name);else if(ts.isNamedImports(clause.namedBindings))for(const sp of clause.namedBindings.elements)locals.push(sp.name);}for(const local of locals){const sym=checker.getSymbolAtLocation(local);if(sym&&refsFor(f,sym,n)<=0)unused++;}}});}
 console.log(JSON.stringify({available:true,files:files.length,semantic_diagnostics:diags.length,resolved_imports:resolved,unresolved_relative_imports:unresolved,unused_imports:unused,exported_symbols:exports}));
}catch(e){console.log(JSON.stringify({available:false,error:'semantic-verification-failed'}));}
"""
    try:
        proc=subprocess.run(['node','-e',script,str(root),*[str(x.resolve()) for x in paths]],cwd=str(root),text=True,capture_output=True,timeout=20)
    except (OSError, subprocess.SubprocessError):
        return {'available':False,'error':'semantic-verification-execution-failed'}
    if proc.returncode!=0:
        return {'available':False,'error':'semantic-verification-process-failed'}
    try: return json.loads(proc.stdout)
    except (TypeError, json.JSONDecodeError): return {'available':False,'error':'semantic-verification-invalid-output'}


def recompute_security_invariants(repo):
    """Independent conservative security invariant scan with bounded data-flow.
    Does not import production analyzer. It verifies the primary analyzer's security
    classification at the invariant/count level while remaining intentionally bounded.
    """
    files=_files(repo); total=high=critical=0
    source=r'(?:req|request)\s*\.\s*(?:body|query|params|headers)|\b(?:userInput|user_input|input|payload|untrusted)\b'
    ident=r'[A-Za-z_$][\w$]*'
    for p in files:
        text=_read(p); tainted=set()
        for m in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;\n]+)',text):
            if re.search(source,m.group(2),re.I): tainted.add(m.group(1))
        for m in re.finditer(r'\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*([^;\n]+)',text):
            if re.search(source,m.group(2),re.I):
                for part in m.group(1).split(','):
                    name=re.split(r'\s*:\s*',part.strip(),maxsplit=1)[-1].strip()
                    if re.fullmatch(ident,name): tainted.add(name)
        for m in re.finditer(r'\b(?:const|let|var)\s*\{[^{}]*\{([^{}]+)\}[^{}]*\}\s*=\s*((?:req|request|ctx|context))\b', text, re.I):
            for nm in re.findall(r'\b'+ident+r'\b(?!\s*:)', m.group(1)):
                tainted.add(nm)
        for _ in range(6):
            changed=False
            for m in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;\n]+)',text):
                if m.group(1) not in tainted and any(re.search(r'\b'+re.escape(x)+r'\b',m.group(2)) for x in tainted): tainted.add(m.group(1)); changed=True
            if not changed: break
        def expr_tainted(x): return bool(re.search(source,x,re.I) or any(re.search(r'\b'+re.escape(t)+r'\b',x) for t in tainted))
        # Same-file function summaries: parameter positions reaching sinks.
        summaries={}
        function_matches=[]
        function_matches.extend(re.finditer(r'\b(?:async\s+)?function\s+('+ident+r')\s*\(([^)]*)\)\s*\{',text))
        function_matches.extend(re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{',text))
        for fm in function_matches:
            name=fm.group(1); params=[]
            for raw in fm.group(2).split(','):
                q=re.sub(r'\s*:\s*.*$','',raw.strip().split('=')[0].strip())
                if re.fullmatch(ident,q): params.append(q)
            depth=1;i=fm.end()
            while i<len(text) and depth:
                if text[i]=='{': depth+=1
                elif text[i]=='}': depth-=1
                i+=1
            body=text[fm.end():max(fm.end(),i-1)]; sinks=set()
            for idx,q in enumerate(params):
                aliases={q}
                for _ in range(4):
                    changed=False
                    for am in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;\n]+)',body):
                        if am.group(1) not in aliases and any(re.search(r'\b'+re.escape(a)+r'\b',am.group(2)) for a in aliases): aliases.add(am.group(1)); changed=True
                    if not changed: break
                sink_re=r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync|Object\.assign)\s*\(' + r'[^)]*\b(?:'+'|'.join(map(re.escape,sorted(aliases)))+r')\b'
                direct_sink=bool(re.search(sink_re,body,re.S))
                source_sink=bool(re.search(r'\b'+re.escape(q)+r'\s*\.\s*(?:body|query|params|headers)\b',body,re.I) and re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync|Object\.assign)\s*\(',body,re.S))
                if direct_sink or source_sink: sinks.add(idx)
            summaries[name]=sinks
            for idx,q in enumerate(params):
                if idx in sinks and (re.fullmatch(r'(?:req|request|ctx|context)',q,re.I) or re.search(r'\b'+re.escape(q)+r'\s*\.\s*(?:body|query|params|headers)\b',body,re.I)):
                    critical += 1; total += 1
        # Bounded same-file wrapper-summary propagation.
        for _hop in range(4):
            changed=False
            for caller_name in list(summaries):
                fpat=r'\b(?:async\s+)?function\s+'+re.escape(caller_name)+r'\s*\(([^)]*)\)\s*\{|\b(?:const|let|var)\s+'+re.escape(caller_name)+r'\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{'
                fm=re.search(fpat,text)
                if not fm: continue
                params_raw=fm.group(1) or fm.group(2) or ''
                params=[]
                for raw in params_raw.split(','):
                    q=re.sub(r'\s*:\s*.*$','',raw.strip().split('=')[0].strip())
                    if re.fullmatch(ident,q): params.append(q)
                depth=1;i=fm.end()
                while i<len(text) and depth:
                    if text[i]=='{': depth+=1
                    elif text[i]=='}': depth-=1
                    i+=1
                body=text[fm.end():max(fm.end(),i-1)]
                for callee,c_sinks in list(summaries.items()):
                    if callee==caller_name: continue
                    for cm in re.finditer(r'\b'+re.escape(callee)+r'\s*\(([^)]*)\)',body,re.S):
                        args=[x.strip() for x in cm.group(1).split(',')]
                        for cidx in c_sinks:
                            if cidx>=len(args): continue
                            for pidx,pname in enumerate(params):
                                if re.search(r'\b'+re.escape(pname)+r'\b',args[cidx]) and pidx not in summaries[caller_name]:
                                    summaries[caller_name].add(pidx); changed=True
            if not changed: break

        for name,sinks in summaries.items():
            for cm in re.finditer(r'\b'+re.escape(name)+r'\s*\(([^)]*)\)',text,re.S):
                prefix=text[max(0,cm.start()-40):cm.start()]
                if re.search(r'\bfunction\s*$',prefix) or re.search(r'\b(?:const|let|var)\s+'+re.escape(name)+r'\s*=\s*$',prefix):
                    continue
                args=[x.strip() for x in cm.group(1).split(',')]
                for idx in sinks:
                    if idx>=len(args):
                        continue
                    # A request-like parameter is not itself proof of taint. The
                    # call argument must carry an explicit untrusted expression.
                    if expr_tainted(args[idx]):
                        critical+=1; total+=1
        for m in re.finditer(r'\b(?:child_process\s*\.\s*)?(?:execFileSync|execFile|execSync|exec|spawnSync|spawn)\s*\((.{0,1500})\)',text,re.I|re.S):
            args=m.group(1); total+=1; untrusted=expr_tainted(args); dynamic=bool(re.search(r'\$\{|\+\s*'+ident+r'|\.concat\s*\(',args))
            if untrusted: critical+=1
            elif dynamic: high+=1
        for m in re.finditer(r'\bObject\.assign\s*\((.{0,1800})\)',text,re.I|re.S):
            args=m.group(1); total+=1; untrusted=expr_tainted(args); dangerous=bool(re.search(r'__proto__|constructor\s*\]|prototype\b',args,re.I))
            if untrusted and dangerous: critical+=1
            elif untrusted or dangerous: high+=1
        # Final32 independent checks: bounded Promise callback and object-return
        # propagation. These intentionally mirror only the concrete one-hop forms
        # used by the primary analyzer; unknown/dynamic flows remain untrusted to
        # neither side of the comparison.
        promise_pat=re.compile(r'\b('+ident+r')\s*\.\s*then\s*\(\s*\(?\s*('+ident+r')\s*\)?\s*=>\s*([^;]+)',re.S)
        for pm in promise_pat.finditer(text):
            receiver,param,body=pm.group(1),pm.group(2),pm.group(3)
            decl=re.search(r'\b(?:const|let|var)\s+'+re.escape(receiver)+r'\s*=\s*[^;]*'+source,text,re.I)
            if decl and re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(param)+r'\b',body,re.S):
                total+=1; critical+=1
        # Final35 independent check: bounded Promise.resolve/reject chains.
        chain_pat=re.compile(r'Promise\.(?:resolve|reject)\s*\(([^;]+?)\)((?:\s*\.\s*(?:then|catch|finally)\s*\(\s*'+ident+r'\s*=>\s*[^;]+?\)){1,4})',re.S)
        for cm in chain_pat.finditer(text):
            upstream=bool(re.search(source,cm.group(1),re.I)) or expr_tainted(cm.group(1))
            if not upstream: continue
            for cb in re.finditer(r'\.\s*(then|catch|finally)\s*\(\s*('+ident+r')\s*=>\s*([^;]+?)\)',cm.group(0),re.S):
                kind,param,body=cb.group(1),cb.group(2),cb.group(3)
                if kind=='finally': continue
                if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(param)+r'\b',body,re.S):
                    total+=1; critical+=1
                upstream=bool(re.fullmatch(re.escape(param),body.strip()))
        object_pat=re.compile(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*(?:await\s+)?('+ident+r')\s*\(([^)]*)\)\s*;',re.S)
        for om in object_pat.finditer(text):
            target,fn,args=om.group(1),om.group(2),om.group(3)
            if re.search(source,args,re.I):
                tail=text[om.end():om.end()+600]
                prop=re.search(r'\b'+re.escape(target)+r'\s*\.\s*('+ident+r')',tail)
                if prop and re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(target)+r'\s*\.\s*'+re.escape(prop.group(1))+r'\b',tail,re.S):
                    total+=1; critical+=1
    return {'total':total,'high':high,'critical':critical}
