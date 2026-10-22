const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const failures = [];
const passed = [];
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const has = (rel, needle, label) => {
  if (read(rel).includes(needle)) passed.push(label);
  else failures.push(`${rel}: missing ${label}`);
};
const forbids = (rel, pattern, label) => {
  if (pattern.test(read(rel))) failures.push(`${rel}: forbidden duplicate semantic ownership: ${label}`);
  else passed.push(label);
};

// AST/ADT contract -> algebra -> authority pipeline -> analysis/target consumers.
has('packages/core/src/types/upstream/astSemanticStageContract.ts', 'AST_SEMANTIC_STAGE_GRAPH', 'closed upstream AST stage graph exists');
has('packages/core/src/types/upstream/astSemanticStageContract.ts', 'stageGraphContains', 'stage graph exposes membership relation');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', "import { stageGraphContains } from './astSemanticStageContract'", 'AST authority pipeline imports canonical stage graph');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'stageGraphContains(stage)', 'AST pipeline validates stages against declared graph');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'astSemanticPipelineInterfaces(pipeline)', 'AST pipeline projects all ports once through the canonical interface algebra');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'relationFirstOption(interfaces', 'AST pipeline selects stage interfaces from the closed projected interface sequence');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'astSemanticInterfaceProofs(from)', 'AST transition validation consumes the canonical proof projection helper');
has('packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts', 'astSemanticStageTransition(from.stage, to.stage', 'pipeline transition is validated by transition algebra');
has('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts', 'astSemanticPipelineInterfaces', 'AST interface algebra can project all pipeline ports');
has('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts', 'astSemanticStageInterfaceOf', 'AST port is projected to closed semantic interface');
has('packages/core/src/types/upstream/astDataflowInterface.ts', 'DataFlowAuthorityInterface<', 'AST dataflow contract reuses read-only canonical dataflow authority');
has('packages/core/src/compiler/analysis/astAnalysisInterface.ts', 'readonly dataflow: AstDataflowInterface', 'AST analysis consumes the upstream AST dataflow contract');
has('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'operationIdentityCapabilityFromRoute', 'operation identity is sealed by upstream authority');
has('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts', 'manifest.ast.ast.routeFlows', 'manifest wiring forwards canonical route flows with their upstream identity capability');
has('packages/cli/src/generators/sdk/apiObjectEmitter.ts', 'operationIdentityReferenceFromCapability(route.raw.operationIdentityCapability)', 'CLI projects identity capability without reclassification');
has('packages/core/src/types/upstream/resourceGroupCapabilityAuthority.ts', 'resourceGroupCapabilityAuthority', 'resource-group semantic capability has upstream authority');
has('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts', 'resourceGroupCapabilityAlgebra: ResourceGroupCapabilityAlgebraInterface', 'resource-group semantics are implemented behind their declared algebra contract');
has('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts', 'relationFold', 'resource-group aggregation uses the canonical relation fold');
has('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts', 'relationIndexLookup', 'resource-group grouping uses relation-index lookup rather than host Map');
has('packages/core/src/types/upstream/resourceGroupCapabilityAuthority.ts', 'resourceGroupCapabilityAlgebra.compose(routes)', 'resource-group authority delegates rather than reclassifying');
has('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts', 'resourceGroupCapabilities: manifest.resourceGroupCapabilities', 'resource-group capability is forwarded through wiring');
has('packages/cli/src/generators/classifier/domainGraphBuilder.ts', 'Missing closed upstream ResourceGroupCapability', 'downstream fails closed when upstream capability is absent');
has('packages/core/src/types/upstream/semanticReconciliationAlgebra.ts', 'semanticReconciliationAlgebra', 'semantic reconciliation rules live in a named upstream algebra');
has('packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts', 'effectiveControllerActionPolicyAlgebra', 'effective policy interpretation lives in upstream algebra');
forbids('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityCapabilityFromRoute\s*\(/, 'CLI does not reconstruct operation identity');
forbids('packages/cli/src/generators/classifier/domainGraphBuilder.ts', /resourceGroupCapabilitiesFromRoutes/, 'CLI does not reconstruct resource-group capability');
forbids('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'SDK does not infer hook semantics from HTTP method');
forbids('packages/react/src/hooks/define/intentWrapper.ts', /operationId\.split\(['"]\.['"]\)/, 'React does not parse operation identity to infer domain intent');

const result = {
  phase: 1353,
  audit: 'upstream-ast-contract-closure',
  topology: 'upstream contract -> algebra/authority -> AST/dataflow interface -> wiring -> downstream projection',
  passed: failures.length === 0,
  passedChecks: passed.length,
  failures,
  scopeNote: 'Static source-boundary audit; it does not substitute for TypeScript build or runtime tests.',
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
