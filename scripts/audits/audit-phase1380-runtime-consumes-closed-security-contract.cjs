const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['resolved boundary requires closed judgment', /readonly security: import\("\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/routeSecurityAuthority"\)\.RouteSecurityJudgment/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts'))],
  ['upstream boundary resolves security once', /routeSecurityAuthority\.resolve\(/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts'))],
  ['upstream boundary returns security judgment', /security,/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts'))],
  ['capability builder consumes judgment', /const security = params\.security;/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))],
  ['capability builder does not resolve security', !/routeSecurityAuthority|\.resolve\(/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))],
  ['resolver graph input requires judgment', /readonly security: RouteSecurityResolution;/.test(read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts'))],
  ['resolver graph consumes supplied judgment', /const security = input\.security;/.test(read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts'))],
  ['resolver graph does not resolve security', !/routeSecurityAuthority|route_security_authority_input/.test(read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts'))],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, pass]) => pass).length}/${checks.length} checks passed`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
