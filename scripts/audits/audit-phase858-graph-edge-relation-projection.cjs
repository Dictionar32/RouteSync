const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const sink = read('packages/core/src/graph/service/graphEdgeRelationSink.ts');
const relation = read('packages/core/src/graph/service/graphEdgeRelation.ts');
const serviceIndex = read('packages/core/src/graph/service/index.ts');

const directLinkCalls = (compiler.match(/\.linkGraph\s*\(/g) || []).length;
const compilerEdgeRelationReads = (compiler.match(/\bedgeRelations\b/g) || []).length;
const sinkConstructionCount = (builder.match(/new GraphEdgeRelationSink\s*\(/g) || []).length;
const relationProducers = (compiler.match(/createGraphEdgeRelation\s*\(/g) || []).length;

const checks = {
  graphEdgeRelationIsClosed: relation.includes("kind: 'graph_edge_relation'") && relation.includes('GraphEdgeRelationOrigin'),
  graphEdgeRelationHasCanonicalEndpoints: relation.includes('ServiceGraphNodeReference'),
  graphEdgeRelationHasOrigin: relation.includes('readonly origin: GraphEdgeRelationOrigin'),
  compilerUsesRelationProducer: relationProducers >= 4,
  directCompilerGraphMutationCount: directLinkCalls,
  directCompilerGraphMutationRemoved: directLinkCalls === 0,
  sinkOwnsMaterialization: sink.includes('materialize(): readonly ServiceDependency[]') && sink.includes('getRelations()'),
  sinkDeduplicatesEdges: sink.includes('Map<string, GraphEdgeRelation>') && sink.includes('if (!this.relations.has(key))'),
  builderOwnsSingleSink: sinkConstructionCount === 1,
  builderDoesNotExposeLegacyLinkGraph: !builder.includes('linkGraph('),
  graphContextAcceptsRelations: builder.includes('addGraphEdgeRelation') && builder.includes('buildGraph: (): ServiceGraph => owner.getGraph()'),
  compilerDoesNotReadEdgeRelations: compilerEdgeRelationReads === 0,
  compilerFinalizesThroughBuilder: compiler.includes('return builder.buildGraph();'),
  builderFinalizesThroughSink: builder.includes('edgeSink.materialize()') && builder.includes('assembleServiceGraph('),
  relationSinkIsExported: serviceIndex.includes('GraphEdgeRelationSink'),
  relationProducerIsExported: serviceIndex.includes('GraphEdgeRelation'),
};

for (const [key, value] of Object.entries(checks)) console.log(`${key}: ${value}`);
if (!Object.values(checks).every(value => value === true || typeof value === 'number')) process.exit(1);
console.log('allChecksPassed: true');
