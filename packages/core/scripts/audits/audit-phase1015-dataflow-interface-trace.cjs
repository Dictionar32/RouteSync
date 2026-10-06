const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const upstream = read('src/types/dataflow/dataFlowInterface.ts');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const manifest = read('src/types/upstream/manifestBuilderInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const analysis = read('src/compiler/analysis/DataFlowAnalysis.ts');
const forward = read('src/compiler/analysis/dataflow/forwardSolver.ts');
const backward = read('src/compiler/analysis/dataflow/backwardSolver.ts');
const ecommerce = path.resolve(root, '..', '..', 'examples/ecommerce-shop-source');
const files = fs.existsSync(ecommerce) ? fs.readdirSync(ecommerce, { recursive: true }).filter(x => typeof x === 'string') : [];
const result = {
  sourceCapability: /interface DataFlowSourceInterface/.test(upstream),
  stepCapability: /interface DataFlowStepInterface/.test(upstream),
  fixpointCapability: /interface DataFlowFixpointInterface/.test(upstream),
  queryCapability: /interface DataFlowQueryInterface/.test(upstream),
  aggregateOnly: /export type DataFlowInterface[\s\S]*DataFlowSourceInterface[\s\S]*DataFlowStepInterface[\s\S]*DataFlowFixpointInterface[\s\S]*DataFlowQueryInterface/.test(upstream) && !/DataFlowProjectionInterface<Input, Output>\s*&/.test(upstream),
  semanticComposesAggregate: /extends DataFlowInterface</.test(semantic),
  semanticNoDuplicateOperations: (semantic.match(/readonly seed:/g) || []).length === 0 && (semantic.match(/readonly derive:/g) || []).length === 0,
  manifestIsConstructionOnly: /interface ManifestBuilderInterface/.test(manifest) && !/DataFlow.*Interface/.test(manifest),
  graphUsesProjectionCapability: /extends DataFlowProjectionInterface/.test(graph),
  irUsesProjectionCapability: /extends DataFlowProjectionInterface/.test(ir),
  cfgImplementsControlFlowContract: /implements ControlFlowDataFlowInterface/.test(analysis),
  rawForwardSolverOnlyBehindAnalysis: !/runForwardAnalysis/.test(analysis) ? false : /runForwardAnalysis/.test(analysis),
  rawBackwardSolverOnlyBehindAnalysis: /runBackwardAnalysis/.test(analysis),
  ecommercePresent: fs.existsSync(path.resolve(root, '..', '..', 'examples/ecommerce-shop-source')),
  ecommerceHasLaravelRelations: fs.existsSync(ecommerce) && fs.existsSync(path.join(ecommerce, 'app/Models/Order.php')),
  traceDocumentPresent: exists('src/types/upstream/PHASE1015_DATAFLOW_INTERFACE_TRACE.md'),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
