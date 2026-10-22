const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing method judgment input carries method and target-method evidence', /interface LaravelRouteDeclarationMethodJudgmentInput[\s\S]*?readonly method: LaravelRouteMethod;[\s\S]*?readonly targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['only match judgment retains target-method evidence after standard method resolution', (read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').match(/readonly targetMethods: readonly LaravelRouteTargetMethod\[\]/g) || []).length === 2 && !/kind: 'laravel_route_declaration_method_standard';[^}]*targetMethods/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts')) && !/method: LaravelResourceRouteMethod; readonly targetMethods/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['method authority contract advanced', /contractVersion: 8/.test(read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts'))],
  ['scanner uses judgment target methods for emission', /emitStandardRoutes\(methodJudgment\.httpMethods/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['Route::any expands to supported HTTP methods instead of resolving any as a verb', /case 'laravel_route_declaration_method_all_methods':[\s\S]*?methodJudgment\.httpMethods/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /methodJudgment\.kind === 'laravel_route_declaration_method_match'/.test(read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts'))],
  ['canonical emission handles all-method and match judgment arms', /case 'laravel_route_declaration_method_all_methods':[\s\S]*case 'laravel_route_declaration_method_match':[\s\S]*case 'laravel_route_declaration_method_standard'/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['producer consumes judgment target methods instead of declaration target methods', /methodJudgment\.httpMethods/.test(read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts')) && !/resolveRouteHttpMethod|ROUTE_HTTP_METHODS/.test(read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts'))],
  ['canonical authority input is used at scanner call site', /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['legacy caller uses the same authority input', /laravelRouteDeclarationMethodSemanticAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))],
  ['method judgment regression tests cover match and resource', /targetMethods: \['get', 'post'\]/.test(read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts')) && /targetMethods: \['apiResource'\]/.test(read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts')) || /method: 'apiResource', targetMethods: \[\]/.test(read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts'))],
  ['route scanner contract advances to version 26', /readonly contractVersion: 26/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['no foundation dependency introduced in changed route path', !/semantic\/foundation/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts') + read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts') + read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts'))],
  ['no duplicate V2 route scanner authority', !/LaravelRouteScannerV2|routeMethodJudgmentAuthorityV2/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts') + read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts'))],
  ['phase documentation records remaining relation dependency honestly', /does not yet eliminate the remaining `semantic\/relations` dependency/.test(read('packages/core/src/types/upstream/docs/PHASE2351-ROUTE-METHOD-JUDGMENT-CARRIES-TARGET-METHOD-EVIDENCE.md'))],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
