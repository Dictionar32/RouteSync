#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const failure = read('packages/core/src/types/upstream/scannerAstSourceFailureInterface.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['array-access failure is modeled by an upstream closed ADT', failure.includes("kind: 'malformed_array_access_delimiter'") && failure.includes('DelimitedTokenJudgment<Token>')],
  ['source failure interface exposes the preserved judgment', failure.includes('interface ScannerAstSourceFailureInterface<Token>') && failure.includes('failure: ScannerAstSourceFailureJudgment<Token>')],
  ['runtime imports the upstream failure contract', runtime.includes("from '../../../types/upstream/scannerAstSourceFailureInterface'")],
  ['malformed array-access path preserves the exact delimiter judgment', /case 'malformed': throw new AstSourceJudgmentFailureError\(Object\.freeze\(\{ kind: 'malformed_array_access_delimiter', judgment \}\)\)/.test(runtime)],
  ['malformed array-access path no longer converts judgment to generic Error', !/Malformed array-access delimiter evidence: expected/.test(runtime)],
  ['typed source failure boundary is explicit', runtime.includes('implements ScannerAstSourceFailureInterface<Token>')],
  ['upstream barrel exports the interface and ADT', index.includes("from './scannerAstSourceFailureInterface'")],
  ['canonical invocation judgment keeps distinct integration outcomes', invocation.includes('php_source_invocation_integration_not_connected') && invocation.includes('php_source_invocation_integration_blocked')],
  ['Laravel wiring still forwards exact invocation and response judgments', wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
  ['no relation/foundation subscanner is introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
