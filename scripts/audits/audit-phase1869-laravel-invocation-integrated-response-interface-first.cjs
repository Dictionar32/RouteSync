const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const resource = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['invocation preservation has a named upstream semantic model', /interface ResourceModelBindingInvocationIntegrationModelInterface/.test(model) && /RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL/.test(model)],
  ['the model binds the exact controller artifact, invocation judgment, and nested response', /each-artifact-retains-its-own-source-correlated-invocation-judgment/.test(model) && /retain-the-exact-judgment-owned-by-that-controller-artifact/.test(model) && /retain-the-exact-response-nested-in-that-invocation-judgment/.test(model)],
  ['all four integration outcomes remain distinct in the contract', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => model.includes(kind)) && ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => integration.includes(kind))],
  ['index joins, judgment reconstruction, and detached response sidecars are forbidden', /controller-resource-join-by-array-index/.test(model) && /invocation-judgment-reconstruction/.test(model) && /integrated-response-copy-into-detached-sidecar/.test(model)],
  ['the existing semantic judgment model reuses the named contract instead of a weaker inline duplicate', /readonly integratedResponse: ResourceModelBindingInvocationIntegrationModelInterface/.test(model) && /integratedResponse: RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL/.test(model)],
  ['resource integrated-response contract consumes that same upstream model and preserves rejected pipeline evidence', /readonly invocationPreservation: ResourceModelBindingInvocationIntegrationModelInterface/.test(resource) && /invocationPreservation: RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL/.test(resource) && /contractVersion: 4/.test(model) && /rejectedSourceBindingEvidence/.test(model)],
  ['integrated response keeps the exact controller scan and closed binding closure as one response', /readonly controllerScan: LaravelControllerScanJudgment/.test(resource) && /readonly bindingClosure: ResourceModelBindingBatchClosure/.test(resource) && /readonly artifacts: LaravelResourceScanArtifactSequence/.test(resource)],
  ['retirement is gated on upstream ownership and scanner semantics are projection-only', /upstream-source-correlated-contract-must-own-the-required-judgment-before-retirement/.test(model) && /consume-closed-judgment-and-project-source-artifacts-only/.test(model)],
  ['no semantic foundation dependency is introduced by the interface model', !/semantic\/foundation/.test(model + resource)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1869-laravel-invocation-integrated-response-interface-first'] === 'node scripts/audits/audit-phase1869-laravel-invocation-integrated-response-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
