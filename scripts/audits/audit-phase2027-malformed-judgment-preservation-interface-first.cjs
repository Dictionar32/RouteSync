#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const scanner = read('packages/core/src/types/upstream/scannerMatchExpressionInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const files = [];
const walk = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const target = path.join(directory, entry.name); if (entry.isDirectory()) walk(target); else files.push(path.relative(path.join(root, 'packages/core/src/compiler/scanner'), target).split(path.sep)); } };
walk(path.join(root, 'packages/core/src/compiler/scanner'));
const checks = [
  ['rule resolution has explicit malformed and rule-contract outcomes', algebra.includes("readonly kind: 'malformed'") && algebra.includes("readonly kind: 'rule_contract_violation'")],
  ['closed judgment carries source failure and attempts', algebra.includes("readonly kind: 'malformed'; readonly ruleId: Id; readonly failure: Failure") && algebra.includes('readonly attempts: readonly AstClassificationRuleAttempt<Id>[]')],
  ['judgment verification recognizes malformed terminal attempts', algebra.includes("kind: 'verified_malformed'") && algebra.includes("terminalAttempt.resolution !== terminalKind")],
  ['match malformed is no longer converted to not-resolved', runtime.includes("kind: 'malformed_match_expression'") && !/case SCANNER_MATCH_MALFORMED:\s*return relationNone\(\)/.test(runtime)],
  ['match contract violation remains a typed judgment outcome', runtime.includes("kind: 'match_expression_contract_violation'") && runtime.includes("kind: 'rule_contract_violation'")],
  ['cast malformed is returned as a typed judgment outcome', runtime.includes("kind: 'malformed_cast_expression'") && /case 'malformed':\s*return Object\.freeze\(\{ kind: 'malformed'/.test(runtime)],
  ['AST runtime throws a typed failure retaining the closed judgment', runtime.includes('class AstClassificationFailureError') && runtime.includes('readonly judgment: Extract<AstClassificationJudgment')],
  ['canonical Laravel invocation ADT remains present', invocation.includes('php_source_invocation_integration_complete') && invocation.includes('php_source_invocation_integration_blocked')],
  ['Laravel scanner wiring preserves invocation and response judgments', wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
  ['no relation subscanner added', !files.some(parts => parts.some(part => part === 'relations' || part === 'relation') && !parts.join('/').startsWith('descriptors/model/relation/'))],
  ['no foundation subscanner added', !files.some(parts => parts.some(part => part === 'foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
