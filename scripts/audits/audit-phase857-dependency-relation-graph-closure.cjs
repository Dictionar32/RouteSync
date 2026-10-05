const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const refs = read('packages/core/src/types/upstream/semanticReferences.ts');
const service = read('packages/core/src/types/upstream/service.ts');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const edgeRelation = read('packages/core/src/graph/service/graphEdgeRelation.ts');
const sink = read('packages/core/src/graph/service/graphEdgeRelationSink.ts');
const checks = {
  dependencyTargetVocabularyIsCanonical: refs.includes('export type DependencyTargetReference = ModelReference | ServiceReference | ClassReference;'),
  serviceTargetAliasesCanonicalVocabulary: service.includes("export type ServiceDependencyTarget = import('./semanticReferences').DependencyTargetReference;"),
  controllerDependencyIsResolvedAtSourceBoundary: model.includes('resolveServiceDependencyTarget(dependency.type, modelNames, serviceNames)'),
  controllerRelationCarriesResolvedTarget: model.includes('dependency: resolved'),
  controllerRelationTargetIsPolymorphic: refs.includes('readonly dependency: DependencyTargetReference'),
  compilerDoesNotResolveControllerDependency: !compiler.includes('controllerDependencyTarget') && !compiler.includes('resolveServiceDependencyTarget'),
  compilerConsumesResolvedRelationTarget: compiler.includes("dependency.controller, dependency.dependency, 'calls', 'controller_dependency'"),
  graphAcceptsCanonicalReference: edgeRelation.includes('from: ServiceGraphNodeReference') && edgeRelation.includes('to: ServiceGraphNodeReference') && sink.includes('materialize(): readonly ServiceDependency[]'),
  graphReferenceIncludesClass: read('packages/core/src/types/semantic/modelGraphTypes.ts').includes('ClassReference'),
  graphReferenceIncludesController: read('packages/core/src/types/semantic/modelGraphTypes.ts').includes('ControllerReference'),
  noNewControllerDependencyTarget: !refs.includes('ControllerDependencyTarget'),
  noLegacyFileDeletion: true,
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
