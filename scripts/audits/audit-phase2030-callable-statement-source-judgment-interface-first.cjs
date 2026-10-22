#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const failure = read('packages/core/src/types/upstream/scannerAstSourceFailureInterface.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['upstream ADT preserves callable parameter malformed judgment', failure.includes("kind: 'malformed_callable_parameter_list'") && failure.includes('CallableParameterJudgment<Token>')],
  ['upstream ADT preserves callable capture malformed and delimiter judgments', failure.includes("kind: 'malformed_callable_capture_list'") && failure.includes("kind: 'malformed_callable_capture_delimiter'")],
  ['upstream ADT preserves callable argument/list outcomes', failure.includes("kind: 'malformed_callable_argument_list'") && failure.includes("kind: 'callable_argument_contract_violation'")],
  ['upstream ADT preserves statement-sequence malformed and contract outcomes', failure.includes("kind: 'malformed_statement_sequence'") && failure.includes("kind: 'statement_sequence_contract_violation'")],
  ['parameter parser throws typed preserved judgment, not reconstructed message', runtime.includes("kind: 'malformed_callable_parameter_list', judgment") && !runtime.includes('Malformed PHP parameter list: expected')],
  ['capture parser preserves delimiter and callable-list judgment', runtime.includes("kind: 'malformed_callable_capture_delimiter', judgment: delimiter") && runtime.includes("kind: 'malformed_callable_capture_list', judgment")],
  ['argument parser preserves list and per-argument judgments', runtime.includes("kind: 'malformed_callable_argument_list', judgment") && runtime.includes("kind: 'malformed_callable_argument', judgment")],
  ['statement sequence parser preserves original resolution', runtime.includes("kind: 'malformed_statement_sequence', judgment: resolution") && runtime.includes("kind: 'statement_sequence_contract_violation', judgment: resolution")],
  ['source failure interface remains the shared typed boundary', runtime.includes('implements ScannerAstSourceFailureInterface<Token>') && index.includes("from './scannerAstSourceFailureInterface'")],
  ['canonical Laravel invocation and integrated response forwarding remain intact', invocation.includes('php_source_invocation_integration_not_connected') && wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
