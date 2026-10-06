const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const cli = p => fs.readFileSync(path.join(root, '..', 'cli', 'src', p), 'utf8');

const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const projectionInterface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const projection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const compiler = read('src/graph/service/manifestGraphCompiler.ts');
const builder = read('src/graph/ServiceGraphBuilder.ts');
const scan = cli('commands/scan.ts');
const flow = read('src/types/upstream/manifest.ts');
const generic = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');

const checks = {
  graphInterfaceUsesSurface: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graphInterface),
  graphProjectionIsDirectional: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(projectionInterface),
  graphProjectionConsumesCanonicalFlowSlice: /manifest\.contracts/.test(projection) && /manifest\.relations/.test(projection) && !/manifest\.sourceModel/.test(projection),
  graphSurfaceIsConstructionFree: !/CompleteSourceAst|CompleteLaravelSourceModel/.test(projectionInterface),
  graphCompilerConsumesSurface: /surface: RouteSyncManifestGraphSurface/.test(compiler),
  graphCompilerDoesNotConsumeCompleteSourceModel: !/CompleteLaravelSourceModel|sourceModel/.test(compiler),
  graphBuilderConsumesSurface: /project\(surface: RouteSyncManifestGraphSurface\)/.test(builder),
  scanProjectsFlowToGraphSurface: /routeSyncManifestGraphSurfaceFromFlow\(manifestFlow\)/.test(scan),
  scanPassesGraphSurface: /graphBuilder\.project\(graphSurface\)/.test(scan),
  genericDataFlowRemainsDomainNeutral: !/Laravel|Route|Controller|Model|Resource|Schema|Manifest/.test(generic),
  boundaryRemainsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  flowDoesNotExposeAst: (() => { const start = flow.indexOf('export interface RouteSyncManifestFlow'); const end = flow.indexOf('/** Canonical validated manifest contract', start); return start >= 0 && end > start && !flow.slice(start, end).includes('readonly ast:'); })(),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ ...checks, failed, allPassed: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
