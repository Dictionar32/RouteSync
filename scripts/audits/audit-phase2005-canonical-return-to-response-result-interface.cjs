const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2005_CANONICAL_RETURN_TO_RESPONSE_RESULT_INTERFACE.md');
const subscannerRoot = path.join(root, 'packages/core/src/compiler/scanner/subscanners');
const subscannerFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(target);
  else if (entry.isFile()) subscannerFiles.push(path.relative(root, target));
});
walk(subscannerRoot);
const checks = [
  ['return projection is a typed upstream interface and contract', () => {
    assert.match(iface, /interface LaravelControllerReturnResponseProjectionInterface/);
    assert.match(iface, /interface LaravelControllerReturnResponseProjectionContract/);
    assert.match(iface, /readonly returnResponseProjection: LaravelControllerReturnResponseProjectionInterface/);
  }],
  ['projection consumes the canonical ControllerReturnSemantic ADT', () => {
    assert.match(iface, /readonly returned: ControllerReturnSemantic/);
    assert.match(pipeline, /function projectCanonicalReturn\(returned: ControllerReturnSemantic\)/);
    assert.match(pipeline, /project: projectCanonicalReturn/);
  }],
  ['already-closed response result is preserved without syntax reclassification', () => {
    assert.match(pipeline, /case 'response':[\s\S]*?result: returned\.result/);
    assert.match(pipeline, /case 'resource':[\s\S]*?kind: 'resource'/);
    assert.match(pipeline, /case 'model':[\s\S]*?kind: 'content'/);
  }],
  ['branches require complete branch projections', () => {
    assert.match(pipeline, /function projectReturnSequenceTail/);
    assert.match(pipeline, /function projectReturnSequence\(branches:[\s\S]*?case 'empty':[\s\S]*?response_result_sequence_unresolved/);
    assert.match(pipeline, /at-least-one-branch-has-no-concrete-http-response-result/);
    assert.match(iface, /all-branches-must-project-to-concrete-ResponseResult/);
  }],
  ['absent and generic expression remain unresolved, not guessed empty or JSON', () => {
    assert.match(pipeline, /case 'absent':[\s\S]*?case 'expression':[\s\S]*?controller_return_response_projection_unresolved/);
    assert.match(iface, /absent-or-generic-expression-does-not-prove-an-http-response-result/);
    assert.doesNotMatch(pipeline, /case 'expression':[\s\S]{0,240}kind: 'json'/);
  }],
  ['all-method concrete results publish a distinct closed response product', () => {
    assert.match(iface, /kind: 'controller_method_response_products'/);
    assert.match(iface, /kind: 'controller_response_method_products_complete'/);
    assert.match(pipeline, /kind: 'controller_response_method_products_complete'/);
    assert.match(pipeline, /product: Object\.freeze\(\{ kind: 'controller_method_response_products', firstMethod: projection\.firstMethod, remainingMethods: projection\.remainingMethods \}\)/);
    assert.match(iface, /readonly firstMethod: LaravelControllerMethodResponseProduct;[\s\S]*?readonly remainingMethods: readonly LaravelControllerMethodResponseProduct\[\]/);
  }],
  ['unresolved method results preserve canonical return-semantic judgment', () => {
    assert.match(pipeline, /kind: 'controller_response_return_semantics_complete'[\s\S]*?kind: 'controller_method_return_semantics'/);
  }],
  ['response runtime executor delegates to the existing authority and carries projection contract', () => {
    assert.match(pipeline, /return responseSemanticAuthority\.judge\(input\)/);
    assert.match(pipeline, /authority: responseSemanticAuthority,[\s\S]*?returnResponseProjection/);
  }],
  ['scanner preserves response judgment into existing AST projection authority', () => {
    assert.match(scanner, /pipeline\.responseExecutor\.execute\(responseInput\)/);
    assert.match(scanner, /responseSemanticPipeline\.astProjection\.judge\(\{ kind: 'integrated_invocation_response_judgment', judgment: invocationJudgment, responseJudgment \}\)/);
  }],
  ['response judgment and pipeline contracts advance consistently', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticJudgmentContract \{[\s\S]*?contractVersion: (?:8|9)/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_judgment_contract',[\s\S]*?contractVersion: (?:8|9)/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: (?:8|9)/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: (?:8|9)/);
  }],
  ['AST projection authority implementation satisfies its preservation contract', () => {
    const astAuthority = read('packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
    assert.match(astAuthority, /responsePreservation: 'ast-projection-forwards-the-artifact-owned-response-judgment-with-the-exact-correlated-invocation-judgment'/);
    assert.match(astAuthority, /runtimeResponsibility: 'preserve-invocation-only-context-as-invocation-only-and-project-integrated-invocation-response-context-without-classification-or-reconstruction'/);
  }],
  ['no new relation/foundation subscanner or parallel response authority', () => {
    assert.equal(subscannerFiles.some(file => /phase2005|returnResponseProjection/i.test(path.basename(file))), false);
    assert.match(docs, /not a parallel top-level response authority/);
    assert.match(docs, /no new `relation` or `foundation` subscanner/);
  }],
  ['documentation distinguishes semantic closure from concrete response projection', () => {
    assert.match(docs, /controller_response_method_products_complete/);
    assert.match(docs, /Full project typecheck\/build is not claimed as passing/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2005, audit: 'canonical-return-to-response-result-interface', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2005_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
