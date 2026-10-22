const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['scanner interface contract version advanced', /readonly contractVersion: 10;/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['artifact carries canonical authorization judgment', /readonly authorization: LaravelRouteAuthorizationSemanticJudgment;/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['emission carries canonical authorization judgment', /readonly authorization: LaravelRouteAuthorizationSemanticJudgment;/.test(read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts'))],
  ['standard emitter preserves judgment in all output variants', (read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts').match(/authorization,/g) ?? []).length >= 5],
  ['current scanner stores emission judgment on artifact', /binding, authorization: route\.authorization/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['legacy scanner forwards existing judgment', /unresolvedResponse, isAuth, authorization,/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))],
  ['no new V2 authorization contract introduced', !/LaravelRouteAuthorizationSemanticJudgmentV2|RouteEmissionV2|LaravelRouteScanArtifactV2/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
