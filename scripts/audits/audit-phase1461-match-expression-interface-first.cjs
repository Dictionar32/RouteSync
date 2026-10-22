const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/scannerMatchExpressionInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const docPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE1461_MATCH_EXPRESSION_INTERFACE_FIRST.md');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');
const checks = [
  ['interface declares closed judgments', /ScannerMatchExpressionJudgment/.test(contract) && /SCANNER_MATCH_RESOLVED/.test(contract) && /SCANNER_MATCH_MALFORMED/.test(contract)],
  ['semantic tags use unique symbols', /SCANNER_MATCH_ARM_CONDITIONAL: unique symbol/.test(contract) && /SCANNER_MATCH_ARM_DEFAULT: unique symbol/.test(contract)],
  ['evidence retains source partitions', /readonly subject: readonly Token\[\]/.test(contract) && /readonly conditions: readonly \(readonly Token\[\]\)\[\]/.test(contract) && /readonly remaining: readonly Token\[\]/.test(contract)],
  ['interface exported from upstream barrel', /export \* from '\.\/scannerMatchExpressionInterface'/.test(barrel)],
  ['phase explicitly defers wiring', /does not wire the new contract/i.test(doc) && /wiring is explicitly deferred/i.test(doc)],
  ['no AST factory or runtime implementation in interface', !/PhpAstFactory|classifyAstTokens|function splitTopLevel/.test(contract)],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, pass]) => !pass).length;
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
