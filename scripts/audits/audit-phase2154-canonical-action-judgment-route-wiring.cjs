const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const routeProjection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const routeRequestAdt = read('packages/core/src/types/domain/request.ts');
const endpointAdt = read('packages/core/src/types/upstream/endpointBindings.ts');
const requestSolver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const actionCoverage = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const checks = [
  ['controller scanner preserves the exact action judgment from the existing executor', /actionExecution\.execute\(\{\s*semanticJudgment\s*,?\s*\}\)/.test(scanner) && /semanticJudgment:\s*result\.semanticJudgment/.test(scanner)],
  ['controller artifact publishes source-correlated canonical action judgments', /readonly actionJudgments: readonly ControllerActionJudgmentPublication\[\]/.test(scannerContract) && /actionJudgments,/.test(scanner)],
  ['publication retains the full semantic judgment with a stable projection identity', /judgment: LaravelControllerActionSemanticJudgmentInterface<ControllerActionSemanticProjectionIdentity>/.test(scannerContract) && /semanticJudgment\.invocationJudgment\.sourceFile/.test(scanner)],
  ['route scanner consumes published judgments from the existing controller artifact', /controllerScan\.controllers\.flatMap\(controller => controller\.actionJudgments\)/.test(routeScanner)],
  ['route identity correlation distinguishes matched, unmatched, and ambiguous outcomes', /matched_action_judgment/.test(routeScanner) && /unmatched_action_judgment/.test(routeScanner) && /ambiguous_action_judgments/.test(routeScanner) && /ControllerActionJudgmentRouteSelection/.test(scannerContract)],
  ['route boundary request projection consumes the canonical judgment', /routeRequestBindingFromActionJudgment/.test(routeProjection) && /routeRequestBindingFromSelection/.test(routeProjection)],
  ['unmatched and ambiguous action correlation remain explicit request ADT variants', /kind: 'unresolved_action_request'/.test(routeRequestAdt) && /action_judgment_unmatched/.test(routeRequestAdt) && /action_judgment_ambiguous/.test(routeRequestAdt)],
  ['endpoint ADT preserves unresolved action correlation rather than no-input', /kind: 'unresolved_action_input'/.test(endpointAdt) && /unresolved_action_input: \(\) => \[\]/.test(sourceModel) && /kind: 'unresolved_action_input'/.test(routeProjection)],
  ['request derivation solver excludes unresolved action correlation from FormRequest aggregation', /kind, 'unresolved_action_request'/.test(requestSolver)],
  ['all five canonical request variants are projected explicitly', /case 'no_request'/.test(routeProjection) && /case 'form_request'/.test(routeProjection) && /case 'framework_request'/.test(routeProjection) && /case 'typed'/.test(routeProjection) && /case 'typed_unresolved'/.test(routeProjection)],
  ['typed and unresolved request variants survive endpoint projection', /case 'typed_request':[\s\S]*kind: 'inline_input'[\s\S]*route\.binding\.request\.type/.test(routeProjection) && /case 'unresolved_request':[\s\S]*kind: 'unresolved_input'[\s\S]*route\.binding\.request\.judgment/.test(routeProjection)],
  ['existing route binding authority remains owner of target-resolution judgment', /bindingAuthority\.judge\(/.test(routeScanner) && /RouteControllerBindingJudgmentAuthority/.test(routeContract)],
  ['controller publication and prepared route-operation contracts retain their versions', /contractVersion: 44/.test(scannerContract) && /contractVersion = 44 as const/.test(scanner) && /readonly contractVersion: 33;/.test(routeContract) && /contractVersion: 33,/.test(routeScanner)],
  ['typed request projection-loss obligation no longer claims the route boundary is unwired', !/typed_request_binding_projection_loss/.test(actionCoverage) && /route-boundary-consumes-source-correlated-canonical-action-judgment/.test(actionCoverage)],
  ['no relation/foundation or new subscanner layer added', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/actionJudgmentRouteRequest.ts'))],
];
const syntaxFiles = [
  'packages/core/src/types/upstream/laravelControllerScannerInterface.ts',
  'packages/core/src/types/upstream/laravelRouteScannerInterface.ts',
  'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts',
  'packages/core/src/types/domain/request.ts',
  'packages/core/src/types/upstream/endpointBindings.ts',
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
  'packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts',
  'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts',
  'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  'packages/core/src/compiler/scanner/operations/routeProducerRelations.ts',
];
for (const file of syntaxFiles) {
  const result = ts.transpileModule(read(file), { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  checks.push([`syntax transpilation: ${file}`, !(result.diagnostics ?? []).some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)]);
}
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 2154,
  title: 'Canonical Action Judgment Publication and Route Boundary Wiring — Interface First',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  limitations: [
    'Full TypeScript typecheck, build, and Vitest were not run.',
    'The action semantic authority still delegates derivation through the legacy action adapter.',
    'When route target correlation is unmatched or ambiguous, the route and endpoint request ADTs retain an explicit unresolved-action outcome; the existing route binding authority still owns target-resolution judgment.',
  ],
};
fs.writeFileSync(path.join(root, 'reports/phase2154/PHASE2154_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2154: ${report.passed}/${report.total} passed\n`);
if (failed.length) process.exitCode = 1;
