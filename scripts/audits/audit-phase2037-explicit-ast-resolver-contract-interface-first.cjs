#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const ruleStart = runtime.indexOf('const AST_CLASSIFICATION_RULES:');
const ruleEnd = runtime.indexOf('\n]);', ruleStart);
const rules = runtime.slice(ruleStart, ruleEnd);
const checks = [
  ['upstream resolver contract is a discriminated union', algebra.includes('AstClassificationResolverContract') && algebra.includes("kind: 'judgment'") && algebra.includes("kind: 'legacy_adapter'")],
  ['judgment resolver carries the complete AstRuleResolution contract', algebra.includes('resolve: (input: Input) => AstRuleResolution<Output, Failure>')],
  ['runtime consumes one explicit resolver contract instead of positional callback slots', runtime.includes('resolver: AstExpressionResolver') && !runtime.includes('resolveJudgment?:')],
  ['assignment uses the canonical judgment resolver variant', rules.includes("expressionRule(EXPRESSION_CANDIDATE.assignment, { kind: 'judgment'")],
  ['match, cast, and compound expressions use canonical judgment resolver variant', ['match', 'cast', 'compound'].every(name => rules.includes(`EXPRESSION_CANDIDATE.${name}, { kind: 'judgment'`))],
  ['legacy relation results are isolated behind an explicitly named adapter variant', rules.includes("kind: 'legacy_adapter'") && runtime.includes('resolveFromRelation(resolver.resolveLegacy(input.tokens))')],
  ['resolver selection preserves all four AST resolution outcomes through the canonical branch', runtime.includes('case \'judgment\': return resolver.resolve(input)') && runtime.includes('return Object.freeze({ kind: \'not_resolved\' })')],
  ['existing ordered AST rule algebra remains the single selection authority', runtime.includes('astClassificationRuleAlgebra.resolveFirst(AST_CLASSIFICATION_RULES, input)')],
  ['Laravel invocation judgment and integrated response remain connected', controller.includes('invocationJudgment') && controller.includes('responseJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['phase audit is registered in package scripts', typeof pkg.scripts['audit:phase2037-explicit-ast-resolver-contract-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
