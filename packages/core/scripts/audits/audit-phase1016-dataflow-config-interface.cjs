const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const upstream = read('src/compiler/analysis/dataflow/dataFlowConfigInterface.ts');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const manifest = read('src/types/upstream/manifestBuilderInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const ecommerce = path.resolve(root, '..', '..', 'examples/ecommerce-shop-source');
const result = {
  sourcePredicate: /interface DataFlowSourcePredicateInterface/.test(upstream) && /readonly isSource/.test(upstream),
  sinkPredicate: /interface DataFlowSinkPredicateInterface/.test(upstream) && /readonly isSink/.test(upstream),
  additionalStepPredicate: /interface DataFlowAdditionalStepInterface/.test(upstream) && /readonly isAdditionalFlowStep/.test(upstream),
  barrierPredicate: /interface DataFlowBarrierInterface/.test(upstream) && /readonly isBarrier/.test(upstream),
  configComposition: /export type DataFlowConfigInterface[\s\S]*DataFlowSourcePredicateInterface[\s\S]*DataFlowSinkPredicateInterface[\s\S]*DataFlowAdditionalStepInterface[\s\S]*DataFlowBarrierInterface/.test(upstream),
  semanticUsesExecutionOnly: /extends DataFlowInterface/.test(semantic) && !/DataFlowConfigInterface/.test(semantic),
  authorityDoesNotOwnSourcePolicy: !/isSource:/.test(authority),
  authorityDoesNotOwnSinkPolicy: !/isSink:/.test(authority),
  authorityDoesNotOwnAdditionalStepPolicy: !/isAdditionalFlowStep/.test(authority),
  configOwnsBarrierPolicy: /isBarrier/.test(upstream),
  manifestIsConstructionOnly: /interface ManifestBuilderInterface/.test(manifest) && !/DataFlow.*Interface/.test(manifest) && !/DataFlowConfigInterface/.test(manifest),
  graphRemainsProjection: /extends DataFlowProjectionInterface/.test(graph),
  irRemainsProjection: /extends DataFlowProjectionInterface/.test(ir),
  ecommercePresent: fs.existsSync(ecommerce),
  ecommerceLaravelRelations: fs.existsSync(path.join(ecommerce, 'app/Models/Order.php')) && fs.existsSync(path.join(ecommerce, 'app/Http/Controllers/PaymentController.php')),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
