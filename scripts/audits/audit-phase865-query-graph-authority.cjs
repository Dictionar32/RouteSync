const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const queryGraph = read('packages/core/src/compiler/query/salsa/queryGraphManager.ts');
const executor = read('packages/core/src/compiler/query/salsa/queryExecutor.ts');
const compiler = read('packages/core/src/compiler/query/SalsaCompiler.ts');
const salsaIndex = read('packages/core/src/compiler/query/salsa/index.ts');
const queryCell = read('packages/core/src/compiler/query/QueryCell.ts');
const queryDatabase = read('packages/core/src/compiler/query/QueryDatabase.ts');
const packageJson = JSON.parse(read('package.json'));

const allSource = [queryGraph, executor, compiler, salsaIndex, queryCell, queryDatabase].join('\n');
const checks = {
  graphOwnsDependencyMutation: /const recordDependency[\s\S]*?setNode\(childId/.test(queryGraph),
  graphOwnsDependencyReset: /const beginEvaluation[\s\S]*?relationRemove\(dependency\.dependents, keyId\)/.test(queryGraph),
  executorUsesAuthorityReset: /graphManager\.beginEvaluation\(keyId\)/.test(executor),
  executorPreservesEvaluatedDependencies: /graphManager\.getNode\(keyId\)[\s\S]*?const evaluated/.test(executor),
  executorRecordsDependencyOnlyThroughManager: !/\.dependencies\s*=|\.dependents\s*=/.test(executor),
  compilerCreatesSingleManager: (compiler.match(/createQueryGraphManager\(\)/g) || []).length === 1,
  queryCellIsEmpty: queryCell.trim() === '',
  noLegacyMemoizedDatabaseSurface: !allSource.includes('MemoizedQueryDatabase'),
  packageScriptPresent: packageJson.scripts?.['audit:phase865-query-graph-authority'] === 'node scripts/audits/audit-phase865-query-graph-authority.cjs',
};
checks.allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
if (!checks.allChecksPassed) process.exit(1);
