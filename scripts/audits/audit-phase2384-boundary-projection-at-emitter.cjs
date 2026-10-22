const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const barrel = read('packages/core/src/compiler/scanner/subscanners/route-scanner/index.ts');
const checks = [
  ['active scanner invokes boundary-producing resource operation', scanner.includes('emitResourceRouteBoundariesFromJudgment(')],
  ['active scanner invokes boundary-producing standard operation', scanner.includes('emitStandardRouteBoundaries(')],
  ['resource operation returns canonical boundary contract', /export function emitResourceRouteBoundariesFromJudgment[\s\S]*?\): readonly RouteBoundaryContract\[\]/.test(emitter)],
  ['standard operation returns canonical boundary contract', /export function emitStandardRouteBoundaries[\s\S]*?\): readonly RouteBoundaryContract\[\]/.test(emitter)],
  ['active scanner does not map emitted route arrays after emitter call', !/emit(?:ResourceRoutesFromJudgment|StandardRoutes)\([\s\S]{0,900}?\)\.map\(route => routeBoundaryContractFromRouteEmission/.test(scanner)],
  ['emitter callback receives resolved route facts and calls the canonical boundary projection', scanner.includes('(method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine) => routeBoundaryContractFromRouteFacts(method, path, resourceName, target, routeAuthorization, middleware, sourceFile, sourceLine, actionJudgmentForTarget(target, publications, correlationAuthority))')],
  ['boundary operations are exported through existing route-scanner module', barrel.includes('emitResourceRouteBoundariesFromJudgment') && barrel.includes('emitStandardRouteBoundaries')],
  ['no new authority or ADT file introduced', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts'))],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
