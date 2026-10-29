const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['RouteEmission has no boolean auth member', !/readonly auth:\s*boolean/.test(read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts'))],
  ['Route emitter signatures no longer accept isAuth', !/isAuth:\s*boolean/.test(read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts'))],
  ['Route boundary options have no boolean auth input', !/readonly auth:\s*boolean/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts'))],
  ['Boundary resolver passes authorization ADT to security authority', /authorization:\s*params\.authorization/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts'))],
  ['Security authority input consumes authorization ADT', /readonly authorization:\s*LaravelRouteAuthorizationSemanticJudgment/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['Security authority does not read an input auth boolean', !/const auth = input\.auth/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['Canonical scanner no longer derives isAuth boolean', !/const isAuth\s*=/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['Legacy scanner no longer derives isAuth boolean', !/const isAuth\s*=/.test(read('packages/core/src/compiler/scanner/operations/RouteScanner.ts'))],
  ['Regression test covers judgment preservation', /preserves recognized Laravel authentication evidence/.test(read('packages/core/src/types/upstream/__tests__/route-security-authority.phase2333.test.ts'))],
  ['Existing route-security contract version is bumped', /route_security\.v2/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts')) && !/route_security\.v1/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['Boundary adapter no longer reads auth boolean from options', !/params\.auth\b/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts'))],
  ['Compatibility resolver executes one complete authority input contract', /resolve: \(input: RouteSecurityAuthorityInput\): RouteSecurityResolution =>\s*routeSecurityAuthority\.resolve\(input\)/.test(read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts'))],
  ['Existing SDK tests call resolver with a closed input contract', !/RouteSecurityResolver\.resolve\(\s*\[/.test(read('packages/sdk/tests/pureRouteDomainContracts.spec.ts')) && !/RouteSecurityResolver\.resolve\(\s*\[/.test(read('packages/sdk/tests/improvedIrDataflow.spec.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
