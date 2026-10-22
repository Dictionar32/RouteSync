const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const ast = read('packages/core/src/types/upstream/astSemanticInterface.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const reasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
const dataflowTypes = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const dataflowAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeBoundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const operationContract = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationWiring = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const cliEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const packageJson = JSON.parse(read('package.json'));
const exampleAxios = read('examples/ecommerce-shop-source/frontend/src/lib/core/api-client.ts');
const exampleQuery = read('examples/ecommerce-shop-source/frontend/src/lib/query-client.ts');
const exampleSchema = read('examples/ecommerce-shop-source/frontend/src/api-compiler/contract/api-contract.ts');
const exampleMapper = read('examples/ecommerce-shop-source/frontend/src/api-compiler/mappers/api-mapper.ts');
const cliPathClassifier = read('packages/cli/src/generators/classifier/pathClassifier.ts');
const cliRouteGrouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const checks = [
  ['AST closure records rule applications with typed premises and conclusions', /const ruleDerivation\s*=/.test(ast) && /kind:\s*'ast_semantic_derivation'/.test(ast) && /premises:\s*Object\.freeze\(relationProject\(rule\.premises/.test(ast) && /conclusions:\s*Object\.freeze\(conclusions\)/.test(ast)],
  ['AST closure returns upstream derivation witnesses instead of a hard-coded empty list', /facts:\s*fixed\.value\.facts[\s\S]*derivations:\s*fixed\.value\.derivations/.test(ast) && /const closeFacts[\s\S]*return Object\.freeze\(\{[\s\S]*derivations:\s*fixed\.value\.derivations/.test(ast)],
  ['AST closure accumulates derivations in the same fixed-point state as facts', /type AstSemanticClosureState[\s\S]*derivations:\s*readonly AstSemanticDerivation\[\][\s\S]*round:\s*number/.test(ast) && /relationFixedPoint\([\s\S]*current\.derivations[\s\S]*applications\.derivations/.test(ast)],
  ['Focused AST proof closure tests cover matched and unmatched rules', exists('packages/core/src/types/upstream/__tests__/ast-semantic-closure-proof.phase1382.test.ts')],
  ['AST dataflow interface aliases canonical upstream input and judgment', /SemanticDataflowInput/.test(astDataflow) && /SemanticDataflowJudgment/.test(astDataflow) && /DataFlowAuthorityInterface</.test(astDataflow)],
  ['Dataflow authority exposes only read-only query/closure facets to consumers', /interface DataFlowAuthorityInterface/.test(dataflowTypes) && /readonly reaches:/.test(dataflowTypes) && /readonly authority:\s*'upstream'/.test(dataflowTypes)],
  ['Producer reasoning operations are separated from consumer authority', /SemanticReasoningExecutionAlgebraInterface/.test(reasoning) && /SemanticReasoningAuthorityInterface/.test(reasoning) && /DataFlowExecutionAlgebraInterface/.test(dataflowTypes) && /DataFlowAuthorityInterface/.test(dataflowTypes)],
  ['Dataflow adapter preserves the authority-produced judgment and proof', /const state = authority\.judge\(input\)/.test(dataflowAdapter) && /reasoning:\s*state\.reasoningContract/.test(dataflowAdapter) && /state,/.test(dataflowAdapter) || /judgment\.reasoningContract/.test(dataflowAdapter) && /state:\s*judgment/.test(dataflowAdapter) && !/authority\.judge/.test(dataflowAdapter)],
  ['Runtime boundary is typed as upstream-input to read-only authority wiring', /UpstreamWiringInterface<[\s\S]*SemanticDataflowJudgment[\s\S]*SemanticDataflowRuntimeDataFlow/.test(runtimeBoundary) && !/SemanticDataflowInput/.test(runtimeBoundary)],
  ['Dataflow authority owns fixed-point reachability/path closure', /relationFixedPoint/.test(dataflowAuthority) && /pathClosure/.test(dataflowAuthority) && /derivationsFor/.test(dataflowAuthority)],
  ['Operation identity contract contains closed identity and reasoning proof', /OperationIdentityCapabilityContract extends OperationIdentityCapabilityAlgebraInterface/.test(operationContract) && /readonly reasoning: SemanticReasoningContract/.test(operationContract)],
  ['Operation identity authority delegates to the canonical materializer instead of rebuilding the contract', /materialize:\s*\(input: OperationIdentityCapabilityInput\): OperationIdentityCapabilityContract\s*=>\s*materializer\.materialize\(input\)/.test(operationAuthority) && /operationIdentityCapabilityContractMaterializer/.test(operationAuthority)],
  ['Operation identity wiring accepts closed capability and projects a reference', /capability:\s*OperationIdentityCapabilityContract/.test(operationWiring) && /operationIdentityProjection\.project\(capability\)/.test(operationWiring)],
  ['IR projects from read-only canonical dataflow authority', /DataFlowAuthorityInterface/.test(irProjection) && /dataflow\.state/.test(irProjection)],
  ['CLI emitter consumes the already-resolved operation identity capability', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cliEmitter)],
  ['React, SDK, CLI, and ecommerce source integration surfaces are present', exists('packages/react/src') && exists('packages/sdk/src') && exists('packages/cli/src') && exists('examples/ecommerce-shop-source')],
  ['Ecommerce target keeps Axios, Zod, TanStack Query, and mapper contracts in their target layer', /axios/.test(exampleAxios) && /QueryClient/.test(exampleQuery) && /from ['\"]zod['\"]/.test(exampleSchema) && /mapper/.test(exampleMapper)],
  ['CLI path classifier is an empty compatibility seam and routeGrouper projects upstream capability', cliPathClassifier.trim().length === 0 && /route\.capability\.crudRole/.test(cliRouteGrouper) && /route\.capability\.actionName/.test(cliRouteGrouper) && /No path inspection, HTTP-method classification, or fallback role/.test(cliRouteGrouper)],
  ['Build command and package version are preserved', packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown'],
];
const failures = checks.filter(([, passed]) => !passed);
const report = {
  phase: 1382,
  audit: 'upstream-ast-proof-dataflow-contract',
  passedChecks: checks.length - failures.length,
  totalChecks: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  findings: {
    canonicalAstProofOwner: 'packages/core/src/types/upstream/astSemanticInterface.ts',
    canonicalDataflowOwner: 'packages/core/src/types/upstream/semanticDataflowAuthority.ts',
    runtimeConsumerBoundary: 'DataFlowAuthorityInterface via SemanticDataflowRuntimeBoundary',
    targetProjection: 'Axios transport + Zod schema + mapper + TanStack Query are target-layer consumers, not semantic authorities',
    migrationDebt: ['CLI path/route grouping classifiers require per-consumer proof that they project closed capabilities instead of reclassifying route facts.'],
    operationIdentityFlow: 'upstream authority -> closed capability -> operationIdentityProjection -> CLI SDK reference',
    limits: ['Static source-contract audit only; it does not replace TypeScript compilation or runtime tests.'],
  },
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1382-upstream-ast-proof-dataflow-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(([name]) => name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
