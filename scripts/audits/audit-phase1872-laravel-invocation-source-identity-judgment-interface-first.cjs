const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const bindingInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const bindingAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const controllerJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const controllerAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const resourceModel = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['source-file identity has a closed typed same/different relation ADT', sourceIdentity.includes("kind: 'same_source_file_identity'") && sourceIdentity.includes("kind: 'different_source_file_identity'")],
  ['source-binding outcome preserves a typed same-identity judgment', /php_source_invocation_semantic_source_binding_closed[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'same_source_file_identity' \}>/.test(bindingInterface)],
  ['source-binding outcome preserves a typed different-identity judgment', /php_source_invocation_semantic_source_binding_rejected[\s\S]*?identityJudgment: Extract<SourceFileIdentityRelationJudgment, \{ readonly kind: 'different_source_file_identity' \}>/.test(bindingInterface)],
  ['source-binding authority declares the canonical identity semantics dependency', /identitySemantics: LaravelSourceIdentitySemanticsInterface/.test(bindingInterface) && /identitySemantics: laravelSourceIdentitySemantics/.test(bindingAuthority)],
  ['source-binding authority delegates identity relation instead of duplicating primitive comparison', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(bindingAuthority) && !/relationEqual|relationGate/.test(bindingAuthority)],
  ['closed binding judgment preserves exact source identity judgment object', /case 'same_source_file_identity':[\s\S]*?closedBinding\(input, identityJudgment\)/.test(bindingAuthority)],
  ['rejected binding judgment preserves exact source identity judgment object and original pipeline evidence', /case 'different_source_file_identity':[\s\S]*?rejectedBinding\(input, identityJudgment\)/.test(bindingAuthority) && /pipelineResult: input\.pipelineResult/.test(bindingAuthority)],
  ['source-binding contract version 5 names typed identity judgment preservation', /readonly version: 5/.test(bindingInterface) && /version: 5/.test(bindingAuthority) && /identityJudgmentPreservation/.test(bindingInterface)],
  ['integrated response contract preserves identity judgment for every outcome', /readonly version: 10/.test(integrationInterface) && /sourceIdentityJudgmentPreservation/.test(integrationInterface)],
  ['controller judgment contract v9 preserves upstream identity relation and outcome correlation', /readonly version: 9/.test(controllerJudgment) && /version: 9/.test(controllerAuthority) && /identityJudgmentRule/.test(controllerJudgment) && /responseOutcomeCorrelation/.test(controllerJudgment)],
  ['resource invocation model preserves source identity relation and advances contract', /readonly contractVersion: 4/.test(resourceModel) && /sourceIdentityRelation/.test(resourceModel) && /contractVersion: 4/.test(resourceModel.split('export const RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL')[1] ?? '')],
  ['all four integration outcomes remain separate', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => integrationInterface.includes(kind))],
  ['scanner runtime and wiring are outside the changed-file scope', !/compiler\/scanner/.test('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(bindingInterface + bindingAuthority + integrationInterface + controllerJudgment + controllerAuthority + resourceModel)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1872-laravel-invocation-source-identity-judgment-interface-first'] === 'node scripts/audits/audit-phase1872-laravel-invocation-source-identity-judgment-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
