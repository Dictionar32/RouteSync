const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const existsNonEmpty = p => fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).size > 0;
const cap = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const input = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const security = read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const capability = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const auth = read('packages/core/src/types/domain/authAndPolicy.ts');
const emptyLegacy = [
  'packages/core/src/compiler/scanner/descriptors/route/routeResponses.ts',
  'packages/core/src/compiler/scanner/descriptors/route/routeSecurity.ts',
  'packages/core/src/types/domain/modelEntityDescriptor.ts',
  'packages/core/src/types/domain/routeEntityDescriptor.ts',
  'packages/core/src/types/domain/resourceAggregateResolver.ts',
  'packages/core/src/types/upstream/routeBindingResolution.ts',
  'packages/core/src/types/upstream/routeResource.ts',
].every(p => fs.statSync(path.join(root, p)).size === 0);
const parsedEmpty = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
].every(p => fs.statSync(path.join(root, p)).size === 0);
const pass = {
  capabilityUsesCanonicalMiddleware: /middleware,\n/.test(cap),
  capabilityPoliciesAreSequence: /policies: security\.policies/.test(cap),
  capabilityErrorsAreUpstream: /toUpstreamHttpErrorResponse/.test(cap),
  capabilityInvalidationIsSequence: /targets: sequenceFromArray/.test(cap),
  boundaryCanonicalizesMiddleware: /route_middlewares/.test(input) && /createMiddlewareName/.test(input),
  securityConsumesCanonicalMiddleware: /middleware: RouteMiddlewares/.test(security),
  securityPoliciesAreSequence: /policies: Sequence<RoutePolicyDescriptor>/.test(security),
  emitterUsesADTNarrowing: /relationVariantFold\(\s*\n\s*target,\s*\n\s*'controller_action'/.test(emitter),
  capabilityInputIsClosed: /type RouteCapabilityResolutionInput = Readonly/.test(capability),
  parsedAstReservoirsEmpty: parsedEmpty,
  inactiveLegacyFilesEmpty: emptyLegacy,
  noSecurityReplacementDescriptor: !/CanonicalRouteSecurityDescriptor|RouteSemanticFlowSecurityDescriptor|ScannedRouteSecurityParams/.test(auth + security),
};
console.log(Object.entries(pass).map(([k,v]) => `${k}=${v}`).join('\n'));
console.log(`ALL_PASS=${Object.values(pass).every(Boolean)}`);
process.exit(Object.values(pass).every(Boolean) ? 0 : 1);
