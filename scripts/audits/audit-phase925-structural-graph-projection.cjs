const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const relationFile = path.join(root, 'packages/core/src/types/upstream/semanticReferences.ts');
const projectionFile = path.join(root, 'packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const compilerFile = path.join(root, 'packages/core/src/graph/service/manifestGraphCompiler.ts');
const graphFile = path.join(root, 'packages/core/src/graph/service/graphEdgeRelation.ts');
const policyFile = path.join(root, 'packages/core/src/types/upstream/controllerActionPolicyRelations.ts');

const relation = fs.readFileSync(relationFile, 'utf8');
const projection = fs.readFileSync(projectionFile, 'utf8');
const compiler = fs.readFileSync(compilerFile, 'utf8');
const graph = fs.readFileSync(graphFile, 'utf8');
const policy = fs.readFileSync(policyFile, 'utf8');

const structuralModelRelationPresent = /kind: 'model_relation'/.test(relation);
const projectionAuthorityPresent = /projectStructuralSemanticRelationToGraphEdge/.test(projection);
const policyKindsAbsentFromProjection = !/controller_action_(?:middleware|authorization)_policy/.test(projection);
const compilerUsesStructuralGuard = /isStructuralSemanticRelation/.test(compiler) && /projectStructuralSemanticRelationToGraphEdge/.test(compiler);
const compilerNoDirectStructuralEdges = !/createGraphEdgeRelation\(\s*\n?\s*\{?\s*kind: 'resource_reference'/.test(compiler)
  && !/dependency\.controller, dependency\.dependency/.test(compiler)
  && !/relation\.target,\n\s*'depends_on_model',\n\s*'model_relation'/.test(compiler);
const graphOriginsClosed = /controller_resource_dependency/.test(graph) && /controller_model_dependency/.test(graph);
const policyRelationStillSeparate = /ControllerActionPolicyRelation/.test(policy) && !/GraphEdgeRelation/.test(policy);
const ecomerceFixtureAbsent = !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source'));
const ecommerceFixtureAbsent = !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source'));

const result = {
  structuralModelRelationPresent,
  projectionAuthorityPresent,
  policyKindsAbsentFromProjection,
  compilerUsesStructuralGuard,
  compilerNoDirectStructuralEdges,
  graphOriginsClosed,
  policyRelationStillSeparate,
  ecomerceFixtureAbsent,
  ecommerceFixtureAbsent,
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
