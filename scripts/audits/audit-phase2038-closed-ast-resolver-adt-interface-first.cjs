#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const ruleStart = runtime.indexOf('const AST_CLASSIFICATION_RULES:');
const ruleEnd = runtime.indexOf('\n]);', ruleStart);
const rules = runtime.slice(ruleStart, ruleEnd);
const checks = [
  ['canonical resolver variant returns closed AST judgment', algebra.includes("readonly kind: 'judgment'") && algebra.includes('AstRuleResolution<Output, Failure>')],
  ['legacy token adapter has a required input discriminant and callback', algebra.includes("readonly input: 'tokens'") && algebra.includes('readonly resolveLegacy: (input: LegacyInput) => LegacyResult')],
  ['legacy context adapter has a required input discriminant and callback', algebra.includes("readonly input: 'context'") && algebra.includes('readonly deriveLegacy: (input: Input) => LegacyResult')],
  ['legacy callbacks are not optional, preventing invalid adapter states', !algebra.includes('resolveLegacy?:') && !algebra.includes('deriveLegacy?:')],
  ['runtime dispatches legacy adapter by closed ADT input variant', runtime.includes("case 'context': return resolveFromRelation(resolver.deriveLegacy(input))") && runtime.includes("case 'tokens': return resolveFromRelation(resolver.resolveLegacy(input.tokens))")],
  ['single-token expression now returns canonical judgment directly', rules.includes("expressionRule(EXPRESSION_CANDIDATE.single, { kind: 'judgment'") && rules.includes('value: classifySingle(input.tokens[0])')],
  ['single-token rule no longer adapts through RelationOption', !rules.includes("EXPRESSION_CANDIDATE.single, { kind: 'legacy_adapter'")],
  ['assignment, match, cast, and compound remain canonical judgments', ['assignment', 'match', 'cast', 'compound'].every(name => rules.includes(`EXPRESSION_CANDIDATE.${name}, { kind: 'judgment'`))],
  ['AST arbitration remains owned by the existing ordered rule algebra', runtime.includes('astClassificationRuleAlgebra.resolveFirst(AST_CLASSIFICATION_RULES, input)')],
  ['Laravel invocation judgment and integrated response wiring remain intact', controller.includes('invocationJudgment') && controller.includes('responseJudgment')],
  ['no relation/foundation subscanner was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['Phase 2038 audit is registered', typeof pkg.scripts['audit:phase2038-closed-ast-resolver-adt-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
