const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const iface = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const pipeline = read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts');
const manifest = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graph = read('packages/core/src/types/upstream/graphRelation.ts');
const example = read('examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php');
const checks = {
  operationalInterface: /export interface SemanticDataflowInterface/.test(iface),
  seedMethod: /interface DataFlowSourceInterface[\s\S]*readonly seed:/.test(dataflow),
  deriveMethod: /interface DataFlowStepInterface[\s\S]*readonly derive:/.test(dataflow),
  closeMethod: /interface DataFlowFixpointInterface[\s\S]*readonly close:/.test(dataflow),
  reachesMethod: /interface DataFlowQueryInterface[\s\S]*readonly reaches:/.test(dataflow),
  authorityImplementsAllMethods: ['seed:', 'derive:', 'close:', 'reaches:'].every(x => authority.includes(x)),
  authorityStillOwnsFixedPoint: authority.includes('relationFixedPoint(') && authority.includes('createSemanticDataflowJudgment'),
  factoryLivesWithAuthority: authority.includes('export const semanticDataflowInterfaceFromJudgment'),
  manifestSeedOnly: manifest.includes('SemanticDataflowInput') && !manifest.includes('relationFixedPoint('),
  irConsumesInterface: ir.includes('dataflow: SemanticDataflowInterface'),
  graphDoesNotOwnRuntimeClosure: !graph.includes('relationFixedPoint('),
  ecommerceHasDataflowRelevantQueries: /->where\s*\(|::where(?:Key)?\s*\(/.test(example),
  noSecondSemanticSolver: !read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts').includes('relationFixedPoint('),
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({phase:1010, checks, clean: failed.length === 0, failed}, null, 2));
process.exitCode = failed.length ? 1 : 0;
