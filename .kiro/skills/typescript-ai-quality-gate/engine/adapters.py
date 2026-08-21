from __future__ import annotations
import json, shutil
from pathlib import Path

def _json(path):
    try: return json.loads(Path(path).read_text())
    except (OSError, UnicodeError, json.JSONDecodeError): return {}

def _scripts(repo,name): return _json(Path(repo)/name).get('scripts',{})

def adapters(repo: Path):
    repo=Path(repo); found=[]
    if (repo/'package.json').exists(): found.append({'id':'node','language':'typescript/javascript','config':'package.json','runner':'npm','contract':'detect-discover-availability-execute-parse-normalize'})
    if (repo/'Cargo.toml').exists(): found.append({'id':'rust','language':'rust','config':'Cargo.toml','runner':'cargo','contract':'detect-discover-availability-execute-parse-normalize'})
    if (repo/'composer.json').exists(): found.append({'id':'laravel-php','language':'php','config':'composer.json','runner':'composer','contract':'detect-discover-availability-execute-parse-normalize'})
    if any(p.is_file() and p.suffix in {'.sh','.bash'} for p in repo.rglob('*')): found.append({'id':'bash','language':'bash','config':'shell','runner':'shellcheck','contract':'detect-discover-availability-execute-parse-normalize'})
    return found

def adapter_commands(repo: Path):
    repo=Path(repo); out=[]
    if (repo/'package.json').exists():
        scripts=_scripts(repo,'package.json'); preferred=['verify','quality','ci','check','typecheck','lint','test','format']
        names=[n for n in preferred if n in scripts] or [n for n in scripts if any(x in n.lower() for x in ('verify','quality','check','lint','type','test','format'))][:8]
        for n in names: out.append({'adapter':'node','name':n,'argv':['npm','run',n],'source':'package.json','parser':'npm-script','required':True,'parser_kind':'structured-fallback'})
        if (repo/'biome.json').exists() or (repo/'biome.jsonc').exists(): out.append({'adapter':'node','name':'biome-check','argv':['npx','--no-install','biome','check','--reporter=json','.'],'source':'biome-config','parser':'biome','required':True,'parser_kind':'native'})
        if any((repo/x).exists() for x in ('.eslintrc','.eslintrc.json','.eslintrc.js','.eslintrc.cjs','.eslintrc.yml','.eslintrc.yaml','eslint.config.js','eslint.config.mjs','eslint.config.cjs','eslint.config.ts','eslint.config.mts','eslint.config.cts')):
            out.append({'adapter':'node','name':'eslint-check','argv':['npx','--no-install','eslint','--format','json','.'],'source':'eslint-config','parser':'eslint','required':True,'parser_kind':'native'})
        if (repo/'.prettierrc').exists() or (repo/'.prettierrc.json').exists(): out.append({'adapter':'node','name':'prettier-check','argv':['npx','--no-install','prettier','--check','.'],'source':'prettier-config','parser':'prettier','required':True,'parser_kind':'structured-fallback'})
    if (repo/'Cargo.toml').exists():
        out += [
            {'adapter':'rust','name':'fmt-check','argv':['cargo','fmt','--','--check'],'source':'Cargo.toml','parser':'cargo','required':True,'parser_kind':'structured-fallback'},
            {'adapter':'rust','name':'check','argv':['cargo','check','--message-format=json'],'source':'Cargo.toml','parser':'cargo-json','required':True,'parser_kind':'native'},
            {'adapter':'rust','name':'test','argv':['cargo','test','--message-format=json'],'source':'Cargo.toml','parser':'cargo-json','required':True,'parser_kind':'native'}]
    if (repo/'composer.json').exists():
        out.append({'adapter':'laravel-php','name':'composer-validate','argv':['composer','validate','--no-check-publish'],'source':'composer.json','parser':'composer','required':True,'parser_kind':'structured-fallback'})
        scripts=_scripts(repo,'composer.json')
        for n in ('verify','quality','check','test','lint','phpstan','pint','phpcs'):
            if n in scripts:
                parser='phpstan-json' if n=='phpstan' else 'phpcs-json' if n=='phpcs' else 'composer'
                argv=['composer','run-script',n]
                if n=='phpstan': argv += ['--','--error-format=json']
                elif n=='phpcs': argv += ['--','--report=json']
                out.append({'adapter':'laravel-php','name':n,'argv':argv,'source':'composer.json','parser':parser,'required':True,'parser_kind':'native' if parser.endswith('-json') else 'structured-fallback'})
    shell_files=[str(p.relative_to(repo)) for p in repo.rglob('*') if p.is_file() and p.suffix in {'.sh','.bash'} and not any(x in p.parts for x in {'.git','node_modules','vendor','target'})]
    if shell_files: out.append({'adapter':'bash','name':'shellcheck','argv':['shellcheck','--format=json']+shell_files,'source':'shellcheckrc' if (repo/'shellcheckrc').exists() else 'shell','parser':'shellcheck','required':True,'parser_kind':'native'})
    return out

def discover(repo): return [(f"{x['adapter']}:{x['name']}",x['argv'],x['source'],x['adapter']) for x in adapter_commands(Path(repo))]
def available(repo): return [x for x in discover(repo) if shutil.which(x[1][0])]
def adapter_contracts(repo):
    return [{'adapter':x['adapter'],'name':x['name'],'parser':x.get('parser'),'contract':'detect-discover-availability-execute-parse-normalize','required':bool(x.get('required',False)),'available':bool(shutil.which(x['argv'][0])),'parser_kind':x.get('parser_kind','structured-fallback'),'parse_implemented':bool(x.get('parser')),'normalize_implemented':True,'native':x.get('parser_kind')=='native','implementation':('native-json-v28.4' if x.get('parser_kind')=='native' else 'structured-text-v28.4')} for x in adapter_commands(Path(repo))]
