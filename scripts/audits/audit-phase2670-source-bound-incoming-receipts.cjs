#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const algebra = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationGroupContributionAlgebra.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const routes = read('examples/ecommerce-shop-source/routes/api.php');
const manifest = JSON.parse(read('examples/ecommerce-shop-source/routesync.temp.manifest.json'));
const pkg = JSON.parse(read('package.json'));
const receiptStart = contract.indexOf('export interface RequestTypeGroupContributionReceipt');
const receiptEnd = contract.indexOf('/** Input to the canonical immutable', receiptStart);
const receipt = contract.slice(receiptStart, receiptEnd);
const checks = [
  ['upstream receipt carries full RequestType incoming identity and provenance', /readonly incoming: RequestType/.test(receipt) && /Full incoming semantic value/.test(receipt)],
  ['group-fold producer preserves the full incoming value instead of projecting actions/response', /incoming,\s*after,/.test(algebra) && !/incoming: Object\.freeze\(\{ actions: incoming\.actions/.test(algebra)],
  ['replay computes initial after-state from incoming rather than trusting forged after identity/source', /\.\.\.receipt\.incoming, actions, response/.test(verifier)],
  ['verifier resolves route occurrence against the original input inventory', /canonicalRouteOccurrenceKey\(candidate\.provenance\) === receipt\.route\.occurrenceKey/.test(verifier)],
  ['verifier resolves request occurrence against original RequestAst and checks source span', /canonicalRequestOccurrenceKey\(candidate\.source\) === receipt\.request\.occurrenceKey/.test(verifier) && /requestAst\.source, requestReference\.location\.span/.test(verifier)],
  ['incoming identity and source are correlated with route binding and RequestAst', /receipt\.incoming\.identity, routeAst\.binding\.request\.identity/.test(verifier) && /receipt\.incoming\.source, requestAst\.source/.test(verifier)],
  ['successful replay remains gated on source-input correlation', /requestTypeDerivationGroupReceiptsReplay\(proof\.groupReceipts, judgment\.groups\)[\s\S]{0,180}requestTypeDerivationIncomingSourceMatchesInput\(proof\.groupReceipts, inference\.preparedInput\)/.test(verifier)],
  ['ecommerce Laravel fixture contains real API route declarations', /Route::post\('\/register'/.test(routes) && /Route::get\('\/produk\/{id}'/.test(routes)],
  ['ecommerce fixture manifest is parseable and has route inventory', Array.isArray(manifest.routes) && manifest.routes.length > 0],
  ['audit is registered as an npm script', pkg.scripts?.['audit:phase2670-source-bound-incoming-receipts'] === 'node scripts/audits/audit-phase2670-source-bound-incoming-receipts.cjs'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\nPhase 2670 source-bound incoming receipts: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural assertions only; not a TypeScript build, runtime verifier test, Laravel scan, or proof of all 34 laws.');
if (failed) process.exitCode = 1;
