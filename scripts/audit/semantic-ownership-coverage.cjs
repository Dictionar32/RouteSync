const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const pass = [];

function requireText(rel, needle, label) {
  const source = read(rel);
  if (source.includes(needle)) pass.push(label);
  else failures.push(`${rel}: missing ${label}`);
}

function forbidText(rel, pattern, label) {
  const source = read(rel);
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'm');
  if (re.test(source)) failures.push(`${rel}: semantic reconstruction remains: ${label}`);
  else pass.push(label);
}

requireText('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts', 'upstream_to_downstream', 'upstream wiring direction contract');
requireText('packages/core/src/types/dataflow/dataFlowInterface.ts', 'DataFlowConsumerInterface', 'closed dataflow consumer interface');
requireText('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningContract', 'semantic reasoning contract');
requireText('packages/core/src/types/upstream/semanticCapability.ts', "'operation_identity_capability'", 'operation identity capability kind');
requireText('packages/core/src/types/upstream/operationIdentityCapability.ts', 'operationIdentityCapabilityFromRoute', 'operation identity upstream authority');
requireText('packages/core/src/types/upstream/domainIntentCapability.ts', 'DomainIntentCapabilityContract', 'domain intent capability contract');
requireText('packages/core/src/types/upstream/domainIntentCapability.ts', 'domainIntentCapabilitiesFromFrontend', 'domain intent upstream authority');
requireText('packages/core/src/types/upstream/routeParameterCapability.ts', 'RouteParameterCapabilityContract', 'route parameter capability contract');
requireText('packages/core/src/types/upstream/routeParameterCapability.ts', 'routeParameterCapabilityReferenceFromRoute', 'route parameter upstream projection');
requireText('packages/core/src/types/dataflow/dataFlowInterface.ts', 'DataFlowProducerInterface', 'dataflow producer/consumer separation');
requireText('packages/core/src/types/interfaces/operationIdentityProjectionInterface.ts', 'UpstreamWiringInterface', 'operation identity upstream wiring');
requireText('packages/core/src/types/dataflow/dataFlowProjectionInterface.ts', 'UpstreamWiringInterface', 'dataflow upstream wiring');
requireText('packages/sdk/src/api-runtime/types.ts', '$queryKey', 'typed endpoint query-key projection');
requireText('packages/sdk/src/defineApi.ts', 'missing the upstream operation identity projection', 'operation identity fail-closed boundary');
requireText('packages/sdk/src/generateHooks.ts', 'missing the upstream hook-kind capability', 'hook generation fail-closed semantic boundary');

forbidText('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'HTTP method decides hook kind');
forbidText('packages/sdk/src/generateHooks.ts', /\[\.\.\.endpoint\.\$key/, 'endpoint key reconstructed into query key');
forbidText('packages/react/src/hooks/define/intentWrapper.ts', /operationId\.split\(['"]\.['"]\)/, 'operation identity is parsed in React');
forbidText('packages/react/src/hooks/define/intent/mutationResolvers.ts', /infer TGroup|infer TAction|split\(['"]\.['"]\)/, 'operation identity is reconstructed in React type resolution');
forbidText('packages/react/src/hooks/define/groupSlotResolver.ts', /PathResolver|\.path[^\n]*includes\(['"]:['"]\)/, 'route path is used as semantic authority');
forbidText('packages/react/src/hooks/define/groupSlotResolver.ts', /const CRUD_KEYS|group\.(?:list|get|show|update|put|patch|delete|remove)/, 'endpoint names are used as CRUD authority');
forbidText('packages/react/src/hooks/define/intentWrapper.ts', /(?:intentType|intent\.(?:capabilities|operations|config))/, 'raw domain intent is reconstructed in React');
forbidText('packages/react/src/hooks/crud/builders/extraHooksBuilder.ts', /name\.startsWith\((?:'create'|'add'|'apply'|'update'|'set'|'change'|'remove'|'delete'|'clear')/, 'action name decides CRUD role');
forbidText('packages/react/src/hooks/crud/builders/extraHooksBuilder.ts', /method\s*===\s*['"]GET['"]/, 'HTTP method decides extra hook kind');
forbidText('packages/react/src/hooks/useMutation.ts', /queryKey:\s*\[group\]/, 'group string becomes semantic invalidation authority');

const result = {
  audit: 'semantic-ownership-coverage',
  topology: 'upstream semantic reasoning -> capability contract/interface -> upstream wiring -> downstream projection',
  passed: failures.length === 0,
  passedChecks: pass.length,
  failures,
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
