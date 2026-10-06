const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const files = p => fs.readdirSync(path.join(root, p), { withFileTypes: true }).flatMap(e => {
  const q = path.join(p, e.name);
  return e.isDirectory() ? files(q) : [q];
});
const upstreamFiles = files('src/types/upstream').filter(p => /\.(ts|tsx)$/.test(p) && !/__tests__\//.test(p));
const upstream = upstreamFiles.map(file => ({ file, text: read(file) }));
const canonical = read('src/types/dataflow/dataFlowInterface.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const adapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const composition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const cfg = read('src/compiler/analysis/dataflow/controlFlowDataFlowInterface.ts');
const oldCfg = path.join(root, 'src/compiler/analysis/dataflow/dataFlowInterface.ts');
const result = {
  canonicalGenericDataflowContract: /export type DataFlowInterface<.*>/.test(canonical),
  canonicalHasOnlyGenericCapabilities: /DataFlowSourceInterface/.test(canonical) && /DataFlowFixpointInterface/.test(canonical) && /DataFlowQueryInterface/.test(canonical) && !/Laravel|Route|Controller|Resource|Schema|Graph/.test(canonical),
  dependencyBoundaryIsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  projectionSpecializesGenericBoundary: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  authorityOwnsClosure: /createSemanticDataflowJudgment/.test(authority) && /reachClosure/.test(authority) && !/DataFlowInterface/.test(authority),
  authorityDoesNotConsumeDownstreamWiring: !/DataFlowInterface|InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(authority),
  adapterOwnsRuntimeWiring: /export const createSemanticDataflowDataFlowInterface/.test(adapter) && /DataFlowInterface<\s*SemanticDataflowInput,\s*SemanticDataflowJudgment,\s*SemanticDataflowIdentity\s*>/.test(adapter),
  compositionUsesAdapter: /createSemanticDataflowDataFlowInterface/.test(composition) && /semanticDataflowDataFlowAdapter/.test(composition),
  irConsumesGenericProjection: /DataFlowProjectionInterface/.test(irInterface) && /SemanticDataflowInput/.test(irInterface) && /SemanticDataflowJudgment/.test(irInterface) && /SemanticDataflowIdentity/.test(irInterface),
  graphUsesGenericDependencyBoundary: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(read('src/graph/ServiceGraphBuilderInterface.ts')) && !/DataFlowProjectionInterface/.test(graph) && !/DataFlowProjectionInterface/.test(graph),
  cfgContractRenamedByResponsibility: /export type ControlFlowDataFlowInterface/.test(cfg) && !fs.existsSync(oldCfg),
  upstreamDoesNotImportDownstreamContracts: upstream.every(({text}) => !/InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(text)),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
