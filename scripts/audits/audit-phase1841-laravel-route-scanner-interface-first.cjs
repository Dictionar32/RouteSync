const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route scanner interface implementation exists', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['production pipeline invokes route interface with operation data only', /routeScanner\.prepare\(\{\s*controllerScan,\s*sourceSelectionIntent: input\.routeSelection\s*\}\)/s.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['production pipeline no longer invokes legacy RouteScanner', !/RouteScanner\.scanCanonicalBundle/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['route scanner accepts correlated controller scan judgment', /input\.controllerScan\.sourceProject/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /input\.controllerScan\.controllers\.flatMap\(controller => controller\.actions\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route AST, flow, and binding judgment remain one artifact', /kind: 'laravel_route_scan_artifact' as const, ast, flow, binding/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) ? /kind: 'laravel_route_scan_artifact' as const, ast, flow, binding/ : /kind: 'laravel_route_scan_artifact',[\s\S]*?ast,[\s\S]*?flow,[\s\S]*?binding/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['binding authority owns controller-action candidate judgment', /routeControllerBindingAuthority/.test(read('packages/core/src/compiler/semantic/routeControllerBindingAuthority.ts')) && /judge: judgeRouteControllerBinding/.test(read('packages/core/src/compiler/semantic/routeControllerBindingAuthority.ts'))],
  ['unresolved and ambiguous bindings are preserved', /kind: 'unresolved'/.test(read('packages/core/src/compiler/semantic/routeControllerBindingAuthority.ts')) && /kind: 'ambiguous'/.test(read('packages/core/src/compiler/semantic/routeControllerBindingAuthority.ts'))],
  ['SourceAsts exposes integrated route scan judgment', /readonly routeScan: import\('\.\/laravelRouteScannerInterface'\)\.LaravelRouteScanJudgment/.test(read('packages/core/src/types/upstream/collections.ts'))],
  ['route scanner avoids forbidden semantic foundation', !/semantic\/foundation/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && !/semantic\/foundation/.test(read('packages/core/src/compiler/semantic/routeControllerBindingAuthority.ts'))],
  ['route scanner does not import legacy ControllerScanner', !/ControllerScanner/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
