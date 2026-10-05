const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const sdk = path.join(root, 'packages/sdk');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function size(file) { return fs.statSync(file).size; }
function count(source, re) { return (source.match(re) || []).length; }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }

const files = {
  analysisManager: path.join(core, 'compiler/analysis/AnalysisManager.ts'),
  analysisGraph: path.join(core, 'compiler/analysis/manager/dependencyGraph.ts'),
  salsaCompiler: path.join(core, 'compiler/query/SalsaCompiler.ts'),
  queryExecutor: path.join(core, 'compiler/query/salsa/queryExecutor.ts'),
  queryGraph: path.join(core, 'compiler/query/salsa/queryGraphManager.ts'),
  memoDb: path.join(core, 'compiler/query/database/memoizedDatabase.ts'),
  queryCell: path.join(core, 'compiler/query/QueryCell.ts'),
};

const src = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, read(f)]));
const memoizedLegacyVacuumed = fs.existsSync(files.memoDb) && fs.existsSync(files.queryCell) && size(files.memoDb) === 0 && size(files.queryCell) === 0;

// Production source excludes tests and prose. This audit intentionally treats
// exports as API surface, not as proof of a production execution path.
const productionFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === 'tests') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) productionFiles.push(full);
  }
}
walk(core);
walk(path.join(root, 'packages/cli/src'));

const usages = (pattern) => productionFiles.flatMap(file => {
  const text = read(file);
  const matches = [...text.matchAll(pattern)];
  return matches.map(m => path.relative(root, file));
});

const analysisExternalConstructors = usages(/\bnew\s+AnalysisManager\s*\(/g);
const analysisExternalRegisters = usages(/\bregisterDependency\s*\(/g).filter(f => f !== 'packages/core/src/compiler/analysis/AnalysisManager.ts');
const analysisExternalCollect = usages(/\bcollectDependents\s*\(/g).filter(f => f !== 'packages/core/src/compiler/analysis/AnalysisManager.ts');
const analysisExternalInvalidate = usages(/\bcache\.delete\s*\(/g).filter(f => f !== 'packages/core/src/compiler/analysis/AnalysisManager.ts');

const salsaConstructors = usages(/\bcreateSalsaCompiler\s*\(/g).filter(f => f !== 'packages/core/src/compiler/query/SalsaCompiler.ts');
const salsaExecutorGraph = count(src.queryExecutor, /graphManager\.(recordDependency|invalidateDependents)\s*\(/g);
const salsaCompilerCreatesGraph = count(src.salsaCompiler, /createQueryGraphManager\s*\(/g);

const memoExternalConstructors = usages(/\b(?:new\s+MemoizedQueryDatabase|createMemoizedQueryDatabase)\s*\(/g).filter(f => f !== 'packages/core/src/compiler/query/database/memoizedDatabase.ts');
const memoCellDependency = count(src.memoDb, /addDependency\s*\(/g);
const queryCellImportedByMemo = count(src.memoDb, /from ['"]\.\.\/QueryCell['"]/g) === 1;

const result = {
  analysis: {
    productionConstructorsOutsideOwner: analysisExternalConstructors,
    productionRegisterDependencyOutsideOwner: analysisExternalRegisters,
    productionCollectDependentsOutsideOwner: analysisExternalCollect,
    productionInvalidateOutsideOwner: analysisExternalInvalidate,
    ownerHasGraph: /const graph:\s*AnalysisDependencyGraph<R>\s*=\s*createAnalysisDependencyGraph<R>\(\);/.test(src.analysisManager),
    ownerHasClosure: count(src.analysisManager, /collectDependents\s*\(/g) >= 1,
    ownerHasInvalidation: count(src.analysisManager, /cache\.delete\(/g) >= 1,
  },
  salsa: {
    productionCreateSalsaCompilerOutsideOwner: salsaConstructors,
    compilerCreatesSingleQueryGraphManager: salsaCompilerCreatesGraph === 1,
    executorRecordsAndInvalidatesDependencies: salsaExecutorGraph >= 2,
  },
  memoizedQueryDatabase: {
    productionConstructorsOutsideOwner: memoExternalConstructors,
    ownsQueryCellDependencyTracking: memoCellDependency >= 1 && queryCellImportedByMemo,
    legacySurfaceVacuumed: memoizedLegacyVacuumed,
  },
  filePresence: Object.fromEntries(Object.entries(files).map(([k, f]) => [k, fs.existsSync(f)])),
};

result.decision = {
  analysisIsFrameworkSurface: result.analysis.productionConstructorsOutsideOwner.length === 0 && result.analysis.productionRegisterDependencyOutsideOwner.length === 0,
  salsaHasInternalExecutionPath: result.salsa.compilerCreatesSingleQueryGraphManager && result.salsa.executorRecordsAndInvalidatesDependencies,
  memoizedDatabaseHasNoProductionConstructionPath: result.memoizedQueryDatabase.productionConstructorsOutsideOwner.length === 0,
  noFileDeletionRequired: Object.values(result.filePresence).every(Boolean),
};

result.allChecksPassed =
  result.analysis.ownerHasGraph &&
  result.analysis.ownerHasClosure &&
  result.analysis.ownerHasInvalidation &&
  result.salsa.compilerCreatesSingleQueryGraphManager &&
  result.salsa.executorRecordsAndInvalidatesDependencies &&
  (result.memoizedQueryDatabase.ownsQueryCellDependencyTracking || result.memoizedQueryDatabase.legacySurfaceVacuumed) &&
  result.decision.noFileDeletionRequired;

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allChecksPassed ? 0 : 1;
