const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2051_RUNTIME_FUNCTION_INVENTORY_INTERFACE_FIRST.md');
const inventory = read('scripts/audits/phase2051-runtime-function-inventory.csv');
const results = [];
const check = (name, fn) => {
  try { fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error.message }); }
};

check('pipeline interface owns integrated response judgment', () => {
  assert.match(iface, /readonly judgeIntegratedResponse:\s*<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>/);
  assert.match(iface, /LaravelControllerIntegratedResponseJudgment<InvocationJudgment>/);
});
check('integrated judgment input retains exact invocation and declaration evidence', () => {
  assert.match(iface, /interface LaravelControllerResponseIntegratedJudgmentInput[\s\S]*?readonly invocationJudgment: InvocationJudgment;[\s\S]*?readonly declarationEvidence: ControllerDeclarationEvidence;/);
});
check('pipeline interface and contract versions align at 17', () => {
  assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 17/);
  assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 17/);
  assert.match(pipeline, /const pipelineContract: LaravelControllerResponseSemanticPipelineContract = Object\.freeze\(\{\s*kind: 'laravel_controller_response_semantic_pipeline_contract',\s*contractVersion: 17/);
  assert.match(pipeline, /export const laravelControllerResponseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface = Object\.freeze\([\s\S]*?contractVersion: 17/);
});
check('pipeline implements integrated response judgment', () => {
  assert.match(pipeline, /function judgeIntegratedResponse<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>/);
  assert.match(pipeline, /judgeIntegratedResponse,\s*evidenceProduction/);
});
check('scanner delegates integrated response through interface', () => {
  assert.match(scanner, /responseSemanticPipeline\.judgeIntegratedResponse\(Object\.freeze\(\{/);
  assert.match(scanner, /kind: 'laravel_controller_response_integrated_judgment_input'/);
});
check('scanner no longer owns responseJudgmentFor runtime helper', () => {
  assert.doesNotMatch(scanner, /function responseJudgmentFor/);
  assert.doesNotMatch(scanner, /pipeline\.correlateDeclarationSource\(/);
  assert.doesNotMatch(scanner, /pipeline\.evidenceProduction\.produce\(/);
  assert.doesNotMatch(scanner, /pipeline\.evidenceSourceBinding\.bind\(/);
  assert.doesNotMatch(scanner, /pipeline\.responseExecutor\.execute\(/);
});
check('integrated response executor preserves exact invocation value', () => {
  assert.match(pipeline, /kind: 'laravel_controller_response_semantic_judgment_input',\s*invocationJudgment: input\.invocationJudgment,\s*sourceBindingJudgment/);
});
check('closed correlation rejection remains explicit', () => {
  assert.match(pipeline, /case 'controller_response_evidence_declaration_source_correlation_rejected':[\s\S]*?kind: 'controller_response_declaration_source_correlation_rejected'/);
});
check('inventory CSV exists and contains semantic candidates', () => {
  assert.match(inventory.split('\n')[0], /file,line,symbol,declaration,priority,initial_classification/);
  for (const token of ['astClassifierRuntime.ts', 'controllerAstCanonical.ts', 'controllerDataflowContract.ts', 'responseAttributeScanner.ts', 'propertyPathResolution.ts']) assert.ok(inventory.includes(token), `missing ${token}`);
});
check('report distinguishes semantic reasoning from pure projection', () => {
  assert.match(report, /semantic judgment\/derivation/);
  assert.match(report, /pure constructor\/structural projection/);
  assert.match(report, /No relation\/foundation subscanner is introduced/);
});
check('no duplicate invocation or response authority added', () => {
  assert.doesNotMatch(iface, /NewInvocationAuthority|ParallelResponseAuthority/);
  assert.match(iface, /responseMeaningOwner: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface'/);
});
check('source scan inventory has substantial coverage', () => {
  const rows = inventory.trim().split('\n');
  assert.ok(rows.length > 2000, `expected >2000 inventory rows, got ${rows.length - 1}`);
});

for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
