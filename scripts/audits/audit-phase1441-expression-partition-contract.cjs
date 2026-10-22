const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['conditional judgment returns source partitions', /export type ConditionalExpressionResolution<Token> =\s*\| Readonly<\{ readonly kind: 'resolved'; readonly condition: readonly Token\[\]; readonly consequent: readonly Token\[\]; readonly alternative: readonly Token\[\]/.test(read('packages/core/src/types/upstream/scannerExpressionFormAlgebra.ts'))],
  ['conditional candidate input uses closed occurrence judgment', /TokenOccurrencesJudgment<Token>/.test(read('packages/core/src/types/upstream/scannerExpressionFormAlgebra.ts'))],
  ['conditional contract has public interface', /interface ScannerExpressionFormInterface/.test(read('packages/core/src/types/upstream/scannerExpressionFormAlgebra.ts'))],
  ['root operator judgment returns partitions, not index', /readonly before: readonly Token\[\].*readonly after: readonly Token\[\]/s.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts')) && !/kind: 'resolved'[^\n]*readonly index: number/.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts'))],
  ['operator candidates use occurrence judgments', /TokenOccurrencesJudgment<Token>/.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts'))],
  ['operator public interface is the algebra implementation authority', /interface ScannerExpressionOperatorInterface/.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts')) && /scannerExpressionOperatorAlgebra: ScannerExpressionOperatorAlgebra = scannerExpressionOperatorInterface/.test(read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts'))],
  ['PHP operator adapter uses token-structure interface', /scannerTokenStructureInterface\.locateTopLevelCandidates/.test(read('packages/core/src/compiler/scanner/lexer/phpExpressionOperatorContract.ts'))],
  ['PHP operator adapter passes token vocabulary explicitly', /tokenValue: token => token\.value/.test(read('packages/core/src/compiler/scanner/lexer/phpExpressionOperatorContract.ts'))],
  ['ternary provider uses token-structure interface', /scannerTokenStructureInterface\.locateTopLevelCandidates/.test(read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts'))],
  ['ternary provider consumes semantic partitions', /condition: conditional\.condition/.test(read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts')) && /consequent: conditional\.consequent/.test(read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts'))],
  ['runtime array access consumes delimiter evidence', /const judgment = findOuterArrayAccessEvidence\(tokens\)/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'))],
  ['runtime operator evidence helper delegates to interface without exposing offsets', /function findTopLevelOperatorEvidence[\s\S]*scannerTokenStructureInterface\.locateTopLevel/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts')) && !/function findTopLevelOperator\(/.test(read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'))],
  ['upstream index exports expression contracts', /export \* from '\.\/scannerExpressionFormAlgebra'/.test(read('packages/core/src/types/upstream/index.ts')) && /export \* from '\.\/scannerExpressionOperatorAlgebra'/.test(read('packages/core/src/types/upstream/index.ts'))],
];
let failed = 0;
for (const [name, ok] of checks) { process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`); if (!ok) failed += 1; }
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
