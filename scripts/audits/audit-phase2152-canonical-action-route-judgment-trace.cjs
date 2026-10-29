const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['action judgment derives request through canonical authority', () => /request:\s*canonicalRequestBinding\(input\.method, input\.formRequestIndex\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'))],
  ['action executor forwards judgment without reclassification', () => /semanticJudgment:\s*input\.semanticJudgment/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'))],
  ['controller artifact currently publishes action projections, not per-action judgments', () => /actions:\s*produced\.actions/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts')) && !/actionSemanticJudgments\s*:/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['route scanner currently passes action projections to route binding', () => /controllerScan\.controllers\.flatMap\(controller => controller\.actions\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route boundary still starts controller-reference request as no_request', () => /origin:\s*'controller_reference'[\s\S]*?request:\s*\{\s*kind:\s*'no_request'/.test(read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts'))],
  ['route ADT projection preserves typed and unresolved variants when present', () => (/kind:\s*'inline_input'/.test(read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts')) && /kind:\s*'unresolved_input' as const,\s*judgment:\s*value\.judgment/.test(read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts')))],
  ['integrated response retains invocation correlation', () => /judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*?invocationJudgment,[\s\S]*?declarationEvidence/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts')) && /kind:\s*'integrated_invocation_response_judgment',[\s\S]*?judgment:\s*invocationJudgment,[\s\S]*?responseJudgment/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['no new relation/foundation/subscanner semantic authority added in this phase', () => fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2152-CANONICAL-ACTION-JUDGMENT-ROUTE-TRACE.md')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerRouteRequestSemanticAuthority.ts'))],
  ['typed request projection loss explicitly remains open', () => /typed_request_binding_projection_loss` remains open/.test(read('packages/core/src/types/upstream/docs/PHASE2152-CANONICAL-ACTION-JUDGMENT-ROUTE-TRACE.md'))],
];
let failures = 0;
for (const [name, check] of checks) {
  let passed = false;
  try { passed = check(); } catch { passed = false; }
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
