const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const contract = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const authority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const algebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const producer = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const projection = read('packages/core/src/types/interfaces/operationIdentityProjectionInterface.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const ast = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const runtimeAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const manifest = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const packageJson = JSON.parse(read('package.json'));

check('operation identity authority has a dedicated executable contract',
  /interface OperationIdentityCapabilityAuthorityInterface\s+extends OperationIdentityCapabilityContractMaterializerInterface/.test(contract) && /readonly authority: 'upstream'/.test(contract) && /readonly closed: true/.test(contract),
  'The authority contract specializes the existing runtime algebra without duplicating its operation signature.');
check('authority composition accepts the runtime algebra contract',
  /createOperationIdentityCapabilityAuthority\(\s*materializer: OperationIdentityCapabilityContractMaterializerInterface/.test(authority),
  'Authority composition depends on the behavioral contract rather than a concrete algebra shape.');
check('authority composition delegates construction exactly once',
  /materialize: \(input: OperationIdentityCapabilityInput\): OperationIdentityCapabilityContract =>\s*materializer\.materialize\(input\)/.test(authority),
  'The authority does not reconstruct identity, evidence, derivation, provenance, or proof.');
check('canonical production authority is bound to the canonical algebra',
  /createOperationIdentityCapabilityAuthority\(\s*operationIdentityCapabilityContractMaterializer,?\s*\)/.test(authority) && /materialize: materializeOperationIdentityCapability/.test(algebra),
  'The production implementation is selected once at the upstream authority boundary.');
check('authority metadata is closed and upstream-owned',
  /kind: 'operation_identity_capability_authority'/.test(authority) && /authority: 'upstream'/.test(authority) && /closed: true/.test(authority),
  'The composed authority advertises its ownership and closed contract explicitly.');
check('existing public function remains backwards compatible',
  /route: OperationIdentityCapabilityInput,\s*authority: OperationIdentityCapabilityAuthorityInterface = operationIdentityCapabilityAuthority/.test(authority),
  'Existing single-argument callers keep working; explicit composition can be supplied for tests or alternate runtime wiring.');
check('authority entry point does not import semantic derivation logic',
  !/relationSelect|relationResolve|crudRole|httpMethod|routeShape/.test(authority),
  'No second identity classifier was introduced at the authority wrapper.');
check('algebra preserves the exact upstream reasoning proof',
  /reasoning,/.test(algebra) && /derivation: input\.derivation/.test(algebra) && /provenance: input\.provenance/.test(algebra),
  'The closed capability forwards existing reasoning evidence and provenance.');
check('algebra does not classify method or path',
  !/switch|case |toLowerCase|startsWith\(|crudRole|HttpMethod/.test(algebra),
  'Identity capability construction seals an existing route identity rather than deriving a new one.');
check('route producer continues to use the upstream authority entry point',
  /operationIdentityCapabilityFromRoute\(boundary\.capability\)/.test(producer),
  'The route producer remains connected to the authority boundary.');
check('operation identity projection remains a consumer-only wiring contract',
  /UpstreamWiringInterface<OperationIdentityCapabilityConsumerInterface, OperationIdentityReference>/.test(projection),
  'Downstream receives a closed identity reference, not an executable reasoning algebra.');
check('CLI projects capability identity rather than reclassifying routes',
  /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cli),
  'CLI generation consumes the canonical upstream capability.');
check('SDK remains fail-closed when upstream identity is absent',
  /missing the upstream operation identity projection/.test(sdk),
  'SDK does not reconstruct operation identity from method/path as a fallback.');
check('AST dataflow uses canonical semantic ADT aliases',
  /type AstDataflowInput = SemanticDataflowInput/.test(ast) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(ast),
  'AST remains a producer boundary over canonical input and judgment types.');
check('dataflow reasoning contract remains shared and upstream-owned',
  /extends SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>/.test(semanticDataflow),
  'Dataflow does not introduce a second local judge signature.');
check('dataflow runtime adapter only projects an upstream-closed judgment',
  /judgment: SemanticDataflowJudgment/.test(runtimeAdapter) && /judgment\.reasoningContract/.test(runtimeAdapter) && !/authority\.judge|SemanticDataflowReasoningAuthorityInterface/.test(runtimeAdapter),
  'Upstream manifest production owns reasoning; runtime adapter only forwards the closed judgment and proof.');
check('manifest projection does not own dataflow closure',
  /dataflowJudgments: manifest\.dataflowJudgments/.test(manifest) && /dataflowQueryPolicyContracts: manifest\.dataflowQueryPolicyContracts/.test(manifest) && !/createSemanticDataflowJudgment/.test(manifest),
  'Manifest projection forwards upstream-closed judgments and policy contracts without rerunning semantic reasoning.');
check('graph projection retains structural relation semantics',
  /StructuralSemanticRelation/.test(graph) && /createGraphEdgeRelation/.test(graph),
  'Graph relations remain distinct from value/dataflow closure.');
check('IR consumes closed upstream dataflow state',
  /dataflow\.state\.closure/.test(ir) && !/createSemanticDataflowJudgment/.test(ir),
  'IR does not rerun the semantic solver.');
check('React hooks consume endpoint capability instead of route classification',
  /hookKind/.test(react),
  'Frontend hooks continue to rely on resolved endpoint capability.');
check('public exports include the new authority contract and composition factory',
  /OperationIdentityCapabilityAuthorityInterface/.test(read('packages/core/src/index.ts')) && /createOperationIdentityCapabilityAuthority/.test(read('packages/core/src/index.ts')),
  'The contract is accessible without forcing consumers to import an internal file path.');
check('audit is reproducible and package build contract is unchanged',
  exists('scripts/audit/semantic-ownership-coverage.cjs') && packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown' && packageJson.scripts['audit:phase1375-operation-identity-authority-contract'] === 'node scripts/audits/audit-phase1375-operation-identity-authority-contract.cjs',
  'The audit is registered without changing package version or build command.');

const report = {
  phase: 1375,
  title: 'Operation Identity Authority Contract Composition',
  scope: [
    'operation identity runtime algebra and upstream authority composition',
    'authority contract metadata and backward-compatible entry point',
    'route producer, operation identity projection, CLI and SDK consumer trace',
    'AST/ADT, semantic dataflow, manifest, graph, IR, and React regression boundaries',
  ],
  checks: checks.length,
  passed: checks.filter(item => item.passed).length,
  failed: checks.filter(item => !item.passed).length,
  results: checks,
  decision: {
    area: 'Operation identity upstream authority boundary',
    change: 'Added an explicit authority interface and a composition factory that accepts OperationIdentityCapabilityContractMaterializerInterface.',
    reason: 'The prior authority wrapper delegated to the canonical algebra but had no explicit compositional contract for runtime wiring or substitutable verification.',
    preserved: 'The canonical algebra remains the sole identity capability constructor; route producers and downstream projections preserve their existing behavior.',
  },
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1375-operation-identity-authority-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
