const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pipeline = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const sourceBinding = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const controllerJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const controllerAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const resourceModel = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scannerBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['connected pipeline evidence requires a closed source-binding judgment', /php_source_invocation_pipeline_connected[\s\S]*?sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, \{ readonly kind: 'php_source_invocation_semantic_source_binding_closed' \}>/.test(pipeline)],
  ['complete and blocked outcomes both retain the exact source-binding judgment', /php_source_invocation_integration_complete[\s\S]*?sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment[\s\S]*?php_source_invocation_integration_blocked[\s\S]*?sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment/.test(integrationInterface)],
  ['integration projection forwards sourceBinding by identity without reconstruction', /sourceBinding: evidence\.sourceBinding/.test(integration) && /pipeline: evidence\.sourceBinding\.pipelineResult/.test(integration)],
  ['source-binding adapter carries the exact closed judgment into connected evidence', /sourceBinding: judgment/.test(sourceBinding) && !/result: judgment\.pipelineResult/.test(sourceBinding)],
  ['four integration outcomes remain distinct', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => integrationInterface.includes(kind))],
  ['integration contract version 10 preserves binding receipts and rejected evidence', /readonly version: 10/.test(integrationInterface) && /sourceBindingPreservation/.test(integrationInterface) && /rejectedEvidencePreservation/.test(integrationInterface) && /version: 10/.test(integrationInterface)],
  ['controller judgment contract records the binding-receipt invariant', /bindingReceiptRule/.test(controllerJudgment) && /bindingReceiptRule/.test(controllerAuthority)],
  ['resource invocation integration model includes source-binding receipt preservation', /contractVersion: 4/.test(resourceModel) && /sourceBindingReceipt/.test(resourceModel) && /rejectedSourceBindingEvidence/.test(resourceModel)],
  ['source-binding projection is performed at the wiring composition root before scanner input', /sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment/.test(scannerBinding) && /phpSourceInvocationSemanticPipelineIntegrationAuthority\.project\(phpSourceInvocationPipelineEvidenceFromSourceBinding\(sourceBinding\)\)/.test(scannerBinding) && !scanner.includes('createControllerDataflowAnalyzerFromPhpSourcePipeline')],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(pipeline + integrationInterface + integration + sourceBinding + controllerJudgment + controllerAuthority + resourceModel + scanner + scannerBinding)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1870-laravel-invocation-source-binding-receipt-interface-first'] === 'node scripts/audits/audit-phase1870-laravel-invocation-source-binding-receipt-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
