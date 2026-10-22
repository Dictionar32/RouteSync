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
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const cli = read('packages/cli/src/commands/scan.ts');
const manifest = read('examples/ecommerce-shop-source/routesync.temp.manifest.json');
const checks = [
  ['upstream declares interface-first conflict group verification port', /export interface RequestTypeDerivationConflictGroupVerificationInterface/.test(upstream)],
  ['verifier implementation is typed against upstream interface', /requestTypeDerivationConflictGroupVerification: RequestTypeDerivationConflictGroupVerificationInterface/.test(verifier)],
  ['conflict path requires both collision-ledger and group-closure verification', /requestTypeDerivationIdentityConflictLedgerMatchesInput\(inference\)[\s\S]{0,160}requestTypeDerivationConflictGroupsMatchInput\(inference\)/.test(verifier)],
  ['non-empty conflict groups replay independently against judgment output', /requestTypeDerivationGroupReceiptsReplay\(groups, judgment\.groups\)/.test(verifier)],
  ['conflict groups correlate source inventory, AST and resource identity', /requestTypeDerivationIncomingSourceMatchesInput\(groups, inference\.preparedInput\)[\s\S]{0,240}requestTypeDerivationIncomingContributionMatchesAst\(groups, inference\.preparedInput\)[\s\S]{0,180}requestTypeDerivationGroupIdentityMatchesInput\(groups, inference\.preparedInput\)/.test(verifier)],
  ['empty conflict groups reject route receipts claiming contribution', /groups\.length === 0[\s\S]{0,180}!judgment\.proof\.routeReceipts\.some\(receipt => receipt\.disposition\.kind === 'contributed'\)/.test(verifier)],
  ['regression test tampers group receipt on valid identity conflict', /forged group attached to an otherwise valid duplicate-identity conflict/.test(tests)],
  ['regression test retains valid conflict with no eligible groups', /accepts a conflict with no groups only when no route claims a contribution/.test(tests)],
  ['CLI continues to consume the single assembled upstream semantic pipeline', /composition\.requestTypeDerivationPipeline/.test(cli)],
  ['fixture manifest remains parseable and contains route entries', Array.isArray(JSON.parse(manifest).routes) && JSON.parse(manifest).routes.length > 0],
  ['audit is registered in package scripts', pkg.scripts?.['audit:phase2673-conflict-group-closure'] === 'node scripts/audits/audit-phase2673-conflict-group-closure.cjs'],
  ['producer preserves group receipts on conflict judgments', /const groupReceipts = makeGroupReceipts\(preparedInput, routeReceipts\)/.test(reasoning) && /kind: 'conflict'/.test(reasoning)],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`\nPhase 2673 conflict group closure: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural assertions only; runtime Vitest, full TypeScript build, Laravel route scan and all-law verification are not implied.');
if (failed) process.exitCode = 1;
