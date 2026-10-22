#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const tests = read('packages/core/src/compiler/semantic/request-type-derivation/__test__/requestTypeDerivationConflictGroupClosure.phase2673.test.ts');
const pkg = JSON.parse(read('package.json'));
const cli = read('packages/cli/src/commands/scan.ts');
const manifest = JSON.parse(read('examples/ecommerce-shop-source/routesync.temp.manifest.json'));
const checks = [
  ['upstream exports conflict-ledger closure interface', /export interface RequestTypeDerivationConflictLedgerClosureVerificationInterface/.test(upstream)],
  ['implementation is typed by upstream interface', /requestTypeDerivationConflictLedgerClosureVerification: RequestTypeDerivationConflictLedgerClosureVerificationInterface/.test(verifier)],
  ['conflict judgment requires identity ledger closure', /requestTypeDerivationIdentityConflictLedgerMatchesInput\(inference\)/.test(verifier)],
  ['conflict judgment requires source ledger closure before group closure', /requestTypeDerivationConflictLedgerClosureMatchesInput\(inference\)[\s\S]{0,120}requestTypeDerivationConflictGroupsMatchInput\(inference\)/.test(verifier)],
  ['route inventory receipts must be cardinality-complete', /proof\.routeReceipts\.length !== routeRefs\.size/.test(verifier)],
  ['resource inventory receipts must be cardinality-complete', /proof\.resourceReceipts\.length !== resourceRefs\.size/.test(verifier)],
  ['request inventory receipts must be cardinality-complete', /proof\.requestReceipts\.length !== requestRefs\.size/.test(verifier)],
  ['duplicate route receipt occurrences are rejected', /seenRoutes\.has\(key\)/.test(verifier)],
  ['duplicate resource receipt occurrences are rejected', /seenResources\.has\(key\)/.test(verifier)],
  ['duplicate request receipt occurrences are rejected', /seenRequests\.has\(key\)/.test(verifier)],
  ['route receipts bind to source route binding kind', /receipt\.requestBindingKind !== routeAst\.binding\.request\.kind/.test(verifier)],
  ['route receipts bind to request and resource resolution ledgers', /structurallyEqual\(receipt\.requestResolution, requestLedger\[0\]!.resolution\)[\s\S]{0,150}structurallyEqual\(receipt\.resourceResolution, resourceLedger\[0\]!.resolution\)/.test(verifier)],
  ['regression test rejects missing resource receipt', /drops an inventory resource receipt/.test(tests)],
  ['regression test rejects duplicate resource receipt', /duplicates a source resource receipt/.test(tests)],
  ['CLI consumes assembled semantic pipeline without bypass', /composition\.requestTypeDerivationPipeline/.test(cli)],
  ['ecommerce fixture manifest has routes', Array.isArray(manifest.routes) && manifest.routes.length > 0],
  ['audit command is registered', pkg.scripts?.['audit:phase2674-conflict-inventory-closure'] === 'node scripts/audits/audit-phase2674-conflict-inventory-closure.cjs'],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`\nPhase 2674 conflict inventory closure: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural assertions only; Vitest, typecheck, Laravel runtime scan/sync, and all-law verification are not implied.');
if (failed) process.exitCode = 1;
