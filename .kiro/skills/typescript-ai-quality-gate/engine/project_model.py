from __future__ import annotations
import json, shutil, subprocess, re
from pathlib import Path

IGNORE={'.git','node_modules','vendor','dist','build','coverage','.next','.turbo'}

def _read_json(p):
    try: return json.loads(p.read_text(encoding='utf-8'))
    except (OSError, UnicodeError, json.JSONDecodeError): return {}

def build_project_model(repo):
    repo=Path(repo).resolve()
    pkg=_read_json(repo/'package.json') if (repo/'package.json').exists() else {}
    lockfiles=[p.name for p in repo.iterdir() if p.is_file() and p.name in {'package-lock.json','pnpm-lock.yaml','yarn.lock','bun.lockb','bun.lock'}]
    declared=pkg.get('packageManager') if isinstance(pkg.get('packageManager'),str) else ''
    pm=(declared.split('@',1)[0] if declared else 'unknown')
    if pm not in {'npm','pnpm','yarn','bun'}: pm='unknown'
    if pm in {'npm','pnpm','yarn','bun'}:
        pass
    elif 'pnpm-lock.yaml' in lockfiles: pm='pnpm'
    elif 'yarn.lock' in lockfiles: pm='yarn'
    elif 'bun.lockb' in lockfiles or 'bun.lock' in lockfiles: pm='bun'
    elif 'package-lock.json' in lockfiles: pm='npm'
    else: pm='unknown'
    tsconfigs=sorted(str(p.relative_to(repo)) for p in repo.rglob('tsconfig*.json') if not any(x in p.parts for x in IGNORE))
    project_references=[]
    for tc in tsconfigs:
        cfg=_read_json(repo/tc)
        refs=cfg.get('references',[]) if isinstance(cfg,dict) else []
        for ref in refs if isinstance(refs,list) else []:
            if isinstance(ref,dict) and isinstance(ref.get('path'),str):
                project_references.append({'config':tc,'path':ref['path']})
    source_roots=[]; test_roots=[]
    for p in repo.rglob('*'):
        if not p.is_dir() or any(x in p.parts for x in IGNORE): continue
        rel=p.relative_to(repo).as_posix(); name=p.name.lower()
        # Only call a directory a source/test root when it actually contains TS/TSX/JS
        # implementation files. Container directories such as monorepo `packages/` are not roots.
        try:
            has_code=any(q.is_file() and q.suffix.lower() in {'.ts','.tsx','.js','.jsx'} for q in p.iterdir())
            has_tests=any(q.is_file() and (q.suffix.lower() in {'.ts','.tsx','.js','.jsx'}) and re.search(r'(?:\.test|\.spec)\.',q.name,re.I) for q in p.iterdir())
        except OSError:
            has_code=has_tests=False
        if name in {'src','source','app','lib'} and has_code: source_roots.append(rel)
        if name in {'test','tests','__tests__','spec','specs'} and (has_code or has_tests): test_roots.append(rel)
    cfg_names={'eslint':['eslint.config.js','eslint.config.mjs','eslint.config.cjs','.eslintrc','.eslintrc.json','.eslintrc.js'],
               'build':['vite.config.ts','vite.config.js','webpack.config.js','rollup.config.js','tsup.config.ts','tsup.config.js','next.config.js','next.config.mjs','rspack.config.js','esbuild.config.js'],
               'framework':['nest-cli.json','angular.json','next.config.js','next.config.mjs','nuxt.config.ts','svelte.config.js','remix.config.js','astro.config.mjs'],
               'test':['vitest.config.ts','vitest.config.js','jest.config.ts','jest.config.js','playwright.config.ts','playwright.config.js','cypress.config.ts','cypress.config.js'],
               'format':['.prettierrc','.prettierrc.json','.prettierrc.js','.prettierrc.cjs','prettier.config.js','prettier.config.cjs']}
    configs={k:sorted(n for n in vals if (repo/n).exists()) for k,vals in cfg_names.items()}
    scripts=pkg.get('scripts',{}) if isinstance(pkg.get('scripts',{}),dict) else {}
    deps={}
    for key in ('dependencies','devDependencies','peerDependencies','optionalDependencies'):
        val=pkg.get(key,{})
        if isinstance(val,dict): deps.update(val)
    framework_hints=[]
    framework_markers={'@nestjs/core':'nestjs','next':'next','@angular/core':'angular','react':'react','vue':'vue','svelte':'svelte','astro':'astro','express':'express','fastify':'fastify'}
    for dep,framework in framework_markers.items():
        if dep in deps: framework_hints.append(framework)
    workspaces=pkg.get('workspaces',[])
    if isinstance(workspaces,dict): workspaces=workspaces.get('packages',[])
    if (repo/'pnpm-workspace.yaml').exists() or (repo/'pnpm-workspace.yml').exists():
        try:
            text=(repo/'pnpm-workspace.yaml').read_text(encoding='utf-8')
            vals=[]; in_packages=False
            for raw in text.splitlines():
                line=raw.split('#',1)[0].rstrip()
                if not line.strip(): continue
                if re.match(r'^\s*packages\s*:',line):
                    in_packages=True
                    tail=line.split(':',1)[1].strip()
                    if tail.startswith('[') and tail.endswith(']'):
                        vals.extend([x.strip().strip('\"\'') for x in tail[1:-1].split(',') if x.strip()])
                    continue
                if in_packages and re.match(r'^\s*-\s+',line):
                    vals.append(re.sub(r'^\s*-\s+','',line).strip().strip('\"\''))
                elif in_packages and not re.match(r'^\s+',line):
                    in_packages=False
            workspaces=vals
        except (OSError, UnicodeError):
            workspaces=[]
    if not isinstance(workspaces,list): workspaces=[]
    workspaces=[str(x) for x in workspaces if isinstance(x,(str,)) and str(x).strip()]
    # Expand workspace globs with pnpm-style negative patterns. pathlib does not
    # implement `!glob` exclusions, so apply positive patterns first and remove
    # packages matched by negative patterns. This keeps the project model aligned
    # with common monorepo workspace semantics.
    workspace_dirs=[]
    positives=[x for x in workspaces if not x.lstrip().startswith('!')]
    negatives=[x.lstrip()[1:] for x in workspaces if x.lstrip().startswith('!')]
    def _matches_pattern(rel, pattern):
        try:
            from pathlib import PurePosixPath
            return PurePosixPath(rel).match(pattern) or any(PurePosixPath(rel).match(pattern.lstrip('./')) for _ in [0])
        except (TypeError, ValueError):
            return False
    for pattern in positives:
        try:
            for q in repo.glob(pattern):
                if q.is_dir() and (q/'package.json').exists():
                    workspace_dirs.append(q.relative_to(repo).as_posix())
        except (OSError, ValueError): pass
    workspace_dirs=sorted(set(workspace_dirs))
    if negatives:
        workspace_dirs=[d for d in workspace_dirs if not any(_matches_pattern(d,n) or d==n.rstrip('/') for n in negatives)]
    if workspace_dirs:
        source_roots.extend(sorted(set(d+'/src' for d in workspace_dirs if (repo/d/'src').is_dir())) )
        test_roots.extend(sorted(set(d+'/tests' for d in workspace_dirs if (repo/d/'tests').is_dir())) )
    git={'available':False,'changed_files':[],'status':None}
    if shutil.which('git'):
        try:
            r=subprocess.run(['git','-C',str(repo),'status','--porcelain','--untracked-files=all'],capture_output=True,text=True,timeout=10)
            if r.returncode==0:
                changed=[]
                for line in r.stdout.splitlines():
                    if len(line)>=4:
                        value=line[3:]
                        if ' -> ' in value: value=value.split(' -> ',1)[-1]
                        changed.append(value)
                git={'available':True,'changed_files':sorted(set(changed)),'status':'dirty' if changed else 'clean'}
        except (OSError, subprocess.SubprocessError): pass
    files=[]
    for p in repo.rglob('*'):
        if p.is_file() and p.suffix.lower() in {'.ts','.tsx'} and not any(x in p.parts for x in IGNORE): files.append(p.relative_to(repo).as_posix())
    commands={k:scripts[k] for k in ('build','test','lint','typecheck','check','format') if k in scripts and isinstance(scripts[k],str)}
    return {'package_manager':pm,'package_manager_evidence':('declared' if declared and pm != 'unknown' else ('lockfile' if pm != 'unknown' else 'not_detected')),'lockfiles':sorted(lockfiles),'typescript_configs':tsconfigs,'project_references':sorted(project_references,key=lambda x:(x['config'],x['path'])),'workspace':bool(workspaces),'workspaces':workspaces if isinstance(workspaces,list) else [],'workspace_dirs':workspace_dirs,'source_roots':sorted(set(source_roots)),'test_roots':sorted(set(test_roots)),'configs':configs,'framework_hints':sorted(set(framework_hints+configs.get('framework',[]))),'commands':commands,'dependencies':sorted(deps),'typescript_files':sorted(files),'git':git}
