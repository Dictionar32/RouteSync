const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const semantic = read('packages/core/src/types/upstream/semanticDataflow.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const composition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const boundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const legacyAnalyzer = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const operationContract = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationProjection = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const genericDataflow = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const reactHooks = read('packages/react/src/hooks/createHooks.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const cliEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const manifestProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const schemaMapper = read('packages/sdk/src/api-runtime/schemaMapper.ts');
const sdkApi = read('packages/sdk/src/defineApi.ts');
const reactQuery = read('packages/react/src/hooks/useQuery.ts');
const httpClient = read('packages/core/src/client/HttpClient.ts');
const packageJson = JSON.parse(read('package.json'));

check('upstream declares an executable semantic-dataflow reasoning contract',
  /interface SemanticDataflowReasoningAuthorityInterface/.test(semantic) && /SemanticDataflowReasoningAuthorityInterface\s+extends SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>/.test(semantic),
  'Runtime code depends on a domain-specific contract composed from the shared typed judgment interface, not a concrete closure implementation.');
check('upstream authority binds the contract to the canonical judgment constructor',
  /semanticDataflowReasoningAuthority[\s\S]*judge: createSemanticDataflowJudgment/.test(authority),
  'The existing semantic closure solver remains the sole implementation behind the contract.');
check('runtime adapter receives authority through dependency wiring',
  /authority: SemanticDataflowReasoningAuthorityInterface/.test(adapter) && /const state = authority\.judge\(input\)/.test(adapter),
  'The adapter executes the upstream contract and does not own semantic reasoning.');
check('runtime exposes the closed authority contract, not producer execution methods',
  /DataFlowAuthorityInterface</.test(adapter) && !/seed: \(nextInput: SemanticDataflowInput\)/.test(adapter) && !/derive: \(current: SemanticDataflowJudgment\)/.test(adapter) && !/close: \(current: SemanticDataflowJudgment\)/.test(adapter),
  'A closed judgment crosses the boundary without fake seed/derive/close execution methods.');
check('runtime adapter has no direct solver dependency',
  !/createSemanticDataflowJudgment/.test(adapter) && /SemanticDataflowReasoningAuthorityInterface/.test(adapter),
  'The wiring layer cannot call the concrete semantic closure constructor directly.');
check('composition injects the canonical upstream authority',
  /semanticDataflowReasoningAuthority/.test(composition) && /createSemanticDataflowDataFlowInterface\(input, semanticDataflowReasoningAuthority\)/.test(composition),
  'The production composition is the explicit binding point between upstream authority and runtime execution.');
check('runtime boundary preserves the closed dataflow authority contract',
  /DataFlowAuthorityInterface</.test(boundary) && /UpstreamWiringInterface/.test(boundary),
  'The runtime receives a read-only state/query surface with explicit wiring direction.');
check('legacy AST analyzer uses the same reasoning contract',
  /semanticDataflowReasoningAuthority\.judge\(input\)/.test(legacyAnalyzer) && !/createSemanticDataflowJudgment/.test(legacyAnalyzer),
  'The deprecated compatibility facade no longer bypasses the authority contract.');
check('semantic result interface remains a projection over a closed judgment',
  /semanticDataflowInterfaceFromJudgment/.test(semantic) && /judgment: SemanticDataflowJudgment/.test(semantic),
  'The result interface does not introduce a second solver or duplicate the judgment ADT.');
check('operation identity contract remains upstream-owned',
  /OperationIdentityCapabilityContract/.test(operationContract) && /algebra\.fromRoute\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority) && /operationIdentityCapabilityFromRoute/.test(operationAuthority),
  'Operation identity still flows through the upstream contract, algebra, and authority.');
check('operation identity algebra preserves reasoning evidence',
  /input\.reasoning/.test(operationAlgebra) && /input\.provenance/.test(operationAlgebra) && /input\.derivation/.test(operationAlgebra),
  'Runtime contract changes do not discard identity proof, provenance, or derivation.');
check('operation identity wiring projects rather than reconstructs',
  /capability\.identity\.route/.test(operationProjection) && /OperationIdentityProjectionInterface/.test(operationProjection) && /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cliEmitter),
  'CLI projection continues consuming the closed upstream capability.');
check('AST dataflow contract aliases canonical semantic ADTs',
  /type AstDataflowInput = SemanticDataflowInput/.test(astDataflow) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(astDataflow),
  'AST and dataflow retain distinct roles while sharing canonical typed evidence/judgment.');
check('generic dataflow separates producer execution from read-only consumer authority',
  /DataFlowProducerInterface/.test(genericDataflow) && /DataFlowConsumerInterface/.test(genericDataflow) && /DataFlowAuthorityInterface/.test(genericDataflow),
  'The public generic contract retains explicit execution and authority facets.');
check('React and SDK remain downstream consumers of closed capabilities',
  /hookKind/.test(reactHooks) && /missing the upstream operation identity projection/.test(sdk),
  'React hook selection and SDK operation identity remain fail-closed consumers.');
check('manifest projection forwards canonical upstream dataflow inputs',
  /dataflowInputs: manifest\.dataflowInputs/.test(manifestProjection) && !/createSemanticDataflowJudgment/.test(manifestProjection),
  'Manifest projection forwards typed input evidence and does not run semantic closure.');
check('IR projects the closed authority state without reconstructing closure',
  /dataflow\.state\.closure/.test(irProjection) && /semanticDataflowIdentityKey/.test(irProjection) && !/createSemanticDataflowJudgment/.test(irProjection),
  'IR is a projection of closed upstream state, not another semantic solver.');
check('structural graph consumes semantic relations through graph-edge projection',
  /StructuralSemanticRelation/.test(graphProjection) && /createGraphEdgeRelation/.test(graphProjection),
  'Graph topology is projected from structural semantic relations through the typed edge contract.');
check('SDK schema mapper consumes upstream parser contract and mapper boundary',
  /isSchemaLike/.test(schemaMapper) && /parseWithSchema/.test(schemaMapper) && /applyMapper/.test(schemaMapper) && /RouteSchemaMap/.test(schemaMapper),
  'Schema parsing and mapping stay at the SDK boundary; they do not reclassify upstream semantic capability.');
check('SDK query key derives from upstream operation identity',
  /route\.operationIdentity/.test(sdkApi) && /\$queryKey/.test(sdkApi) && /missing the upstream operation identity projection/.test(sdkApi),
  'Endpoint identity is required upstream and then used as the stable query-key seed.');
check('React TanStack Query consumes the SDK query key',
  /endpoint\.\$queryKey\(options\)/.test(reactQuery) && /queryKey,/.test(reactQuery) && /queryFn: \(\) => endpoint\(options\)/.test(reactQuery),
  'React does not independently reconstruct endpoint identity or query semantics.');
check('Axios remains the HTTP transport execution boundary',
  /axios\.create/.test(httpClient) && /AxiosResponse/.test(httpClient),
  'HTTP transport and response-envelope handling remain runtime concerns, not upstream semantic reasoning.');
check('Laravel source and frontend target remain in end-to-end trace scope',
  exists('examples/ecommerce-shop-source/routes') && exists('examples/ecommerce-shop-source/app/Models') && exists('examples/ecommerce-shop-source/frontend/src'),
  'Source ecosystem and target example remain present for end-to-end semantic trace.');
check('audit registration preserves package version and build command',
  packageJson.scripts['audit:phase1372-runtime-semantic-contract-execution'] === 'node scripts/audits/audit-phase1372-runtime-semantic-contract-execution.cjs' && packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
  'The focused audit is registered without changing package version or build command.');

const report = {
  phase: 1372,
  title: 'Runtime Semantic Contract Execution',
  flow: 'upstream semantic reasoning authority -> SemanticDataflowReasoningAuthorityInterface -> runtime adapter -> DataFlowAuthorityInterface -> downstream consumers',
  checks: checks.length,
  passed: checks.filter(item => item.passed).length,
  failed: checks.filter(item => !item.passed).length,
  results: checks,
  validationBoundary: 'Static source audit only; TypeScript build and runtime tests require installed dependencies.'
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1372-runtime-semantic-contract-execution.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
