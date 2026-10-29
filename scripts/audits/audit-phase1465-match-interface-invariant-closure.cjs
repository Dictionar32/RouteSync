const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const match = fs.readFileSync(path.join(upstream, 'scannerMatchExpressionInterface.ts'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts'), 'utf8');
const docsPath = path.join(upstream, 'docs/PHASE1465_MATCH_INTERFACE_INVARIANT_CLOSURE.md');
const docs = fs.readFileSync(docsPath, 'utf8');
const checks = [
  ['empty match body has a typed malformed reason', match.includes('SCANNER_MATCH_EMPTY_BODY: unique symbol') && match.includes('typeof SCANNER_MATCH_EMPTY_BODY')],
  ['empty condition partition has a typed malformed reason', match.includes('SCANNER_MATCH_EMPTY_CONDITION: unique symbol') && match.includes('typeof SCANNER_MATCH_EMPTY_CONDITION')],
  ['multiple top-level fat arrows have a typed malformed reason', match.includes('SCANNER_MATCH_MULTIPLE_FAT_ARROWS: unique symbol') && match.includes('typeof SCANNER_MATCH_MULTIPLE_FAT_ARROWS')],
  ['resolved body must contain at least one arm', match.includes('A resolved body has at least one arm')],
  ['condition separator cardinality is specified', docs.includes('exactly one less than the number of conditions')],
  ['every arm must have one fat arrow and non-empty value', match.includes('every arm has exactly one') && match.includes('non-empty value')],
  ['source reconstruction uses token identity', match.includes('sameToken') && match.includes('reconstruct `body`') && docs.includes('by token identity') && docs.includes('reconstructs the original body exactly')],
  ['malformed source and contract violation remain distinct', match.includes('Source malformedness is not a contract') && docs.includes('remains distinct from a contract violation')],
  ['runtime wiring remains unchanged in interface-only phase', !runtime.includes('scannerMatchExpressionAlgebra') && !runtime.includes('ScannerMatchExpressionInterface')],
  ['phase documentation exists and defers wiring', docs.includes('Runtime wiring remains blocked until')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
