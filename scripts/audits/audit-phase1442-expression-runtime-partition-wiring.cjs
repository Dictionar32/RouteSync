const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const checks = [
  ['runtime operator lookup returns occurrence evidence, not numeric offsets', /function findTopLevelOperatorEvidence\([^)]*\): TokenOccurrenceEvidence<TokenDescriptor> \| undefined/.test(runtime)],
  ['runtime lookup is backed by the public token structure interface', /scannerTokenStructureInterface\.locateTopLevel\(/.test(runtime)],
  ['legacy numeric findTopLevelOperator helper removed', !/function findTopLevelOperator\(/.test(runtime)],
  ['inline array key/value split uses before/after partitions', /const keyTokens = arrow\?\.before/.test(runtime) && /const valueTokens = arrow\?\.after/.test(runtime)],
  ['match arms use before/after partitions', /const left = arrow\?\.before/.test(runtime) && /classifyAstTokens\(arrow\?\.after/.test(runtime)],
  ['instanceof uses occurrence partitions', /const occurrence = findTopLevelOperatorEvidence\(tokens, 'instanceof'\)/.test(runtime) && /classifyAstTokens\(occurrence\?\.before/.test(runtime)],
  ['collection iteration uses as occurrence partitions', /const asEvidence = findTopLevelOperatorEvidence\(inner, 'as'\)/.test(runtime) && /classifyAstTokens\(asEvidence\?\.before/.test(runtime) && /const targetTokens = asEvidence\?\.after/.test(runtime)],
  ['legacy numeric adapter and cursor parameters are absent from runtime helper', !/findTopLevelOperator\([^)]*_index/.test(runtime)],
  ['runtime contract regression tests cover four migrated consumers', /keyed array entries/.test(read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionPartitionWiring.phase1442.test.ts')) && /match arms/.test(read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionPartitionWiring.phase1442.test.ts')) && /instanceof/.test(read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionPartitionWiring.phase1442.test.ts')) && /foreach/.test(read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionPartitionWiring.phase1442.test.ts'))],
  ['operator algebra contract remains partition-based', /readonly before: readonly Token\[\].*readonly after: readonly Token\[\]/s.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts')) && !/kind: 'resolved'[^\n]*readonly index: number/.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts'))],
];
let failed = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); if (!ok) failed += 1; }
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
