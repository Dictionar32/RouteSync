const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const surface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const projection = read('src/graph/RouteSyncManifestGraphProjection.ts');
const compiler = read('src/graph/service/manifestGraphCompiler.ts');
const relation = read('src/graph/service/structuralSemanticRelationProjection.ts');
const graphRelation = read('src/types/upstream/graphRelation.ts');
const nodes = read('src/types/semantic/serviceGraphTypes.ts');
const factory = read('src/graph/service/nodeFactories.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const results = {
  graphSurfaceHasNoRouteCompatibilitySlice: !surface.includes('GraphRouteSurface') && !surface.includes('readonly routes:'),
  graphProjectionDoesNotMaterializeRoutes: !projection.includes('projectRoute') && !projection.includes('contracts.routes'),
  controllerNodeDoesNotStoreRoutes: !nodes.includes('routes: string[]'),
  controllerNodeDoesNotStoreCalls: !nodes.includes('calls: string[]'),
  serviceNodeDoesNotStoreDependencies: !nodes.includes('dependencies: ServiceDependency[]'),
  controllerFactoryDoesNotAcceptRoutes: factory.includes('buildControllerNode(name: ControllerNodeName, actions: ActionName[])'),
  structuralRouteControllerProjectsToGraphEdge: relation.includes("case 'route_controller'") && relation.includes("'routes_to_controller'") && relation.includes("'route_controller'"),
  graphRelationAcceptsRouteReference: graphRelation.includes('RouteReference'),
  graphRelationHasRouteControllerOrigin: graphRelation.includes("'route_controller'"),
  compilerDoesNotMaterializeRouteFacts: !compiler.includes('addRouteFact') && !compiler.includes('route.controllerTarget'),
  compilerConsumesCanonicalRelations: compiler.includes('projectStructuralRelations(surface, builder)'),
  genericDataflowRemainsDomainNeutral: !/(Laravel|Route|Controller|Model|Resource|Schema|Manifest|Graph)/.test(dataflow),
  boundaryRemainsDirectional: boundary.includes('project: (upstream: Upstream) => Downstream'),
};
results.allPassed = Object.values(results).every(Boolean);
console.log(JSON.stringify({ phase: 1093, ...results, failed: Object.entries(results).filter(([,v]) => v === false).map(([k]) => k) }, null, 2));
process.exit(results.allPassed ? 0 : 1);
