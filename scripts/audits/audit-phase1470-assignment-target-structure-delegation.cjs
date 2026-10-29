const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const interfaceSource = read('packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const structureAlgebra = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const targetInterface = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const targetAlgebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerTokenStructureInterface.phase1440.test.ts');
const checks = [
  ['token structure interface exposes typed partition judgment', /TokenPartitionJudgment/.test(interfaceSource) && /partitionTopLevel/.test(interfaceSource)],
  ['shared algebra owns delimiter-aware partitioning', /partitionTopLevel:[\s\S]*locateTopLevelCandidates/.test(structureAlgebra)],
  ['assignment target query no longer accepts runtime split callback', !/splitTopLevel/.test(targetInterface)],
  ['assignment target algebra delegates partitioning upstream', /scannerTokenStructureInterface\.partitionTopLevel/.test(targetAlgebra)],
  ['runtime assignment target wiring no longer injects splitTopLevel', !/splitTopLevel,\s*locateTopLevel/.test(runtime)],
  ['partition tests cover nested separators and malformed input', /nested commas/.test(tests) && /unbalanced delimiters/.test(tests)],
  ['public upstream API exports partition judgment', /TokenPartitionJudgment/.test(read('packages/core/src/types/upstream/index.ts'))],
];
let failed = 0;
for (const [label, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`); if (!ok) failed += 1; }
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
