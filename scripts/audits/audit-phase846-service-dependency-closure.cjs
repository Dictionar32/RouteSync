const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourceModel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/highLevelSourceModel.ts'), 'utf8');
const serviceTypes = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/service.ts'), 'utf8');
const graphTypes = fs.readFileSync(path.join(root, 'packages/core/src/types/semantic/modelGraphTypes.ts'), 'utf8');
const graphCompiler = fs.readFileSync(path.join(root, 'packages/core/src/graph/service/manifestGraphCompiler.ts'), 'utf8');
const graphIndex = fs.readFileSync(path.join(root, 'packages/core/src/graph/service/graphNodeIndex.ts'), 'utf8');

const checks = {
  serviceDependencyResolutionClosed:
    serviceTypes.includes("kind: 'class_reference'") &&
    sourceModel.includes("kind: 'class_reference'") &&
    sourceModel.includes("kind: 'service_reference'") &&
    sourceModel.includes("kind: 'model_reference'"),
  serviceToServiceResolution:
    sourceModel.includes("relationFirstOption(sequenceToArray(services)") &&
    sourceModel.includes("target: { kind: 'service_reference'"),
  modelResolutionRetained:
    sourceModel.includes("relationFirstOption(sequenceToArray(models)") &&
    sourceModel.includes("target: { kind: 'model_reference'"),
  classFallbackSemantic:
    serviceTypes.includes("| { readonly kind: 'class_reference'; readonly name: ClassName }"),
  dependencyTargetKindPreserved:
    graphCompiler.includes("'depends_on_service'") &&
    graphCompiler.includes("'depends_on_class'") &&
    graphCompiler.includes("'depends_on_model'"),
  graphPreservesServiceEdges:
    graphCompiler.includes("type: 'depends_on_service'") &&
    graphCompiler.includes("relationProject(dependencies"),
  graphPreservesModelEdges:
    graphCompiler.includes("type: 'depends_on_model'"),
  graphPreservesClassEdges:
    graphCompiler.includes("type: 'depends_on_class'"),
  noDependencyReconstruction:
    graphCompiler.includes('service.resolvedDependencies') &&
    !graphCompiler.includes('service.dependencies.items'),
  noHostPrimitiveFallback:
    sourceModel.includes("relationOptionFold(") &&
    sourceModel.includes("fact.target") &&
    !sourceModel.includes("fact.target ??") &&
    !sourceModel.includes("as unknown as"),
  graphIndexCarriesClassReference:
    graphIndex.includes('ClassReference') &&
    graphIndex.includes('GraphNodeReference = ClassReference | ModelReference | ServiceReference'),
};

for (const [name, value] of Object.entries(checks)) console.log(`${name}: ${value}`);
console.log(`allChecksPassed: ${Object.values(checks).every(Boolean)}`);
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
