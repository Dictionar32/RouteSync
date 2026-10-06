const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const contracts = read('src/types/dataflow/dataFlowInterface.ts');
const semantic = read('src/types/upstream/semanticDataflowInterface.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const manifest = read('src/types/upstream/manifestBuilderInterface.ts');
const manifestImpl = read('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const compiler = read('src/compiler/analysis/DataFlowAnalysis.ts');
const upstreamIndex = read('src/types/upstream/index.ts');

const result = {
  sourceMicroContract: /interface DataFlowSourceInterface/.test(contracts),
  stepMicroContract: /interface DataFlowStepInterface/.test(contracts),
  fixpointMicroContract: /interface DataFlowFixpointInterface/.test(contracts),
  queryMicroContract: /interface DataFlowQueryInterface/.test(contracts),
  projectionMicroContract: /interface DataFlowProjectionInterface/.test(contracts),
  aggregateContract: /export type DataFlowInterface</.test(contracts),
  aggregateComposesSource: /DataFlowSourceInterface<Input, State>/.test(contracts),
  aggregateComposesStep: /DataFlowStepInterface<State>/.test(contracts),
  aggregateComposesFixpoint: /DataFlowFixpointInterface<State>/.test(contracts),
  aggregateComposesQuery: /DataFlowQueryInterface<State, Node>/.test(contracts),
  aggregateExcludesProjection: !/DataFlowProjectionInterface<ProjectionInput, ProjectionOutput>/.test(contracts),
  semanticUsesAggregate: /extends DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(semantic),
  semanticOwnsDerivation: /derive:\s*\(current: SemanticDataflowJudgment\)/.test(authority),
  semanticOwnsClosure: /close:\s*\(current: SemanticDataflowJudgment\)/.test(authority),
  semanticOwnsReachability: /reaches:\s*\(current: SemanticDataflowJudgment/.test(authority),
  manifestIsConstructionOnly: /interface ManifestBuilderInterface/.test(manifest) && !/DataFlow.*Interface/.test(manifest),
  manifestHasNoDataflowSeedMethod: !/seed: constructRouteSyncManifest/.test(manifestImpl),
  irUsesProjection: /extends DataFlowProjectionInterface<SemanticDataflowInterface, SemanticDataflowIRProjection>/.test(ir),
  graphUsesProjection: /extends DataFlowProjectionInterface<RouteSyncManifestFlow, ServiceGraph>/.test(graph),
  cfgUsesDedicatedInterface: /implements ControlFlowDataFlowInterface<T>/.test(compiler),
  upstreamBarrelExportsContracts: /export \* from '.\/dataFlowInterface'/.test(upstreamIndex),
  noSecondSemanticSolverInProjection: !/createSemanticDataflow|runForwardAnalysis|runBackwardAnalysis/.test(ir),
  noSecondSemanticSolverInGraph: !/createSemanticDataflow|runForwardAnalysis|runBackwardAnalysis/.test(graph),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.clean ? 0 : 1;
