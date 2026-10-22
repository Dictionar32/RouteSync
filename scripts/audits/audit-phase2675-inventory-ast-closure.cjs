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
  ['upstream exposes inventory-to-AST verifier interface', /export interface RequestTypeDerivationInventoryAstVerificationInterface/.test(upstream)],
  ['inventory AST verifier is interface typed', /requestTypeDerivationInventoryAstVerification: RequestTypeDerivationInventoryAstVerificationInterface/.test(verifier)],
  ['conflict ledger closure invokes AST inventory verifier', /requestTypeDerivationInventoryMatchesAst\(inference\.preparedInput\)/.test(verifier)],
  ['AST verifier is exported for focused tests', /export const requestTypeDerivationInventoryMatchesAst/.test(verifier)],
  ['route inventory cardinality equals raw AST routes', /inventory\.routes\.length !== input\.routes\.length/.test(verifier)],
  ['resource inventory cardinality equals raw AST resources', /inventory\.resources\.length !== input\.resources\.length/.test(verifier)],
  ['request inventory cardinality equals raw AST requests', /inventory\.requests\.length !== input\.requests\.length/.test(verifier)],
  ['route canonical semantic key is recomputed from AST identity', /route:\$\{\[\s*route\.identity\.coordinates\.method/.test(verifier)],
  ['resource canonical semantic key is recomputed from AST identity', /resource:\$\{canonicalName\}/.test(verifier)],
  ['request canonical semantic key is recomputed from AST identity', /request:form:\$\{encodeURIComponent/.test(verifier)],
  ['route inventory occurrence keys reject duplicates', /const routeKeys = new Set<string>\(\)/.test(verifier)],
  ['resource inventory occurrence keys reject duplicates', /const resourceKeys = new Set<string>\(\)/.test(verifier)],
  ['request inventory occurrence keys reject duplicates', /const requestKeys = new Set<string>\(\)/.test(verifier)],
  ['source identity and source coordinates are correlated', /structurallyEqual\(ref\.source\.identity, resource\.definition\.name\)/.test(verifier) && /structurallyEqual\(ref\.location\.span, request\.source\)/.test(verifier)],
  ['existing conflict receipt closure remains enforced', /requestTypeDerivationConflictLedgerClosureMatchesInput\(inference\)/.test(verifier)],
  ['regression test for self-consistent forged inventory identity exists', /canonical inventory resource identity is forged consistently with itself/.test(tests)],
  ['regression test expects producer-gap error on forged inventory', /requestTypeDerivationProofVerifier\.verify\(tampered\)\)\.toThrow\(RequestTypeDerivationSemanticProducerGapError\)/.test(tests)],
  ['CLI consumes assembled semantic pipeline without bypass', /composition\.requestTypeDerivationPipeline/.test(cli)],
  ['ecommerce fixture manifest contains routes', Array.isArray(manifest.routes) && manifest.routes.length > 0],
  ['audit command is registered', pkg.scripts?.['audit:phase2675-inventory-ast-closure'] === 'node scripts/audits/audit-phase2675-inventory-ast-closure.cjs'],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`\nPhase 2675 inventory AST closure: ${checks.length - failed}/${checks.length} structural assertions passed.`);
console.log('SCOPE: structural assertions only; Vitest, typecheck, Laravel runtime scan/sync, and all-law verification are not implied.');
if (failed) process.exitCode = 1;
