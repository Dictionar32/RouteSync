from __future__ import annotations
import ast, json, re, hashlib, subprocess, shutil, os, signal
from pathlib import Path
from .project_model import build_project_model
from .findings import finding, normalize
from .workspace import analyze_workspace
from .exports import validate_exports
from .config import load_config
from .frameworks import validate_frameworks
CODE_EXT={'.ts','.tsx','.js','.jsx','.rs','.sh','.bash','.php','.py','.vue'}
IGNORE={'.git','node_modules','target','vendor','dist','build','__pycache__','.venv','.pytest_cache','.mypy_cache'}
_TS_CACHE={}

def files(repo):
    repo=Path(repo); out=[]
    for p in repo.rglob('*'):
        if p.is_file() and p.suffix.lower() in CODE_EXT and not any(x in p.parts for x in IGNORE): out.append(p)
    return sorted(out)

def project_configs(repo):
    names=['.editorconfig','biome.json','biome.jsonc','.prettierrc','.prettierrc.json','eslint.config.js','eslint.config.mjs','eslint.config.cjs','.eslintrc','.eslintrc.json','tsconfig.json','rustfmt.toml','clippy.toml','phpcs.xml','phpcs.xml.dist','phpstan.neon','phpstan.neon.dist','pint.json','shellcheckrc']
    return [n for n in names if (Path(repo)/n).exists()]

def _safe_read(p):
    try:return p.read_text(errors='strict')
    except UnicodeDecodeError:return p.read_text(errors='ignore')
    except (OSError, UnicodeError):return None

def style(repo):
    repo=Path(repo); raw=[]; configs=project_configs(repo); indent=None
    ec=repo/'.editorconfig'
    if ec.exists():
        m=re.search(r'indent_style\s*=\s*(space|tab)',_safe_read(ec) or ''); indent=m.group(1) if m else None
    for p in files(repo):
        text=_safe_read(p); rel=p.relative_to(repo).as_posix()
        if text is None: raw.append({'path':rel,'rule':'unreadable-source','severity':'critical','message':'Analyzer could not read source'}); continue
        if re.search(r'[ \t]+$',text,re.M): raw.append({'path':rel,'rule':'trailing-whitespace','severity':'medium','message':'Trailing whitespace'})
        if '\t' in text and p.suffix.lower() not in {'.sh','.bash'} and indent!='tab': raw.append({'path':rel,'rule':'tab-indentation','severity':'medium','message':'Tab indentation conflicts with project style'})
        if len(text.splitlines())>800: raw.append({'path':rel,'rule':'large-source-file','severity':'low','message':'Source file exceeds 800 lines'})
    findings=normalize({'findings':raw},'style'); return {'configs':configs,'indent_style':indent,'findings':findings,'ok':not any(x['severity'] in {'medium','high','critical'} for x in findings)}

def _token_norm(s):
    s=re.sub(r'//[^\n]*|/\*.*?\*/|#[^\n]*','',s,flags=re.S)
    s=re.sub(r'(["\'`])(?:\\.|(?!\1).)*\1','STR',s)
    s=re.sub(r'\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b','N',s)
    return re.findall(r'[A-Za-z_$][\w$]*|==?=?|!==?|=>|&&|\|\||[{}()\[\];,:.?+*/%<>-]',s)

def _ast_shape_py(text):
    try:
        tree=ast.parse(text); funcs=[]; public=[]
        for n in ast.walk(tree):
            if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):
                branches=sum(isinstance(x,(ast.If,ast.For,ast.While,ast.Try,ast.With,ast.BoolOp,ast.Match)) for x in ast.walk(n)); funcs.append({'name':n.name,'line':n.lineno,'branches':branches,'params':len(n.args.args)})
                if not n.name.startswith('_'): public.append(f'{n.name}/{len(n.args.args)}')
            elif isinstance(n,(ast.ClassDef,)): public.append(n.name)
        shape=ast.dump(tree,annotate_fields=False,include_attributes=False)
        return funcs,public,hashlib.sha256(shape.encode()).hexdigest()
    except (SyntaxError, ValueError, TypeError):return [],[],None

def _ts_analysis(repo, paths):
    if not paths: return {}
    if not shutil.which('node'): return {'__engine_error__': 'node-runtime-unavailable'}
    repo=Path(repo).resolve()
    paths=sorted({Path(x).resolve() for x in paths})
    # Include every configuration file that can affect module resolution for the
    # analyzed source set: nearest tsconfig/jsconfig plus their extends chain,
    # package.json ancestry, and workspace config. This prevents stale AST/API
    # results when configuration changes without touching source files.
    config_files=set()
    for src in paths:
        cur=src.parent
        while True:
            for name in ('tsconfig.json','jsconfig.json','package.json'):
                q=cur/name
                if q.exists(): config_files.add(q.resolve())
            if cur==repo or repo not in cur.parents: break
            cur=cur.parent
    for name in ('pnpm-workspace.yaml','pnpm-workspace.yml','package.json'):
        q=repo/name
        if q.exists(): config_files.add(q.resolve())
    # Monorepos commonly keep independent tsconfig files below the workspace root.
    # Include them so a package-level resolution change invalidates the shared cache.
    for q in repo.rglob('tsconfig.json'):
        if not any(part in {'.git','node_modules','vendor','target','dist','build'} for part in q.parts):
            config_files.add(q.resolve())
    for q in repo.rglob('jsconfig.json'):
        if not any(part in {'.git','node_modules','vendor','target','dist','build'} for part in q.parts):
            config_files.add(q.resolve())
    # Follow local tsconfig `extends` references transitively.
    queue=list(config_files); seen=set()
    while queue:
        cf=queue.pop()
        if cf in seen: continue
        seen.add(cf)
        if cf.name not in ('tsconfig.json','jsconfig.json'): continue
        try: data=json.loads(cf.read_text())
        except (json.JSONDecodeError, OSError, UnicodeError): continue
        ext=data.get('extends')
        if not ext: continue
        ep=(cf.parent/ext)
        candidates=[ep, Path(str(ep)+'.json'), ep/'tsconfig.json']
        for q in candidates:
            if q.exists(): config_files.add(q.resolve()); queue.append(q.resolve()); break
    config_sig=[]
    for cf in sorted(config_files):
        try:
            st=cf.stat(); config_sig.append((str(cf),st.st_mtime_ns,st.st_size))
        except OSError: pass
    key=(str(repo), tuple((str(x), x.stat().st_mtime_ns, x.stat().st_size) for x in paths if x.exists()), tuple(config_sig))
    if key in _TS_CACHE: return _TS_CACHE[key]
    script=r"""const fs=require('fs'), path=require('path'), crypto=require('crypto');
const repo=path.resolve(process.argv[1]); const files=process.argv.slice(2);
function resolveTS(){
  let cur=repo, candidates=[];
  while(true){ candidates.push(path.join(cur,'node_modules','typescript')); const par=path.dirname(cur); if(par===cur) break; cur=par; }
  try { candidates.push(require.resolve('typescript',{paths:[repo]})); } catch(e) {}
  if(process.env.NODE_PATH) for(const root of process.env.NODE_PATH.split(path.delimiter)) candidates.push(path.join(root,'typescript'));
  for(const c of candidates){ try { return require(c); } catch(e) {} }
  return null;
}
const ts=resolveTS(); if(!ts){ process.exit(3); }
let program=null, checker=null, semanticDiagnostics=[];
try {
  const configPath=ts.findConfigFile(repo, ts.sys.fileExists, 'tsconfig.json');
  let options={target:ts.ScriptTarget.Latest,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,skipLibCheck:true};
  let rootNames=files;
  if(configPath){
    const cfg=ts.readConfigFile(configPath, ts.sys.readFile);
    if(!cfg.error){
      const parsed=ts.parseJsonConfigFileContent(cfg.config, ts.sys, path.dirname(configPath));
      if(parsed.options) options={...parsed.options,skipLibCheck:true};
      if(parsed.fileNames && parsed.fileNames.length) rootNames=Array.from(new Set(parsed.fileNames.concat(files)));
    }
  }
  program=ts.createProgram(rootNames, options); checker=program.getTypeChecker();
  semanticDiagnostics=program.getSemanticDiagnostics();
} catch(e) { program=null; checker=null; }
const out={};
for(const p of files){try{
 const s=fs.readFileSync(p,'utf8'); const f=(program&&program.getSourceFile(p)) || ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true); let funcs=[],pub=[];
 const sem=semanticDiagnostics.filter(d=>{try{return d.file && path.resolve(d.file.fileName)===path.resolve(p)}catch(e){return false}});
 const imports=[]; f.forEachChild(n=>{ if(ts.isImportDeclaration(n)){ const spec=n.moduleSpecifier; if(spec&&ts.isStringLiteral(spec)) imports.push(spec.text); } else if(ts.isExportDeclaration(n)&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier)) imports.push(n.moduleSpecifier.text); });
 const resolvedImports=[]; for(const mod of imports){ try{ const r=ts.resolveModuleName(mod,p,program?program.getCompilerOptions():{},ts.sys); if(r&&r.resolvedModule) resolvedImports.push({specifier:mod,resolvedFile:path.resolve(r.resolvedModule.resolvedFileName)}); else resolvedImports.push({specifier:mod,resolvedFile:null}); }catch(e){ resolvedImports.push({specifier:mod,resolvedFile:null}); }}
 const unusedImports=[];
 function countSemanticReferences(symbol, importNode){
   let count=0;
   function visit(n){
     if(n===importNode) return;
     if(ts.isIdentifier(n)){ try { const s2=checker && checker.getSymbolAtLocation(n); if(s2 && symbol && (s2===symbol)) count++; } catch(e) {} }
     ts.forEachChild(n,visit);
   }
   ts.forEachChild(f,visit);
   return count;
 }
 function inspectImport(n){
   const clause=n.importClause; if(!clause || !checker) return;
   const locals=[];
   if(clause.name) locals.push(clause.name);
   if(clause.namedBindings){
     if(ts.isNamespaceImport(clause.namedBindings)) locals.push(clause.namedBindings.name);
     else if(ts.isNamedImports(clause.namedBindings)) for(const sp of clause.namedBindings.elements) locals.push(sp.name);
   }
   for(const local of locals){
     try { const sym=checker.getSymbolAtLocation(local); const refs=countSemanticReferences(sym,n); if(refs<=0) unusedImports.push(local.text); } catch(e) {}
   }
 }
 f.forEachChild(n=>{ if(ts.isImportDeclaration(n)) inspectImport(n); });
 function complexity(n){let branches=0,maxDepth=0; const controls=new Set([ts.SyntaxKind.IfStatement,ts.SyntaxKind.ForStatement,ts.SyntaxKind.ForOfStatement,ts.SyntaxKind.ForInStatement,ts.SyntaxKind.WhileStatement,ts.SyntaxKind.DoStatement,ts.SyntaxKind.SwitchStatement,ts.SyntaxKind.CaseClause,ts.SyntaxKind.CatchClause,ts.SyntaxKind.ConditionalExpression]); function walk(x,d){const isControl=controls.has(x.kind); const nd=isControl?d+1:d; if(isControl){branches++;maxDepth=Math.max(maxDepth,nd);} if(ts.isBinaryExpression(x)&&(x.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken||x.operatorToken.kind===ts.SyntaxKind.BarBarToken||x.operatorToken.kind===ts.SyntaxKind.QuestionQuestionToken))branches++; ts.forEachChild(x,c=>walk(c,nd));} ts.forEachChild(n,c=>walk(c,0)); return {branches,maxDepth};}
 function typeText(t){return t?t.getText(f).replace(/\s+/g,' '):'';}
 function isExported(n){return !!(n.modifiers&&n.modifiers.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));}
 function isPublicMember(n){const f=ts.getCombinedModifierFlags(n); return (f & (ts.ModifierFlags.Private|ts.ModifierFlags.Protected))===0;}
 function memberSig(m){
   if(ts.isPropertySignature(m)||ts.isPropertyDeclaration(m)){
     const nm=m.name&&m.name.getText(f)||'<computed>'; const opt=m.questionToken?'?':'';
     return nm+opt+':'+typeText(m.type);
   }
   if(ts.isMethodSignature(m)||ts.isMethodDeclaration(m)){
     const nm=m.name&&m.name.getText(f)||'<computed>'; const params=(m.parameters||[]).map(x=>(x.name&&x.name.getText(f)||'?')+(x.questionToken?'?':'')+':'+typeText(x.type)).join(',');
     return nm+'('+params+'):'+typeText(m.type);
   }
   return m.name&&m.name.getText(f)||'';
 }
 function walk(n,exported=false,publicContext=true){
   const ownExport=isExported(n); const ex=exported||ownExport;
   const memberPublic=publicContext && isPublicMember(n);
   if(ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n)||ts.isArrowFunction(n)||ts.isFunctionExpression(n)){
     let name=n.name&&n.name.text;
     if(!name && (ts.isArrowFunction(n)||ts.isFunctionExpression(n)) && n.parent && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) name=n.parent.name.text;
     if(!name) name='<anonymous>';
     const c=complexity(n); const params=n.parameters?n.parameters.length:0;
     const signature=name+'/'+params+'|'+(n.parameters||[]).map(x=>(x.questionToken?'?':'')+typeText(x.type)).join(',')+'|'+typeText(n.type);
     funcs.push({name,line:f.getLineAndCharacterOfPosition(n.pos).line+1,branches:c.branches,max_nesting:c.maxDepth,complexity:1+c.branches,params,signature});
     if(ex&&memberPublic)pub.push(signature);
   }
   if((ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n))&&ex&&n.name&&memberPublic){
     let signature=n.name.text;
     if(ts.isInterfaceDeclaration(n)||ts.isClassDeclaration(n)){
       signature+='|'+n.members.filter(isPublicMember).map(memberSig).join(';');
     }
     pub.push(signature);
   }
   ts.forEachChild(n,x=>walk(x,ex,memberPublic));
 }
 walk(f,false,true);
 let shape='';function sh(n){shape+=n.kind+':'+(ts.isIdentifier(n)?n.text:'')+';';ts.forEachChild(n,sh)}sh(f);const rel=path.relative(repo,p).split(path.sep).join('/');
 const semanticDiagnosticsForFile=sem.map(d=>({code:Number(d.code)||0,category:Number(d.category)||0,start:d.start==null?null:Number(d.start),length:d.length==null?null:Number(d.length),message:ts.flattenDiagnosticMessageText(d.messageText,'\\n')}));
 const moduleResolution=resolvedImports;
 let exportCount=0;
 f.forEachChild(n=>{ if((ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n)||ts.isVariableStatement(n)) && isExported(n)) exportCount++; });
 out[rel]={funcs,public:pub,shape:crypto.createHash('sha256').update(shape).digest('hex'),backend:'typescript-compiler-api',
   semantic_available:!!program&&!!checker,
   semantic_diagnostics:semanticDiagnosticsForFile,
   imports:imports,
   resolved_imports:moduleResolution,
   module_resolution_complete:moduleResolution.every(x=>x.resolvedFile!==null || !x.specifier.startsWith('.')),
   checker_available:!!checker,
   unused_imports:unusedImports.sort(),
   semantic_unused_import_count:unusedImports.length,
   exported_symbol_count:exportCount,
   semantic_symbol_count:checker ? pub.length : 0};

}catch(e){const rel=path.relative(repo,p).split(path.sep).join('/');out[rel]={error:String(e)};}}
console.log(JSON.stringify(out));"""
    proc=None
    try:
        proc=subprocess.Popen(['node','-e',script,str(repo),*[str(x.resolve()) for x in paths]],cwd=str(repo),text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
        try:
            stdout,stderr=proc.communicate(timeout=15)
        except subprocess.TimeoutExpired:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except OSError: pass
            proc.communicate()
            return {'__engine_error__': 'typescript-compiler-timeout'}
        if proc.returncode != 0:
            return {'__engine_error__': 'typescript-compiler-process-failed', 'stderr': (stderr or '')[-2000:]}
        try:
            result=json.loads(stdout)
        except (TypeError, json.JSONDecodeError):
            return {'__engine_error__': 'typescript-compiler-invalid-output'}
        if not isinstance(result, dict):
            return {'__engine_error__': 'typescript-compiler-invalid-result'}
        _TS_CACHE[key]=result
        return result
    except (OSError, UnicodeError, ValueError, subprocess.SubprocessError) as exc:
        if proc is not None and proc.poll() is None:
            try: os.killpg(proc.pid, signal.SIGKILL)
            except OSError: pass
        return {'__engine_error__': 'typescript-compiler-execution-failed', 'detail': type(exc).__name__}

def _tsconfig(repo):
    p=Path(repo)/'tsconfig.json'
    try:return json.loads(p.read_text()) if p.exists() else {}
    except (OSError, UnicodeError, ValueError):return {}

def _resolve_export_target(value, subpath='.', conditions=('types','import','require','node','default')):
    """Resolve a package exports object conservatively for TypeScript graph analysis.
    If exports exists, do not fall back to main/module for blocked subpaths.
    """
    if isinstance(value,str): return [value]
    if isinstance(value,list):
        out=[]
        for x in value: out.extend(_resolve_export_target(x,subpath,conditions))
        return out
    if not isinstance(value,dict): return []
    if subpath in value:
        return _resolve_export_target(value[subpath],subpath,conditions)
    # exact key first, then simple wildcard subpath mappings
    if subpath.startswith('./'):
        for k,v in value.items():
            if isinstance(k,str) and '*' in k:
                pre,post=k.split('*',1)
                if subpath.startswith(pre) and subpath.endswith(post):
                    mid=subpath[len(pre):len(subpath)-len(post) if post else None]
                    vals=_resolve_export_target(v,subpath,conditions)
                    return [x.replace('*',mid) for x in vals]
    for cond in conditions:
        if cond in value:
            vals=_resolve_export_target(value[cond],subpath,conditions)
            if vals: return vals
    return []

def _workspace_packages(repo):
    repo=Path(repo); out={}
    def add_dir(d):
        if (d/'package.json').exists():
            try:n=json.loads((d/'package.json').read_text())
            except (OSError, UnicodeError, json.JSONDecodeError):return
            if n.get('name'): out[n['name']]=d
    try:data=json.loads((repo/'package.json').read_text()) if (repo/'package.json').exists() else {}
    except (OSError, UnicodeError, json.JSONDecodeError):data={}
    ws=data.get('workspaces',[])
    if isinstance(ws,dict): ws=ws.get('packages',[])
    if isinstance(ws,list):
        for pat in ws:
            for d in repo.glob(str(pat)): add_dir(d)
    for lock in (repo/'pnpm-workspace.yaml',repo/'pnpm-workspace.yml'):
        if lock.exists():
            text=lock.read_text(errors='ignore')
            # supports normal list items and a compact YAML list on the packages key.
            for m in re.finditer(r"^\s*-\s*['\"]?([^'\"#\n]+?)['\"]?\s*$",text,re.M):
                for d in repo.glob(m.group(1).strip()): add_dir(d)
            m=re.search(r'packages\s*:\s*\[([^]]+)\]',text,re.S)
            if m:
                for pat in re.findall(r"['\"]([^'\"]+)['\"]",m.group(1)):
                    for d in repo.glob(pat): add_dir(d)
    return out

def _package_resolve(repo,src,target):
    repo=Path(repo).resolve(); parts=target.split('/'); pkg=parts[0] if not target.startswith('@') else '/'.join(parts[:2]); rest=parts[1:] if not target.startswith('@') else parts[2:]
    roots=[]; workspaces=_workspace_packages(repo)
    if pkg in workspaces: roots.append(workspaces[pkg])
    cur=(repo/Path(src).parent).resolve()
    while True:
        roots.append(cur/'node_modules'/pkg)
        if cur==repo: break
        cur=cur.parent
    for nm in roots:
        if not nm.exists(): continue
        try:data=json.loads((nm/'package.json').read_text())
        except (OSError, UnicodeError, json.JSONDecodeError):data={}
        sub='./'+('/'.join(rest)) if rest else '.'; candidates=[]
        has_exports=data.get('exports') is not None
        if has_exports:
            candidates.extend(_resolve_export_target(data['exports'],sub))
            # An exports map is authoritative: do not bypass it with main/module/index.
            if not candidates: continue
        else:
            if rest: candidates.append('/'.join(rest))
            candidates += [data.get('types'),data.get('typings'),data.get('module'),data.get('main'),'index']
        for c in candidates:
            if not c: continue
            q=nm/str(c).lstrip('./'); checks=[q,*[Path(str(q)+e) for e in ('.ts','.tsx','.js','.jsx','.d.ts')],q/'index.ts',q/'index.tsx',q/'index.js',q/'index.jsx']
            for z in checks:
                if z.is_file():
                    try:return z.relative_to(repo).as_posix()
                    except ValueError:return target
    return target

def _resolve_ts_target(repo,src,target):
    if target.startswith('.'):
        base=Path(src).parent/target; candidates=[base,*[Path(str(base)+e) for e in ('.ts','.tsx','.js','.jsx','.d.ts')],base/'index.ts',base/'index.tsx',base/'index.js',base/'index.jsx']
    else:
        cfg=_tsconfig(repo); opts=cfg.get('compilerOptions',{}); paths=opts.get('paths',{}); root=Path(opts.get('baseUrl','.'))
        candidates=[]
        for pat,vals in paths.items():
            rx='^'+re.escape(pat).replace(r'\*','(.+)')+'$'; m=re.match(rx,target)
            if m:
                for v in vals:
                    candidates.append(root/Path(v.replace('*',m.group(1) if m.groups() else '')))
        candidates += [Path(_package_resolve(repo,src,target))]
    for c in candidates:
        q=(Path(repo)/c).resolve() if not str(c).startswith('/') else c
        checks=[q,*[Path(str(q)+e) for e in ('.ts','.tsx','.js','.jsx','.d.ts')],q/'index.ts',q/'index.tsx',q/'index.js',q/'index.jsx']
        try:
            for z in checks:
                if z.is_file(): return z.relative_to(repo).as_posix()
        except ValueError: pass
    return target

def reuse(repo):
    repo=Path(repo); groups={}; raw=[]; ast_index={}
    ts_paths=[p for p in files(repo) if p.suffix.lower() in {'.ts','.tsx','.js','.jsx'}]
    tsinfo=_ts_analysis(repo,ts_paths)
    ts_engine_error=tsinfo.get('__engine_error__') if isinstance(tsinfo,dict) else None
    if ts_engine_error:
        raw.append({'path':'<repository>','rule':'typescript-analyzer-error','severity':'critical','message':f'TypeScript compiler analysis failed: {ts_engine_error}'})
    for p in files(repo):
        text=_safe_read(p) or ''; rel=p.relative_to(repo).as_posix()
        if p.suffix.lower()=='.py': funcs,pub,shape=_ast_shape_py(text)
        elif rel in tsinfo and not tsinfo[rel].get('error'): funcs,pub,shape=tsinfo[rel]['funcs'],tsinfo[rel]['public'],tsinfo[rel]['shape']
        else:
            toks=_token_norm(text); shape=hashlib.sha256(' '.join(toks).encode()).hexdigest(); funcs=[]; pub=[]
        ast_index[rel]={'shape':shape,'public':sorted(set(pub)),'functions':funcs}
        if shape: groups.setdefault(shape,[]).append(rel)
    for paths in groups.values():
        if len(paths)>1: raw.append({'paths':paths,'rule':'duplicate-structural-source','severity':'high','message':'Structurally equivalent syntax trees/token streams'})
    # Function-level structural reuse, independent of whitespace and literals.
    fgroups={}
    for rel,item in ast_index.items():
        for f in item['functions']:
            key=hashlib.sha256(json.dumps({'branches':f.get('branches'), 'params':f.get('params')},sort_keys=True).encode()).hexdigest()
            fgroups.setdefault(key,set()).add(rel)
    for paths in fgroups.values():
        if len(paths)>1: raw.append({'paths':sorted(paths)[:12],'rule':'repeated-function-shape','severity':'medium','message':'Functions share structural control-flow and arity shape'})
    findings=normalize({'findings':raw},'reuse'); return {'findings':findings,'ast_backend':'typescript-compiler-api/python-ast-with-token-fallback','structural_index':ast_index,'ok':not any(x['severity'] in {'high','critical'} for x in findings)}

def routesync_extensions(repo):
    """
    RouteSync-specific extensions: workspace validation, export validation, and framework patterns.
    """
    repo=Path(repo); findings=[]; ws_result={}; export_result={}; framework_result={}
    
    # Load config to enforce thresholds and policies
    config = load_config(repo)
    
    # Workspace dependency validation
    try:
        ws_result = analyze_workspace(repo)
        if ws_result.get('workspace_enabled'):
            findings.extend(ws_result.get('violations', []))
    except Exception as e:
        findings.append({
            'path': '<repository>',
            'rule': 'workspace-analysis-failed',
            'severity': 'low',
            'message': f'Workspace analysis failed: {str(e)}'
        })
    
    # Export path validation
    try:
        ts_files = [p for p in files(repo) if p.suffix.lower() in {'.ts', '.tsx', '.js', '.jsx'}]
        export_result = validate_exports(repo, ts_files)
        findings.extend(export_result.get('violations', []))
    except Exception as e:
        findings.append({
            'path': '<repository>',
            'rule': 'export-validation-failed',
            'severity': 'low',
            'message': f'Export validation failed: {str(e)}'
        })
    
    # Framework pattern validation (React Hooks, Vue Composition, etc.)
    try:
        framework_result = validate_frameworks(repo, ts_files)
        findings.extend(framework_result.get('violations', []))
    except Exception as e:
        findings.append({
            'path': '<repository>',
            'rule': 'framework-validation-failed',
            'severity': 'low',
            'message': f'Framework validation failed: {str(e)}'
        })
    
    normalized = normalize({'findings': findings}, 'routesync')
    
    # Apply config thresholds
    critical_count = sum(1 for f in normalized if f['severity'] == 'critical')
    high_count = sum(1 for f in normalized if f['severity'] == 'high')
    medium_count = sum(1 for f in normalized if f['severity'] == 'medium')
    
    threshold_violations = []
    if config.is_loaded:
        thresholds = config.data.get('thresholds', {})
        if critical_count > thresholds.get('critical', 0):
            threshold_violations.append(f"Critical violations: {critical_count} > {thresholds.get('critical', 0)}")
        if high_count > thresholds.get('high', 5):
            threshold_violations.append(f"High violations: {high_count} > {thresholds.get('high', 5)}")
        if medium_count > thresholds.get('medium', 20):
            threshold_violations.append(f"Medium violations: {medium_count} > {thresholds.get('medium', 20)}")
    
    return {
        'findings': normalized,
        'workspace_analysis': ws_result,
        'export_validation': export_result,
        'framework_validation': framework_result,
        'threshold_violations': threshold_violations,
        'config_loaded': config.is_loaded,
        'ok': not any(x['severity'] in {'high', 'critical'} for x in normalized) and not threshold_violations
    }

def architecture(repo):
    repo=Path(repo); raw=[]; edges=[]
    
    # Load config to apply exclusions and blocking rules
    config = load_config(repo)
    
    for p in files(repo):
        text=_safe_read(p) or ''; rel=p.relative_to(repo).as_posix(); ext=p.suffix.lower()
        
        # Skip excluded files
        if config.is_loaded and config.is_file_excluded(rel):
            continue
            
        if ext in {'.ts','.tsx','.js','.jsx'}:
            for m in re.finditer(r"(?:from\s+|import\s*\(|require\s*\()\s*['\"]([^'\"]+)",text):
                target=m.group(1); resolved=_resolve_ts_target(repo,rel,target); edges.append((rel,resolved))
                if target.startswith('../../'): raw.append({'path':rel,'rule':'deep-relative-import','severity':'medium','target':resolved})
        if ext=='.rs' and re.search(r'\bunsafe\s*\{',text) and 'SAFETY:' not in text: raw.append({'path':rel,'rule':'unsafe-without-safety-note','severity':'high','message':'Unsafe block lacks SAFETY comment'})
        if ext=='.php' and re.search(r'function\s+__construct\([^)]{180,}\)',text): raw.append({'path':rel,'rule':'large-constructor','severity':'medium','message':'Constructor has excessive parameter surface'})
    # Laravel/PHP PSR-4 + use-statement graph. This is intentionally namespace-aware,
    # not a regex-only file adjacency graph.
    if (repo/'composer.json').exists():
        try: composer=json.loads((repo/'composer.json').read_text())
        except (OSError, UnicodeError, json.JSONDecodeError): composer={}
        autoload=((composer.get('autoload') or {}).get('psr-4') or {})
        php_symbols={}; class_to_file={}
        for p in files(repo):
            if p.suffix.lower()!='.php': continue
            txt=_safe_read(p) or ''; rel=p.relative_to(repo).as_posix(); ns=re.search(r'\bnamespace\s+([^;]+);',txt); cls=re.search(r'\bclass\s+([A-Za-z_]\w*)',txt)
            if ns and cls:
                fq=ns.group(1).strip('\\')+'\\'+cls.group(1); class_to_file[fq]=rel; php_symbols[rel]=fq
        for rel,fq in php_symbols.items():
            txt=_safe_read(repo/rel) or ''
            for um in re.finditer(r'\buse\s+([^;]+);',txt):
                target=um.group(1).strip().split(' as ')[0].strip('\\'); tgt=class_to_file.get(target)
                if tgt: edges.append((rel,tgt))
        if autoload:
            for prefix,base in autoload.items():
                for rel,fq in php_symbols.items():
                    if fq.startswith(prefix.strip('\\')):
                        expected=Path(base)/Path(fq[len(prefix):].lstrip('\\').replace('\\','/')+'.php')
                        if expected.as_posix() not in rel and expected.as_posix()!=rel:
                            raw.append({'path':rel,'rule':'psr4-autoload-mismatch','severity':'medium','expected':expected.as_posix(),'namespace':fq})
        for rel,fq in php_symbols.items():
            lower=rel.lower()
            if '/controllers/' in lower and ('/services/' in lower or '/repositories/' in lower):
                raw.append({'path':rel,'rule':'mixed-controller-layer','severity':'low','message':'Controller file also resides in service/repository layer'})
    graph={}
    for src,tgt in edges: graph.setdefault(src,[]).append(tgt)
    visiting=set(); visited=set(); cycles=[]
    def dfs(n,stack):
        if n in visiting: cycles.append(stack+[n]); return
        if n in visited:return
        visiting.add(n)
        for x in graph.get(n,[]): dfs(x,stack+[n])
        visiting.remove(n); visited.add(n)
    for n in graph: dfs(n,[])
    for c in cycles[:20]: raw.append({'path':c[0] if c else '', 'rule':'dependency-cycle','severity':'high','cycle':c})
    findings=normalize({'findings':raw},'architecture'); return {'findings':findings,'graph':{'edges':[list(e) for e in edges],'edge_count':len(edges),'cycles':[list(c) for c in cycles[:20]]},'resolver':'tsconfig-paths-node-exports-workspaces-relative','ok':not any(x['severity'] in {'high','critical'} for x in findings)}

def _api_index(repo, tsinfo=None):
    repo=Path(repo); idx={}
    ts_paths=[p for p in files(repo) if p.suffix.lower() in {'.ts','.tsx','.js','.jsx'}]
    tsinfo=tsinfo if tsinfo is not None else _ts_analysis(repo,ts_paths)
    for p in files(repo):
        text=_safe_read(p) or ''; rel=p.relative_to(repo).as_posix(); ext=p.suffix.lower(); public=[]
        if ext=='.py':
            try:
                tree=ast.parse(text)
                for n in tree.body:
                    if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)) and not n.name.startswith('_'):
                        args=[]
                        for a in n.args.args: args.append(ast.unparse(a.annotation) if a.annotation else '')
                        ret=ast.unparse(n.returns) if n.returns else ''
                        public.append(f"{n.name}/{len(args)}|{','.join(args)}|{ret}")
                    elif isinstance(n,ast.ClassDef) and not n.name.startswith('_'): public.append(n.name)
            except (SyntaxError, ValueError, TypeError): pass
        elif ext in {'.ts','.tsx','.js','.jsx'}:
            public=(tsinfo.get(rel) or {}).get('public',[])
        elif ext=='.php':
            for n,args,ret in re.findall(r'\bpublic\s+(?:static\s+)?function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?::\s*([^\s{]+))?',text):
                params=[x.strip() for x in args.split(',') if x.strip()]
                types=[]
                for a in params:
                    m=re.match(r'(?:(?:public|protected|private)\s+)?(?:[?A-Za-z_\\][\w\\|&]*\s+)?\$[A-Za-z_]\w*',a)
                    types.append(a.rsplit('$',1)[0].strip() if '$' in a else a)
                public.append(f"{n}/{len(params)}|{','.join(types)}|{ret}")
        elif ext=='.rs':
            for n,args,ret in re.findall(r'\bpub\s+(?:async\s+)?fn\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*([^\s{]+))?',text):
                params=[x.strip() for x in args.split(',') if x.strip() and not x.strip().startswith('self')]
                public.append(f"{n}/{len(params)}|{','.join(params)}|{ret}")
        if public: idx[rel]=sorted(set(public))
    return idx

def _affected_graph(repo, changed):
    repo=Path(repo); reverse={}; edges=[]
    for p in files(repo):
        text=_safe_read(p) or ''; rel=p.relative_to(repo).as_posix()
        if p.suffix.lower() not in {'.ts','.tsx','.js','.jsx'}: continue
        for m in re.finditer(r"(?:from\s+|import\s*\(|require\s*\()\s*['\"]([^'\"]+)",text):
            target=m.group(1); resolved=_resolve_ts_target(repo,rel,target); edges.append((rel,resolved)); reverse.setdefault(resolved,set()).add(rel)
    affected=set(changed); queue=list(changed)
    while queue:
        x=queue.pop()
        for parent in reverse.get(x,()):
            if parent not in affected: affected.add(parent); queue.append(parent)
    return {'changed':sorted(changed),'affected':sorted(affected),'edge_count':len(edges),'backend':'dependency-reverse-graph'}

def semantic_change(baseline,current,repo=None,current_api=None):
    ba={x['path']:x['sha256'] for x in baseline.get('files',[])}; ca={x['path']:x['sha256'] for x in current.get('files',[])}; changed=sorted(k for k in set(ba)|set(ca) if ba.get(k)!=ca.get(k)); categories=set(); signals={}
    for p in changed:
        s=p.lower(); sig=[]
        if p not in ba:sig.append('file-added')
        if p not in ca:sig.append('file-deleted')
        if any(x in s for x in ['auth','security','credential','permission','middleware','policy']):categories.add('security');sig.append('path-security')
        if any(x in s for x in ['package.json','package-lock','pnpm-lock','yarn.lock','cargo.toml','cargo.lock','composer.json','composer.lock']):categories.add('dependency');sig.append('manifest-dependency')
        if any(x in s for x in ['config','.env','.github/workflows','docker']):categories.add('configuration');sig.append('path-configuration')
        if Path(p).suffix.lower() in CODE_EXT:categories.add('behavior');sig.append('code')
        signals[p]=sorted(set(sig))
    old_api=baseline.get('semantic_api') or {}; new_api=current_api if current_api is not None else (_api_index(repo) if repo else {})
    api_added=[];api_removed=[];api_changed=[]
    for p in sorted(set(old_api)|set(new_api)):
        old=set(old_api.get(p,[])); new=set(new_api.get(p,[]))
        if old!=new:
            if new-old: api_added += [f'{p}:{x}' for x in sorted(new-old)]
            if old-new: api_removed += [f'{p}:{x}' for x in sorted(old-new)]
            if old & new: api_changed.append(p)
            elif old != new: api_changed.append(p)
    if api_added or api_removed or api_changed: categories.add('api');
    affected=_affected_graph(repo,changed) if repo else {'changed':changed,'affected':changed,'edge_count':0,'backend':'dependency-reverse-graph'}
    return {'changed_files':changed,'categories':sorted(categories),'signals':signals,'api_diff':{'added':api_added,'removed':api_removed,'changed_files':api_changed},'api_backend':'language-aware-public-signature-index','affected_graph':affected}

def _complexity_file(repo,f):
    text=_safe_read(f) or ''; ext=f.suffix.lower(); funcs=[]; branches=0; maxnest=0
    if ext=='.py':
        try:
            t=ast.parse(text)
            for n in ast.walk(t):
                if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)):
                    b=sum(isinstance(x,(ast.If,ast.For,ast.While,ast.Try,ast.With,ast.BoolOp,ast.Match)) for x in ast.walk(n)); funcs.append({'name':n.name,'line':n.lineno,'branches':b,'complexity':1+b})
            branch_nodes=(ast.If,ast.For,ast.While,ast.Try,ast.With,ast.Match)
            branches=sum(isinstance(n,branch_nodes) for n in ast.walk(t)) + sum(isinstance(n,ast.BoolOp) for n in ast.walk(t))
            def depth(n,d=0):
                nd=d+1 if isinstance(n,branch_nodes) else d
                return max([nd]+[depth(c,nd) for c in ast.iter_child_nodes(n)])
            return funcs,branches,depth(t)
        except (SyntaxError, ValueError, TypeError): pass
    # Token-aware fallback for non-Python languages; counts syntax constructs, not words in strings/comments.
    toks=_token_norm(text); branches=sum(1 for x in toks if x in {'if','for','while','case','catch','match','&&','||','?'}); depth=cur=0; maxd=0
    for x in toks:
        if x=='{':cur+=1;maxd=max(maxd,cur)
        elif x=='}':cur=max(0,cur-1)
    names=re.findall(r'\b(?:function|fn|def)\s+([A-Za-z_$][\w$]*)',text); funcs=[{'name':n,'line':text[:m.start()].count('\n')+1,'branches':0,'complexity':1} for n in names for m in [re.search(r'\b(?:function|fn|def)\s+'+re.escape(n),text)]]
    return funcs,branches,maxd


def _tsq_finding(rule, path, line, message, severity='medium', **extra):
    f={'id':f'{rule}:{path}:{line}','analyzer':'typescript-quality','rule':rule,
       'path':path,'message':message,'severity':severity}
    if line: f['line']=int(line)
    f.update(extra)
    return f

def _line_of(text, pos):
    return text.count('\n',0,pos)+1

def _security_findings(repo, path, text):
    """Contextual security analysis with bounded local/interprocedural data-flow.

    Tracks common request/input sources through aliases, destructuring, function
    arguments and same-file function summaries. This is intentionally bounded and
    is not presented as a full taint engine. Unknown flows remain uncertain.
    """
    out=[]
    def add(rule,line,msg,severity,confidence,evidence_kind,**extra):
        out.append(_tsq_finding(rule,path,line,msg,severity,confidence=confidence,
                                provenance='contextual-bounded-dataflow', evidence_kind=evidence_kind,**extra))

    source_pat=r'(?:req|request)\s*\.\s*(?:body|query|params|headers)|\b(?:userInput|user_input|input|payload|untrusted)\b'

    # Final32 bounded one-hop Promise/object-return checks. Kept at the front of
    # the security pass so these concrete forms cannot be masked by later lexical
    # sink classification.
    _promise_sink = re.compile(r'\b('+r'[A-Za-z_$][\w$]*'+r')\s*\.\s*then\s*\(\s*\(?\s*('+r'[A-Za-z_$][\w$]*'+r')\s*\)?\s*=>\s*([^;]+)', re.S)
    _sink_names = r'(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)'
    for _pm in _promise_sink.finditer(text):
        _receiver,_param,_body=_pm.group(1),_pm.group(2),_pm.group(3)
        _decl = re.search(r'\b(?:const|let|var)\s+'+re.escape(_receiver)+r'\s*=\s*[^;]*'+source_pat,text,re.I)
        if _decl and re.search(r'\b'+_sink_names+r'\s*\([^)]*\b'+re.escape(_param)+r'\b',_body,re.S):
            add('TSQ-SEC-003',_line_of(text,_pm.start()),'Untrusted input reaches a security-sensitive sink through bounded Promise callback propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='promise-callback-parameter',parameter=_param)
    _object_call = re.compile(r'\b(?:const|let|var)\s+('+r'[A-Za-z_$][\w$]*'+r')\s*=\s*(?:await\s+)?('+r'[A-Za-z_$][\w$]*'+r')\s*\(([^)]*)\)\s*;', re.S)
    for _om in _object_call.finditer(text):
        _target,_fn,_args=_om.group(1),_om.group(2),_om.group(3)
        if re.search(source_pat,_args,re.I):
            _tail=text[_om.end():_om.end()+600]
            _prop=re.search(r'\b'+re.escape(_target)+r'\s*\.\s*('+r'[A-Za-z_$][\w$]*'+r')',_tail)
            if _prop and re.search(r'\b'+_sink_names+r'\s*\([^)]*\b'+re.escape(_target)+r'\s*\.\s*'+re.escape(_prop.group(1))+r'\b',_tail,re.S):
                add('TSQ-SEC-003',_line_of(text,_om.start()),'Untrusted input reaches a security-sensitive sink through bounded object-return propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='object-return-property',function=_fn,property=_prop.group(1))

    ident=r'[A-Za-z_$][\w$]*'
    tainted_aliases=set()
    tainted_properties=set()
    tainted_object_aliases=set()
    tainted_object_spreads=set()
    tainted_array_aliases=set()
    tainted_computed_properties=set()
    # Direct aliases and destructuring from request/input objects.
    for m in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;]+)', text):
        rhs=m.group(2)
        if re.search(source_pat,rhs,re.I):
            tainted_aliases.add(m.group(1))
        if re.search(r'\b(?:req|request)\s*\.\s*(?:body|query|params|headers)\b', rhs, re.I):
            tainted_object_aliases.add(m.group(1))
    # Object/property construction from untrusted values.
    for m in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*\{([^}]*)\}', text, re.S):
        obj=m.group(1); body=m.group(2)
        if re.search(source_pat, body, re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', body) for a in tainted_aliases):
            tainted_object_aliases.add(obj)
            for pm in re.finditer(r'([A-Za-z_$][\w$]*)\s*:\s*([^,]+)', body):
                if re.search(source_pat, pm.group(2), re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', pm.group(2)) for a in tainted_aliases):
                    tainted_properties.add(obj+'.'+pm.group(1))
    for m in re.finditer(r'\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*([^;]+)', text):
        rhs=m.group(2).strip()
        if re.search(source_pat,rhs,re.I) or re.fullmatch(r'(?:req|request|ctx|context)',rhs,re.I):
            # Support nested destructuring conservatively: identifiers that are
            # property keys (`key:`) are excluded; binding identifiers are tainted.
            for nm in re.findall(r'\b'+ident+r'\b(?!\s*:)',m.group(1)):
                if nm not in {'const','let','var'}: tainted_aliases.add(nm)
    # Nested destructuring from a request/context object (bounded to one nested level).
    for m in re.finditer(r'\b(?:const|let|var)\s*\{[^{}]*\{([^{}]+)\}[^{}]*\}\s*=\s*((?:req|request|ctx|context))\b', text, re.I):
        for nm in re.findall(r'\b'+ident+r'\b(?!\s*:)', m.group(1)):
            tainted_aliases.add(nm)

    # Object spread propagation: `{ ...req.body }` and `{ ...alias }` are
    # treated as tainted object carriers. This is intentionally bounded and
    # does not attempt arbitrary computed-key resolution.
    for om in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*\{([^{}]*)\}', text, re.S):
        obj, body = om.group(1), om.group(2)
        if re.search(source_pat, body, re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', body) for a in tainted_aliases) or re.search(r'\.\.\.', body):
            if re.search(source_pat, body, re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', body) for a in tainted_aliases):
                tainted_object_aliases.add(obj); tainted_object_spreads.add(obj)
        for pm in re.finditer(r'([A-Za-z_$][\w$]*)\s*:\s*([^,}]+)', body):
            if re.search(source_pat, pm.group(2), re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', pm.group(2)) for a in tainted_aliases):
                tainted_properties.add(obj+'.'+pm.group(1))
    # Array/tuple propagation: track containers whose elements derive from an
    # untrusted source. This is deliberately bounded; element indexes are not
    # inferred from arbitrary dynamic expressions.
    for am in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*\[([^\]]*)\]', text, re.S):
        arr, body = am.group(1), am.group(2)
        if re.search(source_pat, body, re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', body) for a in tainted_aliases) or any(re.search(r'\b'+re.escape(a)+r'\b', body) for a in tainted_object_aliases):
            tainted_array_aliases.add(arr)

    # Computed property reads from a tainted object carrier. Constant string
    # keys are evidence-bearing; arbitrary dynamic keys remain uncertain.
    for pm in re.finditer(r'\b('+ident+r')\s*\[\s*[\"\']([^\"\']+)[\"\']\s*\]', text):
        obj, key = pm.group(1), pm.group(2)
        if obj in tainted_object_aliases or obj in tainted_object_spreads:
            tainted_computed_properties.add(obj+'.'+key)

    # Property mutation propagation: preserve taint when an existing object
    # receives an untrusted value after construction. This is intentionally
    # bounded to simple member assignments; computed dynamic writes remain
    # uncertain rather than being treated as proven-safe.
    for mm in re.finditer(r'\b('+ident+r')\s*\.\s*('+ident+r')\s*=\s*([^;]+)', text):
        obj, key, rhs = mm.group(1), mm.group(2), mm.group(3)
        if re.search(source_pat, rhs, re.I) or any(re.search(r'\b'+re.escape(a)+r'\b', rhs) for a in tainted_aliases):
            tainted_properties.add(obj+'.'+key)
            tainted_object_aliases.add(obj)

    # Bounded local alias propagation, including destructured aliases.
    for _ in range(6):
        changed=False
        for m in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;]+)', text):
            rhs=m.group(2)
            if m.group(1) not in tainted_aliases and (any(re.search(r'\b'+re.escape(a)+r'\b',rhs) for a in tainted_aliases) or any(re.search(r'\b'+re.escape(a.replace('.', r'\.'))+r'\b',rhs) for a in tainted_properties)):
                tainted_aliases.add(m.group(1)); changed=True
        for m in re.finditer(r'\b(?:const|let|var)\s*\{([^}]+)\}\s*=\s*('+ident+r')\s*;', text):
            if m.group(2) in tainted_aliases:
                for part in m.group(1).split(','):
                    name=re.split(r'\s*:\s*',part.strip(),maxsplit=1)[-1].strip()
                    if re.fullmatch(ident,name) and name not in tainted_aliases: tainted_aliases.add(name); changed=True
        if not changed: break

    # Function summaries: parameter positions that reach dangerous sinks.
    function_params={}
    function_matches=[]
    function_matches.extend(re.finditer(r'\b(?:async\s+)?function\s+('+ident+r')\s*\(([^)]*)\)\s*\{', text))
    function_matches.extend(re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{', text))
    # Include class methods (including inherited methods when the concrete call
    # resolves to the method name). Parameter bindings may be destructured; keep
    # a synthetic parameter slot and record its bound identifiers.
    function_matches.extend(re.finditer(r'(?:^|[{};])\s*(?:public|private|protected|static|async|override|readonly|abstract|\s)*('+ident+r')\s*\(([^)]*)\)\s*\{', text, re.M))
    for fm in function_matches:
        name=fm.group(1); params=[]; bound_by_param=[]
        for raw in fm.group(2).split(','):
            q=raw.strip().split('=')[0].strip()
            q=re.sub(r'\?\s*(?::.*)?$','',q); q=re.sub(r'\s*:\s*.*$','',q)
            binds=[]
            if q.startswith('{') and q.endswith('}'):
                for part in q[1:-1].split(','):
                    part=part.strip()
                    if not part: continue
                    rhs=part.split(':',1)[-1].strip()
                    rhs=re.sub(r'\s*=.*$','',rhs).strip()
                    if re.fullmatch(ident,rhs): binds.append(rhs)
            elif re.fullmatch(ident,q): binds=[q]
            else: continue
            params.append(q if re.fullmatch(ident,q) else f'__param{len(params)}')
            bound_by_param.append(binds)
        depth=1; i=fm.end(); quote=None; esc=False
        while i<len(text) and depth:
            ch=text[i]
            if quote:
                if esc: esc=False
                elif ch=='\\': esc=True
                elif ch==quote: quote=None
            else:
                if ch in "\"'`": quote=ch
                elif ch=='{': depth+=1
                elif ch=='}': depth-=1
            i+=1
        body=text[fm.end():max(fm.end(),i-1)]
        sinks=set()
        for pidx,pname in enumerate(params):
            aliases={pname}
            if pidx < len(bound_by_param): aliases.update(bound_by_param[pidx])
            for _ in range(4):
                changed=False
                for am in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;\n]+)',body):
                    if am.group(1) not in aliases and any(re.search(r'\b'+re.escape(a)+r'\b',am.group(2)) for a in aliases):
                        aliases.add(am.group(1)); changed=True
                if not changed: break
            sink_re=r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync|Object\.assign)\s*\(' + r'[^)]*\b(?:'+'|'.join(map(re.escape,sorted(aliases)))+r')\b'
            # A parameter is tainted only when an explicit alias/property path
            # reaches a security sink. Do not infer a flow merely because the
            # function also happens to read req.body/query/params somewhere else.
            if re.search(sink_re,body,re.S):
                sinks.add(pidx)
            if re.search(r'\b(?:readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(pname)+r'\b',body,re.S): sinks.add(pidx)
            if re.search(r'\bObject\.assign\s*\([^)]*\b'+re.escape(pname)+r'\b',body,re.S): sinks.add(pidx)
        function_params[name]={'params':params,'sink_params':sinks}
        for pidx,pname in enumerate(params):
            if pidx not in sinks:
                continue
            # Declaration-time evidence is allowed only when the parameter's
            # request/input property path itself reaches a sink. Merely having a
            # request-like parameter and an unrelated sink in the same function
            # is NOT a data-flow edge (e.g. req.body.x + exec("safe")).
            aliases={pname}
            if pidx < len(bound_by_param): aliases.update(bound_by_param[pidx])
            direct=False
            sink_names=r'(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)'
            for a in aliases:
                if re.search(r'\b'+re.escape(a)+r'\s*\.\s*(?:body|query|params|headers)\s*\.',body,re.I) and re.search(sink_names+r'\s*\([^)]*\b'+re.escape(a)+r'\s*\.\s*(?:body|query|params|headers)\b',body,re.I|re.S):
                    direct=True; break
            if direct:
                add('TSQ-SEC-003',_line_of(text,fm.start()),'Untrusted input reaches a security-sensitive sink through a bounded function parameter flow','critical','high','concrete-untrusted-flow',source='request-or-input',sink='function-parameter',function=name,parameter_index=pidx)
        # A parameter assigned to a local alias remains tainted inside this summary.
        for pidx,pname in enumerate(params):
            if pidx in sinks: continue
            aliases={pname}
            for _ in range(3):
                changed=False
                for am in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*([^;\n]+)',body):
                    if am.group(1) not in aliases and any(re.search(r'\b'+re.escape(a)+r'\b',am.group(2)) for a in aliases): aliases.add(am.group(1)); changed=True
                if not changed: break
            if any(re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(a)+r'\b',body,re.S) for a in aliases):
                function_params[name]['sink_params'].add(pidx)

    def split_top_level_args(arg_text):
        parts=[]; start=0; depth=0; quote=None; esc=False
        pairs={'(':')','[':']','{':'}'}
        stack=[]
        for i,ch in enumerate(arg_text):
            if quote:
                if esc: esc=False
                elif ch=='\\': esc=True
                elif ch==quote: quote=None
                continue
            if ch in '"\'`': quote=ch; continue
            if ch in pairs: stack.append(pairs[ch]); continue
            if ch in ')]}':
                if stack and ch==stack[-1]: stack.pop()
                continue
            if ch==',' and not stack:
                parts.append(arg_text[start:i].strip()); start=i+1
        tail=arg_text[start:].strip()
        if tail or arg_text.strip(): parts.append(tail)
        return parts

    # Propagate sink summaries through same-file wrapper calls to a bounded fixpoint.
    # If A(param) calls B(param) and B's corresponding parameter reaches a sink,
    # then A's parameter also reaches a sink. This handles multi-function wrapper
    # chains without claiming to be a full whole-program taint engine.
    for _hop in range(4):
        changed=False
        for caller_name, meta in list(function_params.items()):
            # Locate caller body from its declaration.
            fpat=r'\b(?:async\s+)?function\s+'+re.escape(caller_name)+r'\s*\(([^)]*)\)\s*\{|\b(?:const|let|var)\s+'+re.escape(caller_name)+r'\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{'
            fm=re.search(fpat,text)
            if not fm: continue
            depth=1; i=fm.end(); quote=None; esc=False
            while i<len(text) and depth:
                ch=text[i]
                if quote:
                    if esc: esc=False
                    elif ch=='\\': esc=True
                    elif ch==quote: quote=None
                else:
                    if ch in "\"'`": quote=ch
                    elif ch=='{': depth+=1
                    elif ch=='}': depth-=1
                i+=1
            body=text[fm.end():max(fm.end(),i-1)]
            params=meta.get('params',[])
            for callee, cmeta in function_params.items():
                if callee==caller_name: continue
                for cm in re.finditer(r'\b'+re.escape(callee)+r'\s*\(([^)]*)\)',body,re.S):
                    args=split_top_level_args(cm.group(1))
                    for cidx in cmeta.get('sink_params',set()):
                        if cidx>=len(args): continue
                        arg=args[cidx]
                        for pidx,pname in enumerate(params):
                            if re.search(r'\b'+re.escape(pname)+r'\b',arg) and pidx not in meta['sink_params']:
                                meta['sink_params'].add(pidx); changed=True
        if not changed: break

    def expr_untrusted(expr):
        if re.search(source_pat,expr,re.I): return True
        if any(re.search(r'\b'+re.escape(a)+r'\b',expr) for a in tainted_aliases): return True
        if any(re.search(r'\b'+re.escape(a.split('.')[0])+r'\s*\.\s*'+re.escape(a.split('.')[1])+r'\b',expr) for a in tainted_properties if '.' in a): return True
        if any(re.search(r'\b'+re.escape(a)+r'\b',expr) for a in tainted_object_aliases): return True
        if any(re.search(r'\b'+re.escape(a)+r'\s*\[\s*[\"\']'+re.escape(a.split('.',1)[1])+r'[\"\']\s*\]',expr) for a in tainted_computed_properties if '.' in a): return True
        if any(re.search(r'\b'+re.escape(a)+r'\s*\[\s*\d+\s*\]',expr) for a in tainted_array_aliases): return True
        # Property reads from tainted object carriers, including object-spread
        # aliases. Computed properties remain intentionally uncertain.
        for obj in tainted_object_spreads:
            if re.search(r'\b'+re.escape(obj)+r'\s*\.', expr): return True
        return False

    # Bounded Promise chain propagation. Track explicit `Promise.resolve/reject`
    # chains through up to four then/catch/finally callbacks. `finally` has no
    # settled-value parameter and therefore never receives taint implicitly.
    _promise_chain_pat = re.compile(r'Promise\.(resolve|reject)\s*\(([^;]+?)\)((?:\s*\.\s*(?:then|catch|finally)\s*\(\s*'+ident+r'\s*=>\s*[^;]+?\)){1,4})', re.S)
    for pcm in _promise_chain_pat.finditer(text):
        expr=pcm.group(0); upstream=bool(re.search(source_pat,pcm.group(2),re.I)) or expr_untrusted(pcm.group(2))
        if not upstream: continue
        for cb in re.finditer(r'\.\s*(then|catch|finally)\s*\(\s*('+ident+r')\s*=>\s*([^;]+?)\)', expr, re.S):
            kind,param,body=cb.group(1),cb.group(2),cb.group(3).strip()
            if kind == 'finally': continue
            if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(param)+r'\b',body,re.S):
                add('TSQ-SEC-003',_line_of(text,pcm.start()),'Untrusted input reaches a security-sensitive sink through bounded Promise chain propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='promise-chain-parameter',parameter=param,stage=kind)
            upstream = bool(re.fullmatch(re.escape(param),body))

    def call_arguments(pattern, source):
        hits=[]
        for m in re.finditer(pattern, source, re.I):
            # Do not interpret TypeScript declarations/signatures as runtime calls.
            # `declare function exec(x: string): void` was previously parsed as an
            # invocation, which could turn an unrelated tainted identifier elsewhere
            # in the file into a false-positive sink finding.
            prefix=source[max(0,m.start()-80):m.start()]
            if re.search(r'\b(?:declare\s+)?function\s*$', prefix, re.I):
                continue
            if re.search(r'\b(?:interface|type)\b[^{};]*$', prefix, re.I):
                continue
            op=source.find('(',m.start(),min(len(source),m.end()+2))
            if op<0: continue
            depth=0; quote=None; esc=False
            for i in range(op,len(source)):
                ch=source[i]
                if quote:
                    if esc: esc=False
                    elif ch=='\\': esc=True
                    elif ch==quote: quote=None
                    continue
                if ch in "\"'`": quote=ch; continue
                if ch=='(': depth+=1
                elif ch==')':
                    depth-=1
                    if depth==0: hits.append((m.start(),op,i,source[op+1:i])); break
        return hits

    # Evaluate function call propagation before direct sinks. Bounded to one same-file hop.
    propagated_calls=[]
    for name,meta in function_params.items():
        for cm in re.finditer(r'\b'+re.escape(name)+r'\s*\(([^)]*)\)',text,re.S):
            prefix=text[max(0,cm.start()-40):cm.start()]
            # A declaration's parameter list is not a call site. Exclude
            # `function name(...)` and `const name = (...) =>` matches.
            if re.search(r'\bfunction\s*$',prefix) or re.search(r'\b(?:const|let|var)\s+'+re.escape(name)+r'\s*=\s*$',prefix):
                continue
            args=split_top_level_args(cm.group(1))
            for idx in meta['sink_params']:
                if idx < len(args) and (expr_untrusted(args[idx]) or bool(re.fullmatch(r'(?:req|request|ctx|context)', args[idx], re.I))):
                    propagated_calls.append((cm.start(),name,idx,args[idx]))
                    add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through bounded same-file function parameter propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='function-parameter',function=name,parameter_index=idx)

    # Bounded return-value propagation. Build a summary of functions whose
    # return expression depends on a parameter, then propagate taint from a
    # tainted call argument into the assigned return value. This closes the
    # common `get(req.body.x) -> return x -> exec(result)` gap without claiming
    # whole-program taint completeness.
    return_params={}
    for fm in re.finditer(r'\b(?:async\s+)?function\s+('+ident+r')\s*\(([^)]*)\)\s*\{', text):
        name=fm.group(1)
        raw_params=[re.sub(r'\s*=.*$','',x.strip()) for x in split_top_level_args(fm.group(2))]
        raw_params=[re.sub(r'\?\s*(?::.*)?$','',x).strip() for x in raw_params]
        depth=1; i=fm.end(); quote=None; esc=False
        while i<len(text) and depth:
            ch=text[i]
            if quote:
                if esc: esc=False
                elif ch=='\\': esc=True
                elif ch==quote: quote=None
            else:
                if ch in "\"'`": quote=ch
                elif ch=='{': depth+=1
                elif ch=='}': depth-=1
            i+=1
        body=text[fm.end():max(fm.end(),i-1)]
        ret_exprs=re.findall(r'\breturn\s+([^;\n]+)',body)
        indices=set()
        for idx,param in enumerate(raw_params):
            if re.fullmatch(ident,param) and any(re.search(r'\b'+re.escape(param)+r'\b',expr) for expr in ret_exprs):
                indices.add(idx)
        if indices: return_params[name]=indices

    for _ in range(4):
        changed=False
        for name,indices in return_params.items():
            for cm in re.finditer(r'\b'+re.escape(name)+r'\s*\(([^)]*)\)',text,re.S):
                prefix=text[max(0,cm.start()-50):cm.start()]
                if re.search(r'\bfunction\s*$',prefix) or re.search(r'\b(?:const|let|var)\s+'+re.escape(name)+r'\s*=\s*$',prefix):
                    continue
                args=split_top_level_args(cm.group(1))
                lhs=re.search(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*(?:await\s+)?$',text[:cm.start()])
                if not lhs: continue
                if any(idx < len(args) and (re.search(source_pat,args[idx],re.I) or any(re.search(r'\b'+re.escape(a)+r'\b',args[idx]) for a in tainted_aliases)) for idx in indices):
                    target=lhs.group(1)
                    if target not in tainted_aliases:
                        tainted_aliases.add(target); changed=True
        if not changed: break

    # Promise/callback return propagation. Track bounded `.then(...)` callbacks and\n    # async return-object/property values without claiming arbitrary Promise taint\n    # completeness. This covers common `source -> Promise -> then(value => sink)`\n    # and `async get() { return {command}; } -> await get() -> exec(x.command)` shapes.\n    promise_return_aliases=set()\n    for _ in range(4):\n        changed=False\n        # `const x = await get(tainted)` is already handled above; extend it to\n        # `.then(v => v)` and `.then(v => sink(v))` where the receiver is tainted.\n        for pm in re.finditer(r'\\b('+ident+r')\\s*\\.\\s*then\\s*\\(\\s*(?:\\(?\\s*('+ident+r')\\s*\\)?\\s*=>|function\\s*\\(\\s*('+ident+r')\\s*\\))', text):\n            receiver=pm.group(1); param=pm.group(2) or pm.group(3)\n            if receiver in tainted_aliases or receiver in tainted_object_aliases or receiver in promise_return_aliases:\n                promise_return_aliases.add(param)\n                changed=True\n        # A tainted Promise/return carrier assigned from an expression containing\n        # an already-tainted alias remains tainted.\n        for am in re.finditer(r'\\b(?:const|let|var)\\s+('+ident+r')\\s*=\\s*([^;]+)', text):\n            target,rhs=am.group(1),am.group(2)\n            if target not in promise_return_aliases and ('.then' in rhs or 'Promise.' in rhs) and (re.search(source_pat,rhs,re.I) or any(re.search(r'\\b'+re.escape(a)+r'\\b',rhs) for a in tainted_aliases)):\n                promise_return_aliases.add(target); changed=True\n        if not changed: break\n\n    # Direct `.then` sink calls. The callback parameter is tainted only when the\n    # receiver is already proven tainted; unknown Promise receivers remain unknown.\n    for pm in re.finditer(r'\\b('+ident+r')\\s*\\.\\s*then\\s*\\(\\s*(?:\\(?\\s*('+ident+r')\\s*\\)?\\s*=>|function\\s*\\(\\s*('+ident+r')\\s*\\))', text):\n        receiver,param=pm.group(1),pm.group(2) or pm.group(3)\n        if receiver not in tainted_aliases and receiver not in promise_return_aliases: continue\n        tail=text[pm.end():pm.end()+700]\n        if re.search(r'\\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\\s*\\([^)]*\\b'+re.escape(param)+r'\\b',tail,re.S):\n            add('TSQ-SEC-003',_line_of(text,pm.start()),'Untrusted input reaches a security-sensitive sink through bounded Promise callback propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='promise-callback-parameter',parameter=param)\n\n    # Async/object return summaries. If a function returns an object whose property\n    # depends on a parameter, propagate the taint to `await fn(x).property` and to\n    # an assigned result's property. This is intentionally limited to named/static\n    # properties and one object layer.\n    object_return_params={}\n    for fm in re.finditer(r'\\b(?:export\\s+)?(?:async\\s+)?function\\s+('+ident+r')\\s*\\(([^)]*)\\)\\s*\\{', text):\n        name=fm.group(1); params=[re.sub(r'\\s*=.*$','',x.strip()) for x in split_top_level_args(fm.group(2))]\n        params=[re.sub(r'\\s*:\\s*.*$','',x).strip() for x in params]\n        depth=1; i=fm.end(); quote=None; esc=False\n        while i<len(text) and depth:\n            ch=text[i]\n            if quote:\n                if esc: esc=False\n                elif ch=='\\\\': esc=True\n                elif ch==quote: quote=None\n            else:\n                if ch in "\\\"'`": quote=ch\n                elif ch=='{': depth+=1\n                elif ch=='}': depth-=1\n            i+=1\n        body=text[fm.end():max(fm.end(),i-1)]\n        for rm in re.finditer(r'\\breturn\\s*\\{([^{}]*)\\}',body,re.S):\n            props=rm.group(1); hits=[]\n            for idx,param in enumerate(params):\n                if re.fullmatch(ident,param) and re.search(r'[:\\[]\\s*'+re.escape(param)+r'\\b',props): hits.append(idx)\n            if hits: object_return_params[name]=hits\n\n    for name,indices in object_return_params.items():\n        for cm in re.finditer(r'\\b'+re.escape(name)+r'\\s*\\(([^)]*)\\)',text,re.S):\n            prefix=text[max(0,cm.start()-100):cm.start()]\n            if re.search(r'\\bfunction\\s*$',prefix): continue\n            args=split_top_level_args(cm.group(1))\n            tainted_call=any(idx<len(args) and (expr_untrusted(args[idx]) or re.search(source_pat,args[idx],re.I)) for idx in indices)\n            if not tainted_call: continue\n            after=text[cm.end():cm.end()+300]\n            if re.search(r'^\\s*\\?\\.?(?:\\w+)\\s*',after) or re.search(r'^\\s*\\.\\s*('+ident+r')',after):\n                prop=re.search(r'^\\s*\\.\\s*('+ident+r')',after)\n                if prop:\n                    propname=prop.group(1)\n                    # Taint direct member use in the following sink.\n                    tail=after[0:700]\n                    if re.search(r'\\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\\s*\\([^)]*'+re.escape(propname)+r'\\b',tail,re.S):\n                        add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through bounded object return propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='object-return-property',function=name,property=propname)\n\n    # Minimal explicit Promise/object-return sinks. These checks complement the\n    # bounded summaries above for common one-hop forms that regex-based alias\n    # propagation cannot safely normalize. They remain evidence-bound and static.\n    for pm in re.finditer(r'\b('+ident+r')\s*\.\s*then\s*\(\s*\(?\s*('+ident+r')\s*\)?\s*=>\s*([^;]+)', text, re.S):\n        receiver,param,body=pm.group(1),pm.group(2),pm.group(3)\n        receiver_source=bool(re.search(r'\b(?:const|let|var)\s+'+re.escape(receiver)+r'\s*=\s*[^;]*'+source_pat,text,re.I))\n        if receiver_source and re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(param)+r'\b',body,re.S):\n            add('TSQ-SEC-003',_line_of(text,pm.start()),'Untrusted input reaches a security-sensitive sink through bounded Promise callback propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='promise-callback-parameter',parameter=param)\n\n    for om in re.finditer(r'\b(?:const|let|var)\s+('+ident+r')\s*=\s*(?:await\s+)?('+ident+r')\s*\(([^)]*)\)\s*;',text,re.S):\n        target,fn,args=om.group(1),om.group(2),om.group(3)\n        if not re.search(source_pat,args,re.I): continue\n        tail=text[om.end():om.end()+500]\n        if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\(\s*'+re.escape(target)+r'\s*\.\s*('+ident+r')',tail,re.S):\n            prop=re.search(r'\b'+re.escape(target)+r'\s*\.\s*('+ident+r')',tail)\n            add('TSQ-SEC-003',_line_of(text,om.start()),'Untrusted input reaches a security-sensitive sink through bounded object-return propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='object-return-property',function=fn,property=prop.group(1) if prop else 'unknown')\n\n    # Inline callback propagation. Track a tainted collection/argument into
    # simple arrow/function callback parameters used by a security sink.
    callback_pat=r'\b(?:forEach|map|filter|some|every|find)\s*\(\s*(?:\(?\s*('+ident+r')\s*\)?\s*=>|function\s*\(\s*('+ident+r')\s*\))'
    for cm in re.finditer(callback_pat,text):
        param=cm.group(1) or cm.group(2)
        prefix=text[max(0,cm.start()-180):cm.start()]
        collection_tainted=bool(re.search(source_pat,prefix,re.I)) or any(re.search(r'\b'+re.escape(a)+r'\b',prefix) for a in tainted_aliases)
        if not collection_tainted: continue
        tail=text[cm.end():cm.end()+500]
        if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*\([^)]*\b'+re.escape(param)+r'\b',tail,re.S):
            add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through bounded callback parameter propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='callback-parameter',parameter=param)

    # Cross-file exported-function propagation. Build a conservative summary
    # from other TypeScript files: exported functions whose parameter reaches a
    # security sink. Only direct call arguments are followed and only when the
    # current file can prove the argument is untrusted.
    cross_summaries={}
    try:
        # Cross-file summaries are only relevant when the current source actually
        # contains an import or a construction/call that can cross a module/class
        # boundary. Avoid rescanning the entire repository for isolated fixtures.
        _needs_cross_file=bool(re.search(r'\bimport\b|\bnew\s+'+ident+r'\s*\(', text))
        if not _needs_cross_file:
            cross_summaries={}
        else:
            for fp in files(repo):
                if fp.suffix.lower() not in {'.ts','.tsx'} or 'node_modules' in fp.parts or fp.resolve()==Path(path).resolve(): continue
                other=_safe_read(fp)
                if not other: continue
                for fm in re.finditer(r'\bexport\s+(?:async\s+)?function\s+('+ident+r')\s*\(([^)]*)\)\s*\{',other):
                    name=fm.group(1); params=[]
                    for raw in fm.group(2).split(','):
                        q=raw.strip().split('=')[0].strip(); q=re.sub(r'\?\s*(?::.*)?$','',q); q=re.sub(r'\s*:\s*.*$','',q)
                        if re.fullmatch(ident,q): params.append(q)
                    body=other[fm.end():]
                    sinks=set()
                    for idx,pname in enumerate(params):
                        if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync|Object\.assign)\s*\([^)]*\b'+re.escape(pname)+r'\b',body,re.S): sinks.add(idx)
                    if sinks: cross_summaries[name]=sorted(sinks)
    except (OSError, UnicodeError):
        cross_summaries={}
    # Cached exported-class method summaries. Building this index once per repository
    # avoids quadratic rescanning of every TypeScript file during per-file analysis.
    global _CLASS_METHOD_CACHE
    try:
        _CLASS_METHOD_CACHE
    except NameError:
        _CLASS_METHOD_CACHE={}
    _needs_class_cross=bool(re.search(r'\bimport\b|\bnew\s+'+ident+r'\s*\(', text))
    _class_files=files(repo) if _needs_class_cross else []
    _class_stamp=(len(_class_files), max((x.stat().st_mtime_ns for x in _class_files), default=0))
    _cache_key=(str(Path(repo).resolve()), _class_stamp)
    if not _needs_class_cross:
        class_method_summaries={}
    elif _cache_key in _CLASS_METHOD_CACHE:
        class_method_summaries=_CLASS_METHOD_CACHE[_cache_key]
    else:
        class_method_summaries={}
        try:
            for other_path in _class_files:
                other=_safe_read(other_path) or ''
                for cm in re.finditer(r'\bexport\s+class\s+('+ident+r')(?:\s+extends\s+'+ident+r')?\s*\{',other):
                    cls=cm.group(1); depth=1; j=cm.end(); quote=None; esc=False
                    while j<len(other) and depth:
                        ch=other[j]
                        if quote:
                            if esc: esc=False
                            elif ch=='\\': esc=True
                            elif ch==quote: quote=None
                        else:
                            if ch in "\"'`": quote=ch
                            elif ch=='{': depth+=1
                            elif ch=='}': depth-=1
                        j+=1
                    body=other[cm.end():max(cm.end(),j-1)]
                    for mm in re.finditer(r'(?<![\w$])(?:public\s+|protected\s+|private\s+|static\s+|async\s+|override\s+)*('+ident+r')\s*\(([^)]*)\)\s*\{',body):
                        meth=mm.group(1); params=[]
                        for raw in mm.group(2).split(','):
                            q=raw.strip().split('=')[0].strip(); q=re.sub(r'\s*:\s*.*$','',q)
                            params.append(q if re.fullmatch(ident,q) else f'__param{len(params)}')
                        mb=body[mm.end():]; sinks=[]
                        for idx,pn in enumerate(params):
                            if re.search(r'\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync|Object\.assign)\s*\([^)]*\b'+re.escape(pn)+r'\b',mb,re.S): sinks.append(idx)
                        if sinks: class_method_summaries[(cls,meth)]=sorted(set(sinks))
        except Exception:
            class_method_summaries={}
        _CLASS_METHOD_CACHE[_cache_key]=class_method_summaries

    # Resolve imported function/class aliases conservatively.
    # Resolve imported function aliases conservatively. If `import { run as r }`
    # exists, map local call `r(x)` to exported summary `run`.
    imported_aliases={}
    for im in re.finditer(r'\bimport\s*\{([^}]+)\}\s*from\s*[\"\']([^\"\']+)[\"\']', text):
        for spec in im.group(1).split(','):
            bits=re.split(r'\s+as\s+',spec.strip())
            if bits and bits[0].strip(): imported_aliases[bits[-1].strip()]=bits[0].strip()
    # Imported class aliases: `import { Runner as R } from './lib'`.
    imported_classes = {}
    for im in re.finditer(r'\bimport\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\']', text):
        for spec in im.group(1).split(','):
            bits=re.split(r'\s+as\s+',spec.strip())
            if bits and bits[0].strip() in {k[0] for k in class_method_summaries}:
                imported_classes[bits[-1].strip()] = bits[0].strip()
    for local_cls, exported_cls in imported_classes.items():
        for (cls,meth),indices in class_method_summaries.items():
            if cls != exported_cls: continue
            for cm in re.finditer(r'\bnew\s+'+re.escape(local_cls)+r'\s*\(\s*\)\s*\.\s*'+re.escape(meth)+r'\s*\(([^)]*)\)', text, re.S):
                args=split_top_level_args(cm.group(1))
                for idx in indices:
                    if idx < len(args) and expr_untrusted(args[idx]):
                        add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through bounded cross-file class-method propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='cross-file-class-method',class_name=exported_cls,method=meth,parameter_index=idx,local_alias=local_cls)

    for name,indices in list(cross_summaries.items()):
        pass
    for name,indices in cross_summaries.items():
        for cm in re.finditer(r'\b'+re.escape(name)+r'\s*\(([^)]*)\)',text,re.S):
            args=split_top_level_args(cm.group(1))
            for idx in indices:
                if idx < len(args) and expr_untrusted(args[idx]):
                    add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through bounded cross-file function propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='cross-file-function-parameter',function=name,parameter_index=idx)

    for local_name, exported_name in imported_aliases.items():
        indices=cross_summaries.get(exported_name, [])
        if not indices: continue
        for cm in re.finditer(r'\b'+re.escape(local_name)+r'\s*\(([^)]*)\)',text,re.S):
            args=split_top_level_args(cm.group(1))
            for idx in indices:
                if idx < len(args) and expr_untrusted(args[idx]):
                    add('TSQ-SEC-003',_line_of(text,cm.start()),'Untrusted input reaches a security-sensitive sink through imported function alias propagation','critical','high','concrete-untrusted-flow',source='request-or-input',sink='cross-file-import-alias',function=exported_name,parameter_index=idx,local_alias=local_name)

    # Direct dangerous sinks.
    for start_pos,op,cl,args in call_arguments(r'\b(?:child_process\s*\.\s*)?(?:execFileSync|execFile|execSync|exec|spawnSync|spawn)\s*',text):
        line=_line_of(text,start_pos); untrusted=expr_untrusted(args)
        dynamic=bool(re.search(r'\$\{|\+\s*'+ident+r'|\.concat\s*\(',args))
        if untrusted: add('TSQ-SEC-003',line,'Untrusted input reaches process execution sink through a bounded local data-flow path','critical','high','concrete-untrusted-flow',source='request-or-input',sink='process-execution')
        elif dynamic: add('TSQ-SEC-002',line,'Process execution uses dynamically constructed arguments; review command injection boundary','high','medium','dynamic-command-construction')
        else: add('TSQ-SEC-002',line,'Process execution API detected; no concrete untrusted flow proven','low','high','dangerous-sink-only')

    for start_pos,op,cl,args in call_arguments(r'\b(?:readFile|readFileSync|writeFile|writeFileSync|unlink|unlinkSync|rm|rmSync|open|openSync)\s*',text):
        untrusted=expr_untrusted(args); add('TSQ-SEC-004',_line_of(text,start_pos),'Potential user-controlled filesystem path; verify canonicalization and boundary checks','high' if untrusted else 'low','high','concrete-untrusted-flow' if untrusted else 'dangerous-sink-only')
    for start_pos,op,cl,args in call_arguments(r'\bJSON\.parse\s*',text):
        untrusted=expr_untrusted(args); add('TSQ-SEC-005',_line_of(text,start_pos),'Deserialization of untrusted input; validate schema before use' if untrusted else 'Deserialization boundary detected; validation may be appropriate','medium' if untrusted else 'low','medium' if untrusted else 'high','concrete-untrusted-flow' if untrusted else 'boundary-only')
    for start_pos,op,cl,args in call_arguments(r'\bObject\.assign\s*',text):
        line=_line_of(text,start_pos); untrusted=expr_untrusted(args); dangerous=bool(re.search(r'__proto__|constructor\s*\]|prototype\b',args,re.I))
        if untrusted and dangerous: sev,conf,kind='critical','high','concrete-dangerous-key-and-untrusted-flow'
        elif untrusted: sev,conf,kind='medium','medium','untrusted-object-merge'
        elif dangerous: sev,conf,kind='medium','medium','dangerous-key-pattern'
        else: sev,conf,kind='low','high','merge-only-no-untrusted-flow'
        add('TSQ-SEC-006',line,'Potential prototype-pollution-sensitive object merge; validate keys and destination',sev,conf,kind)
    return out

def _ai_signals(path,text):
    out=[]
    signals=[
      (r'\b(?:function|const|let)\s+\w+\s*\([^)]*\)\s*\{\s*return\s+\w+\([^;]+\);?\s*\}', 'TSQ-AI-002','Wrapper function pattern may be unnecessary abstraction','advisory'),
      (r'\b(?:TODO|FIXME)\b[^\n]*\b(?:implement|generated|AI|later)\b','TSQ-AI-003','Placeholder/generative implementation marker detected','advisory'),
      (r'(?:if\s*\([^\n]+\)\s*\{\s*throw[^\n]+\}\s*){3,}', 'TSQ-AI-004','Repeated defensive guard pattern may indicate generated boilerplate','advisory'),
      (r'\b(?:interface|type)\s+[A-Z]\w*(?:Props|Options|Config)\b[^\n]*\{[^}]{0,80}\}', 'TSQ-AI-005','Generic configuration/props abstraction may be generated boilerplate; review necessity','advisory'),
      (r'(?:catch\s*\([^)]*\)\s*\{\s*(?:console\.error|throw new Error|return)[^}]*\}\s*){3,}', 'TSQ-AI-006','Repeated generic error-handling wrapper pattern may indicate generated boilerplate','advisory'),
      (r'\b(?:with|create|build|make)[A-Z]\w*\s*\([^)]*\)\s*\{\s*return\s+new\s+[A-Z]\w*', 'TSQ-AI-007','Thin factory/wrapper abstraction may be unnecessary; review semantic value','advisory'),
    ]
    for pat,rule,msg,severity in signals:
        m=re.search(pat,text,re.I|re.S)
        if m: out.append(_tsq_finding(rule,path,_line_of(text,m.start()),msg,severity,confidence='low',provenance='advisory-pattern-analysis'))
    return out

def typescript_quality(repo, policy=None):
    """Deterministic TypeScript/TSX maintainability gate.

    This is intentionally a finding engine, not a decision authority. Its
    normalized evidence is recomputed by the v28.4 verifier.
    """
    repo=Path(repo).resolve()
    all_ts_paths=[p for p in files(repo) if p.suffix.lower() in {'.ts','.tsx'} and 'node_modules' not in p.parts]
    # Self-test fixtures can contain many independent TypeScript cases. Allow the
    # semantic self-test harness to scope a single quality pass to the fixture
    # files it just created, avoiding repeated full-repository compiler rebuilds.
    # This is deliberately opt-in and falls back to the complete project when the
    # scope is absent or cannot be resolved.
    scope_env=os.environ.get('TSQ_SELFTEST_SCOPE','').strip()
    paths=all_ts_paths
    if scope_env:
        requested=[]
        for raw in scope_env.split(os.pathsep):
            q=(repo/ raw).resolve() if not Path(raw).is_absolute() else Path(raw).resolve()
            if q in all_ts_paths: requested.append(q)
        if requested: paths=sorted(set(requested))
    project_model=build_project_model(repo)
    tsinfo=_ts_analysis(repo,paths)
    ts_engine_error=tsinfo.get('__engine_error__') if isinstance(tsinfo,dict) else None
    file_results=[v for k,v in tsinfo.items() if not str(k).startswith('__')] if isinstance(tsinfo,dict) else []
    compiler_available=bool(paths) and not ts_engine_error and len(file_results)==len(paths) and all(isinstance(v,dict) and v.get('backend')=='typescript-compiler-api' and v.get('semantic_available') for v in file_results)
    findings=[]
    if ts_engine_error:
        findings.append(_tsq_finding('TSQ-031','<repository>',1,f'TypeScript analyzer execution failed: {ts_engine_error}','critical',blocking=True))
    metrics={'files':len(paths),'lines':0,'functions':0,'any':0,
                           'ts_ignores':0,'console_logs':0,'todo_fixme':0,
                           'max_function_lines':0,'max_complexity':0,'max_nesting':0,'semantic_diagnostics':0,'unresolved_relative_imports':0,'resolved_imports':0,
                           'unused_imports':0,'exported_symbols':0,'duplicate_types':0,'dead_code':0,'suspicious_dependencies':0,'naming_anomalies':0,'security_findings':0,'security_high':0,'security_critical':0,'ai_signal_count':0,'category_scores':{},'backend_status':'compiler-api' if compiler_available else 'deterministic-source-fallback'}
    feedback=[]
    # Thresholds are deliberately conservative defaults; policy may override them
    # later, but the analyzer itself remains deterministic.
    defaults={'max_function_lines':80,'max_file_lines':500,'max_complexity':10,
              'max_nesting':4,'max_any':2,'max_params':6}
    configured=(policy or {}).get('typescript_quality',{}).get('rules',{}) if isinstance(policy,dict) else {}
    limits={k:int(configured.get(k,v)) for k,v in defaults.items()}
    type_defs={}
    for p in paths:
        rel=p.relative_to(repo).as_posix(); text=_safe_read(p)
        if text is None:
            findings.append(_tsq_finding('TSQ-000',rel,1,'Unable to read TypeScript source','critical')); continue
        lines=text.splitlines(); metrics['lines']+=len(lines)
        sec=_security_findings(repo,rel,text); findings.extend(sec)
        ai=_ai_signals(rel,text); findings.extend(ai)
        metrics['security_findings'] += len(sec); metrics['security_high'] += sum(1 for x in sec if x.get('severity')=='high'); metrics['security_critical'] += sum(1 for x in sec if x.get('severity')=='critical'); metrics['ai_signal_count'] += len(ai)
        if len(lines)>limits['max_file_lines']:
            findings.append(_tsq_finding('TSQ-002',rel,1,f'File contains {len(lines)} lines; maximum is {limits["max_file_lines"]}','medium',metric=len(lines),maximum=limits['max_file_lines']))
        # Compiler-derived functions where available.
        info=tsinfo.get(rel,{}) if isinstance(tsinfo,dict) else {}
        if isinstance(info,dict) and info.get('error'):
            findings.append(_tsq_finding('TSQ-031',rel,1,f'TypeScript semantic analysis failed for file: {info.get("error")}', 'critical', blocking=True))
        if isinstance(info,dict):
            for diag in info.get('semantic_diagnostics',[]):
                if int(diag.get('category',0)) == 1:
                    findings.append(_tsq_finding('TSQ-032',rel,1,f'TypeScript semantic diagnostic TS{diag.get("code")}: {diag.get("message")}', 'high', blocking=True, diagnostic_code=int(diag.get('code',0))))
        if isinstance(info,dict):
            sems=info.get('semantic_diagnostics',[]) or []
            metrics['semantic_diagnostics'] += len(sems)
            metrics['resolved_imports'] += sum(1 for x in (info.get('resolved_imports',[]) or []) if x.get('resolvedFile'))
            metrics['exported_symbols'] += int(info.get('exported_symbol_count',0) or 0)
            metrics['unresolved_relative_imports'] += sum(1 for x in (info.get('resolved_imports',[]) or []) if x.get('resolvedFile') is None and str(x.get('specifier','')).startswith('.'))
        funcs=info.get('funcs',[]) if isinstance(info,dict) else []
        metrics['functions']+=len(funcs)
        for fn in funcs:
            # End line is approximated from next function or brace matching; use
            # source node position only for start/complexity, keeping the rule deterministic.
            start=int(fn.get('line',1)); complexity_n=int(fn.get('complexity',1)); nesting=int(fn.get('max_nesting',0))
            metrics['max_complexity']=max(metrics['max_complexity'],complexity_n)
            metrics['max_nesting']=max(metrics['max_nesting'],nesting)
            # Locate a balanced body from the function start.
            tail='\n'.join(lines[start-1:])
            brace=tail.find('{'); flines=1
            if brace>=0:
                depth=0; end=None
                for idx,ch in enumerate(tail[brace:],brace):
                    if ch=='{': depth+=1
                    elif ch=='}':
                        depth-=1
                        if depth==0:
                            end=start+tail[:idx].count('\n')
                            break
                if end is not None: flines=max(1,end-start+1)
            metrics['max_function_lines']=max(metrics['max_function_lines'],flines)
            if flines>limits['max_function_lines']:
                findings.append(_tsq_finding('TSQ-003',rel,start,f'Function "{fn.get("name","<anonymous>")}" contains {flines} lines; maximum is {limits["max_function_lines"]}','medium',symbol=fn.get('name'),metric=flines,maximum=limits['max_function_lines']))
                feedback.append(f'Refactor {fn.get("name","<anonymous>")} into smaller cohesive functions')
            if complexity_n>limits['max_complexity']:
                findings.append(_tsq_finding('TSQ-004',rel,start,f'Cyclomatic complexity is {complexity_n}; maximum is {limits["max_complexity"]}','high',symbol=fn.get('name'),metric=complexity_n,maximum=limits['max_complexity']))
                feedback.append(f'Reduce complexity of {fn.get("name","<anonymous>")} by splitting branches into smaller functions')
            if nesting>limits['max_nesting']:
                findings.append(_tsq_finding('TSQ-005',rel,start,f'Nesting depth is {nesting}; maximum is {limits["max_nesting"]}','high',symbol=fn.get('name'),metric=nesting,maximum=limits['max_nesting']))
            if int(fn.get("params",0))>limits["max_params"]:
                findings.append(_tsq_finding("TSQ-006",rel,start,f"Function has {fn.get("params",0)} parameters; maximum is {limits["max_params"]}","medium",symbol=fn.get("name"),metric=int(fn.get("params",0)),maximum=limits["max_params"]))
                feedback.append(f"Reduce parameter count of {fn.get("name","<anonymous>")} by introducing a cohesive options/domain type")
        any_count=len(re.findall(r'\bany\b',re.sub(r'//[^\n]*|/\*.*?\*/','',text,flags=re.S)))
        metrics['any']+=any_count
        if any_count>limits['max_any']:
            line=_line_of(text,re.search(r'\bany\b',text).start()) if re.search(r'\bany\b',text) else 1
            findings.append(_tsq_finding('TSQ-007',rel,line,f'{any_count} occurrences of "any"; maximum allowed is {limits["max_any"]}','high',metric=any_count,maximum=limits['max_any']))
            feedback.append('Replace any with explicit domain or generic types')
        for pat,rule,msg,severity in [
            (r'@ts-(?:ignore|expect-error)\b','TSQ-008','TypeScript suppression directive detected','high'),
            (r'@ts-nocheck\b','TSQ-009','@ts-nocheck disables TypeScript checking for this file','critical'),
            (r'\bconsole\.(?:log|debug|info)\s*\(','TSQ-015','Console logging detected in source','medium'),
            (r'\b(?:TODO|FIXME)\b','TSQ-016','TODO/FIXME marker remains in source','low')]:
            for m in re.finditer(pat,text,re.I):
                findings.append(_tsq_finding(rule,rel,_line_of(text,m.start()),msg,severity))
                metrics['ts_ignores']+=1 if rule in {'TSQ-008','TSQ-009'} else 0
                metrics['console_logs']+=1 if rule=='TSQ-015' else 0
                metrics['todo_fixme']+=1 if rule=='TSQ-016' else 0
        # Excessive boolean/ternary chains are a maintainability signal.
        for m in re.finditer(r'(?:&&|\|\||\?\?|\?)',text):
            line=_line_of(text,m.start()); segment=text[max(0,text.rfind('\n',0,m.start())+1):text.find('\n',m.start()) if text.find('\n',m.start())>=0 else len(text)]
            if len(re.findall(r'&&|\|\||\?\?',segment))>=4:
                findings.append(_tsq_finding('TSQ-018',rel,line,'Condition contains an excessive boolean chain','medium'))
                break
        # Duplicate interface/type declarations by normalized signature.
        for m in re.finditer(r'\b(?:interface|type)\s+([A-Za-z_$][\w$]*)',text):
            name=m.group(1); type_defs.setdefault(name,[]).append(rel)
        # Async anti-patterns.
        for m in re.finditer(r'\basync\s+(?:function\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*\{',text):
            start=m.end(); depth=1; i=start
            while i<len(text) and depth:
                if text[i]=='{': depth+=1
                elif text[i]=='}': depth-=1
                i+=1
            body=text[start:i]
            if not re.search(r'\bawait\b',body) and not re.search(r'\breturn\s+new\s+Promise\b',body):
                findings.append(_tsq_finding('TSQ-019',rel,_line_of(text,m.start()),f'Async function "{m.group(1)}" contains no await','medium',symbol=m.group(1)))
                feedback.append(f'Remove async from {m.group(1)} or await the intended asynchronous operation')
        # Suspicious promise handling: fire-and-forget calls and empty catches.
        for m in re.finditer(r'\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)',text):
            findings.append(_tsq_finding('TSQ-020',rel,_line_of(text,m.start()),'Empty Promise catch handler silently discards errors','high'))
        # Heuristic generated-code signals: repetitive explanatory comments.
        comments=re.findall(r'//[^\n]*|/\*.*?\*/',text,re.S)
        ai_comments=[c for c in comments if re.search(r'\b(this function|this code|this method|the following|note that)\b',c,re.I)]
        if len(ai_comments)>=4 and len(ai_comments) >= max(4, len(lines)//40):
            findings.append(_tsq_finding('TSQ-AI-001',rel,1,'Comment density contains repetitive explanatory/generated-code patterns','low',count=len(ai_comments)))
    # Duplicate type/interface detection uses declaration shape rather than only the
    # symbol name. This avoids flagging legitimate declaration merging.
    type_shapes={}
    for p in paths:
        rel=p.relative_to(repo).as_posix(); text=_safe_read(p) or ''
        for m in re.finditer(r'\b(interface|type)\s+([A-Za-z_$][\w$]*)\s*(?:=|\{)',text):
            kind,name=m.group(1),m.group(2)
            start=m.start(); end=min(len(text),start+4000)
            fragment=re.sub(r'//[^\n]*|/\*.*?\*/','',text[start:end],flags=re.S)
            normalized=re.sub(r'\s+',' ',fragment).strip()
            body=normalized.split('{',1)[1].rsplit('}',1)[0] if '{' in normalized and '}' in normalized else normalized
            members=re.findall(r'([A-Za-z_$][\w$]*)\s*(?:\?|:)\s*([^;,}]+)',body)
            if len(members)<2: continue
            structural=';'.join(sorted(re.sub(r'\s+',' ',typ.strip()) for _,typ in members))
            fp=hashlib.sha256((kind+'|'+structural).encode()).hexdigest()
            type_shapes.setdefault(fp,[]).append((rel,name,kind,len(members)))
    for fp,decls in sorted(type_shapes.items()):
        paths_for=sorted({x[0] for x in decls})
        if len(paths_for)>1 and len({x[1] for x in decls})>1:
            metrics['duplicate_types']+=1
            first=decls[0]
            findings.append(_tsq_finding('TSQ-024',first[0],1,f'Structurally similar {first[2]} declarations detected across modules; review ownership before merging','low',blocking=False,confidence='medium',paths=paths_for,symbols=sorted({x[1] for x in decls}),fingerprint=fp,provenance='structural-type-analysis'))
    # Token-level duplicate blocks: deterministic 8-token windows repeated across files.
    windows={}
    for p in paths:
        text=_safe_read(p) or ''; toks=_token_norm(text)
        for i in range(max(0,len(toks)-7)):
            key=' '.join(toks[i:i+8])
            windows.setdefault(key,set()).add(p.relative_to(repo).as_posix())
    repeated=[(k,v) for k,v in windows.items() if len(v)>=2 and k]
    for k,ps in sorted(repeated,key=lambda x:(-len(x[1]),x[0]))[:10]:
        findings.append(_tsq_finding('TSQ-025',sorted(ps)[0],1,'Repeated normalized token sequence detected across files; advisory similarity signal only','low', blocking=False,paths=sorted(ps)))
    # Unused imports: TypeChecker/reference analysis is authoritative when available.
    # Lexical fallback is diagnostic-only and can never create a blocking finding.
    if compiler_available:
        for p in paths:
            rel=p.relative_to(repo).as_posix(); info=tsinfo.get(rel,{}) if isinstance(tsinfo,dict) else {}
            for local in info.get('unused_imports',[]) or []:
                metrics['unused_imports']+=1
                findings.append(_tsq_finding('TSQ-021',rel,1,f'Imported symbol "{local}" appears unused by TypeChecker reference analysis','medium',symbol=local,backend='typescript-typechecker',confidence='high',provenance='typescript-typechecker'))
    else:
        for p in paths:
            rel=p.relative_to(repo).as_posix(); text=_safe_read(p) or ''
            for m in re.finditer(r'import\s+\{\s*([^}]+)\s*\}\s+from\s+[\'"][^\'"]+[\'"]',text):
                for item in m.group(1).split(','):
                    raw=item.strip(); local=(raw.split(' as ')[-1]).strip() if raw else ''
                    if local and len(re.findall(r'\b'+re.escape(local)+r'\b',text))<=1:
                        metrics['unused_imports']+=1
                        findings.append(_tsq_finding('TSQ-021',rel,_line_of(text,m.start()),f'Possible unused import "{local}" (lexical diagnostic only)','low',symbol=local,backend='lexical-diagnostic-fallback',confidence='low',provenance='lexical-diagnostic-only',blocking=False))
    # Additional deterministic maintainability and dependency heuristics.
    for p in paths:
        rel=p.relative_to(repo).as_posix(); text=_safe_read(p) or ''; lines=text.splitlines()
        for i,line in enumerate(lines[:-1]):
            if re.search(r'\b(?:return|throw)\b[^;{]*;',line) and lines[i+1].strip() and not lines[i+1].lstrip().startswith(('}', 'case ', 'default:')):
                metrics['dead_code']+=1; findings.append(_tsq_finding('TSQ-026',rel,i+2,'Possible unreachable statement after return/throw; advisory heuristic only','low', blocking=False)); break
        for m in re.finditer(r'\bexport\s+(?:async\s+)?(?:function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)',text):
            name=m.group(1); km=re.search(r'\b(?:function|class|interface|type|enum|const|let|var)\b',m.group(0)); kind=km.group(0) if km else 'declaration'
            bad=(kind in {'class','interface','type','enum','function'} and not re.match(r'^[A-Z][A-Za-z0-9_$]*$',name)) or (kind in {'const','let','var'} and re.match(r'^[A-Z][A-Za-z0-9_$]*$',name))
            if bad:
                metrics['naming_anomalies']+=1; findings.append(_tsq_finding('TSQ-027',rel,_line_of(text,m.start()),f'Exported {kind} name {name} is inconsistent with conventional TypeScript naming','low',symbol=name))
        if p.name=='package.json':
            try:
                data=json.loads(text); deps={**data.get('dependencies',{}),**data.get('devDependencies',{})}
                for dep in sorted(set(deps)&{'event-stream','node-ipc','ua-parser-js','colors.js'}):
                    metrics['suspicious_dependencies']+=1; findings.append(_tsq_finding('TSQ-028',rel,1,f'Suspicious dependency {dep} requires review','high',dependency=dep))
                for key,val in (data.get('scripts',{}) or {}).items():
                    if re.search(r'curl\s+[^|]+\|\s*(?:sh|bash)|wget\s+[^|]+\|\s*(?:sh|bash)',str(val),re.I):
                        metrics['suspicious_dependencies']+=1; findings.append(_tsq_finding('TSQ-029',rel,1,f'Install script {key} pipes remote content into a shell','critical',script=key))
            except (OSError, UnicodeError, json.JSONDecodeError): pass
    if paths and not compiler_available:
        findings.append(_tsq_finding('TSQ-030','<repository>',1,'TypeScript semantic compiler analysis is unavailable; source heuristics are diagnostic-only and cannot establish a clean PASS','critical',blocking=True, capability='typescript-semantic-analysis'))
    # Repository-level dependency and install-script checks are evaluated outside the TS file list.
    pkg=repo/'package.json'
    if pkg.exists():
        try:
            data=json.loads(_safe_read(pkg) or '{}'); deps={**data.get('dependencies',{}),**data.get('devDependencies',{})}
            for dep in sorted(set(deps)&{'event-stream','node-ipc','ua-parser-js','colors.js'}):
                metrics['suspicious_dependencies']+=1; findings.append(_tsq_finding('TSQ-028','package.json',1,f'Suspicious dependency {dep} requires review','high',dependency=dep))
            for key,val in (data.get('scripts',{}) or {}).items():
                if re.search(r'curl\s+[^|]+\|\s*(?:sh|bash)|wget\s+[^|]+\|\s*(?:sh|bash)',str(val),re.I):
                    metrics['suspicious_dependencies']+=1; findings.append(_tsq_finding('TSQ-029','package.json',1,f'Install script {key} pipes remote content into a shell','critical',script=key))
        except (OSError, UnicodeError, json.JSONDecodeError): pass
    # Quality score is a weighted quality indicator, not a security boundary.
    # Blocking remains controlled by finding severity/policy.
    weights={'structure':15,'type_safety':20,'complexity':25,'maintainability':15,'security':15,'duplication':10}
    cats={'structure':[],'type_safety':[],'complexity':[],'maintainability':[],'security':[],'duplication':[]}
    for f in findings:
        r=str(f.get('rule',''))
        if r in {'TSQ-004','TSQ-005','TSQ-006','TSQ-003'}: cat='complexity'
        elif r in {'TSQ-007','TSQ-008','TSQ-009','TSQ-019','TSQ-020'}: cat='type_safety'
        elif r in {'TSQ-021','TSQ-015','TSQ-028','TSQ-029'}: cat='security'
        elif r in {'TSQ-024','TSQ-025'}: cat='duplication'
        elif r in {'TSQ-026','TSQ-027','TSQ-030'}: cat='maintainability'
        elif r in {'TSQ-002','TSQ-016','TSQ-018','TSQ-AI-001'}: cat='maintainability'
        else: cat='structure'
        cats[cat].append(f)
    penalties={'low':2,'medium':5,'high':12,'critical':25}
    category_scores={}
    for cat,fs in cats.items():
        category_scores[cat]=max(0,100-sum(penalties.get(str(f.get('severity')),0) for f in fs))
    score=round(sum(category_scores[c]*weights[c] for c in weights)/100)
    metrics['category_scores']=category_scores
    status='PASS' if not any(f.get('severity') in {'high','critical'} or f.get('blocking') is True for f in findings) else 'FAIL'
    for f in findings:
        f['blocking']=f.get('severity') in {'high','critical'}
    return {'version':'1.0','backend':('typescript-compiler-api+deterministic-source-rules' if compiler_available else 'deterministic-source-rules-fallback'),
            'files':len(paths),'metrics':metrics,'score':score,'status':status,
            'findings':sorted(findings,key=lambda x:(x.get('path',''),x.get('line',0),x.get('rule',''),x.get('id',''))),
            'ai_pattern':{'status':'advisory','detected':any(f['rule'].startswith('TSQ-AI-') for f in findings)},
            'ai_feedback':sorted(set(feedback)),
            'threshold':int((policy or {}).get('typescript_quality',{}).get('minimum_score',85))}

def complexity(repo: Path, changed=None):
    repo=Path(repo); findings=[]; total_lines=0; functions=0; branches=0; max_nesting=0; per_function={}
    code_files=files(repo)
    ts_paths=[p for p in code_files if p.suffix.lower() in {'.ts','.tsx','.js','.jsx'}]
    tsinfo=_ts_analysis(repo,ts_paths)
    ts_engine_error=tsinfo.get('__engine_error__') if isinstance(tsinfo,dict) else None
    if ts_engine_error:
        findings.append({'path':'<repository>','kind':'typescript-analyzer-error','severity':'critical','message':f'TypeScript compiler analysis failed: {ts_engine_error}'})
    for f in code_files:
        text=_safe_read(f); rel=f.relative_to(repo).as_posix()
        if text is None: findings.append({'path':rel,'kind':'unreadable-source','severity':'critical'}); continue
        lines=text.splitlines()
        if f.relative_to(repo).as_posix() in tsinfo and not tsinfo[f.relative_to(repo).as_posix()].get('error'):
            funcs=[{'name':x['name'],'line':x['line'],'branches':x['branches'],'max_nesting':x.get('max_nesting',0),'complexity':1+x['branches']} for x in tsinfo[f.relative_to(repo).as_posix()].get('funcs',[])]
            b=sum(x['branches'] for x in funcs); n=max([x.get('max_nesting',0) for x in funcs] or [0])
        else:
            funcs,b,n=_complexity_file(repo,f)
        total_lines+=len(lines); branches+=b; functions+=len(funcs); max_nesting=max(max_nesting,n); per_function[rel]=funcs
        if len(lines)>300: findings.append({'path':rel,'kind':'large-file','severity':'medium'})
        if n>8: findings.append({'path':rel,'kind':'deep-nesting','severity':'medium'})
        for fn in funcs:
            if fn['complexity']>15: findings.append({'path':rel,'kind':'high-function-complexity','severity':'high','function':fn['name'],'complexity':fn['complexity']})
    normalized=normalize({'findings':findings},'complexity')
    return {'files':len(code_files),'lines':total_lines,'functions':functions,'branches':branches,'max_nesting':max_nesting,'per_function':per_function,'findings':normalized,'metric_backend':'python-ast/typescript-compiler-api-ast/token-aware-fallback'}

def complexity_delta(baseline,current):
    return {'files':int(current.get('files',0))-int(baseline.get('files',0)),'lines':int(current.get('lines',0))-int(baseline.get('lines',0)),'functions':int(current.get('functions',0))-int(baseline.get('functions',0)),'branches':int(current.get('branches',0))-int(baseline.get('branches',0)),'max_nesting':int(current.get('max_nesting',0))-int(baseline.get('max_nesting',0)),'finding_delta':len(current.get('findings',[]))-len(baseline.get('findings',[]))}
