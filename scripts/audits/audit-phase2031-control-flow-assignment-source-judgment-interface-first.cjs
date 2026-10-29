#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const failure = read('packages/core/src/types/upstream/scannerAstSourceFailureInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['source failure ADT carries conditional statement judgment', failure.includes("kind: 'malformed_conditional_statement'") && failure.includes('ScannerConditionalStatementJudgment<Token>')],
  ['source failure ADT carries loop control and original judgment', failure.includes("kind: 'malformed_loop_statement'") && failure.includes('ScannerLoopControl') && failure.includes('ScannerLoopStatementJudgment<Token>')],
  ['source failure ADT carries switch judgment', failure.includes("kind: 'malformed_switch_statement'") && failure.includes('ScannerSwitchStatementJudgment<Token>')],
  ['source failure ADT carries assignment-parts malformed and contract outcomes', failure.includes("kind: 'malformed_assignment_parts'") && failure.includes("kind: 'assignment_parts_contract_violation'")],
  ['source failure ADT carries assignment-target malformed and contract outcomes', failure.includes("kind: 'malformed_assignment_target'") && failure.includes("kind: 'assignment_target_contract_violation'")],
  ['conditional parser preserves malformed judgment without reconstructing an Error message', runtime.includes("kind: 'malformed_conditional_statement', judgment") && !runtime.includes('Malformed conditional statement: expected')],
  ['loop parser preserves malformed judgment for all three loop forms', runtime.includes("control: 'collection_iteration', judgment") && runtime.includes("control: 'pretest_iteration', judgment") && runtime.includes("control: 'counted_iteration', judgment")],
  ['switch parser preserves malformed judgment', runtime.includes("kind: 'malformed_switch_statement', judgment") && !runtime.includes('Malformed selection dispatch statement: expected')],
  ['assignment decomposition preserves malformed and contract judgments', runtime.includes("kind: 'malformed_assignment_parts', judgment })") && runtime.includes("kind: 'assignment_parts_contract_violation', judgment })")],
  ['assignment target preserves malformed and contract judgments', runtime.includes("kind: 'malformed_assignment_target', judgment: resolution") && runtime.includes("kind: 'assignment_target_contract_violation', judgment: resolution")],
  ['canonical Laravel invocation and integrated response forwarding remain intact', invocation.includes('php_source_invocation_integration_not_connected') && wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
