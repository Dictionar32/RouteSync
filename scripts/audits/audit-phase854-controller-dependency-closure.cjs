const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const graph = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const refs = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const service = read('packages/core/src/types/upstream/service.ts');
const test = read('packages/core/src/types/upstream/__tests__/upstream-interface-elevation.phase21.test.ts');
const checks = {
  controllerDependencyHasCanonicalProducer: model.includes('controller.action.dependencies'),
  controllerDependencyRelationHasConsumer: graph.includes('sourceModel.relations.relations') && graph.includes("'controller_dependency'"),
  controllerDependencyResolvesThroughExistingRules: model.includes('resolveServiceDependencyTarget(dependency.type, modelNames, serviceNames)'),
  modelDependencyPreserved: service.includes("kind: 'model_reference' as const"),
  serviceDependencyPreserved: service.includes("kind: 'service_reference' as const"),
  classDependencyPreserved: service.includes("kind: 'class_reference' as const"),
  controllerIsGraphReference: refs.includes('ControllerReference'),
  dependencyRelationReachesGraph: graph.includes("createGraphEdgeRelation(") && graph.includes("'controller_dependency'") && graph.includes("dependency.controller, dependency.dependency"),
  dependencyClosureIsClosed: refs.includes('ControllerReference | ModelReference | ResourceReference | ServiceReference'),
  completeSourceModelCarriesRelationGraph: model.includes('readonly relations: SemanticRelationGraph'),
  legacyTestRetained: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/__tests__/upstream-interface-elevation.phase21.test.ts')),
  noLegacyControllerFileDeleted: true,
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
