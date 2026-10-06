const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const surface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const projection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const compiler = read('src/graph/service/manifestGraphCompiler.ts');
const nodes = read('src/types/semantic/serviceGraphTypes.ts');
const factory = read('src/graph/service/nodeFactories.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const results = {
  serviceSurfaceUsesGraphMethodSlice: surface.includes('GraphServiceMethodSurface'),
  serviceSurfaceDoesNotExposeRawDependencyFacts: !surface.includes('ServiceDependencyFacts'),
  serviceSurfaceDoesNotExposeResolvedDependencyAggregate: !surface.includes('ResolvedServiceDependencies'),
  serviceSurfaceCarriesResolvedTargetsOnly: surface.includes('dependencyTargets: Sequence<DependencyTargetReference>'),
  projectionSlicesMethodNames: projection.includes('name: method.name'),
  projectionSlicesDependencyTargets: projection.includes('dependency.target'),
  compilerConsumesDependencyTargets: compiler.includes('sequenceToArray(service.dependencyTargets)'),
  serviceNodeDoesNotStoreUpstreamDependencyPayloads: !nodes.includes('ServiceDependencyFacts') && !nodes.includes('ResolvedServiceDependencies'),
  serviceNodeDoesNotStoreUpstreamMethodPayload: !nodes.includes('ServiceMethod'),
  factoryStoresOnlyGraphMethodNames: factory.includes('methods: relationProject(methods, method => ({ name: method }))'),
  genericDataflowRemainsDomainNeutral: !/(Laravel|Route|Controller|Model|Resource|Schema|Manifest|Graph)/.test(dataflow),
  boundaryRemainsDirectional: boundary.includes('project: (upstream: Upstream) => Downstream'),
  controllerSurfaceDoesNotImportControllerAction: !surface.includes("ControllerAction['controller']") && !surface.includes("ControllerAction['action']"),
  routeSurfaceDoesNotImportRouteDefinition: !surface.includes("RouteDefinition['identity']") && !surface.includes("RouteDefinition['bindings']"),
  routeSurfaceUsesGraphOwnedSlices: surface.includes('path: RoutePath') && surface.includes('controllerTarget: Option<ControllerReference>'),
  routeProjectionExtractsControllerTarget: projection.includes("target.kind === 'controller_action' || target.kind === 'controller_invokable'"),
  graphCompilerConsumesProjectedRouteTarget: compiler.includes('route.controllerTarget') && compiler.includes('route.path.value.value'),
};
results.allPassed = Object.values(results).every(Boolean);
console.log(JSON.stringify({phase:1091, ...results, failed:Object.entries(results).filter(([,v])=>v===false).map(([k])=>k)}, null, 2));
process.exit(results.allPassed ? 0 : 1);
