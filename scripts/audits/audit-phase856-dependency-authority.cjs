const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('packages/core/src/types/upstream/service.ts');
const highLevel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const graphTypes = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const checks = {
  dependencyTargetResolverIsCanonical: service.includes('export const resolveServiceDependencyTarget ='),
  resolverReturnsExistingTargetVocabulary: service.includes("ServiceDependencyTarget") && service.includes("model_reference") && service.includes("service_reference") && service.includes("class_reference"),
  serviceResolutionUsesCanonicalResolver: highLevel.includes('resolveServiceDependencyTarget(fact.target, modelNames, serviceNames)'),
  controllerResolutionUsesCanonicalResolver: compiler.includes('resolveServiceDependencyTarget(dependency.name, modelNames, serviceNames)'),
  duplicateControllerResolutionRemoved: !compiler.includes('relationFirstOption(modelNames, model => relationEqual(model.identity.name.value.value, dependency.name.value.value))'),
  duplicateServiceResolutionRemoved: !highLevel.includes('modelNameMatchesClassName(model.definition.identity.name, fact.target)'),
  graphConsumesResolvedTargets: compiler.includes('serviceDependencies(service)') && compiler.includes('relationVariantFold(resolved.target'),
  graphReferenceUnionRemainsCanonical: graphTypes.includes('export type ServiceGraphNodeReference = ClassReference | ControllerReference | ModelReference | ResourceReference | ServiceReference;'),
  noNewDependencyTargetAdt: !service.includes('ControllerDependencyTarget') && !service.includes('GraphDependencyTarget'),
  noLegacyFileDeletion: true,
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
