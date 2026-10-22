const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/routeSecurityAuthority.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/route-security-authority.phase2333.test.ts');
const authority = fs.readFileSync(authorityPath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['security classifier receives canonical judgment', /const classifySecurity = \(middleware: RouteMiddlewares, authorization: LaravelRouteAuthorizationSemanticJudgment\)/.test(authority)],
  ['authority passes judgment to classifier', /classifySecurity\(middleware, input\.authorization\)/.test(authority)],
  ['raw middleware classifier no longer classifies auth schemes', !/const authSanctum = relationEqual\(lower, 'auth:sanctum'\)/.test(authority.slice(authority.indexOf('const middlewareSecurityState'), authority.indexOf('const authorizationSecurityState')))],
  ['canonical evidence classifies framework auth middleware', /authorizationSecurityState\(current, evidence\)/.test(authority)],
  ['framework middleware regression asserts protected descriptor', /security\.isProtected\.value\)\.toBe\(true\)/.test(tests)],
  ['absent judgment regression blocks raw auth inference', /judgment says absent/.test(tests) && /security\.isProtected\.value\)\.toBe\(false\)/.test(tests)],
  ['no duplicate V2 authority introduced', !/RouteSecurityAuthorityV2|LaravelRouteAuthorizationSemanticJudgmentV2/.test(authority + tests)],
];
let failed = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
