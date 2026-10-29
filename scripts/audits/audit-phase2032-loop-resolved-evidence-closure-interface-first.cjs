#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerLoopStatementInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerLoopStatementAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['resolved loop evidence is a discriminated union by control form', contract.includes("readonly control: 'pretest_iteration'") && contract.includes("readonly control: 'counted_iteration'") && contract.includes("readonly control: 'collection_iteration'")],
  ['pretest evidence has no unrelated optional loop payload', contract.includes("readonly control: 'pretest_iteration'") && !contract.includes('readonly iterable?:') && !contract.includes('readonly target?:') && !contract.includes('readonly clauses?:')],
  ['counted-loop resolved evidence requires all three clauses', contract.includes("readonly control: 'counted_iteration';") && contract.includes('readonly clauses: readonly [readonly Token[], readonly Token[], readonly Token[]]')],
  ['collection-loop resolved evidence requires iterable and target', contract.includes("readonly control: 'collection_iteration';") && contract.includes('readonly iterable: readonly Token[]') && contract.includes('readonly target: ScannerLoopTarget<Token>')],
  ['upstream algebra stamps the exact control variant on each resolved judgment', algebra.includes("control: 'pretest_iteration'") && algebra.includes("control: 'counted_iteration'") && algebra.includes("control: 'collection_iteration'")],
  ['runtime projects loops by the closed control ADT', runtime.includes('function projectLoopStatement(') && runtime.includes("case 'collection_iteration':") && runtime.includes("case 'counted_iteration':") && runtime.includes("case 'pretest_iteration':")],
  ['runtime no longer revalidates optional resolved loop evidence', !runtime.includes('resolved judgment lacks iterable or target evidence') && !runtime.includes('resolved judgment lacks clause evidence')],
  ['all three parser entry points preserve original malformed loop judgments', runtime.includes("control: 'collection_iteration', judgment") && runtime.includes("control: 'pretest_iteration', judgment") && runtime.includes("control: 'counted_iteration', judgment")],
  ['Laravel invocation and integrated response remain forwarded through the existing interface', invocation.includes('php_source_invocation_integration_not_connected') && wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
