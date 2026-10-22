#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['existing algebra interface owns verification of every judgment', algebra.includes('interface AstClassificationRuleAlgebraInterface') && algebra.includes('verifyJudgment:')],
  ['negative judgment must account for every policy rule', algebra.includes("judgment.attempts.length !== rules.length")],
  ['negative judgment attempts must follow exact policy order', algebra.includes("reason: 'attempt_history_out_of_order'") && algebra.includes('attempt.ruleId === rules[index]?.id')],
  ['negative judgment cannot claim a resolved attempt', algebra.includes("reason: 'attempt_state_inconsistent'")],
  ['resolved judgment still requires proof verification', algebra.includes('const proof = verifyProof(rules, judgment)')],
  ['runtime verifies the full judgment before projecting AST', runtime.includes('astClassificationRuleAlgebra.verifyJudgment(AST_CLASSIFICATION_RULES, judgment)')],
  ['AST arbitration algebra remains free of relation dependencies', !algebra.includes('RelationOption') && !algebra.includes('semantic/relations')],
  ['parser compatibility adapter is not misrepresented as removed', runtime.includes('resolveFromRelation') && runtime.includes('RelationOption adapter')],
  ['canonical invocation ADT retains four outcomes', ['php_source_invocation_integration_not_connected','php_source_invocation_integration_source_binding_rejected','php_source_invocation_integration_complete','php_source_invocation_integration_blocked'].every(value => invocation.includes(value))],
  ['Laravel AST projection forwards invocation and response judgments', scanner.includes('invocationJudgment') && scanner.includes('responseJudgment') && scanner.includes('astProjection.judge')],
  ['invocation executor delegates to upstream authority', executor.includes('authority.analyze(input)')],
  ['no relation subscanner directory added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation'))],
  ['no foundation subscanner directory added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`\nPhase 2026 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
