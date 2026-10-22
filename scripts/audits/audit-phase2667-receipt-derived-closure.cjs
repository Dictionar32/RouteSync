#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['expected inventory counts and accounted receipt counts are computed separately', source.includes('const closureCounts =') && source.includes('expected: preparedInput.inventory.routes.length') && source.includes('accounted: countAccountedOccurrences(')],
  ['receipt coverage is matched by source occurrence identity in each domain', source.includes('routeReceipts.map(receipt => receipt.route.occurrenceKey)') && source.includes('resourceReceipts.map(receipt => receipt.resource.occurrenceKey)') && source.includes('requestReceipts.map(receipt => receipt.request.occurrenceKey)')],
  ['duplicate receipts cannot inflate coverage because accounting uses a Set', source.includes('const accounted = new Set(receiptOccurrenceKeys.filter(key => expected.has(key)))')],
  ['closed judgment rejects incomplete source receipt coverage with a typed producer gap', source.includes('if (!isFullyAccounted)') && source.includes('cannot emit closed judgment: source receipt coverage is incomplete') && source.includes('RequestTypeDerivationSemanticProducerGapError')],
  ['inference constructs each domain receipt ledger once and reuses it for proof and closure', source.includes('const resourceReceipts = makeResourceReceipts(preparedInput)') && source.includes('const requestReceipts = makeRequestReceipts(preparedInput)') && source.includes('makeClosedClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts)')],
  ['audit is registered in package scripts', pkg.scripts?.['audit:phase2667-receipt-derived-closure'] === 'node scripts/audits/audit-phase2667-receipt-derived-closure.cjs'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\nPhase 2667 receipt-derived closure: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural source audit only; runtime, typecheck, and proof-law verification are separate.');
if (failed) process.exitCode = 1;
