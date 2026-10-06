const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const graph = ['src/graph/RouteSyncManifestGraphProjectionInterface.ts','src/graph/RouteSyncManifestGraphProjection.ts','src/graph/service/nodeFactories.ts','src/graph/service/manifestGraphCompiler.ts','src/graph/ServiceGraphBuilder.ts','src/graph/ServiceGraphAssemblyInterface.ts','src/types/semantic/modelGraphTypes.ts'].map(read).join('\n');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const results = {
  graphDoesNotImportModelSemanticDefinition: !graph.includes("ModelSemanticDefinition"),
  graphNodeUsesGraphModelNodeSurface: graph.includes('GraphModelNodeSurface'),
  graphProjectionForwardsOnlyIdentity: graph.includes('const projectModel') && graph.includes('identity: model.identity') && !graph.includes('semantic: model.semantic'),
  graphCompilerBuildsFromIdentitySlice: graph.includes('buildModelNode({ identity: model.identity })'),
  canonicalRelationGraphRemainsPresent: graph.includes('SemanticRelationGraph') && graph.includes('relations: manifest.relations'),
  genericDataflowRemainsDomainNeutral: !/(Laravel|Route|Controller|Model|Resource|Schema|Manifest|Graph)/.test(dataflow),
  boundaryRemainsDirectional: boundary.includes('project: (upstream: Upstream) => Downstream'),
};
results.allPassed = Object.values(results).every(Boolean);
console.log(JSON.stringify({phase:1090, ...results, failed:Object.entries(results).filter(([,v])=>v===false).map(([k])=>k)}, null, 2));
process.exit(results.allPassed ? 0 : 1);
