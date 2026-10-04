const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const auth = read('packages/core/src/types/domain/authAndPolicy.ts');
const upstream = read('packages/core/src/types/upstream/route.ts');
const route = read('packages/core/src/types/route.ts');
const security = read('packages/core/src/types/domain/security.ts');
const checks = {
  canonicalSecurityADT: upstream.includes('export interface RouteSecurityDescriptor'),
  canonicalConstructor: upstream.includes('createRouteSecurityDescriptor'),
  noCanonicalReplacementName: !auth.includes('CanonicalRouteSecurityDescriptor'),
  noSemanticFlowSecurityDescriptor: !auth.includes('RouteSemanticFlowSecurityDescriptor'),
  classifierReturnsCanonical: auth.includes('RouteSecurityDescriptor') && auth.includes('createRouteSecurityDescriptor'),
  upstreamAbilityOnly: auth.includes('createAbilityName') && upstream.includes('AbilityName'),
  noHostReductionInClassifier: !auth.includes('.reduce('),
  noHostMapInClassifier: !auth.includes('.map('),
  noHostFilterInClassifier: !auth.includes('.filter('),
  publicExportsClean: !route.includes('RouteSemanticFlowSecurityDescriptor') && !security.includes('RouteSemanticFlowSecurityDescriptor'),
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
process.exit(Object.values(checks).every(Boolean)?0:1);
