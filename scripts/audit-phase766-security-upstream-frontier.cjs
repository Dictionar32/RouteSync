const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const size = p => fs.statSync(path.join(root, p)).size;
const has = (p, pattern) => pattern.test(read(p));

const upstreamRoute = read('packages/core/src/types/upstream/route.ts');
const domainSecurity = read('packages/core/src/types/domain/authAndPolicy.ts');
const resolver = read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');

const parsedReservoirs = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];

const checks = {
  upstreamSecurityTruthValue: /interface RouteSecurityDescriptor[\s\S]*readonly isProtected: TruthValue;/.test(upstreamRoute),
  domainUsesUpstreamSecurity: /export type \{ RouteSecurityDescriptor \} from "\.\.\/upstream\/route";/.test(domainSecurity),
  domainSecuritySequence: /readonly guards: Sequence<GuardName>/.test(domainSecurity) && /readonly abilities: Sequence<AbilityName>/.test(domainSecurity),
  classifierCanonicalizesSecurity: /new RouteSemanticFlowSecurityDescriptor\([\s\S]*guards: sequenceFromArray\(guards\.map\(guardName\)\)[\s\S]*abilities: sequenceFromArray\(abilities\.map\(abilityName\)/.test(domainSecurity),
  resolverConsumesTruthValue: /securityDesc\.isProtected\.value/.test(resolver),
  builderConsumesResolvedSecurity: /RouteSecurityResolver\.resolve\(middleware, params\.auth\)/.test(builder),
  factoryNoDuplicateCapabilityResolution: !/resolveRouteCapability\(/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts')),
  parsedReservoirsEmpty: parsedReservoirs.every(p => size(p) === 0),
};

for (const [k,v] of Object.entries(checks)) console.log(`${k}=${v}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
