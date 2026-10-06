const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const manifest = read('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const manifestInterface = read('src/types/upstream/manifestBuilderInterface.ts');
const scanner = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const dataflowIndex = read('src/compiler/analysis/dataflow/index.ts');
const dataflow = read('src/compiler/analysis/DataFlowAnalysis.ts');
const upstreamDataflow = read('src/types/dataflow/dataFlowInterface.ts');
const upstreamIndex = read('src/types/upstream/index.ts');
const result = {
  manifestBuilderInterface: /interface ManifestBuilderInterface/.test(manifestInterface),
  manifestBuilderImplementation: /manifestBuilder: ManifestBuilderInterface/.test(manifest),
  scannerUsesManifestInterface: /manifestBuilder\.build\(sourceProject\)/.test(scanner),
  manifestProducesOnlySeeds: /dataflowInputs:\s*semanticDataflowInputsFromSourceModel/.test(manifest),
  irProjectionInterface: /interface SemanticDataflowIRProjectionInterface/.test(ir),
  irConsumesSemanticInterface: /DataFlowProjectionInterface<SemanticDataflowInterface, SemanticDataflowIRProjection>/.test(ir),
  irProjectionImplementation: /semanticDataflowIRProjection: SemanticDataflowIRProjectionInterface/.test(ir),
  graphBuilderInterface: /interface ServiceGraphBuilderInterface/.test(graph),
  graphBuilderImplementsInterface: /class ServiceGraphBuilder implements ServiceGraphBuilderInterface/.test(graph),
  graphDoesNotOwnDataflowSolver: !/createSemanticDataflow|runForwardAnalysis|runBackwardAnalysis/.test(graph),
  dataflowInterfaceExported: /export \* from '.\/dataFlowInterface'/.test(upstreamIndex),
  rawSolversHiddenFromBarrel: !/export \{ runForwardAnalysis \}|export \{ runBackwardAnalysis \}/.test(dataflowIndex),
  dataflowClassImplementsInterface: /class DataFlowAnalysis<T> implements ControlFlowDataFlowInterface<T>/.test(dataflow),
  microSeedInterfacePresent: /interface DataFlowSourceInterface/.test(upstreamDataflow),
  microDerivationInterfacePresent: /interface DataFlowStepInterface/.test(upstreamDataflow),
  microClosureInterfacePresent: /interface DataFlowFixpointInterface/.test(upstreamDataflow),
  microReachabilityInterfacePresent: /interface DataFlowQueryInterface/.test(upstreamDataflow),
  microProjectionInterfacePresent: /interface DataFlowProjectionInterface/.test(upstreamDataflow),
  aggregateDataFlowInterfacePresent: /export type DataFlowInterface<.*>/.test(upstreamDataflow),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.clean ? 0 : 1;
