const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const relation = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const sourceAsts = read('packages/core/src/types/upstream/collections.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2411_RESPONSE_JUDGMENT_ROUTE_HANDOFF_TRACE.md');
const checks = [
  ['controller scanner calls existing integrated response pipeline', controller.includes('this.responseSemanticPipeline.judgeIntegratedResponse(')],
  ['controller artifact retains response judgment', controller.includes('responseJudgment,') && controller.includes('projectionJudgment,')],
  ['route scan receives full controller scan', route.includes('input.controllerScan') && route.includes('controllerScan: LaravelControllerScanJudgment')],
  ['route emitDeclaration input currently receives action publications', route.includes('file, actionJudgments, correlationAuthority')],
  ['route scanner still seeds compatibility void descriptor', route.includes('const unresolvedResponse = VoidResponseDescriptor.create()')],
  ['resource route emission receives unresolved descriptor', route.includes('        unresolvedResponse,')],
  ['standard target receives unresolved descriptor', route.includes('response: unresolvedResponse')],
  ['route boundary forwards target response descriptor', relation.includes('response: value.response')],
  ['route producer derives endpoint response from descriptor kind', relation.includes('route.binding.response.responseTypeName()')],
  ['source AST retains route scan and response projections but not route handoff join', sourceAsts.includes("routeScan: import('./laravelRouteScannerInterface').LaravelRouteScanJudgment") && report.includes('downstream manifest/CLI projection cannot recover the lost method response product')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2411 structural assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
