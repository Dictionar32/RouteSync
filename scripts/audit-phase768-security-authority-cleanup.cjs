const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const auth = read('packages/core/src/types/domain/authAndPolicy.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const checks = {
  classifyReturnsCanonicalSecurity: /classify\(middleware: readonly string\[\]\): RouteSecurityDescriptor/.test(auth),
  noStaleCanonicalSecurityName: !auth.includes('CanonicalRouteSecurityDescriptor'),
  upstreamAbilityConstructorUsed: auth.includes('createAbilityName'),
  noDomainAbilityFactoryUse: !auth.includes('SemanticValueFactory.abilityName'),
  upstreamSecurityTruth: /readonly isProtected: TruthValue/.test(route),
  upstreamSecurityAbility: /readonly abilities: Sequence<import\('\.\/names'\)\.AbilityName>/.test(route),
  upstreamAbilityStringValue: /interface AbilityName \{ readonly kind: 'ability_name'; readonly value: StringValue \}/.test(names),
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
