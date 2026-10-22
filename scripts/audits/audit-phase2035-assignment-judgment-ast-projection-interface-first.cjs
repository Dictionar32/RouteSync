#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const contract = read('packages/core/src/types/upstream/scannerAssignmentPartsInterface.ts');
const sourceFailure = read('packages/core/src/types/upstream/scannerAstSourceFailureInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const parseStart = runtime.indexOf('function parseAssignmentParts(');
const parseEnd = runtime.indexOf('function classifyAssignmentStatementJudgment(', parseStart);
const parseBody = runtime.slice(parseStart, parseEnd);
const expressionStart = runtime.indexOf('function classifyAssignmentExpression(');
const expressionEnd = runtime.indexOf('function parseAssignmentParts(', expressionStart);
const expressionBody = runtime.slice(expressionStart, expressionEnd);
const statementStart = runtime.indexOf('function classifyAssignmentStatementJudgment(', parseEnd - 1);
const statementEnd = runtime.indexOf('function classifyAssignmentTarget(', statementStart);
const statementBody = runtime.slice(statementStart, statementEnd);
const checks = [
  ['assignment-parts parser returns the canonical upstream judgment', parseBody.includes('): AssignmentPartsJudgment<') && parseBody.includes('return scannerAssignmentPartsAlgebra.resolve(')],
  ['parser no longer collapses resolved/unresolved judgment into RelationOption', !parseBody.includes('switch (resolution.kind)') && !parseBody.includes('return relationSome(resolution.value)') && !parseBody.includes('return relationNone()')],
  ['expression AST projection consumes the resolved judgment payload directly', expressionBody.includes("case 'resolved': return Object.freeze({ kind: 'resolved', value: PhpAstFactory.assignmentExpression(judgment.value.target") && expressionBody.includes("case 'unresolved': return Object.freeze({ kind: 'not_resolved' })")],
  ['statement AST projection consumes the resolved judgment payload directly', statementBody.includes("case 'resolved': return Object.freeze({ kind: 'resolved', value: PhpAstFactory.assignment(judgment.value.target") && statementBody.includes("case 'unresolved': return Object.freeze({ kind: 'not_resolved' })")],
  ['malformed and contract-violation judgments remain preserved at AST boundary', expressionBody.includes("kind: 'malformed_assignment_parts', judgment") && expressionBody.includes("kind: 'assignment_parts_contract_violation', judgment") && statementBody.includes("kind: 'malformed_assignment_parts', judgment") && statementBody.includes("kind: 'assignment_parts_contract_violation', judgment") && sourceFailure.includes("kind: 'malformed_assignment_parts'") && sourceFailure.includes("kind: 'assignment_parts_contract_violation'")],
  ['upstream component contract remains discriminated and explicit', contract.includes('export type AssignmentPartsComponentJudgment<Value>') && contract.includes("readonly kind: 'resolved'") && contract.includes("readonly kind: 'unresolved'")],
  ['no duplicate invocation authority or integrated response path added', runtime.includes('classifyAssignmentExpression') && read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('invocationJudgment') && read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('responseJudgment')],
  ['no relation/foundation subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['phase audit is registered in package scripts', typeof packageJson.scripts['audit:phase2035-assignment-judgment-ast-projection-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
