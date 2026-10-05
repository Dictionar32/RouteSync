const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const semantic = read('packages/core/src/types/upstream/semanticReferences.ts');
const relation = read('packages/core/src/types/upstream/routeActionPolicyRelations.ts');
const highLevel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const clean = {
  routeAuthorizationGuardPresent: semantic.includes("relation.kind === 'route_action_authorization_policy'"),
  routePolicyRelationHasAuthorization: relation.includes("kind: 'route_action_authorization_policy'"),
  effectivePolicyProjectionPresent: relation.includes('routeActionPolicyRelationsFromEffectivePolicy'),
  suppliedEffectivePolicyPreferred: highLevel.includes('suppliedPolicy') && highLevel.includes('routePolicy') && highLevel.includes('routeActionPolicyRelationsFromEffectivePolicy(route.identity, Object.freeze({'),
  routeIdentityPreserved: highLevel.includes('routeActionPolicyRelationsFromEffectivePolicy(route.identity'),
  graphPolicyBoundaryPreserved: semantic.includes('isStructuralSemanticRelation'),
  dataflowPolicyVocabularyAbsent: !/dataflow_(middleware|authorization|policy)/.test(relation + highLevel),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
clean.clean = Object.values(clean).every(Boolean);
console.log(JSON.stringify(clean, null, 2));
process.exitCode = clean.clean ? 0 : 1;
