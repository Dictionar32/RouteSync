const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing authorization ADT remains closed', /kind:\s*'laravel_route_authorization_middleware_present'[\s\S]*kind:\s*'laravel_route_authorization_middleware_absent'/.test(read('packages/core/src/types/upstream/routeAuthorizationSemanticJudgmentInterface.ts'))],
  ['scanner retains injected authorization authority', /authorizationAuthority:\s*LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['route emission loss boundary is documented in source', /readonly auth:\s*boolean/.test(read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts'))],
  ['scanner wiring still references subscanner emitter', /operations\/route-scanner/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route security authority relations dependency is documented', /semantic\/relations/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['trace report exists', fs.existsSync(path.join(root, 'PHASE2330_EXISTING_INTERFACE_EXECUTOR_TRACE.md'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
