const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const dataFlowInterface = read('src/types/dataflow/dataFlowInterface.ts');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');
const config = read('src/compiler/analysis/dataflow/dataFlowConfigInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const adapter = read('src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const ecommerce = path.resolve(root, '../../examples/ecommerce-shop-source');

const result = {
  dataFlowHasSeed: /readonly seed\s*:\s*\(/.test(dataFlowInterface),
  dataFlowHasDerive: /readonly derive\s*:\s*\(/.test(dataFlowInterface),
  dataFlowHasClose: /readonly close\s*:\s*\(/.test(dataFlowInterface),
  dataFlowHasReaches: /readonly reaches\s*:\s*\(/.test(dataFlowInterface),
  dataFlowDoesNotContainProjection: !/interface DataFlowProjectionInterface/.test(dataFlowInterface),
  semanticUsesExecutionInterface: /extends DataFlowInterface</.test(semantic),
  configIsAnalysisOwned: /DataFlowConfigInterface/.test(config) && true,
  configHasFourPolicies: ['isSource', 'isSink', 'isAdditionalFlowStep', 'isBarrier'].every(name => config.includes(name)),
  manifestCombinesRouteFacts: /semanticDataflowRouteParameterFacts/.test(manifest),
  manifestCombinesControllerFacts: /semanticDataflowControllerFacts/.test(manifest),
  manifestCombinesQueryFacts: /semanticDataflowControllerQueryFacts/.test(manifest),
  inputHasSingleOrigin: /readonly origin: SemanticDataflowOrigin/.test(semantic),
  lineageHasProducerDomains: ['route', 'controller', 'model_relation', 'resource', 'schema'].every(name => semantic.includes(`'${name}'`)),
  adapterProducerBoundaryStable: /producer: SemanticDataflowLineage\['producer'\]/.test(adapter) || !/producer: SemanticDataflowLineage/.test(adapter),
  graphRemainsProjection: /DataFlowProjectionInterface/.test(graph),
  irRemainsProjection: /DataFlowProjectionInterface/.test(ir),
  ecommerceRoutesPresent: fs.existsSync(path.join(ecommerce, 'routes/api.php')),
  ecommerceModelsPresent: fs.existsSync(path.join(ecommerce, 'app/Models')),
  ecommerceControllersPresent: fs.existsSync(path.join(ecommerce, 'app/Http/Controllers')),
  ecommerceMigrationsPresent: fs.existsSync(path.join(ecommerce, 'database/migrations')),
};

// Deliberately fail if future work starts producer policy before fixing provenance granularity.
result.mixedProducerSeedSurfaceDetected =
  result.inputHasSingleOrigin &&
  result.manifestCombinesRouteFacts &&
  result.manifestCombinesControllerFacts &&
  result.manifestCombinesQueryFacts;

result.producerPolicyMustWaitForFactLineage = result.mixedProducerSeedSurfaceDetected;
result.clean = Object.values(result).every(value => typeof value !== 'boolean' || value === true);

console.log(JSON.stringify({ phase: 1021, ...result }, null, 2));
process.exitCode = result.clean ? 0 : 1;
