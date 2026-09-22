#!/usr/bin/env python3
"""Final40 stabilization gate: bounded evidence, adversarial regression, and runtime hygiene."""
import json, os, subprocess, sys, tempfile, time, py_compile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]


def run(cmd, timeout):
    started=time.monotonic()
    try:
        p=subprocess.run(cmd,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
        return p.returncode,time.monotonic()-started,p.stdout,p.stderr
    except subprocess.TimeoutExpired as e:
        return 124,time.monotonic()-started,e.stdout or '',e.stderr or ''


def adversarial():
    from engine.analysis import typescript_quality
    with tempfile.TemporaryDirectory() as td:
        repo=Path(td)
        (repo/'package.json').write_text('{"packageManager":"pnpm@9.0.0"}\n')
        (repo/'sink.ts').write_text('''export class Runner {\n  run(command: string) { exec(command); }\n}\nexport function run(command: string) { exec(command); }\n''')
        (repo/'main.ts').write_text('''import { Runner, run as execute } from "./sink";\nexport function unrelated(req: any) {\n  console.log(req.body.x);\n  Promise.resolve("safe").then(v => exec(v));\n  Promise.resolve("safe").catch(v => exec(v));\n  Promise.resolve("safe").finally(() => exec("safe"));\n}\nexport function direct(req: any) {\n  const { command } = req.body;\n  exec(command);\n}\nexport function chain(req: any) {\n  Promise.resolve(req.body.command).then(v => v).then(v => exec(v));\n}\nexport function method(req: any) {\n  const x = req.body.command;\n  new Runner().run(x);\n  execute(x);\n}\n''')
        q=typescript_quality(repo, {'typescript_quality':{'minimum_score':85}})
        sec=[f for f in q['findings'] if str(f.get('rule','')).startswith('TSQ-SEC-')]
        bad=[f for f in sec if f.get('function')=='unrelated' and f.get('severity') in {'high','critical'}]
        assert not bad, bad
        assert any(f.get('rule')=='TSQ-SEC-003' and f.get('line')==10 and f.get('severity')=='critical' for f in sec), sec
        assert any(f.get('rule')=='TSQ-SEC-003' and f.get('line')==13 and f.get('severity')=='critical' for f in sec), sec
        assert any(f.get('rule')=='TSQ-SEC-003' and f.get('line')==17 and f.get('severity')=='critical' for f in sec), sec
        return len(sec)


def main():
    # Compile every Python module without executing it.
    for p in ROOT.rglob('*.py'):
        if any(x in p.parts for x in {'.git','__pycache__'}):
            continue
        py_compile.compile(str(p),doraise=True)
    for script in (ROOT/'self-tests'/'run.sh',ROOT/'self-tests'/'runx.sh',ROOT/'self-tests'/'stabilization.sh'):
        p=subprocess.run(['bash','-n',str(script)],cwd=ROOT)
        assert p.returncode==0, script
    n=adversarial()
    print(f'FINAL40_ADVERSARIAL_PASS:security_findings={n}')
    print('FINAL40_STATIC_PASS')

if __name__=='__main__':
    main()
