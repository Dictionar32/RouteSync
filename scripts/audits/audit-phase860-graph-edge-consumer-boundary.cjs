const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const rel = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(rel);
  return /\.(ts|tsx)$/.test(entry.name) ? [rel] : [];
});

const serviceGraphType = read('packages/core/src/types/semantic/serviceGraphTypes.ts');
const assembler = read('packages/core/src/graph/service/graphAssembler.ts');
const sink = read('packages/core/src/graph/service/graphEdgeRelationSink.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const semanticAuditor = read('packages/cli/src/commands/audit/semanticAuditor.ts');

const files = [
  ...walk('packages/core/src'),
  ...walk('packages/cli/src'),
];

const edgeReads = files.flatMap(file => {
  if (file === 'packages/core/src/compiler/utils/graph/dependencyGraph.ts') return [];
  const text = read(file);
  return /(?:graph|serviceGraph)\.edges\b/.test(text) ? [file] : [];
});

const checks = {
  serviceGraphEdgesAreReadonly: /readonly edges: readonly ServiceDependency\[\]/.test(serviceGraphType),
  assemblerFreezesEdgeProjection: /edges: Object\.freeze\(\[\.\.\.edges\]\)/.test(assembler),
  sinkReturnsFrozenDependencies: /return Object\.freeze\(this\.getRelations\(\)\.map/.test(sink),
  scanIsExplicitGraphSerializer: /JSON\.stringify\(serviceGraph, null, 2\)/.test(scan),
  semanticAuditorIsExplicitGraphReader: /edges: serialized\.edges/.test(semanticAuditor),
  noDirectServiceGraphEdgeMutation: !files.some(file => {
    const text = read(file);
    return /(?:graph|serviceGraph)\.edges\s*\.(?:push|splice|sort|pop|shift|unshift)\s*\(/.test(text);
  }),
  graphEdgeReadsAreKnownBoundaries: edgeReads.every(file => [
    'packages/cli/src/commands/audit/semanticAuditor.ts',
  ].includes(file)),
};

console.log(`serviceGraphEdgeReadSites: ${JSON.stringify(edgeReads)}`);
for (const [key, value] of Object.entries(checks)) console.log(`${key}: ${value}`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
console.log('allChecksPassed: true');
