const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const projection = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const types = read('src/compiler/ir/SemanticDataflowIRProjectionTypes.ts');
const upstream = read('src/types/upstream/semanticDataflow.ts');
const graph = read('src/graph/service/graphRelation.ts');
const adapter = read('src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts');
const ecommerce = path.join(root, '..', '..', 'examples', 'ecommerce-shop-source');
const checks = {
  irLineageContractLocal: types.includes('export interface SemanticDataflowIRLineage'),
  irRelationCarriesLineage: types.includes('readonly lineage?: SemanticDataflowIRLineage'),
  irProjectsProducer: projection.includes('producer: fact.lineage.producer'),
  irProjectsLineageIdentity: projection.includes('identity: identityId(fact.lineage.identity)'),
  irProjectsLineageSource: projection.includes('source: fact.lineage.source'),
  irDoesNotRecomputeClosure: !projection.includes('createSemanticDataflowJudgment'),
  canonicalProducerCatalog: upstream.includes("'request' | 'route' | 'controller' | 'resource'"),
  adapterExplicitProducer: adapter.includes("producer: 'route' | 'controller'"),
  graphRelationDownstreamOwned: graph.includes('GraphSemanticRelation'),
  ecommerceFixturePresent: fs.existsSync(ecommerce),
};
const violations = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
const result = { phase:1129, direction:'upstream => wiring => interface => downstream', checks, violations, passed: violations.length === 0 };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exit(1);
