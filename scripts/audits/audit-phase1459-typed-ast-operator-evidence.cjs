const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['typed operator identities use unique symbols', read('packages/core/src/types/upstream/scannerAstOperatorEvidenceInterface.ts').includes('unique symbol')],
  ['operator algebra delegates structure evidence upstream', read('packages/core/src/types/upstream/scannerAstOperatorEvidenceAlgebra.ts').includes('scannerTokenStructureInterface.locateTopLevel')],
  ['runtime no longer has the string-based helper', !read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts').includes('findTopLevelOperatorEvidence')],
  ['match and array arrows use typed operator vocabulary', (read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts').match(/SCANNER_AST_OPERATOR\.fatArrow/g) || []).length >= 2],
  ['collection as uses typed operator vocabulary', read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts').includes('SCANNER_AST_OPERATOR.as')],
  ['instanceof candidate uses typed operator vocabulary', read('packages/core/src/types/upstream/scannerAstExpressionCandidateAlgebra.ts').includes('SCANNER_AST_OPERATOR.instanceof')],
  ['upstream barrel exports contract and algebra', read('packages/core/src/types/upstream/index.ts').includes('scannerAstOperatorEvidenceAlgebra')],
];
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
