const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const emitter = read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts');
const executor = emitter.split('export function emitResourceRoutesFromJudgment(')[1].split('/** Compatibility entrypoint')[0];
const resourceBranch = scanner.split("case 'laravel_route_declaration_method_resource': {")[1].split("case 'laravel_route_declaration_method_query': {")[0];
const checks = [
  ['existing RouteResourceActionPlan is evolved rather than duplicated', /interface RouteResourceActionPlan/.test(authority) && !/RouteResourceActionPlanV2/.test(authority)],
  ['resource action contract carries runtime path and constant identity', /readonly runtimePath: RoutePath/.test(authority) && /readonly constantKey: string/.test(authority)],
  ['judgment and authority versions reflect the evolved contract', /interface RouteResourceFlowJudgment[\s\S]*readonly contractVersion: 2/.test(authority) && /interface RouteResourceFlowAuthority[\s\S]*readonly contractVersion: 3/.test(authority) && /contractVersion: 3,\s*closed: true,\s*resolveDeclaration: resolveRouteResourceDeclarationJudgment/.test(authority)],
  ['upstream judgment computes target path and key before emission', /runtimePath: createRoutePath\(path\.value\.value\.replace/.test(authority) && /constantKey: deriveRouteConstantKey\(path\)/.test(authority)],
  ['emitter consumes planned runtime path and key without recalculating them', /runtimePath: planned\.runtimePath/.test(executor) && /constantKey: planned\.constantKey/.test(executor) && !/deriveRouteConstantKey|planned\.path\.value\.value\.replace/.test(executor)],
  ['constant-key operation is owned beside upstream RoutePath constructors', /export const deriveRouteConstantKey = \(routePath: RoutePath\)/.test(names) && !/export function deriveRouteConstantKey/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts'))],
  ['resource path judgment receives raw declaration path and group prefix', /routeDeclarationEvidenceFromAst\(declaration\)/.test(scanner) && /declaration: declarationEvidence/.test(scanner) && /input\.declaration\.prefix\.map\(createRoutePath\)/.test(authority)],
  ['resource branch no longer invokes the scanner path parser before authority', /resourceFlowAuthority\.resolve/.test(resourceBranch) && !/resolveRoutePath/.test(resourceBranch)],
  ['resource-flow upstream contract has no semantic relation/foundation imports', !/semantic\/(?:relations|relation|foundation)/.test(authority)],
  ['the existing scanner authority remains wired into active declaration execution', /resourceFlowAuthority\.resolveDeclaration\(/.test(scanner) && /emitResourceRoutesFromJudgment\(\s*judgment/.test(scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2369 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2369 audit failed');
