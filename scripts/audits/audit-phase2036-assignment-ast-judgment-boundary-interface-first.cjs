#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const failure = read('packages/core/src/types/upstream/scannerAstSourceFailureInterface.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const expressionStart = runtime.indexOf('function classifyAssignmentExpression(');
const expressionEnd = runtime.indexOf('function parseAssignmentParts(', expressionStart);
const expression = runtime.slice(expressionStart, expressionEnd);
const statementStart = runtime.indexOf('function classifyAssignmentStatementJudgment(');
const statementEnd = runtime.indexOf('function classifyAssignmentTarget(', statementStart);
const statement = runtime.slice(statementStart, statementEnd);
const simpleStart = runtime.indexOf('const simpleStatementRules:');
const simpleEnd = runtime.indexOf('function parseSimpleStatement(', simpleStart);
const rules = runtime.slice(simpleStart, simpleEnd);
const checks = [
  ['assignment expression rule returns the existing AST rule judgment directly', expression.includes('AstRuleResolution<PhpAstValueNode, AstClassificationSourceFailure>') && expression.includes("kind: 'resolved'") && expression.includes("kind: 'not_resolved'")],
  ['assignment expression policy wires a judgment resolver rather than a RelationOption resolver', runtime.includes("expressionRule(EXPRESSION_CANDIDATE.assignment, { kind: 'judgment', resolve: input =>")],
  ['assignment statement rule wires the upstream judgment directly into rule resolution', rules.includes("id: 'assignment', applies: alwaysApplicable, resolve: input => classifyAssignmentStatementJudgment(input.part)")],
  ['assignment statement malformed and contract failures preserve the original source judgment', statement.includes("kind: 'malformed_assignment_parts', judgment") && statement.includes("kind: 'assignment_parts_contract_violation', judgment") && failure.includes("kind: 'malformed_assignment_parts'") && failure.includes("kind: 'assignment_parts_contract_violation'")],
  ['simple statement boundary forwards terminal source failures rather than flattening them', runtime.includes("case 'malformed':\n        case 'rule_contract_violation':\n            throw new AstSourceJudgmentFailureError(judgment.failure);")],
  ['legacy RelationOption wrapper is isolated for counted-for clause compatibility', statement.includes('function classifyAssignment(tokens: readonly TokenDescriptor[]): RelationOption<PhpStatement>')],
  ['canonical Laravel invocation judgment and integrated response ownership remain present', controller.includes('invocationJudgment') && controller.includes('responseJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['audit is registered in package scripts', typeof pkg.scripts['audit:phase2036-assignment-ast-judgment-boundary-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
