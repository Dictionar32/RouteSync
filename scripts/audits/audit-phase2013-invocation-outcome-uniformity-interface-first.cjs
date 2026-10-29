const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2013_INVOCATION_OUTCOME_UNIFORMITY_INTERFACE_FIRST.md');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing response pipeline contract owns uniform outcome policy', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?invocationOutcomeUniformityRule:/);
    assert.match(pipeline, /invocationOutcomeUniformityRule: 'every-closed-invocation-judgment-outcome-enters-the-same-response-evidence-and-AST-projection-sequence/);
  }],
  ['pipeline contract versions align at 17', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 17/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 17/);
    assert.match(pipeline, /const pipelineContract: LaravelControllerResponseSemanticPipelineContract = Object\.freeze\(\{\s*kind: 'laravel_controller_response_semantic_pipeline_contract',\s*contractVersion: 17/);
    assert.match(pipeline, /export const laravelControllerResponseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface = Object\.freeze\(\{\s*kind: 'laravel_controller_response_semantic_pipeline',\s*closed: true,\s*contractVersion: 17/);
  }],
  ['scanner no longer classifies invocation outcome or repeats four equivalent branches', () => {
    assert.doesNotMatch(scanner, /hasInvocationOutcome|InvocationResponseOutcomeKind/);
    assert.doesNotMatch(scanner, /php_source_invocation_integration_not_connected[\s\S]{0,700}php_source_invocation_integration_source_binding_rejected[\s\S]{0,700}php_source_invocation_integration_blocked/);
    assert.match(scanner, /const responseJudgment = responseSemanticPipeline\.judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*?invocationJudgment,[\s\S]*?declarationEvidence,[\s\S]*?astProjection\.judge\([\s\S]*?judgment: invocationJudgment,[\s\S]*?responseJudgment/);
  }],
  ['same exact invocation judgment is retained in artifact and projection input', () => {
    assert.match(scanner, /kind: 'integrated_invocation_response_judgment',[\s\S]*?judgment: invocationJudgment,[\s\S]*?responseJudgment/);
    assert.match(scanner, /invocationJudgment,\s*responseJudgment,\s*projectionJudgment/);
  }],
  ['response evidence and projection still delegate to existing authorities', () => {
    assert.match(pipeline, /const inventory = evidenceProduction\.produce\(productionInput\)/);
    assert.match(pipeline, /const sourceBindingJudgment = evidenceSourceBinding\.bind\(inventory\)/);
    assert.match(pipeline, /return responseExecutor\.execute\(responseInput\)/);
    assert.doesNotMatch(scanner, /pipeline\.evidenceProduction\.produce\(productionInput\)/);
    assert.match(scanner, /responseSemanticPipeline\.astProjection\.judge/);
  }],
  ['no parallel invocation authority or new relation/foundation subscanner', () => {
    assert.doesNotMatch(docs, /new (?:parallel )?(?:invocation )?authority/i);
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
    assert.doesNotMatch(scanner, /operations\/(?:relation|foundation)/);
  }],
  ['audit command is registered and limits are documented', () => {
    assert.equal(pkg.scripts['audit:phase2013-invocation-outcome-uniformity-interface-first'], 'node scripts/audits/audit-phase2013-invocation-outcome-uniformity-interface-first.cjs');
    assert.match(docs, /Full project typecheck\/build is not claimed/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2013, audit: 'invocation-outcome-uniformity-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2013_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
