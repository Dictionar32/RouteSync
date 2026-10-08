const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const passes = [];
function requirePattern(rel, pattern, label) {
  if (pattern.test(read(rel))) passes.push(label);
  else failures.push(`${rel}: missing ${label}`);
}
function forbidPattern(rel, pattern, label) {
  if (pattern.test(read(rel))) failures.push(`${rel}: forbidden downstream reconstruction: ${label}`);
  else passes.push(label);
}

requirePattern('packages/core/src/types/upstream/operationIdentityCapability.ts', /OperationIdentityCapabilityContract/, 'operation identity is a closed upstream contract');
requirePattern('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', /operationIdentityCapabilityFromRoute/, 'identity contract is constructed by upstream authority');
requirePattern('packages/cli/src/generators/classifier/routeGrouper.ts', /route\.capability\.actionName\.value\.value/, 'CLI grouping consumes upstream action name');
requirePattern('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/, 'SDK emitter projects upstream operation identity capability');
requirePattern('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /route\.raw\.capability\.hookKind/, 'SDK emitter projects upstream hook capability');
requirePattern('packages/core/src/types/dataflow/dataFlowInterface.ts', /DataFlowConsumerInterface/, 'dataflow consumer interface exists');
requirePattern('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts', /upstream_to_downstream/, 'wiring direction is explicit');
forbidPattern('packages/react/src/hooks/define/intent/groupHookResult.ts', /TEndpoint extends \{ update: infer TU \}[\s\S]*TEndpoint extends \{ put: infer TU \}[\s\S]*TEndpoint extends \{ patch: infer TU \}/, 'React response type does not infer updateSelf from transport aliases');
forbidPattern('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /CANONICAL_ACTION_MAP|getActionFromMethod/, 'CLI emitter does not use method-to-action classifier');
forbidPattern('packages/cli/src/generators/names.ts', /function toActionName[\s\S]*route\.identity\.coordinates\.method/, 'CLI action naming does not derive semantic action from method/path');
forbidPattern('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'SDK hook kind is not selected from HTTP method');

const result = { audit: 'phase1312-semantic-contract-projection', topology: 'source evidence -> upstream reasoning -> closed capability contract -> wiring -> downstream projection', passed: failures.length === 0, passedChecks: passes.length, passes, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
