const fs = require('fs');
const path = require('path');

const root = process.cwd();
const upstream = path.join(root, 'packages/core/src/types/upstream');
const semanticReferences = path.join(upstream, 'semanticReferences.ts');
const policyRelations = path.join(upstream, 'controllerActionPolicyRelations.ts');
const graphEdge = path.join(root, 'packages/core/src/graph/service/graphEdgeRelation.ts');
const dataflow = path.join(upstream, 'semanticDataflowInterface.ts');
const files = fs.readdirSync(upstream).filter(file => file.endsWith('.ts') && !file.includes('__tests__'));
const read = file => fs.readFileSync(file, 'utf8');
const semantic = read(semanticReferences);
const policy = read(policyRelations);
const edge = read(graphEdge);
const flow = read(dataflow);

const result = {
  structuralSemanticRelationPresent: semantic.includes('export type StructuralSemanticRelation ='),
  semanticRelationIsUnion: semantic.includes('export type SemanticRelation = StructuralSemanticRelation | ControllerActionPolicyRelation;'),
  policyGuardPresent: semantic.includes('isControllerActionPolicyRelation'),
  structuralGuardPresent: semantic.includes('isStructuralSemanticRelation'),
  policyProvenancePresent: policy.includes('ControllerActionPolicyProvenance'),
  policyInheritanceProvenancePresent: policy.includes('inheritedFrom: readonly ControllerName[]'),
  graphEdgePolicyOriginAbsent: !edge.includes('controller_action_middleware_policy') && !edge.includes('controller_action_authorization_policy'),
  dataflowPolicyVocabularyAbsent: !/dataflow_(?:middleware|authorization|policy)/.test(flow),
  productionUpstreamCompilerImports: files.filter(file => file !== 'index.ts' && /from ['"][^'"]*(?:compiler|scanner)[^'"]*['"]/.test(read(path.join(upstream, file)))).map(file => file),
  productionUpstreamGraphImports: files.filter(file => /GraphEdgeRelation|ServiceGraphNodeReference|from ['"][^'"]*graph\//.test(read(path.join(upstream, file)))).map(file => file),
  ecomerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
result.clean = result.structuralSemanticRelationPresent
  && result.semanticRelationIsUnion
  && result.policyGuardPresent
  && result.structuralGuardPresent
  && result.policyProvenancePresent
  && result.policyInheritanceProvenancePresent
  && result.graphEdgePolicyOriginAbsent
  && result.dataflowPolicyVocabularyAbsent
  && result.productionUpstreamCompilerImports.length === 0
  && result.productionUpstreamGraphImports.length === 0
  && !result.ecomerceFixturePresent
  && !result.ecommerceFixturePresent;

console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
