const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const cli = p => fs.readFileSync(path.join(root, '..', 'cli', 'src', p), 'utf8');

const projectionInterface = read('src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts');
const projection = read('src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const analysis = read('src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const scan = cli('commands/scan.ts');
const sync = cli('commands/sync.ts');
const flow = read('src/types/upstream/manifest.ts');
const generic = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const graph = read('src/graph/ServiceGraphBuilderInterface.ts');
const graphProjectionInterface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const graphProjection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const graphCompiler = read('src/graph/service/manifestGraphCompiler.ts');

const checks = {
  dataflowProjectionIsDownstreamBoundary: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestDataflowSurface>/.test(projectionInterface),
  dataflowSurfaceIsAstFree: !/\bast\b/.test(projectionInterface),
  projectionConsumesCanonicalFlowSlice: /manifest\.contracts\.controllers/.test(projection),
  analysisDoesNotImportCompleteSourceModel: !/CompleteLaravelSourceModel|sourceModel/.test(analysis),
  analysisConsumesDataflowSurface: /manifest: RouteSyncManifestDataflowSurface/.test(analysis),
  scanProjectsFlowOnceForDataflow: /routeSyncManifestDataflowSurfaceFromFlow\(manifestFlow\)/.test(scan),
  syncProjectsFlowOnceForDataflow: /routeSyncManifestDataflowSurfaceFromFlow\(manifestFlow\)/.test(sync),
  scanAnalyzerConsumesSurface: /analyzeRouteSyncManifestDataflow\(dataflowSurface, semanticDataflowRuntimeBoundary\)/.test(scan),
  syncAnalyzerConsumesSurface: /analyzeRouteSyncManifestDataflow\(dataflowSurface, semanticDataflowRuntimeBoundary\)/.test(sync),
  genericDataFlowRemainsDomainNeutral: !/Laravel|Route|Controller|Model|Resource|Schema|Manifest/.test(generic),
  boundaryRemainsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  graphUsesDownstreamSurfaceBoundary: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graph),
  graphProjectionIsDownstreamBoundary: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graphProjectionInterface),
  graphProjectionConsumesCanonicalFlowSlice: /manifest\.contracts/.test(graphProjection) && /manifest\.relations/.test(graphProjection),
  graphCompilerDoesNotImportCompleteSourceModel: !/CompleteLaravelSourceModel|manifest\.sourceModel/.test(graphCompiler),
  scanProjectsFlowOnceForGraph: /routeSyncManifestGraphSurfaceFromFlow\(manifestFlow\)/.test(scan),
  graphAnalyzerConsumesSurface: /graphBuilder\.project\(graphSurface\)/.test(scan),
  legacyScannerAbsent: !exists('src/compiler/scanner/StaticLaravelScanner.ts'),
  flowDoesNotExposeAst: (() => { const start = flow.indexOf('export interface RouteSyncManifestFlow'); const end = flow.indexOf('/** Canonical validated manifest contract', start); return start >= 0 && end > start && !flow.slice(start, end).includes('readonly ast:'); })(),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ ...checks, failed, allPassed: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
