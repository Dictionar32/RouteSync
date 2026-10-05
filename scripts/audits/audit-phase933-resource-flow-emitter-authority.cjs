const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const flow = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const semanticKind = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts');
const result = {
  upstreamRouteResourceModesClosed: ['resource','apiResource','singleton','apiSingleton'].every(v => flow.includes(`'${v}'`)),
  upstreamActionKnowledgeIsCanonical: flow.includes('RESOURCE_ACTION_KNOWLEDGE') && flow.includes('RouteResourceMode'),
  upstreamResolverConsumesMode: flow.includes('resolveRouteResourceFlow') && flow.includes('actionsOf(input.registration, mode)'),
  singletonCreatableSemanticsPresent: flow.includes("action: 'create'") && flow.includes("action: 'store'") && flow.includes('registration.creatable.value'),
  singletonDestroyableSemanticsPresent: flow.includes("action: 'destroy'") && flow.includes('registration.destroyable.value'),
  emitterLocalActionTableRemoved: !emitter.includes('RESOURCE_ROUTE_ACTIONS'),
  emitterConsumesUpstreamResolver: emitter.includes('resolveRouteResourceFlow') && emitter.includes('defaultApiResourceRegistration'),
  scannerUsesAllResourceKinds: ['resource','api_resource','singleton','api_singleton'].every(v => scanner.includes(`'${v}'`)),
  semanticKindUsesAllResourceKinds: ['resource','api_resource','singleton','api_singleton'].every(v => semanticKind.includes(`'${v}'`)),
  noGenericDataflowPolicyVocabulary: !flow.includes('SemanticDataflowFact') && !emitter.includes('SemanticDataflowFact'),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.clean ? 0 : 1;
