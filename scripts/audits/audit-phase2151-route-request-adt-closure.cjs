const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const routeRequest = read('packages/core/src/types/domain/request.ts');
const endpoint = read('packages/core/src/types/upstream/endpointBindings.ts');
const projection = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const relationModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const solver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const coverage = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const checks = [
  ['route request ADT distinguishes typed request from no request', /kind: 'typed_request';\s*readonly type: TypeExpression/.test(routeRequest)],
  ['route request ADT retains the original unresolved type judgment', /kind: 'unresolved_request';\s*readonly judgment: UnresolvedPhpParameterTypeJudgment/.test(routeRequest)],
  ['endpoint request ADT preserves unresolved judgment', /kind: 'unresolved_input'; readonly judgment: UnresolvedPhpParameterTypeJudgment/.test(endpoint)],
  ['route boundary projection preserves typed request as inline input', /'typed_request'[\s\S]*kind: 'inline_input'[\s\S]*value\.type/.test(projection)],
  ['route boundary projection preserves unresolved request as unresolved input', /'unresolved_request'[\s\S]*kind: 'unresolved_input'[\s\S]*value\.judgment/.test(projection)],
  ['high-level source model handles unresolved endpoint input', /unresolved_input: \(\) => \[\]/.test(relationModel)],
  ['request-type solver explicitly skips unresolved instead of casting it as FormRequest', /kind, 'unresolved_request'/.test(solver) && /kind, 'framework_request'/.test(solver)],
  ['canonical action judgment wiring remains explicitly open', /canonical-action-request-judgment-is-not-yet-wired-to-route-boundary/.test(coverage) && /typed_request_binding_projection_loss/.test(coverage)],
  ['no relation/foundation or subscanner added', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/route-request-binding'))],
];
const syntaxFiles = [
  'packages/core/src/types/domain/request.ts',
  'packages/core/src/types/upstream/endpointBindings.ts',
  'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts',
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts',
];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  checks.push([`syntax transpilation: ${file}`, !(result.diagnostics ?? []).some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)]);
}
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 2151,
  title: 'Route Request ADT Closure Interface-First',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  limitations: [
    'The canonical action request judgment is not yet wired into route-boundary construction; route construction still consumes the legacy ControllerActionInfo.request projection.',
    'Full build, full typecheck, and Vitest were not run.',
    'Static assertions and syntax-only transpilation do not establish full runtime correctness.'
  ]
};
fs.mkdirSync(path.join(root, 'reports/phase2151'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/phase2151/PHASE2151_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2151: ${report.passed}/${report.total} passed\n`);
if (failed.length) process.exitCode = 1;
