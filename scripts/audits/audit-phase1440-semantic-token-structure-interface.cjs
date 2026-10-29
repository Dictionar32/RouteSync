const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const provider = read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerTokenStructureInterface.phase1440.test.ts');
const checks = [
  ['consumer-facing token structure interface is declared', /interface ScannerTokenStructureInterface/.test(contract)],
  ['public occurrence evidence carries partitions instead of numeric cursor', /TokenOccurrenceEvidence<Token>[\s\S]*before: readonly Token\[\][\s\S]*token: Token[\s\S]*after: readonly Token\[\]/.test(contract) && !/TokenOccurrenceEvidence<Token>[\s\S]{0,400}index: number/.test(contract)],
  ['delimiter evidence is expressed as source token partitions', /DelimitedTokenEvidence<Token>[\s\S]*opening: Token[\s\S]*contents: readonly Token\[\][\s\S]*closing: Token/.test(contract)],
  ['interface implementation is wired through upstream structure algebra', /scannerTokenStructureInterface: ScannerTokenStructureInterface/.test(contract)],
  ['short ternary consumes occurrence partitions', /scannerTokenStructureInterface\.locateTopLevel[\s\S]*condition: operator\.occurrence\.before[\s\S]*fallback: operator\.occurrence\.after/.test(provider)],
  ['array-access candidate consumes delimiter partitions', /case 'matched':[\s\S]*base: evidence\.evidence\.prefix[\s\S]*index: evidence\.evidence\.contents/.test(provider)],
  ['call candidate consumes delimiter contents, not close index', /matchingClose\(relationSlice\(tokens, 1\)\)[\s\S]*arguments: close\.evidence\.contents/.test(provider)],
  ['runtime wires expression provider through token structure interface', /scannerTokenStructureInterface\.matchTrailingDelimiter/.test(runtime) && /scannerTokenStructureInterface\.matchLeadingDelimiter/.test(runtime)],
  ['contract regression covers occurrence and delimiter partitions', /returns top-level operator partitions rather than a cursor/.test(tests) && /preserves malformed delimiter evidence without exposing a numeric cursor/.test(tests)],
  ['public upstream barrel exports the interface', /scannerTokenStructureInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
if (failures > 0) process.exitCode = 1;
