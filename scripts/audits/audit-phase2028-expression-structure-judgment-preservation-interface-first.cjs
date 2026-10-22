#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['compound-expression candidate delegates to closed judgment resolution', /expressionRule\(EXPRESSION_CANDIDATE\.compound, undefined, undefined, input => classifyCompoundExpression\(input\.tokens\)\)/.test(runtime)],
  ['malformed structure judgment is retained as a typed failure', runtime.includes("kind: 'malformed_expression_structure'") && runtime.includes("kind: 'malformed_source'" )],
  ['structure contract violation is retained as a typed failure', runtime.includes("kind: 'expression_structure_contract_violation'") && runtime.includes("kind: 'contract_violation'")],
  ['not-structured remains distinct from malformed', /case 'not_structured': return Object\.freeze\(\{ kind: 'not_resolved' \}\)/.test(runtime)],
  ['structured evidence is projected only after upstream judgment', /case 'structured': return Object\.freeze\(\{ kind: 'resolved', value: projectPhpExpressionStructure\(judgment\.structure/.test(runtime)],
  ['compound malformed path no longer throws a generic Error', !/function classifyCompoundExpression[\s\S]*?case 'malformed_source': throw new Error/.test(runtime)],
  ['compound contract-violation path no longer throws a generic Error', !/function classifyCompoundExpression[\s\S]*?case 'contract_violation': throw new Error/.test(runtime)],
  ['AST classifier retains the closed judgment in its typed failure boundary', runtime.includes('class AstClassificationFailureError') && runtime.includes('readonly judgment: Extract<AstClassificationJudgment')],
  ['canonical invocation ADT remains intact', invocation.includes('php_source_invocation_integration_complete') && invocation.includes('php_source_invocation_integration_blocked')],
  ['Laravel scanner wiring still forwards invocation and response judgments', wiring.includes('invocationJudgment') && wiring.includes('responseJudgment') && wiring.includes('astProjection.judge')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
