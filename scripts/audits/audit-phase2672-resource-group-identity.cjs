#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const api = read('examples/ecommerce-shop-source/routes/api.php');
const web = read('examples/ecommerce-shop-source/routes/web.php');
const manifest = JSON.parse(read('examples/ecommerce-shop-source/routesync.temp.manifest.json'));
const pkg = JSON.parse(read('package.json'));
const tests = read('packages/core/src/compiler/semantic/request-type-derivation/__test__/requestTypeDerivationGroupIdentityVerification.phase2672.test.ts');
const checks = [
  ['upstream defines the group identity verifier interface', /export interface RequestTypeDerivationGroupIdentityVerificationInterface/.test(contract)],
  ['verifier implements the interface-first operation', /requestTypeDerivationGroupIdentityVerification: RequestTypeDerivationGroupIdentityVerificationInterface/.test(verifier) && /export const requestTypeDerivationGroupIdentityMatchesInput/.test(verifier)],
  ['group keys are domain-separated as resource keys', /group\.canonicalKey\.startsWith\('resource:'\)/.test(verifier)],
  ['duplicate group keys are rejected', /seenGroupKeys\.has\(group\.canonicalKey\)/.test(verifier)],
  ['duplicate route occurrences across groups are rejected', /seenRoutes\.has\(routeKey\)/.test(verifier)],
  ['request occurrence reuse is validated against each route resolution instead of globally forbidden', /requestResolution\.request\.occurrenceKey !== requestKey/.test(verifier) && !/seenRequests\.has\(requestKey\)/.test(verifier)],
  ['each contribution has exactly one resource resolution receipt', /routeResourceReceipts\.length !== 1/.test(verifier)],
  ['group key must match resolved canonical resource identity', /resolution\.resource\.canonicalIdentity\.semanticKey !== group\.canonicalKey/.test(verifier)],
  ['each contribution has exactly one request resolution receipt', /requestReceipts\.length !== 1/.test(verifier)],
  ['request occurrence must match the resolved request witness', /requestResolution\.request\.occurrenceKey !== requestKey/.test(verifier)],
  ['final verifier gate requires group identity correlation', /requestTypeDerivationIncomingContributionMatchesAst\(proof\.groupReceipts, inference\.preparedInput\)[\s\S]{0,240}requestTypeDerivationGroupIdentityMatchesInput\(proof\.groupReceipts, inference\.preparedInput\)/.test(verifier)],
  ['group fold remains producer-owned and independent verifier does not call it', /requestTypeDerivationGroupContributionAlgebra\.fold/.test(reasoning) && !/requestTypeDerivationGroupContributionAlgebra\.fold/.test(verifier)],
  ['Laravel fixture route sources are available', /Route::/.test(api) && /Route::/.test(web)],
  ['Laravel fixture manifest is parseable and has route entries', Array.isArray(manifest.routes) && manifest.routes.length > 0],
  ['phase 2672 audit is registered in package scripts', pkg.scripts?.['audit:phase2672-resource-group-identity'] === 'node scripts/audits/audit-phase2672-resource-group-identity.cjs'],
  ['runtime test rejects a forged canonical group key', /rejects a forged canonical group key/.test(tests) && /toBe\(false\)/.test(tests)],
  ['runtime test rejects repeated route occurrence across groups', /route occurrence repeated across two groups/.test(tests)],
  ['runtime test rejects missing and duplicate resource evidence', /missing or duplicated resource-resolution evidence/.test(tests)],
  ['runtime test permits legitimate FormRequest reuse across distinct routes', /FormRequest occurrence to be reused by distinct routes/.test(tests)],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\nPhase 2672 resource group identity: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural assertions only; not runtime behavior, TypeScript build, Vitest, Laravel route:list, or proof of all 34 semantic laws.');
if (failed) process.exitCode = 1;
