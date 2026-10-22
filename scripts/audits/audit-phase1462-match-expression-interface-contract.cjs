const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/scannerMatchExpressionInterface.ts');
const structurePath = path.join(root, 'packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const docPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE1462_MATCH_EXPRESSION_INTERFACE_CONTRACT.md');
const contract = fs.readFileSync(contractPath, 'utf8');
const structure = fs.readFileSync(structurePath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const doc = fs.readFileSync(docPath, 'utf8');
const checks = [
  ['query explicitly depends on canonical token structure interface', /import type \{ ScannerTokenStructureInterface \} from '\.\/scannerTokenStructureInterface'/.test(contract) && /readonly structure: ScannerTokenStructureInterface/.test(contract)],
  ['conditional condition separators preserve source evidence', /readonly conditionSeparators: readonly Token\[\]/.test(contract)],
  ['arm separators preserve optional comma evidence', /readonly armSeparatorAfter\?: Token/.test(contract)],
  ['source malformedness differs from contract violation', /ScannerMatchMalformedReason/.test(contract) && /ScannerMatchContractViolationReason/.test(contract) && /SCANNER_MATCH_INCOMPLETE_RESOLVED_EVIDENCE/.test(contract)],
  ['structural authority exposes top-level and delimiter contracts', /interface ScannerTokenStructureInterface/.test(structure) && /locateTopLevel/.test(structure) && /matchLeadingDelimiter/.test(structure)],
  ['interface remains exported upstream', /export \* from '\.\/scannerMatchExpressionInterface'/.test(barrel)],
  ['phase explicitly defers algebra wiring and AST projection', /does not implement the match algebra/.test(doc) && /No wiring is changed in this phase/.test(doc)],
  ['interface contains no runtime scanner or AST factory', !/PhpAstFactory|classifyAstTokens|function splitTopLevel/.test(contract)],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, pass]) => !pass).length;
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
