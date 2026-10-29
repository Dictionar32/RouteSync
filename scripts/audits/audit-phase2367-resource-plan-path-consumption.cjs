const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const emitter = read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const executor = emitter.split('export function emitResourceRoutesFromJudgment(')[1].split('/** Compatibility entrypoint')[0];
const checks = [
  ['resource judgment already carries the planned path and typed parameter names', /interface RouteResourceActionPlan[\s\S]*readonly path: RoutePath[\s\S]*readonly parameters: readonly RouteParameterName\[\]/.test(authority)],
  ['shallow resource plans expose only the leaf parameter that exists in their path', /leaf: input\.registration\.shallow\.value \? Object\.freeze\(\[leafParameter\]\) : Object\.freeze\(\[\.\.\.parameterNames\]\)/.test(authority)],
  ['judgment executor uses the upstream planned path without reparsing it through resolveRoutePath', /path: planned\.path/.test(executor) && !/resolveRoutePath\(/.test(executor)],
  ['resource identity comes from the upstream plan rather than path classification', /resourceName,/.test(executor) && !/resolveRoutePath\(planned\.path/.test(executor)],
  ['parameter materialization consumes planned parameter names instead of extracting raw URI segments', /planned\.parameters\.map\(parameter => RouteParameterSemanticFactory\.fromPathSegment\(parameter\.value\.value\)\)/.test(executor)],
  ['runtime-path and constant-key are carried by the upstream action plan and consumed directly', /readonly runtimePath: RoutePath/.test(authority) && /readonly constantKey: string/.test(authority) && /runtimePath: planned\.runtimePath/.test(executor) && /constantKey: planned\.constantKey/.test(executor)],
  ['CLI scanner continues to resolve resource judgment through its injected upstream authority', /resourceFlowAuthority\.resolveDeclaration\(/.test(scanner) && /emitResourceRoutesFromJudgment\(/.test(scanner)],
  ['resource-flow upstream file does not import semantic foundation', !/semantic\/foundation/.test(authority)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2367 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2367 audit failed');
