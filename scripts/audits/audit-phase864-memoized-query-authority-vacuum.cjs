const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const sdkTest = path.join(root, 'packages/sdk/tests/compiler.spec.ts');

const rel = p => path.relative(root, p);
const read = p => fs.readFileSync(p, 'utf8');
const size = p => fs.statSync(p).size;
const files = {
  queryCell: path.join(core, 'compiler/query/QueryCell.ts'),
  memoDb: path.join(core, 'compiler/query/database/memoizedDatabase.ts'),
  databaseIndex: path.join(core, 'compiler/query/database/index.ts'),
  queryDatabase: path.join(core, 'compiler/query/QueryDatabase.ts'),
  queryIndex: path.join(core, 'compiler/query/index.ts'),
  compilerIndex: path.join(core, 'compiler/index.ts'),
};

const sources = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '__tests__', 'tests'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const productionFiles = [...walk(core), ...walk(path.join(root, 'packages/cli/src'))];
const productionText = productionFiles.map(read).join('\n');
const sdkText = read(sdkTest);

const result = {
  legacyFilesPreserved: [files.queryCell, files.memoDb].every(fs.existsSync),
  legacyFilesEmpty: size(files.queryCell) === 0 && size(files.memoDb) === 0,
  databaseIndexNoLegacyExport: !/MemoizedQueryDatabase|createMemoizedQueryDatabase/.test(sources.databaseIndex),
  queryDatabaseNoLegacyImportExport: !/MemoizedQueryDatabase|createMemoizedQueryDatabase/.test(sources.queryDatabase),
  queryIndexNoLegacySurface: !/MemoizedQueryDatabase|createMemoizedQueryDatabase|QueryCell|createPendingCell|createReadyCell|isReady|isPending/.test(sources.queryIndex),
  compilerIndexNoLegacySurface: !/MemoizedQueryDatabase|createMemoizedQueryDatabase|QueryCell|createPendingCell|createReadyCell|isReady|isPending/.test(sources.compilerIndex),
  noProductionLegacyConstruction: !/\b(?:new\s+MemoizedQueryDatabase|createMemoizedQueryDatabase)\s*\(/.test(productionText),
  noProductionLegacyCellImports: !/from ['"][^'\"]*QueryCell['"]/.test(productionText),
  sdkLegacyTestRemoved: !/MemoizedQueryDatabase|createMemoizedQueryDatabase|QueryCell/.test(sdkText),
  salsaAuthorityStillPresent: /createQueryGraphManager\s*\(/.test(read(path.join(core, 'compiler/query/SalsaCompiler.ts'))) && /recordDependency\s*\(/.test(read(path.join(core, 'compiler/query/salsa/queryExecutor.ts'))) && /invalidateDependents\s*\(/.test(read(path.join(core, 'compiler/query/salsa/queryExecutor.ts'))),
};

result.allChecksPassed = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allChecksPassed ? 0 : 1;
