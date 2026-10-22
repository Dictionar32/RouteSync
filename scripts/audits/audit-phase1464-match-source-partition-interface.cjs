const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const read = file => fs.readFileSync(path.join(upstream, file), 'utf8');
const match = read('scannerMatchExpressionInterface.ts');
const tokenStructure = read('scannerTokenStructureInterface.ts');
const barrel = read('index.ts');
const runtime = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts'), 'utf8');
const checks = [
  ['complete match body source is preserved', match.includes('readonly body: readonly Token[]')],
  ['interstitial subject-to-body evidence is preserved', match.includes('readonly betweenSubjectAndBody: readonly Token[]')],
  ['token identity comparator is explicit', match.includes('readonly sameToken: (left: Token, right: Token) => boolean')],
  ['fat-arrow evidence has a grammar-specific name', match.includes('readonly fatArrow: Token') && !match.includes('readonly separator: Token')],
  ['partition reconstruction invariants are documented', match.includes('reconstruct the') && match.includes('sameToken')],
  ['structural authority remains interface-only', match.includes("from './scannerTokenStructureInterface'") && tokenStructure.includes('export interface ScannerTokenStructureInterface')],
  ['match interface remains exported', barrel.includes("export * from './scannerMatchExpressionInterface'")],
  ['runtime source is unchanged in this interface phase', !runtime.includes('ScannerMatchExpressionInterface') && !runtime.includes('scannerMatchExpressionAlgebra')],
  ['phase documentation forbids premature wiring', fs.existsSync(path.join(upstream, 'docs/PHASE1464_MATCH_SOURCE_PARTITION_INTERFACE.md')) && fs.readFileSync(path.join(upstream, 'docs/PHASE1464_MATCH_SOURCE_PARTITION_INTERFACE.md'), 'utf8').includes('Do not migrate runtime wiring until those tests pass')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
