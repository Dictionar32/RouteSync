const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const sink = read('packages/core/src/graph/service/graphEdgeRelationSink.ts');
const assembler = read('packages/core/src/graph/service/graphAssembler.ts');

const checks = {
  compilerDoesNotReadRawEdgeRelations: !/\bedgeRelations\b/.test(compiler),
  compilerDoesNotAssembleGraph: !/assembleServiceGraph\s*\(/.test(compiler),
  compilerFinalizesThroughBuilder: /return builder\.buildGraph\(\);/.test(compiler),
  builderOwnsSingleSink: (builder.match(/new GraphEdgeRelationSink\s*\(/g) || []).length === 1,
  builderMaterializesThroughSink: /edgeSink\.materialize\(\)/.test(builder),
  builderOwnsAssembly: /assembleServiceGraph\(this\.modelsMap, this\.servicesMap, this\.controllersIndex, this\.edgeSink\.materialize\(\)\)/.test(builder),
  sinkProjectsToServiceDependency: /materialize\(\): readonly ServiceDependency\[\]/.test(sink),
  assemblerAcceptsOnlyProjectedEdges: /edges: readonly ServiceDependency\[\]/.test(assembler),
};

for (const [key, value] of Object.entries(checks)) console.log(`${key}: ${value}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
