const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const highLevel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const relation = read('packages/core/src/types/upstream/routeActionPolicyRelations.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const semantic = read('packages/core/src/types/upstream/semanticReferences.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');

const result = {
  upstreamResolverPresent: exists('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts'),
  highLevelUsesUpstreamResolver: highLevel.includes("./effectiveControllerActionPolicyResolver") && !highLevel.includes("../../compiler/scanner/"),
  effectiveRouteProjectionPresent: highLevel.includes('routeActionPolicyRelationsFromEffectivePolicy'),
  routeIdentityPreserved: relation.includes("readonly route: RouteReference"),
  actionIdentityPreserved: relation.includes("readonly controller: ControllerReference") && relation.includes("action: policy.action"),
  authorizationRouteLanePresent: relation.includes("route_action_authorization_policy"),
  inheritedPolicyPreserved: relation.includes('inheritedFrom'),
  graphRemainsStructuralOnly: graph.includes('StructuralSemanticRelation') && !graph.includes('RouteActionPolicyRelation'),
  dataflowPolicyVocabularyAbsent: !/dataflow_(middleware|authorization|policy)/.test(`${highLevel}\n${relation}\n${resolver}\n${semantic}`),
  ecomerceFixtureAbsent: !exists('examples/ecomerce-shop-source'),
  ecommerceFixtureAbsent: !exists('examples/ecommerce-shop-source'),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exitCode = 1;
