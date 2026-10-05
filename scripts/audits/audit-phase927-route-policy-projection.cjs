const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const relation = read('packages/core/src/types/upstream/routeActionPolicyRelations.ts');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const result = {
  routeProjectionPresent: relation.includes('routeActionPolicyRelations'),
  routeGroupProvenancePreserved: relation.includes("route_group") && relation.includes("route"),
  routeProjectionWired: model.includes('routeActionPolicyRelations('),
  routeTargetGuardPresent: model.includes("target.kind !== 'controller_action'"),
  graphRejectsPolicy: graph.includes('StructuralSemanticRelation') && graph.includes('not_projectable'),
  dataflowPolicyVocabularyAbsent: !/dataflow_(middleware|authorization|policy)/.test(dataflow),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
