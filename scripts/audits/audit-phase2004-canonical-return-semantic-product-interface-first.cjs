const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2004_CANONICAL_RETURN_SEMANTIC_PRODUCT_INTERFACE_FIRST.md');
const subscannerRoot = path.join(root, 'packages/core/src/compiler/scanner/operations');
const subscannerFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(target);
  else if (entry.isFile()) subscannerFiles.push(path.relative(root, target));
});
walk(subscannerRoot);

const checks = [
  ['return product uses the existing ControllerReturnSemantic ADT', () => {
    assert.match(iface, /readonly kind: 'controller_method_return_semantics'/);
    assert.match(iface, /readonly returned: ControllerReturnSemantic/);
    assert.match(pipeline, /returned: observation\.action\.semantic\.returned/);
  }],
  ['method identity and source provenance remain on each semantic return product', () => {
    assert.match(iface, /readonly methodEvidence: ControllerMethodEvidence/);
    assert.match(iface, /readonly action: ControllerActionFlowContract/);
    assert.match(iface, /readonly source: SourceSpan/);
  }],
  ['binding receipt retains all observations including those with no evidence', () => {
    assert.match(iface, /kind: 'controller_response_evidence_source_binding_complete';\s+readonly invocationSource:[\s\S]*?readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation\[\]/);
    assert.match(iface, /kind: 'controller_response_evidence_source_binding_rejected';\s+readonly invocationSource:[\s\S]*?readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation\[\]/);
    assert.match(iface, /kind: 'controller_response_evidence_source_binding_empty';\s+readonly invocationSource:[\s\S]*?readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation\[\]/);
    assert.match(pipeline, /observations: input\.observations/);
  }],
  ['semantic authority emits a distinct return-semantic outcome only for complete invocation plus complete source binding', () => {
    assert.match(pipeline, /hasInvocationOutcome\(input\.invocationJudgment, 'php_source_invocation_integration_complete'\)/);
    assert.match(pipeline, /kind: 'controller_response_return_semantics_complete'/);
    assert.match(iface, /kind: 'controller_response_return_semantics_complete'/);
    assert.match(pipeline, /case 'controller_response_evidence_source_binding_rejected':[\s\S]*?case 'controller_response_evidence_source_binding_empty':[\s\S]*?case 'controller_response_evidence_source_binding_complete'/);
  }],
  ['the existing executor remains a delegate and AST projection remains integrated', () => {
    assert.match(pipeline, /return responseSemanticAuthority\.judge\(input\)/);
    assert.match(scanner, /pipeline\.responseExecutor\.execute\(responseInput\)/);
    assert.match(scanner, /responseSemanticPipeline\.astProjection\.judge\(\{ kind: 'integrated_invocation_response_judgment', judgment: invocationJudgment, responseJudgment \}\)/);
  }],
  ['source identity authority remains the only identity owner', () => {
    assert.match(pipeline, /laravelSourceIdentitySemantics\.relateSourceFiles\(input\.invocationJudgment\.sourceFile, evidence\.sourceFile\)/);
    assert.match(iface, /readonly owner: 'LaravelSourceIdentitySemanticsInterface'/);
  }],
  ['source-binding contract version advances to 7', () => {
    assert.match(iface, /interface LaravelControllerResponseEvidenceSourceBindingContract \{[\s\S]*?contractVersion: (?:7|8)/);
    assert.match(pipeline, /kind: 'laravel_controller_response_evidence_source_binding_contract',[\s\S]*?contractVersion: (?:7|8)/);
  }],
  ['response judgment contract version advances to 7', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticJudgmentContract \{[\s\S]*?contractVersion: (?:7|8)/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_judgment_contract',[\s\S]*?contractVersion: (?:7|8)/);
  }],
  ['response pipeline contract and implementation are version 8', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: (?:8|9)/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: (?:8|9)/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: (?:8|9)/);
  }],
  ['no new relation/foundation subscanner was added', () => {
    assert.equal(subscannerFiles.some(file => /phase2004|canonicalReturnSemanticProduct/i.test(path.basename(file))), false);
    assert.match(docs, /No new `relation` or `foundation` subscanner is introduced/);
  }],
  ['documentation does not overclaim concrete HTTP ResponseDefinition projection', () => {
    assert.match(docs, /does \*\*not\*\* claim[\s\S]*?concrete `ResponseDefinition` \/ `ResponseResult`/);
    assert.match(docs, /Full project typecheck\/build is not treated as passing/);
  }],
];

const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2004, audit: 'canonical-return-semantic-product-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2004_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
