const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const authorityPath = path.join(root, 'packages/core/src/types/upstream/routeSecurityAuthority.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts');
const graphPath = path.join(root, 'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts');
const builderPath = path.join(root, 'packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const read = file => fs.readFileSync(file, 'utf8');
const authority = read(authorityPath);
const index = read(indexPath);
const resolver = read(resolverPath);
const graph = read(graphPath);
const builder = read(builderPath);
const checks = [
  ['closed judgment ADT exists', /export interface RouteSecurityJudgment\s*\{/.test(authority)],
  ['judgment discriminant is explicit', /kind:\s*'route_security_judgment'/.test(authority)],
  ['upstream authority is explicit', /authority:\s*'upstream'/.test(authority)],
  ['contract version and closure are required', /contractVersion:\s*'route_security\.v1'/.test(authority) && /closed:\s*true/.test(authority)],
  ['all resolved outputs are required', ['security:', 'auth:', 'policies:', 'rateLimit:'].every(k => authority.includes(k))],
  ['legacy resolution name aliases the complete judgment', /export type RouteSecurityResolution\s*=\s*RouteSecurityJudgment/.test(authority)],
  ['authority returns the closed judgment shape', /kind:\s*'route_security_judgment'\s+as const/.test(authority) && /return Object\.freeze\(\{[\s\S]*?closed:\s*true\s+as const/.test(authority)],
  ['public entry exports judgment', /RouteSecurityJudgment/.test(index)],
  ['compatibility adapter delegates to authority', /routeSecurityAuthority\.resolve\(/.test(resolver)],
  ['resolver graph consumes supplied closed judgment', /const security = input\.security;/.test(graph) && /readonly security: RouteSecurityResolution;/.test(graph)],
  ['capability builder consumes supplied closed judgment', /const security = params\.security;/.test(builder)],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1379 audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed ? 1 : 0;
