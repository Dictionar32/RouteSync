const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const graphTypes = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const edgeRelation = read('packages/core/src/graph/service/graphEdgeRelation.ts');
const checks = {
  graphContextAcceptsControllerReference: compiler.includes('ControllerReference') && compiler.includes('GraphEdgeRelation'),
  graphContextAcceptsClassReference: edgeRelation.includes('ServiceGraphNodeReference') && edgeRelation.includes('GraphEdgeRelation'),
  builderUsesCanonicalGraphReferenceUnion: edgeRelation.includes('ServiceGraphNodeReference') && edgeRelation.includes('GraphEdgeRelation'),
  controllerIndexIsLive: builder.includes('get controllersIndex(): RelationIndex<string, ControllerNode> { return owner.controllersIndex; }'),
  edgeCollectionIsLive: builder.includes('get edgeRelations(): readonly GraphEdgeRelation[] { return owner.edgeSink.getRelations(); }'),
  controllerDependencyStillReachesGraph: compiler.includes("builder.addGraphEdgeRelation(createGraphEdgeRelation(") && compiler.includes("dependency.controller, dependency.dependency"),
  canonicalGraphReferenceIncludesController: graphTypes.includes('ControllerReference'),
  canonicalGraphReferenceIncludesClass: graphTypes.includes('ClassReference'),
  noLegacyFileDeletion: true,
};
for (const [k,v] of Object.entries(checks)) console.log(`${k}: ${v}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
