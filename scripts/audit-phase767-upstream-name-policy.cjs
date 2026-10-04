const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const auth = read('packages/core/src/types/domain/authAndPolicy.ts');
const semanticValues = read('packages/core/src/types/domain/semanticValues.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const checks = {
  upstreamAbilityAuthority: /export interface AbilityName\s*\{[^}]*value: StringValue/.test(names),
  upstreamAbilityConstructor: /createAbilityName/.test(names),
  noDomainAbilityPrimitive: !/export interface AbilityName\s*\{[^}]*value:\s*string/.test(semanticValues),
  domainReexportsUpstreamAbility: /AbilityName/.test(semanticValues.split('export type {')[1]?.split('};')[0] ?? ''),
  canonicalRouteSecurityImported: /type RouteSecurityDescriptor/.test(auth),
  canonicalRoutePolicyImported: /type RoutePolicyDescriptor/.test(auth),
  noDuplicateRoutePolicyDescriptor: (auth.match(/export type RoutePolicyDescriptor\s*=/g) ?? []).length === 0,
  upstreamRouteSecurityTruth: /interface RouteSecurityDescriptor[\s\S]*isProtected: TruthValue/.test(route),
  upstreamRouteSecurityAbility: /interface RouteSecurityDescriptor[\s\S]*abilities: Sequence<import\('\.\/names'\)\.AbilityName>/.test(route),
};
for (const [k, v] of Object.entries(checks)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
