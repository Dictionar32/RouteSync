const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const routeProducer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const requestBinding = read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['typed projection loss is an explicit ownership obligation', /kind: 'typed_request_binding_projection_loss'[\s\S]*currentOwner: 'route_producer_relations'[\s\S]*targetOwner: 'upstream_route_request_binding_authority'/.test(contract)],
  ['coverage names the lossy fallback without claiming closure', /canonical-action-request-judgment-is-not-yet-wired-to-route-boundary/.test(contract) && /typed-request-binding-projection-loss-remains-open/.test(contract)],
  ['canonical controller request judgment preserves typed and unresolved variants', /kind: 'typed'; readonly type: TypeExpression/.test(requestBinding) && /kind: 'typed_unresolved'; readonly judgment: UnresolvedPhpParameterTypeJudgment/.test(requestBinding)],
  ['route producer keeps canonical typed/unresolved route ADT variants available', /'typed_request'[\s\S]*'unresolved_request'/.test(read('packages/core/src/types/domain/request.ts')) && /'typed_request'[\s\S]*'unresolved_request'/.test(routeProducer)],
  ['action contract version synchronizes with production wiring', /readonly version: 18;/.test(contract) && /version: 18 as const/.test(wiring)],
  ['runtime executor still forwards the exact semantic judgment', /semanticJudgment: input\.semanticJudgment/.test(wiring) && /semanticJudgment: LaravelControllerActionSemanticJudgmentInterface/.test(executor)],
  ['invocation correlation and integrated response pipeline remain wired', /invocationJudgment/.test(scanner) && /judgeIntegratedResponse/.test(scanner)],
  ['no new relation/foundation or subscanner layer was introduced', !/types\/upstream\/(relation|foundation)(\/|')|semantic\/(relation|foundation)(\/|')|subscanners\/(relation|foundation)(\/|')/.test(contract + wiring) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation'))],
  ['source trace documentation records the open boundary', /typed_request_binding_projection_loss/.test(read('packages/core/src/types/upstream/docs/PHASE2149-TYPED-REQUEST-PROJECTION-LOSS-INTERFACE-FIRST.md')) && /no_request/.test(read('reports/phase2149/TRACE.md'))],
];
const syntaxFiles = [
  'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts',
];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  checks.push([`syntax transpilation: ${file}`, !(result.diagnostics ?? []).some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)]);
}
const failed = checks.filter(([, passed]) => !passed);
const report = { phase: 2149, title: 'Typed Request Projection Loss Interface-First Trace', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })), limitations: ['The canonical action request judgment is not yet wired into route boundary construction', 'No full build, full typecheck, or Vitest run', 'Syntax-only transpilation and static source checks do not establish runtime correctness'] };
fs.writeFileSync(path.join(root, 'reports/phase2149/PHASE2149_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2149: ${report.passed}/${report.total} passed\n`);
if (failed.length) process.exitCode = 1;
