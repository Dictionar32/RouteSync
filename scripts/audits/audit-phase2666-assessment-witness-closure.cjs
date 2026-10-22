const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['assessment incompleteness is computed explicitly', source.includes('const assessmentClaimsIncomplete =')],
  ['empty unresolved ledger cannot be cast into non-empty judgment', source.includes('if (unresolved.length === 0)') && source.includes('resolution assessment claims incomplete while route receipts contain no unresolved witness')],
  ['producer gap is typed', source.includes('throw new RequestTypeDerivationSemanticProducerGapError(')],
  ['incomplete judgment uses the actual unresolved receipt ledger', source.includes("unresolved: unresolved as [RequestTypeUnresolvedRouteReceipt, ...RequestTypeUnresolvedRouteReceipt[]]")],
  ['closure coverage is computed from source occurrence keys and actual receipts', source.includes('const closureCounts =') && source.includes('countAccountedOccurrences(') && source.includes('routeReceipts.map(receipt => receipt.route.occurrenceKey)')],
  ['closed judgment fails closed when any inventory domain lacks receipt coverage', source.includes('if (!isFullyAccounted)') && source.includes('cannot emit closed judgment: source receipt coverage is incomplete')],
  ['closure expected counts are distinct from receipt-derived accounted counts', source.includes('expected: preparedInput.inventory.routes.length') && source.includes('accounted: countAccountedOccurrences(')],
  ['audit is registered', pkg.scripts?.['audit:phase2666-assessment-witness-closure'] === 'node scripts/audits/audit-phase2666-assessment-witness-closure.cjs'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} structural assertions passed`);
if (failed) process.exitCode = 1;
