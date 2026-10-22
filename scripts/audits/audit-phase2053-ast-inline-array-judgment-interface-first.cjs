const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const candidate = read('packages/core/src/types/upstream/scannerAstExpressionCandidateInterface.ts');
const phase2052 = read('scripts/audits/audit-phase2052-response-attribute-semantic-judgment-interface-first.cjs');
const phase2051 = read('scripts/audits/audit-phase2051-runtime-function-interface-first.cjs');
const report = read('packages/core/src/types/upstream/docs/PHASE2053_AST_INLINE_ARRAY_JUDGMENT_INTERFACE_FIRST.md');
const results = [];
const check = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } };
check('inline array rule emits existing closed AST rule judgment directly', () => {
  assert.match(runtime, /expressionRule\(EXPRESSION_CANDIDATE\.inlineArray, \{ kind: 'judgment', resolve: input => Object\.freeze\(\{ kind: 'resolved', value: classifyInlineArray\(input\.tokens\) \}\) \}\)/);
});
check('inline array rule no longer crosses RelationOption legacy adapter', () => {
  const line = runtime.split('\n').find(value => value.includes('expressionRule(EXPRESSION_CANDIDATE.inlineArray'));
  assert.ok(line);
  assert.doesNotMatch(line, /legacy_adapter|resolveLegacy|relationGate|relationSome|relationNone/);
});
check('candidate evidence remains upstream owner of rule applicability', () => {
  assert.match(runtime, /applies: \(input\): AstRuleApplicability => input\.candidates\.some\(candidate => candidate\.id === id\)/);
  assert.match(runtime, /scannerAstExpressionCandidateContractAlgebra\.resolve\(/);
  assert.match(candidate, /SCANNER_EXPRESSION_INLINE_ARRAY/);
});
check('existing rule algebra remains the single ordered arbitration and proof authority', () => {
  assert.match(algebra, /interface AstClassificationRuleAlgebraInterface/);
  assert.match(algebra, /readonly resolveFirst:/);
  assert.match(algebra, /readonly verifyJudgment:/);
  assert.doesNotMatch(report, /new AST authority|parallel AST authority/i);
});
check('AST value projection still receives the same node and token source location', () => {
  assert.match(runtime, /case 'resolved': return locateAstValue\(judgment\.value, tokens\)/);
  assert.match(runtime, /function classifyInlineArray\(tokens: readonly TokenDescriptor\[\]\): PhpAstValueNode/);
});
check('legacy adapters are explicitly inventoried for future semantic migrations', () => {
  for (const candidateId of ['closure', 'arrow', 'instanceof', 'parenthesized', 'classConstant', 'classReference', 'construct', 'staticCall', 'member']) {
    assert.ok(runtime.includes(`EXPRESSION_CANDIDATE.${candidateId}`), `missing candidate ${candidateId}`);
  }
  assert.match(report, /legacy `RelationOption` adapters/);
});
check('invocation, integrated response, and response attribute authorities remain regression-gated', () => {
  assert.match(phase2051, /pipeline interface owns integrated response judgment/);
  assert.match(phase2052, /semantic authority owns inference and merge contract/);
});
check('no relation/foundation subscanner or duplicate AST facade is introduced', () => {
  assert.match(report, /does not add a competing AST authority, relation kernel, foundation subscanner/);
  assert.match(report, /existing `AstClassificationRuleAlgebraInterface`/);
  assert.doesNotMatch(report, /new .*Ast.*AuthorityInterface/);
});
check('package audit script is registered', () => {
  assert.match(read('package.json'), /audit:phase2053-ast-inline-array-judgment-interface-first/);
});
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
