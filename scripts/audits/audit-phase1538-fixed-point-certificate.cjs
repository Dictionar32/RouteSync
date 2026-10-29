const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const model = read('packages/core/src/types/upstream/semanticDataflow.ts');
const boundary = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts');
const checks = [
  ['judgment model requires closure certificate', /readonly closureCertificate: SemanticDataflowClosureCertificate/.test(model)],
  ['certificate records fact convergence and rounds', /factClosure: Readonly<\{ readonly kind: 'fact_closure'; readonly converged: true; readonly rounds: number \}>/.test(model)],
  ['certificate records path convergence and rounds', /pathClosure: Readonly<\{ readonly kind: 'path_closure'; readonly converged: true; readonly rounds: number \}>/.test(model)],
  ['fact solver fails closed when fixed point is not reached', /if \(!fixed\.converged\) throw new Error\(`semantic dataflow fact closure did not converge/.test(authority)],
  ['path solver fails closed when closure is incomplete', /if \(!result\.converged\) throw new Error\(`semantic dataflow path closure did not converge/.test(authority)],
  ['path expansion prevents revisiting path identities', /!relationEqual\(identityKey\(next\.target\), identityKey\(path\.source\)\)[\s\S]*!relationAnyMatch\(path\.steps/.test(authority)],
  ['boundary rejects missing closure certificate', /closure_certificate_missing/.test(boundary) && /certificate === undefined \|\| certificate === null/.test(boundary)],
  ['boundary validates convergence flags and round counts', /certificate\.factClosure\.converged !== true[\s\S]*Number\.isSafeInteger\(certificate\.factClosure\.rounds\)[\s\S]*certificate\.pathClosure\.converged !== true/.test(boundary)],
  ['scanner admits judgment before downstream projection', /semanticDataflowJudgmentBoundary\.admit\(judged\)/.test(scanner) && scanner.indexOf('semanticDataflowJudgmentBoundary.admit(judged)') < scanner.indexOf('const canonical = admission.judgment')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}
`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}
`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
