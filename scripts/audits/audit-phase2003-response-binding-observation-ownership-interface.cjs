const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2003_RESPONSE_BINDING_OBSERVATION_OWNERSHIP_INTERFACE.md');
const subscannerRoot = path.join(root, 'packages/core/src/compiler/scanner/subscanners');
const subscannerFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(target);
  else if (entry.isFile()) subscannerFiles.push(path.relative(root, target));
});
walk(subscannerRoot);

const checks = [
  ['source-binding input is the canonical evidence production inventory, not a reconstructed flattened tuple', () => {
    assert.match(responseInterface, /LaravelControllerResponseEvidenceSourceBindingInput<[\s\S]*?> = LaravelControllerResponseEvidenceProductionInventory<InvocationJudgment>/);
    assert.match(scanner, /const sourceBindingInput: LaravelControllerResponseEvidenceSourceBindingInput = inventory/);
  }],
  ['each same-source binding entry retains its exact producing method observation', () => {
    assert.match(responseInterface, /kind: 'response_evidence_same_source';\s+readonly observation: LaravelControllerResponseEvidenceProductionObservation/);
  }],
  ['each different-source binding entry retains its exact producing method observation', () => {
    assert.match(responseInterface, /kind: 'response_evidence_different_source';\s+readonly observation: LaravelControllerResponseEvidenceProductionObservation/);
  }],
  ['binding traverses observation-owned evidence instead of flattening inventory evidence', () => {
    assert.match(pipeline, /input\.observations\.flatMap\(observation => observation\.evidence\.map\(evidence => bindEntry\(observation, evidence\)\)\)/);
    assert.doesNotMatch(pipeline, /input\.evidence\.map\(bindEntry\)/);
  }],
  ['the identity authority remains the only source identity owner', () => {
    assert.match(pipeline, /laravelSourceIdentitySemantics\.relateSourceFiles\(input\.invocationJudgment\.sourceFile, evidence\.sourceFile\)/);
    assert.match(responseInterface, /readonly owner: 'LaravelSourceIdentitySemanticsInterface'/);
  }],
  ['observation ownership is an explicit source-binding contract obligation', () => {
    assert.match(responseInterface, /readonly observationOwnership: 'every-bound-evidence-item-retains-the-exact-controller-method-observation-that-produced-it'/);
    assert.match(responseInterface, /readonly observationCoverage: 'binding-iterates-canonical-observations-and-their-evidence;flattened-inventory-is-not-the-source-of-method-association'/);
    assert.match(pipeline, /observationOwnership: 'every-bound-evidence-item-retains-the-exact-controller-method-observation-that-produced-it'/);
  }],
  ['source-binding contract version advances to 6', () => {
    assert.match(responseInterface, /interface LaravelControllerResponseEvidenceSourceBindingContract \{[\s\S]*?contractVersion: 6/);
    assert.match(pipeline, /kind: 'laravel_controller_response_evidence_source_binding_contract',[\s\S]*?contractVersion: 6/);
  }],
  ['response pipeline interface and contract advance to version 7', () => {
    assert.match(responseInterface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 7/);
    assert.match(responseInterface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 7/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 7/);
  }],
  ['response runtime executor still delegates to the existing response authority', () => {
    assert.match(pipeline, /function executeResponse[\s\S]*?return responseSemanticAuthority\.judge\(input\)/);
    assert.match(pipeline, /authority: responseSemanticAuthority/);
  }],
  ['scanner preserves the exact response judgment through the existing AST projection authority', () => {
    assert.match(scanner, /pipeline\.responseExecutor\.execute\(responseInput\)/);
    assert.match(scanner, /responseSemanticPipeline\.astProjection\.judge\(\{ kind: 'integrated_invocation_response_judgment', judgment: invocationJudgment, responseJudgment \}\)/);
  }],
  ['no relation/foundation subscanner is added by this phase', () => {
    assert.equal(subscannerFiles.some(file => /phase2003|responseBindingObservation/i.test(path.basename(file))), false);
    assert.match(docs, /No new `relation` or `foundation` subscanner/);
  }],
  ['documentation records the unresolved semantic limitation honestly', () => {
    assert.match(docs, /does not yet classify return expressions into a closed response product/);
    assert.match(docs, /Full project typecheck and build were not run/);
  }],
];

const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2003, audit: 'response-binding-observation-ownership-interface', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2003_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
