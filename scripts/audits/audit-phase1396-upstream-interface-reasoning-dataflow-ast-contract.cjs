const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const packageJson = JSON.parse(read('package.json'));
const operation = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationProducer = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const semanticCapability = read('packages/core/src/types/upstream/semanticCapability.ts');
const semanticReasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const inputFactory = read('packages/core/src/types/upstream/semanticDataflowInputFactory.ts');
const dataflowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const astSemanticAlgebra = read('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts');
const dataflowAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeBoundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const runtimePolicy = read('packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const emitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const relationCalculus = read('packages/core/src/semantic/foundation/semanticRelations.ts');
const checks = {
  operationIdentityHasClosedContract: /OperationIdentityCapabilityContractMaterializerInterface/.test(operation) && /OperationIdentityCapabilityContract/.test(operation),
  operationIdentityAuthorityDelegatesToMaterializer: /materializer\.materialize\(input\)/.test(operationAuthority),
  routeProducerUsesAuthorityNotRawMaterializer: /operationIdentityCapabilityFromRoute\(boundary\.capability\)/.test(operationProducer) && !/materializeOperationIdentityCapability\(boundary\.capability\)/.test(operationProducer),
  semanticCapabilityComposesProofAndClosure: /SemanticCapabilityAlgebraInterface/.test(semanticCapability) && /SemanticCapabilityClosureInterface/.test(semanticCapability),
  reasoningSeparatesProducerAndConsumer: /SemanticReasoningProducerInterface/.test(semanticReasoning) && /SemanticReasoningConsumerInterface/.test(semanticReasoning) && /SemanticReasoningContract/.test(semanticReasoning),
  canonicalDataflowUsesClosedFactAdt: /kind: 'dependency'/.test(semanticDataflow) && /kind: 'value_flow'/.test(semanticDataflow) && /kind: 'reaches'/.test(semanticDataflow),
  inputProducerPreservesLineage: /semanticDataflowFactWithLineage/.test(inputFactory) && /producer/.test(inputFactory),
  genericDataflowSeparatesExecutionFromAuthority: /DataFlowExecutionAlgebraInterface/.test(dataflowInterface) && /DataFlowAuthorityInterface/.test(dataflowInterface) && /DataFlowConsumerInterface/.test(dataflowInterface),
  astDataflowAliasesCanonicalInputAndJudgment: /AstDataflowInput = SemanticDataflowInput/.test(astDataflow) && /AstDataflowJudgment = SemanticDataflowJudgment/.test(astDataflow),
  astSemanticInterfaceCarriesFactsAndProofs: /readonly facts: readonly AstSemanticStageFact\[\]/.test(astSemanticAlgebra) && /readonly proofs: readonly AstSemanticStageProof\[\]/.test(astSemanticAlgebra),
  dataflowAdapterForwardsExactProof: /reasoning: judgment\.reasoningContract/.test(dataflowAdapter) && !/semanticReasoningContract\s*\(/.test(dataflowAdapter),
  runtimeBoundaryAcceptsClosedJudgmentOnly: /UpstreamWiringInterface<\s*SemanticDataflowJudgment,\s*SemanticDataflowRuntimeDataFlow/.test(runtimeBoundary),
  manifestBuildsJudgmentsUpstream: /semanticDataflowJudgmentsFromInputs\(dataflowInputs\)/.test(manifestBuilder),
  manifestProjectionForwardsClosedJudgments: /dataflowJudgments: manifest\.dataflowJudgments/.test(manifestProjection) && /dataflowQueryPolicyContracts: manifest\.dataflowQueryPolicyContracts/.test(manifestProjection),
  runtimePolicyDecodesBeforeExecution: /decodeSemanticDataflowQueryPolicyContract\(candidate, dataflow\.state\)/.test(runtimePolicy),
  graphUsesStructuralRelationsNotDataflowClosure: /StructuralSemanticRelation/.test(graph) && /GraphEdgeRelation/.test(graph),
  irConsumesClosedDataflowClosure: /dataflow\.state\.closure/.test(ir) && !/createSemanticDataflowJudgment/.test(ir),
  sdkFailsClosedWithoutOperationIdentity: /missing the upstream operation identity projection/.test(sdk),
  cliProjectsIdentityCapability: /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(emitter),
  reactConsumesResolvedHookCapability: /hookKind/.test(react) && !/method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/.test(react),
  relationCalculusIsExplicit: /relationResolve/.test(relationCalculus) && /relationEqual/.test(relationCalculus),
  laravelEcommerceFixturePresent: exists('examples/ecommerce-shop-source/routes/web.php') && exists('examples/ecommerce-shop-source/app/Http'),
  packageUsesTypeScript7WithoutBuildScriptMutation: packageJson.devDependencies.typescript === '7.0.2' && packageJson.scripts.build === 'tsdown' && packageJson.version === '1.0.49',
};
const result = {
  phase: 1396,
  audit: 'upstream-interface-reasoning-dataflow-ast-contract',
  topology: 'Laravel/AST evidence -> upstream reasoning + capability contract -> closed DataFlow/AST ADT -> wiring -> manifest/graph/IR -> SDK/React',
  checks: Object.entries(checks).map(([name, passed]) => ({ name, passed })),
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  failures: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name),
  references: {
    typescript: 'runtime data requires narrowing; static annotations do not validate external values',
    codeql: 'AST nodes and dataflow nodes are distinct representations with separate analyses',
    mlir: 'interfaces let generic passes operate without hard-coding each dialect operation',
  },
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1396-upstream-interface-reasoning-dataflow-ast-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ phase: result.phase, audit: result.audit, passed: result.failures.length === 0, passedChecks: result.passedChecks, totalChecks: result.totalChecks, failures: result.failures, report: path.relative(root, reportPath) }, null, 2));
process.exitCode = result.failures.length ? 1 : 0;
