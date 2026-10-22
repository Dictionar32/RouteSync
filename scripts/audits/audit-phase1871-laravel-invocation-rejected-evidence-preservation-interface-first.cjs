const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const bindingInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const bindingAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const controllerJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const controllerAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const resourceModel = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['rejected source-binding judgment retains the exact pipeline result', /php_source_invocation_semantic_source_binding_rejected[\s\S]*?pipelineResult: PhpSourceInvocationSemanticPipelineResult/.test(bindingInterface)],
  ['rejection retains both competing source identities through the canonical different-identity judgment', /php_source_invocation_semantic_source_binding_rejected[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'different_source_file_identity' \}>/.test(bindingInterface) && /different_source_file_identity[\s\S]*?readonly left: SourceFile;[\s\S]*?readonly right: SourceFile/.test(read('packages/core/src/types/upstream/sourceProjectIdentity.ts'))],
  ['authority forwards the original pipeline result without reconstruction', /pipelineResult: input\.pipelineResult/.test(bindingAuthority)],
  ['source-binding contract version 5 makes identity judgment the canonical endpoint owner', /readonly version: 5/.test(bindingInterface) && /version: 5/.test(bindingAuthority) && /sourceEndpointOwnership/.test(bindingInterface)],
  ['integration rejection preserves the complete binding judgment', /php_source_invocation_integration_source_binding_rejected[\s\S]*?judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment/.test(integrationInterface) && /judgment: evidence\.judgment/.test(integration)],
  ['integration contract version 10 names rejected evidence preservation', /readonly version: 10/.test(integrationInterface) && /rejectedEvidencePreservation/.test(integrationInterface) && /version: 10/.test(integrationInterface.split('export const PHP_SOURCE')[1] ?? '')],
  ['controller judgment contract v10 preserves rejected evidence and outcome correlation', /readonly version: 11/.test(controllerJudgment) && /version: 11/.test(controllerAuthority) && /rejectedEvidenceRule/.test(controllerJudgment) && /rejectedEvidenceRule/.test(controllerAuthority) && /responseOutcomeCorrelation/.test(controllerJudgment)],
  ['resource integrated-response model advances to version 4 and preserves rejected pipeline evidence', /contractVersion: 4/.test(resourceModel) && /rejectedSourceBindingEvidence/.test(resourceModel) && /rejectedSourceBindingEvidence/.test(resourceModel.split('export const RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL')[1] ?? '')],
  ['complete, blocked, rejected and not-connected remain distinct outcomes', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => integrationInterface.includes(kind))],
  ['no scanner runtime or wiring files are modified by this phase', !/compiler\/scanner/.test('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts')],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(bindingInterface + bindingAuthority + integrationInterface + integration + controllerJudgment + controllerAuthority + resourceModel)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1871-laravel-invocation-rejected-evidence-preservation-interface-first'] === 'node scripts/audits/audit-phase1871-laravel-invocation-rejected-evidence-preservation-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
