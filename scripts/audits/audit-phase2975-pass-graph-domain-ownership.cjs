const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const files = {
  analyzer: 'packages/core/src/compiler/passes/graph/graphAnalyzer.ts',
  sorter: 'packages/core/src/compiler/passes/graph/topologicalSorter.ts',
  entry: 'packages/core/src/compiler/passes/graph/index.ts',
  facade: 'packages/core/src/compiler/passes/PassGraph.ts',
  tests: 'packages/core/src/compiler/passes/__tests__/PassEngineInvariant.test.ts',
  collections: 'packages/core/src/types/upstream/collections.ts',
};
const contents = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = [
  ['graph analyzer no longer imports deleted relation foundation', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(contents.analyzer)],
  ['topological sorter no longer imports deleted relation foundation', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(contents.sorter)],
  ['graph analysis is represented by a domain interface with follow-up operations', /interface PassGraphAnalysisInterface/.test(contents.analyzer) && /producerOf/.test(contents.analyzer) && /containsRemainingProducer/.test(contents.analyzer) && /dependentsOf/.test(contents.analyzer)],
  ['analysis operations are an explicitly typed frozen runtime object', /export const passGraphAnalysisOperations:\s*PassGraphAnalysisOperationsInterface\s*=\s*Object\.freeze/.test(contents.analyzer)],
  ['ordering operations are an explicitly typed frozen runtime object', /export const passGraphOrderingOperations:\s*PassGraphOrderingOperationsInterface\s*=\s*Object\.freeze/.test(contents.sorter)],
  ['graph runtime files do not export free function declarations', !/export\s+function\s+/.test(contents.analyzer + contents.sorter)],
  ['graph runtime files do not expose inferred arrow exports', !/export const [A-Za-z0-9_]+\s*=\s*\(/.test(contents.analyzer + contents.sorter)],
  ['PassGraph facade delegates to domain operation objects', /passGraphAnalysisOperations\.buildAdjacency/.test(contents.facade) && /passGraphOrderingOperations\.resolveTopologicalOrder/.test(contents.facade) && /passGraphOrderingOperations\.resolveParallelLayers/.test(contents.facade)],
  ['domain public entry exports interfaces and operation objects', /passGraphAnalysisOperations/.test(contents.entry) && /passGraphOrderingOperations/.test(contents.entry)],
  ['regression test checks graph domain continuation operations', /analysis\.producerOf/.test(contents.tests) && /analysis\.containsRemainingProducer/.test(contents.tests) && /analysis\.dependentsOf/.test(contents.tests)],
  ['regression test preserves external-input evidence vs missing-provider blocker', /external source evidence/.test(contents.tests) && /Missing provider/.test(contents.tests)],
  ['upstream collections remains empty', contents.collections.trim().length === 0],
  ['deleted relation foundation modules remain absent', ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].every((file) => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', file)))],
];

let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failures += 1;
}
const relationImports = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const source = fs.readFileSync(full, 'utf8');
      const matches = source.match(/from\s+['"][^'"]*semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)['"]/g) || [];
      for (const match of matches) relationImports.push({ file: path.relative(root, full), import: match });
    }
  }
};
walk(path.join(root, 'packages'));
const report = {
  phase: 2975,
  audit: 'pass-graph-domain-ownership',
  passed: checks.length - failures,
  total: checks.length,
  remainingDirectSemanticRelationImports: relationImports.length,
  remainingFilesWithDirectSemanticRelationImports: new Set(relationImports.map((entry) => entry.file)).size,
  migratedDomain: 'compiler pass graph analysis, producer ownership, adjacency, dependency validation, and topological ordering',
  remainingImportsSample: relationImports.slice(0, 20),
  fullBuildVerified: false,
  note: 'This is a bounded domain migration. Other consumers of the deleted relation foundation remain unresolved and must be migrated by their own domain ownership.',
};
fs.writeFileSync(path.join(root, 'PHASE2975_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`\nPHASE2975 pass graph domain audit: ${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write(`Remaining direct relation imports: ${report.remainingDirectSemanticRelationImports} across ${report.remainingFilesWithDirectSemanticRelationImports} files.\n`);
if (failures) process.exitCode = 1;
