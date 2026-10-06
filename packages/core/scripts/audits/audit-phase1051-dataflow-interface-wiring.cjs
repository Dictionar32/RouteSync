const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walkTs = relative => {
  const base = path.join(root, relative);
  const out = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.ts')) out.push({
        file: path.relative(root, full),
        text: fs.readFileSync(full, 'utf8'),
      });
    }
  };
  visit(base);
  return out;
};

const production = walkTs('src').filter(({ file }) => !file.includes('/__tests__/'));
const upstream = production.filter(({ file }) => file.startsWith('types/upstream/'));
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const runtimeBoundary = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const runtimeComposition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const runtimeAdapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const scannerCompat = read('src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const manifest = read('src/types/upstream/semanticDataflowManifestSurface.ts');

const authorityFactoryImports = production.filter(({ file, text }) =>
  /createSemanticDataflowDataFlowInterface/.test(text) && file !== 'src/compiler/analysis/semanticDataflowDataFlowAdapter.ts'
);
const authorityConcreteImports = production.filter(({ file, text }) =>
  /from ['"][^'\"]*semanticDataflowAuthority['"]/.test(text) &&
  file !== 'src/types/upstream/semanticDataflowAuthority.ts'
);

const checks = {
  genericDataFlowContractExists: /export type DataFlowInterface|export interface DataFlowInterface/.test(read('src/types/dataflow/dataFlowInterface.ts')),
  runtimeBoundaryConsumesAndReturnsGenericDataflow: /extends InterfaceDependencyBoundary<\s*SemanticDataflowInput,\s*SemanticDataflowRuntimeDataFlow\s*>/.test(runtimeBoundary) && /SemanticDataflowRuntimeDataFlow\s*=\s*DataFlowInterface</.test(runtimeBoundary),
  compositionIsOnlyFactoryWiring: /project:\s*createSemanticDataflowDataFlowInterface/.test(runtimeComposition) && /semanticDataflowRuntimeBoundary/.test(runtimeComposition),
  factoryHasSingleProductionWiringImport: /export const createSemanticDataflowDataFlowInterface/.test(runtimeAdapter) && /semanticDataflowDataFlowAdapter/.test(runtimeComposition),
  noProductionConcreteAuthorityImportOutsideCompatibility: authorityConcreteImports.length === 1 && authorityConcreteImports[0].file === 'src/compiler/analysis/semanticDataflowDataFlowAdapter.ts',
  scannerCompatibilityUsesWiring: /semanticDataflowRuntimeBoundary\.project\(input\)\.state/.test(scannerCompat) && !/from ['"][^'\"]*semanticDataflowAuthority['"]/.test(scannerCompat) && !/SemanticDataFlowInterface|analyzeSemanticDataFlowInterface/.test(scannerCompat),
  upstreamDoesNotDependOnDownstreamBoundary: upstream.every(({ text }) => !/InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(text)),
  projectionIsBoundarySpecialization: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  irUsesProjectionAndGenericDataflow: /DataFlowProjectionInterface/.test(irInterface) && /SemanticDataflowInput/.test(irInterface) && /SemanticDataflowJudgment/.test(irInterface) && /SemanticDataflowIdentity/.test(irInterface) && /DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(ir),
  graphUsesInterfaceDependencyBoundary: /InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface) && !/DataFlowProjectionInterface/.test(graph),
  manifestRemainsSeedOnly: /ManifestDataflowSeedSurface/.test(manifest) && !/readonly reaches/.test(manifest) && !/kind:\s*['"]reaches['"]/.test(manifest),
  authorityOwnsClosure: /createSemanticDataflowJudgment/.test(authority) && /reachClosure/.test(authority) && !/DataFlowInterface/.test(authority),
  noSemanticDataflowWrapperAuthority: !/interface\s+SemanticDataflowInterface/.test(read('src/types/upstream/semanticDataflow.ts')) && !/createSemanticDataflowInterface|semanticDataflowInterfaceFromJudgment/.test(authority),
  noProductionLegacyScannerInterface: !production.some(({ file, text }) => file === 'src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts' && /SemanticDataFlowInterface|analyzeSemanticDataFlowInterface/.test(text)),
};

const result = { checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
