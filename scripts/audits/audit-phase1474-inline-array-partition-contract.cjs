const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const structurePath = path.join(root, 'packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__test__/scannerInlineArrayPartition.phase1474.test.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const structure = fs.readFileSync(structurePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['partition operation is declared by upstream interface', /partitionTopLevel/.test(structure)],
  ['partition operation delegates to canonical top-level structure authority', /partitionTopLevel:[\s\S]*?locateTopLevelCandidates/.test(algebra)],
  ['inline array runtime consumes upstream partition judgment', /function classifyInlineArray[\s\S]*?partitionTopLevel/.test(runtime)],
  ['malformed partition fails closed to unsupported AST', /partition\.kind === 'malformed'\) return PhpAstFactory\.unsupported\(tokens\)/.test(runtime)],
  ['runtime-local splitTopLevel reasoning removed', !/function splitTopLevel\(/.test(runtime)],
  ['runtime does not use the old splitTopLevel adapter', !/\bsplitTopLevel\(/.test(runtime)],
  ['tests cover nested delimiter partition and trailing comma', /top-level commas[\s\S]*?trailing empty segment/.test(tests)],
  ['tests cover malformed delimiter evidence', /returns a malformed judgment[\s\S]*?mismatched delimiters/.test(tests)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
