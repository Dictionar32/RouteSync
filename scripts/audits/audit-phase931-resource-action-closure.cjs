const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const highLevel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const test = read('packages/core/src/types/upstream/__tests__/effective-route-resource-policy.phase931.test.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const clean = {
  resourceRulesConsumed: highLevel.includes('routeResourceMiddlewareContractsFromDefinition') && highLevel.includes('routeResourceMiddleware.declarations'),
  resourceExclusionsConsumed: highLevel.includes('routeResourceMiddleware.exclusions'),
  resourceSourcePreserved: highLevel.includes("source: { kind: 'resource' as const }"),
  actionScopedClosure: resolver.includes("scope.kind === 'only'") && resolver.includes('sameAction'),
  regressionTestPresent: test.includes('Phase 931 effective route resource policy'),
  canonicalRulePresent: route.includes("kind: 'route_resource_middleware'"),
  canonicalRulePreservesScope: route.includes('readonly scope: RouteMiddlewareScope'),
  producerPreservesAllScope: read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts').includes("entry.scope.kind === 'all'") && read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts').includes("scope: resourceScope(entry)"),
  noPolicyDataflowVocabulary: !/dataflow_(middleware|authorization|policy)/.test(highLevel + resolver),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
clean.clean = Object.values(clean).every(Boolean);
console.log(JSON.stringify(clean, null, 2));
process.exitCode = clean.clean ? 0 : 1;
