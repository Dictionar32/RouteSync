#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const reasoning = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts');
const algebra = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationGroupContributionAlgebra.ts');
const routeSource = read('examples/ecommerce-shop-source/routes/api.php');
const webSource = read('examples/ecommerce-shop-source/routes/web.php');
const manifest = JSON.parse(read('examples/ecommerce-shop-source/routesync.temp.manifest.json'));
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['verifier exports a separate AST contribution correlation function', /export const requestTypeDerivationIncomingContributionMatchesAst/.test(verifier)],
  ['upstream exposes an explicit interface for the AST contribution verifier port', /export interface RequestTypeDerivationIncomingContributionAstVerificationInterface/.test(contract) && /requestTypeDerivationIncomingContributionAstVerification: RequestTypeDerivationIncomingContributionAstVerificationInterface/.test(verifier)],
  ['AST action witness derives create/update from route capability and schema fields', /route\.capability\.actionKind/.test(verifier) && /route\.binding\.schema\.fields/.test(verifier) && /FormActionName\.Create/.test(verifier) && /FormActionName\.Update/.test(verifier)],
  ['read/delete source actions must contribute no FormAction', /actionKind === 'read' \|\| actionKind === 'delete'/.test(verifier)],
  ['resource response must resolve to a ResourceAst in the original input', /preparedInput\.input\.resources\.map/.test(verifier) && /result\.resource\.name\.value\.value/.test(verifier)],
  ['resource response fields and contract field names are checked against AST fields', /typeExpressionToSemanticType\(sourceField\.type\)/.test(verifier) && /contractField\.name\.value !== sourceField\.name\.value\.value/.test(verifier)],
  ['unsupported response projections fail closed rather than being guessed', /if \(!isExplicitEmpty \|\| receipt\.incoming\.response\.kind !== 'none'\) return false/.test(verifier)],
  ['final verification gate requires AST contribution correlation', /requestTypeDerivationIncomingSourceMatchesInput\(proof\.groupReceipts, inference\.preparedInput\)[\s\S]{0,180}requestTypeDerivationIncomingContributionMatchesAst\(proof\.groupReceipts, inference\.preparedInput\)/.test(verifier)],
  ['contribution producer and verifier remain separate implementations', !/requestTypeDerivationGroupContributionAlgebra\.fold/.test(verifier) && /requestTypeDerivationGroupContributionAlgebra\.fold/.test(reasoning) && /const fold =/.test(algebra)],
  ['Laravel ecommerce API and web route sources are present', /Route::/.test(routeSource) && /Route::/.test(webSource)],
  ['ecommerce fixture manifest parses and carries routes', Array.isArray(manifest.routes) && manifest.routes.length > 0],
  ['audit is registered as a package script', pkg.scripts?.['audit:phase2671-ast-contribution-replay'] === 'node scripts/audits/audit-phase2671-ast-contribution-replay.cjs'],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`\nPhase 2671 AST contribution replay: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: source-structure checks only; not a TypeScript build, Vitest execution, Laravel runtime scan, or proof of all 34 laws.');
if (failed) process.exitCode = 1;
