const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const cli = p => fs.readFileSync(path.join(root, '..', 'cli', 'src', p), 'utf8');
const allTs = dir => {
  const out = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.ts')) out.push(fs.readFileSync(p, 'utf8'));
  });
  walk(path.join(root, dir));
  return out.join('\n');
};

const surface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const projection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const compiler = read('src/graph/service/manifestGraphCompiler.ts');
const generic = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const flow = read('src/types/upstream/manifest.ts');
const scan = cli('commands/scan.ts');
const sync = cli('commands/sync.ts');
const core = allTs('src');
const cliAll = allTs('../cli/src');

const checks = {
  graphSurfaceDoesNotExtendWholeCatalog: !/interface RouteSyncManifestGraphSurface extends LaravelSemanticContractCatalog/.test(surface),
  graphSurfaceHasOnlyMinimalCollections: /readonly models: Sequence<GraphModelSurface>/.test(surface)
    && /readonly services: Sequence<GraphServiceSurface>/.test(surface)
    && /readonly controllers: Sequence<GraphControllerSurface>/.test(surface)
    && /readonly routes: Sequence<GraphRouteSurface>/.test(surface),
  graphSurfaceCarriesCanonicalRelations: /readonly relations: SemanticRelationGraph/.test(surface),
  graphSurfaceDoesNotExposeConstructionModel: !/CompleteLaravelSourceModel|CompleteSourceAst/.test(surface),
  graphProjectionIsDirectional: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(surface),
  graphProjectionSlicesModels: /models: sequenceMap\(manifest\.contracts\.models, projectModel\)/.test(projection),
  graphProjectionSlicesServices: /services: sequenceMap\(manifest\.contracts\.services, projectService\)/.test(projection),
  graphProjectionSlicesControllers: /controllers: sequenceMap\(manifest\.contracts\.controllers, projectController\)/.test(projection),
  graphProjectionSlicesRoutes: /routes: sequenceMap\(manifest\.contracts\.routes, projectRoute\)/.test(projection),
  graphProjectionDoesNotForwardCatalogWholesale: !/\.\.\.manifest\.contracts/.test(projection),
  graphCompilerUsesOnlyGraphSlices: !/ServiceSemanticContract|ModelHighLevelContract|RouteHighLevelContract|ControllerActionFlowContract/.test(compiler),
  graphCompilerDoesNotInspectResourcesRequestsResponsesSchema: !/Resource|Request|Response|ModelSchema|CompleteLaravelSourceModel/.test(compiler),
  structuralRelationAuthorityRemainsCanonical: /surface\.relations\.relations/.test(compiler),
  genericDataFlowRemainsDomainNeutral: !/Laravel|Route|Controller|Model|Resource|Schema|Manifest/.test(generic),
  boundaryRemainsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  cliBuildsManifestThenProjectsFlow: /manifestBuilder\.build\(sourceProject\)/.test(scan) && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(scan),
  syncUsesSameFlowBoundary: /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(sync),
  staticLaravelScannerAbsent: !/StaticLaravelScanner/.test(core + cliAll),
  noSecondManifestBuildInMainCommands: (scan.match(/manifestBuilder\.build\(/g) || []).length === 1 && (sync.match(/manifestBuilder\.build\(/g) || []).length === 1,
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ ...checks, failed, allPassed: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
