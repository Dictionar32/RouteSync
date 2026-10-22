const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['switch interface defines closed judgments', /ScannerSwitchStatementJudgment/.test(read('packages/core/src/types/upstream/scannerSwitchStatementInterface.ts'))],
  ['switch algebra owns structural resolution', /scannerSwitchStatementContractAlgebra/.test(read('packages/core/src/types/upstream/scannerSwitchStatementAlgebra.ts'))],
  ['algebra uses shared token structure interface', /query\.structure\.matchLeadingDelimiter/.test(read('packages/core/src/types/upstream/scannerSwitchStatementAlgebra.ts')) && /locateTopLevelCandidates/.test(read('packages/core/src/types/upstream/scannerSwitchStatementAlgebra.ts'))],
  ['runtime delegates switch reasoning to algebra', /scannerSwitchStatementContractAlgebra\.resolve/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'))],
  ['runtime no longer owns recursive parseSwitchCases', !/function parseSwitchCases\(/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'))],
  ['runtime only projects case evidence into AST', /item\.labels\.map\(label => classifyAstTokens\(label\)\)/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'))],
  ['public upstream exports switch interface and algebra', /scannerSwitchStatementInterface/.test(read('packages/core/src/types/upstream/index.ts')) && /scannerSwitchStatementAlgebra/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['focused semantic tests cover valid and malformed paths', /duplicate default labels/.test(read('packages/core/src/types/upstream/__test__/scannerSwitchStatementAlgebra.phase1469.test.ts')) && /partitions case labels/.test(read('packages/core/src/types/upstream/__test__/scannerSwitchStatementAlgebra.phase1469.test.ts'))],
];
let failed = 0;
for (const [label, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`); if (!ok) failed += 1; }
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
