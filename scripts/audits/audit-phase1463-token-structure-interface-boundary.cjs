const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const read = file => fs.readFileSync(path.join(upstream, file), 'utf8');
const contract = read('scannerTokenStructureInterface.ts');
const algebra = read('scannerTokenStructureAlgebra.ts');
const match = read('scannerMatchExpressionInterface.ts');
const barrel = read('index.ts');
const checks = [
  ['dedicated structural interface module exists', contract.includes('export interface ScannerTokenStructureInterface')],
  ['contract module contains evidence and judgments', contract.includes('TokenOccurrenceEvidence') && contract.includes('DelimitedTokenJudgment')],
  ['contract module does not import algebra implementation', !/^import\s+.*scannerTokenStructureAlgebra/m.test(contract)],
  ['algebra imports the dedicated interface contract', algebra.includes("from './scannerTokenStructureInterface'")],
  ['algebra retains compatibility type exports', algebra.includes('export type {') && algebra.includes('ScannerTokenStructureInterface')],
  ['match contract depends on dedicated interface', match.includes("from './scannerTokenStructureInterface'") && !match.includes("import('./scannerTokenStructureAlgebra').ScannerTokenStructureInterface")],
  ['upstream barrel exports dedicated contract types', barrel.includes("from './scannerTokenStructureInterface'")],
  ['phase documentation explicitly prohibits early wiring', fs.existsSync(path.join(upstream, 'docs/PHASE1463_TOKEN_STRUCTURE_INTERFACE_BOUNDARY.md')) && fs.readFileSync(path.join(upstream, 'docs/PHASE1463_TOKEN_STRUCTURE_INTERFACE_BOUNDARY.md'), 'utf8').includes('Runtime wiring remains unchanged')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
