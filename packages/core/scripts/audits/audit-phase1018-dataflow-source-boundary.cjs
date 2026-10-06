const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const exists = p => fs.existsSync(path.join(repo, p));
const manifestInterface = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const index = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const graph = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const ecommerceRoutes = read('examples/ecommerce-shop-source/routes/api.php');
const checks = {
  manifestInterfaceIsConstructionOnly: /interface ManifestBuilderInterface/.test(manifestInterface) && !/DataFlow.*Interface/.test(manifestInterface),
  manifestHasBuildOnly: /readonly build:/.test(manifestInterface) && !/readonly seed:/.test(manifestInterface),
  manifestProducerHasNoSeedAlias: !/seed:\s*constructRouteSyncManifest/.test(manifestBuilder),
  canonicalMicroCapabilitiesPresent: /DataFlowSourceInterface/.test(dataflow) && /DataFlowStepInterface/.test(dataflow) && /DataFlowFixpointInterface/.test(dataflow) && /DataFlowQueryInterface/.test(dataflow),
  legacyAliasesRemoved: !/DataFlowSeedInterface|DataFlowDerivationInterface|DataFlowClosureInterface|DataFlowReachabilityInterface/.test(dataflow),
  canonicalCoreExportsPresent: /DataFlowSourceInterface/.test(index) && /DataFlowStepInterface/.test(index) && /DataFlowFixpointInterface/.test(index) && /DataFlowQueryInterface/.test(index),
  upstreamExportsDataflow: /dataFlowInterface/.test(upstreamIndex),
  manifestRemainsSeedSurface: /SemanticDataflowInput/.test(surface) && /dataflowInputs/.test(surface) && !/createSemanticDataflowJudgment/.test(surface),
  authorityOwnsClosure: /relationFixedPoint/.test(authority) && /createSemanticDataflowJudgment/.test(authority),
  graphIsProjection: /DataFlowProjectionInterface/.test(graph) && /GraphEdgeRelationSink/.test(graph),
  irIsProjection: /DataFlowProjectionInterface/.test(ir) && /projectSemanticDataflowToIR/.test(ir),
  ecommerceFixturePresent: exists('examples/ecommerce-shop-source/routes/api.php') && /\{orderId\}|\{id\}/.test(ecommerceRoutes),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { phase: 1018, checks, clean: failed.length === 0, failed };
console.log(JSON.stringify(report, null, 2));
process.exitCode = failed.length ? 1 : 0;
