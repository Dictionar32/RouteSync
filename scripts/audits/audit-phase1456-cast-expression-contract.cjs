const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const interfaceSource = read('packages/core/src/types/upstream/scannerCastExpressionInterface.ts');
const algebraSource = read('packages/core/src/types/upstream/scannerCastExpressionAlgebra.ts');
const runtimeSource = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const barrelSource = read('packages/core/src/types/upstream/index.ts');
const docsSource = read('packages/core/src/types/upstream/docs/PHASE1456_CAST_EXPRESSION_CONTRACT.md');

check('interface defines closed resolved/not_applicable/malformed judgment',
  interfaceSource.includes("kind: 'resolved'") && interfaceSource.includes("kind: 'not_applicable'") && interfaceSource.includes("kind: 'malformed'"));
check('interface retains source token evidence and operand partition',
  interfaceSource.includes('readonly opening: Token') && interfaceSource.includes('readonly typeToken: Token') && interfaceSource.includes('readonly closing: Token') && interfaceSource.includes('readonly operand: readonly Token[]'));
check('interface does not depend on AST construction',
  !interfaceSource.includes('PhpAstFactory') && !interfaceSource.includes('classifyAstTokens'));
check('algebra implements canonical interface',
  algebraSource.includes('ScannerCastExpressionInterface') && algebraSource.includes('scannerCastExpressionContractAlgebra'));
check('algebra owns the closed cast-type vocabulary',
  ['int', 'float', 'string', 'bool', 'array', 'object'].every(value => algebraSource.includes(`'${value}'`)));
check('algebra returns operand partition without classifying it',
  algebraSource.includes('operand,') && !algebraSource.includes('classifyAstTokens') && !algebraSource.includes('PhpAstFactory'));
check('algebra reports missing closing delimiter', algebraSource.includes("reason: 'missing_closing_delimiter'"));
check('algebra reports missing operand', algebraSource.includes("reason: 'missing_operand'"));
check('runtime delegates cast recognition to the canonical algebra',
  runtimeSource.includes('scannerCastExpressionContractAlgebra.resolve('));
check('runtime only classifies operand after a resolved judgment',
  runtimeSource.indexOf('case \'resolved\':') < runtimeSource.indexOf('const operand = classifyAstTokens(judgment.evidence.operand)'));
check('runtime no longer eagerly constructs cast candidates with recursive operand classification',
  !runtimeSource.includes("{ id: 'int', value: PhpAstFactory.castExpression") && !runtimeSource.includes('solveCandidate(candidates)'));
check('upstream barrel exports interface and contract algebra',
  barrelSource.includes("export * from './scannerCastExpressionInterface'") && barrelSource.includes("export { scannerCastExpressionContractAlgebra } from './scannerCastExpressionAlgebra'"));
check('phase documentation records verification boundary', docsSource.includes('Maximum call stack size exceeded') && docsSource.includes('downstream'));
check('no any was introduced in new interface or algebra',
  !/\bany\b/.test(interfaceSource) && !/\bany\b/.test(algebraSource));

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${checks.filter(result => result.passed).length}/${checks.length} checks passed`);
if (checks.some(result => !result.passed)) process.exitCode = 1;
