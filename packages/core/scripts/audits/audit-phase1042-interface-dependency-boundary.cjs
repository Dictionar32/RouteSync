const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walkTs = relative => {
  const base = path.join(root, relative);
  const out = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '__tests__') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
    }
  };
  visit(base);
  return out.map(file => ({ file: path.relative(root, file), text: fs.readFileSync(file, 'utf8') }));
};

const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');
const upstream = walkTs('src/types/upstream');
const upstreamProduction = upstream.filter(({ file }) => !file.includes('/PHASE'));
const coreProduction = walkTs('src').filter(({ file }) => !file.includes('/__tests__/'));

const checks = {
  boundaryExists: /interface InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary),
  boundaryDirectionIsUpstreamToDownstream: /project:\s*\(upstream:\s*Upstream\)\s*=>\s*Downstream/.test(boundary),
  dataflowRemainsExecutionStateQueryContract: /DataFlowSourceInterface/.test(dataflow) && /DataFlowStateInterface/.test(dataflow) && /DataFlowStepInterface/.test(dataflow) && /DataFlowFixpointInterface/.test(dataflow) && /DataFlowQueryInterface/.test(dataflow),
  projectionSpecializesGenericBoundary: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  irConsumesGenericDataflow: /DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(ir) || (/DataFlowProjectionInterface/.test(irInterface) && /SemanticDataflowInput/.test(irInterface)),
  irUsesCanonicalState: /dataflow\.state\.closure/.test(ir) && /dataflow\.state\.authority/.test(ir) && !/dataflow\.judgment\.closure/.test(ir),
  graphUsesDirectionalStructuralBoundary: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graphInterface) && !/DataFlowProjectionInterface/.test(graph),
  manifestIsSeedOnly: /ManifestDataflowSeedSurface/.test(manifest) && !/readonly reaches/.test(manifest) && !/kind:\s*['\"]reaches['\"]/.test(manifest),
  upstreamDoesNotImportBoundary: upstreamProduction.every(({ text }) => !/InterfaceDependencyBoundary/.test(text)),
  noNonIRDataflowProjectionConsumers: coreProduction.filter(({ file, text }) => /DataFlowProjectionInterface/.test(text) && !file.includes('SemanticDataflowIRProjection.ts') && !file.includes('SemanticDataflowIRProjectionInterface.ts') && !file.includes('dataFlowProjectionInterface.ts') && !file.includes('types/dataflow/index.ts') && !file.endsWith('src/index.ts')).length === 0,
};

const result = { ...checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
