const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const manifest = read('src/types/upstream/manifest.ts');
const projection = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const graphProjection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const dataflowProjection = read('src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const dataflow = read('src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const graphCompiler = read('src/graph/service/manifestGraphCompiler.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const generic = read('src/types/dataflow/dataFlowInterface.ts');
const cli = fs.readFileSync(path.resolve(root, '../cli/src/commands/scan.ts'), 'utf8');
const start = manifest.indexOf('export interface RouteSyncManifestFlow');
const end = manifest.indexOf('/** Canonical validated manifest contract', start);
const flowBlock = manifest.slice(start, end);
const checks = {
  flowIsCanonicalSemanticSlice: /readonly contracts: LaravelSemanticContractCatalog/.test(flowBlock) && /readonly relations: SemanticRelationGraph/.test(flowBlock) && /extends ManifestDataflowSeedSurface/.test(flowBlock),
  flowDoesNotCarryCompleteSourceModel: !/CompleteLaravelSourceModel|sourceModel/.test(flowBlock),
  flowDoesNotCarryAst: !/CompleteSourceAst|readonly ast:/.test(flowBlock),
  manifestProjectionBuildsCanonicalSlices: /contracts: manifest\.sourceModel\.contracts/.test(projection) && /relations: manifest\.sourceModel\.relations/.test(projection),
  graphProjectionConsumesFlowSlices: /manifest\.contracts/.test(graphProjection) && /manifest\.relations/.test(graphProjection) && !/manifest\.sourceModel/.test(graphProjection),
  dataflowProjectionConsumesFlowSlices: /manifest\.contracts\.controllers/.test(dataflowProjection) && !/manifest\.sourceModel/.test(dataflowProjection),
  graphCompilerHasNoSourceModelVocabulary: !/CompleteLaravelSourceModel|sourceModel/.test(graphCompiler),
  analysisHasNoSourceModelVocabulary: !/CompleteLaravelSourceModel|sourceModel/.test(dataflow),
  cliBuildsThenProjectsFlow: /manifestBuilder\.build\(sourceProject\)/.test(cli) && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(cli),
  genericDataFlowRemainsDomainNeutral: !/Laravel|Route|Controller|Model|Resource|Schema|Manifest|Graph|IR/.test(generic),
  boundaryRemainsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ phase: 1087, ...checks, failed, allPassed: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
