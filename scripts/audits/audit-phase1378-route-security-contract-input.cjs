const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['typed request ADT is declared', /export interface RouteSecurityAuthorityInput\s*\{[\s\S]*?readonly kind: 'route_security_authority_input'[\s\S]*?readonly middleware: RouteMiddlewares[\s\S]*?readonly auth: TruthValue/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['algebra consumes the typed request', /interface RouteSecurityAuthorityAlgebraInterface\s*\{\s*readonly resolve: \(input: RouteSecurityAuthorityInput\) => RouteSecurityResolution/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['closed authority exposes contract version', /interface RouteSecurityAuthorityContractInterface extends RouteSecurityAuthorityAlgebraInterface\s*\{\s*readonly authority: 'upstream';\s*readonly contractVersion: 'route_security\.v1';\s*readonly closed: true/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['authority wrapper delegates without reclassification', /resolve: \(input: RouteSecurityAuthorityInput\): RouteSecurityResolution => algebra\.resolve\(input\)/.test(read('packages/core/src/types/upstream/routeSecurityAuthority.ts'))],
  ['upstream boundary passes typed contract input', /routeSecurityAuthority\.resolve\(\{[\s\S]*?kind: "route_security_authority_input"[\s\S]*?middleware,[\s\S]*?auth: truthValue\(authInput\)/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts'))],
  ['capability builder consumes closed judgment', /const security = params\.security;/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))],
  ['domain facade passes contract input', /routeSecurityAuthority\.resolve\(\{ kind: 'route_security_authority_input', middleware, auth: \{ kind: 'truth_value', value: false \} \}\)/.test(read('packages/core/src/types/domain/authAndPolicy.ts'))],
  ['public core entry exports contract input', /RouteSecurityAuthorityInput/.test(read('packages/core/src/index.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
