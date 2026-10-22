const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const react = read('packages/react/src/hooks/createHooks.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const identity = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const upstreamIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const dataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['React validates endpoint shape before consuming hook capability', /if \(!isEndpointCallable\(endpoint\)\)/.test(react)],
  ['endpoint guard verifies callable SDK endpoint shape', /typeof value !== 'function'/.test(react) && /Reflect\.get\(value, '\$def'\)/.test(react) && /Reflect\.get\(value, '\$queryKey'\)/.test(react)],
  ['endpoint guard accepts only closed hook-kind values', /hookKind === 'query' \|\| hookKind === 'infinite_query' \|\| hookKind === 'mutation'/.test(react)],
  ['React reads hook kind from the validated upstream endpoint definition', /const hookKind = endpoint\.\$def\.hookKind/.test(react)],
  ['React hook builder no longer asserts arbitrary group entries as EndpointCallable', !/endpoint as EndpointCallable/.test(react)],
  ['SDK operation identity remains guarded and directly consumed', /if \(!route\.operationIdentity\)/.test(sdk) && /const operationIdentity = route\.operationIdentity/.test(sdk) && !/as OperationIdentityReference/.test(sdk)],
  ['CLI projects operation identity from the upstream capability', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cli)],
  ['operation identity projection remains a representation-only boundary', /operationIdentityProjection/.test(identity) && /OperationIdentityCapabilityContract/.test(identity)],
  ['upstream operation identity contract retains evidence and reasoning', /SemanticCapabilityContractInterface<'operation_identity_capability'/.test(upstreamIdentity) && /readonly reasoning: SemanticReasoningContract/.test(upstreamIdentity)],
  ['manifest builder validates canonical AST before model and dataflow seed wiring', /validateCompleteSourceAst/.test(manifestBuilder) && /buildCompleteLaravelSourceModel/.test(manifestBuilder) && /semanticDataflowInputsFromSourceModel/.test(manifestBuilder)],
  ['dataflow and AST interfaces remain explicit separate boundaries', /DataFlowProducerInterface/.test(dataflow) && /DataFlowConsumerAlgebraInterface/.test(dataflow) && /DataFlowAuthorityInterface/.test(astDataflow)],
  ['Phase 1366 audit is registered without changing build or package version', packageJson.scripts['audit:phase1366-react-endpoint-contract-boundary'] === 'node scripts/audits/audit-phase1366-react-endpoint-contract-boundary.cjs' && packageJson.scripts.build === 'tsdown' && packageJson.version === '1.0.49'],
];
const report = {
  phase: 1366,
  title: 'React Endpoint Contract Boundary and Semantic Flow Trace',
  result: checks.every(([, passed]) => passed) ? 'passed' : 'failed',
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  trace: {
    operationIdentity: 'RouteCapabilityContract / reasoning -> OperationIdentityCapabilityRuntimeAlgebraInterface -> operationIdentityProjection -> CLI manifest projection -> SDK OperationIdentityReference -> SDK query key',
    hookCapability: 'upstream route capability -> CLI emitted hookKind -> SDK endpoint $def -> React createHooks validated EndpointCallable -> TanStack Query hook selection',
    dataflow: 'CompleteSourceAst validation -> CompleteLaravelSourceModel -> SemanticDataflowInput -> DataFlowInterface / AST dataflow authority -> IR projection',
    graph: 'schema/model relation evidence -> StructuralSemanticRelation -> GraphEdgeRelation; remains distinct from dataflow and IR semantics',
    candidateContracts: {
      SchemaRelationTarget: 'Preserve; current SchemaRelationIndexInterface and SemanticRelationReconciliationInterface already carry relation evidence; no distinct target-identity consumer demonstrated.',
      ControllerExpressionFact: 'Preserve pending a concrete expression-origin consumer not represented by existing controller semantic/dataflow contracts.',
      ExpressionDefinition: 'Preserve pending a consumer that requires an explicit expression/source pair beyond existing source-bearing AST.',
      ValidationRuleDefinition: 'Preserve separate from active ValidationRuleNode ADT until one canonical validation owner and lossless migration are established.'
    }
  },
  validationLimits: [
    'Static contract audit only; does not prove TypeScript typecheck, runtime tests, or full build.',
    'No new consumers were added for declaration-only contracts.',
    'Full build requires repository dependencies including tsdown.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1366-react-endpoint-contract-boundary.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.result !== 'passed') process.exitCode = 1;
