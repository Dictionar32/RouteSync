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
requireText('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningExecutionAlgebraInterface', 'semantic reasoning execution algebra');
requireText('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningProducerInterface', 'semantic reasoning producer interface');
requireText('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningConsumerInterface', 'semantic reasoning consumer interface');
requireText('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningWiringInterface', 'semantic reasoning upstream wiring');
requireText('packages/core/src/types/upstream/semanticCapability.ts', "'operation_identity_capability'", 'operation identity capability kind');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'operationIdentityCapabilityFromRoute', 'operation identity upstream authority');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'SemanticReasoningContract', 'operation identity proof-carrying reasoning');
requireText('packages/core/src/types/upstream/route.ts', 'readonly actionName: ActionName', 'route action-name semantic capability');
requireText('packages/core/src/types/upstream/route.ts', "readonly schemaRole: 'request' | 'response'", 'route schema role is a closed capability');
requireText('packages/core/src/types/upstream/routeExecutionVocabulary.ts', 'type RoutePayloadLocationDecision', 'payload placement has a closed evidence-decision algebra');
requireText('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts', 'payloadLocationDecision: RoutePayloadLocationDecision', 'payload placement authority returns provenance with the semantic value');
requireText('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts', 'payloadLocationDecision: capability.payloadLocationDecision', 'payload placement evidence is preserved through upstream wiring');
requireText('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts', "presenceFold(overrides.schemaRole, () => 'request' as const", 'schema role is closed from explicit upstream evidence, not hook kind');
forbidText('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts', /schemaRole[^;\n]*hookKind|hookKind[^;\n]*schemaRole/, 'schema role inferred from hook execution kind');
requireText('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts', 'schemaRole: params.schemaRole', 'schema role preserved into closed route capability');
requireText('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts', 'reasoning: capability.reasoning', 'route boundary wiring preserves the exact upstream proof contract');
requireText('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts', 'const reasoning = params.reasoning', 'route capability composition consumes upstream proof without reconstruction');
forbidText('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts', /semanticReasoningContract\s*\(/, 'route capability builder mints a second reasoning contract');
requireText('packages/core/src/types/upstream/domainIntentCapability.ts', 'DomainIntentCapabilityContract', 'domain intent capability contract');
requireText('packages/core/src/types/upstream/resourceGroupCapability.ts', 'ResourceGroupCapabilityContract', 'resource group shape is a closed upstream capability');
requireText('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts', 'resourceGroupCapabilities: resourceGroupCapabilitiesFromRoutes(routes)', 'scanner wiring emits group capability before generator');
requireText('packages/cli/src/generators/classifier/domainGraphBuilder.ts', 'Missing closed upstream ResourceGroupCapability', 'generator fails closed without upstream group capability');
forbidText('packages/cli/src/generators/classifier/domainGraphBuilder.ts', /if \(res\.index && res\.show\)/, 'generator infers CRUD group kind from endpoint slots');
requireText('packages/core/src/types/upstream/domainIntentCapability.ts', 'domainIntentCapabilitiesFromFrontend', 'domain intent upstream authority');
requireText('packages/core/src/types/upstream/routeParameterCapability.ts', 'RouteParameterCapabilityContract', 'route parameter capability contract');
requireText('packages/core/src/types/upstream/routeParameterCapability.ts', 'routeParameterCapabilityReferenceFromRoute', 'route parameter upstream projection');
requireText('packages/core/src/types/dataflow/dataFlowInterface.ts', 'DataFlowProducerInterface', 'dataflow producer/consumer separation');
requireText('packages/core/src/types/interfaces/operationIdentityProjectionInterface.ts', 'UpstreamWiringInterface', 'operation identity upstream wiring');
requireText('packages/core/src/types/domain/routes.ts', 'operationIdentityCapability: OperationIdentityCapabilityContract', 'canonical route flow carries closed operation identity capability');
requireText('packages/core/src/compiler/scanner/descriptors/route/routeDeclarations.ts', 'operationIdentityCapabilityFromRoute(capability)', 'route semantic producer owns operation identity capability construction');
requireText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', 'operationIdentityReferenceFromCapability(route.raw.operationIdentityCapability)', 'CLI projects the closed upstream identity capability');
forbidText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityReferenceFromCapability\(route\.raw\.capability\)/, 'CLI does not pass route capability in place of operation identity capability');
forbidText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityCapabilityFromRoute\s*\(/, 'CLI does not construct semantic operation identity');
requireText('packages/core/src/types/dataflow/dataFlowProjectionInterface.ts', 'UpstreamWiringInterface', 'dataflow upstream wiring');
requireText('packages/sdk/src/api-runtime/types.ts', '$queryKey', 'typed endpoint query-key projection');
requireText('packages/sdk/src/defineApi.ts', 'missing the upstream operation identity projection', 'operation identity fail-closed boundary');
requireText('packages/sdk/src/generateHooks.ts', 'missing the upstream hook-kind capability', 'hook generation fail-closed semantic boundary');

forbidText('packages/sdk/src/api-runtime/optionSplitter.ts', /PathResolver|extractParams\(/, 'SDK parses route path for parameter semantics');
forbidText('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'HTTP method decides hook kind');
forbidText('packages/react/src/hooks/define/hookTypes.ts', /InferMethod<T>[\s\S]*extends ['"]GET['"]/, 'HTTP method decides React hook type');
forbidText('packages/react/src/hooks/define/hookTypes.ts', /InferHookKind<T>\s+extends|export type InferHookKind/, 'React interface conditionally classifies hook kind');
forbidText('packages/react/src/hooks/define/hookTypes.ts', /TEndpoint extends \{ update: infer TU \}[\s\S]*TEndpoint extends \{ put: infer TU \}[\s\S]*TEndpoint extends \{ patch: infer TU \}/, 'updateSelf response reconstructed from transport aliases');
forbidText('packages/react/src/hooks/define/intent/groupHookResult.ts', /TEndpoint extends \{ update: infer TU \}[\s\S]*TEndpoint extends \{ put: infer TU \}[\s\S]*TEndpoint extends \{ patch: infer TU \}/, 'group hook response reconstructed from transport aliases');
forbidText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /CANONICAL_ACTION_MAP|route\.method[\s\S]{0,100}actionName/, 'CLI emitter reclassifies semantic action from transport vocabulary');
forbidText('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts', /semanticReasoningContract\s*\(/, 'dataflow wiring mints a second reasoning contract instead of preserving upstream proof');
requireText('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts', 'reasoning: state.reasoningContract', 'dataflow wiring preserves exact upstream reasoning proof');
forbidText('packages/cli/src/generators/names.ts', /function toActionName[\s\S]*route\.identity\.coordinates\.method/, 'CLI naming helper reconstructs action identity from method/path');
forbidText('packages/sdk/src/generateHooks.ts', /\[\.\.\.endpoint\.\$key/, 'endpoint key reconstructed into query key');
forbidText('packages/cli/src/generators/classifier/routeGrouper.ts', /matchCrudRole|method\.toLowerCase\(\)/, 'CLI reconstructs action semantics from HTTP method');
forbidText('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts', /return Object\.freeze\(\{[\s\S]*?executionSignature,\s*invalidation,/, 'route capability resolution omits the resolved payload-location capability from its closed result');
forbidText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /getActionFromMethod|isMutationAction|CANONICAL_ACTION_MAP/, 'active CLI emitter does not import legacy method-to-action helpers');
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
