const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const compiler = read('src/graph/service/manifestGraphCompiler.ts');
const surface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const projection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const checks = {
  serviceDependencyOriginUsesGraphSurfaceName: /service\.name\.value\.value/.test(compiler),
  noStaleServiceIdentityAccess: !/service\.identity\.name/.test(compiler),
  graphBoundaryIsFlowToSurface: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(surface),
  projectionDoesNotForwardCatalog: !/\.\.\.manifest\.contracts/.test(projection),
  genericDataflowStillDomainNeutral: !/Laravel|Route|Controller|Model|Resource|Schema|Manifest/.test(dataflow),
  boundaryIsUpstreamToDownstream: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ phase: 1089, ...checks, failed, allPassed: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
