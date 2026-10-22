#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['proof producer exists and is the sole proof assembly point', source.includes('const makeProof =') && source.includes("kind: 'request_type_derivation_proof'")],
  ['proof preserves upstream policy and required-law contract without claiming verification', source.includes('policy: requestTypeDerivationContract.policy') && source.includes('requiredLaws: requestTypeDerivationContract.laws')],
  ['proof source evidence is projected from canonical inventory domains', source.includes('routes: preparedInput.inventory.routes') && source.includes('resources: preparedInput.inventory.resources') && source.includes('requests: preparedInput.inventory.requests')],
  ['conflict judgment retains independently derivable group receipts', source.includes('if (conflicts.length > 0)') && source.includes('const groupReceipts = makeGroupReceipts(preparedInput, routeReceipts);') && source.includes('kind: \'conflict\',\n        groups,')],
  ['incomplete judgment retains independently derivable group receipts', source.includes('const assessmentClaimsIncomplete =') && source.includes('kind: \'incomplete\',\n        groups,')],
  ['partial outcomes keep their conflict or incomplete closure rather than being upgraded to closed', source.includes('makeClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts, unresolved.length, conflicts.length)') && source.includes('makeClosure(preparedInput, routeReceipts, resourceReceipts, requestReceipts, unresolved.length, 0)')],
  ['proof relations are generated from the same group receipts that are published', source.includes('relations: makeRelations(routeReceipts, resourceReceipts, requestReceipts, conflicts, groupReceipts)')],
  ['audit is registered in package scripts', pkg.scripts?.['audit:phase2668-mixed-outcome-contribution-ledger'] === 'node scripts/audits/audit-phase2668-mixed-outcome-contribution-ledger.cjs'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\nPhase 2668 mixed-outcome contribution ledger: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: source-structure assertions only; typecheck, runtime behavior, and all 34 proof laws require separate verification.');
if (failed) process.exitCode = 1;
