const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const isEmptyFile = (p) => exists(p) && fs.statSync(path.join(root, p)).size === 0;
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) walk(rel);
    else if (entry.isFile() && /\.(ts|tsx|js|cjs)$/.test(entry.name)) sourceFiles.push(rel);
  }
}
walk('packages');
walk('scripts');
const activeRefs = sourceFiles.filter(f => {
  const t = read(f);
  return !f.includes('audit-phase861') && !f.endsWith('CompilationResult.ts') && !f.endsWith('compiler/index.ts') && !f.endsWith('compiler/utils/index.ts') && !f.endsWith('artifacts/index.ts') && !f.endsWith('artifacts/types.ts') && /\bcreateDependencyGraph\b|\bstronglyConnectedComponents\b|\bdependencyClosure\b|\bDependencyGraphArtifact\b/.test(t);
});
const removed = [
  'packages/core/src/compiler/utils/Graph.ts',
  'packages/core/src/compiler/utils/graph/dependencyGraph.ts',
  'packages/core/src/compiler/utils/graph/graphAlgorithms.ts',
  'packages/core/src/compiler/utils/graph/index.ts',
  'packages/core/src/compiler/artifacts/DependencyGraphArtifact.ts'
];
const result = {
  legacyGraphFilesEmptied: removed.every(isEmptyFile),
  compilationResultNoLegacyDependencyGraph: !/dependencyGraph|DependencyGraph/.test(read('packages/core/src/compiler/result/CompilationResult.ts')),
  artifactRegistryNoLegacyDependencyGraph: !/DependencyGraph/.test(read('packages/core/src/compiler/artifacts/types.ts')),
  publicCompilerIndexNoLegacyDependencyGraph: !/\bcreateDependencyGraph\b|\bstronglyConnectedComponents\b|\bdependencyClosure\b|\bDependencyGraphArtifact\b/.test(read('packages/core/src/compiler/index.ts')),
  activeLegacyReferences: activeRefs,
};
result.noActiveLegacyReferences = result.activeLegacyReferences.length === 0;
result.allChecksPassed = result.legacyGraphFilesEmptied && result.compilationResultNoLegacyDependencyGraph && result.artifactRegistryNoLegacyDependencyGraph && result.publicCompilerIndexNoLegacyDependencyGraph && result.noActiveLegacyReferences;
console.log(JSON.stringify(result, null, 2));
if (!result.allChecksPassed) process.exit(1);
