const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const passes = [];
const check = (condition, label) => (condition ? passes : failures).push(label);

const authority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const executionVocabulary = read('packages/core/src/types/upstream/routeExecutionVocabulary.ts');
const actionMap = read('packages/cli/src/generators/canonical/actionMap.ts');
const apiEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const reactGroupResult = read('packages/react/src/hooks/define/intent/groupHookResult.ts');
const reactHookTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const identityContract = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const identityAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');

check(/const payloadLocationDecision: RoutePayloadLocationDecision = presenceFold\(\s*overrides\.payloadLocation/.test(authority), 'payload location is resolved as a proof-carrying upstream decision');
check(/const payloadLocation = payloadLocationDecision\.location/.test(authority), 'legacy payload-location projection comes from the closed decision');
check(/executionSignature,\s*payloadLocation,\s*payloadLocationDecision,\s*schemaRole,\s*invalidation/.test(authority), 'closed route capability returns payload location and its decision provenance');
check(/routePayloadLocationFromMethod/.test(executionVocabulary), 'method-based payload convention remains isolated in upstream vocabulary');
check(/@deprecated Do not use this module for route classification or generation/.test(actionMap), 'legacy method-to-action helper is explicitly marked compatibility-only');
check(!/getActionFromMethod|isMutationAction|CANONICAL_ACTION_MAP/.test(apiEmitter), 'active CLI emitter does not consume legacy classifier');
check(!/TEndpoint extends \{ update: infer TU \}[\s\S]*TEndpoint extends \{ put: infer TU \}[\s\S]*TEndpoint extends \{ patch: infer TU \}/.test(reactGroupResult), 'React group result does not reconstruct updateSelf response from transport aliases');
check(!/InferHookKind<T>\s+extends|export type InferHookKind/.test(reactHookTypes), 'React does not reclassify closed hook kind via repeated conditional chain');
check(/interface OperationIdentityCapabilityContract extends OperationIdentityCapabilityAlgebraInterface/.test(identityContract), 'operation identity interface remains contract-only');
check(/operationIdentityCapabilityFromRoute/.test(identityAuthority), 'operation identity construction remains upstream-owned');
check(/DataFlowConsumerInterface/.test(dataflow) && /DataFlowWiringInterface/.test(dataflow), 'data-flow consumer and wiring algebra are explicitly separated');

const result = { audit: 'phase1313-upstream-capability-completeness', passed: failures.length === 0, passedChecks: passes.length, passes, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
