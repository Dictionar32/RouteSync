const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const semanticReasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const composition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const runtimeBoundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const pipeline = read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationProjection = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const manifestProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const packageJson = JSON.parse(read('package.json'));

check('generic semantic reasoning owns the reusable judgment operation',
  /interface SemanticReasoningJudgmentInterface<State, Judgment>/.test(semanticReasoning),
  'The judge operation is a shared reasoning contract rather than duplicated by each domain contract.');
check('dataflow authority composes the generic judgment contract',
  /SemanticDataflowReasoningAuthorityInterface\s+extends SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>/.test(semanticDataflow),
  'The semantic-dataflow contract specializes the existing reasoning judgment interface for canonical input and judgment ADTs.');
check('dataflow authority contract retains upstream ownership marker',
  /interface SemanticDataflowReasoningAuthorityInterface[\s\S]*readonly authority: 'upstream'/.test(semanticDataflow),
  'The shared judge shape does not weaken the semantic ownership boundary.');
check('dataflow authority contract retains a domain-specific discriminant',
  /readonly kind: 'semantic_dataflow_reasoning_authority'/.test(semanticDataflow),
  'Runtime composition can identify the concrete authority contract without exposing its solver.');
check('canonical authority remains the only binding to the concrete solver',
  /semanticDataflowReasoningAuthority[\s\S]*judge: createSemanticDataflowJudgment/.test(authority),
  'The implementation constructor is bound once behind the upstream authority object.');
check('runtime adapter depends on the authority interface',
  /authority: SemanticDataflowReasoningAuthorityInterface/.test(adapter) && /authority\.judge\(input\)/.test(adapter),
  'The runtime adapter invokes the contract rather than importing the concrete solver.');
check('runtime adapter exposes the closed consumer authority, not fake execution methods',
  /DataFlowAuthorityInterface</.test(adapter) && !/seed: \(nextInput: SemanticDataflowInput\)/.test(adapter) && !/derive: \(current: SemanticDataflowJudgment\)/.test(adapter) && !/close: \(current: SemanticDataflowJudgment\)/.test(adapter),
  'The runtime consumer surface exposes closed state/query/closure and does not imitate producer execution.');
check('runtime adapter does not import the concrete solver',
  !/createSemanticDataflowJudgment/.test(adapter),
  'The wiring adapter cannot bypass the upstream authority contract.');
check('composition root binds the canonical authority',
  /createSemanticDataflowDataFlowInterface\(input, semanticDataflowReasoningAuthority\)/.test(composition),
  'Concrete implementation selection remains in the explicit composition root.');
check('runtime boundary expresses upstream-to-runtime wiring',
  /UpstreamWiringInterface</.test(runtimeBoundary) && /DataFlowAuthorityInterface</.test(runtimeBoundary),
  'The contract direction remains upstream evidence to downstream read-only authority projection.');
check('analysis pipeline consumes the injected runtime boundary',
  /runtime: SemanticDataflowRuntimeBoundary/.test(pipeline) && /runtime\.project\(input\)/.test(pipeline),
  'Analysis orchestration does not choose a solver or construct a second judgment.');
check('AST dataflow input and judgment remain canonical aliases',
  /type AstDataflowInput = SemanticDataflowInput/.test(astDataflow) && /type AstDataflowJudgment = SemanticDataflowJudgment/.test(astDataflow),
  'AST-facing dataflow does not introduce a parallel input or judgment representation.');
check('operation identity has a domain-specific runtime algebra contract',
  /OperationIdentityCapabilityRuntimeAlgebraInterface/.test(operationIdentity) && /fromRoute\(input: OperationIdentityCapabilityInput\)/.test(operationIdentity),
  'Operation identity construction is typed separately from the closed result ADT.');
check('operation identity authority delegates to its algebra',
  /algebra\.fromRoute\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority),
  'The authority does not reconstruct identity capability fields.');
check('operation identity algebra preserves semantic proof',
  /const reasoning: SemanticReasoningContract = input\.reasoning/.test(operationAlgebra) && /derivation: input\.derivation/.test(operationAlgebra) && /provenance: input\.provenance/.test(operationAlgebra),
  'Capability construction retains the original proof, derivation, and provenance.');
check('operation identity projection consumes the closed capability',
  /capability\.identity\.route/.test(operationProjection) && /OperationIdentityProjectionInterface/.test(operationProjection),
  'The downstream projection serializes identity without reclassification.');
check('manifest projection forwards canonical inputs',
  /dataflowInputs: manifest\.dataflowInputs/.test(manifestProjection) && !/createSemanticDataflowJudgment/.test(manifestProjection),
  'Manifest wiring transports semantic evidence but does not solve it.');
check('IR projects closed closure and canonical identity',
  /dataflow\.state\.closure/.test(irProjection) && /semanticDataflowIdentityKey/.test(irProjection) && !/createSemanticDataflowJudgment/.test(irProjection),
  'IR consumes the canonical closed state instead of creating a parallel solver.');
check('structural graph has a distinct relation-to-edge projection',
  /StructuralSemanticRelation/.test(graphProjection) && /createGraphEdgeRelation/.test(graphProjection),
  'Structural graph reasoning remains distinct from runtime value dataflow.');
check('React and SDK remain consumers of endpoint capability',
  /hookKind/.test(react) && /missing the upstream operation identity projection/.test(sdk),
  'React and SDK do not infer endpoint identity from raw method/path data.');
check('CLI consumes the upstream operation identity reference',
  /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(cli),
  'The emitter projects a closed capability instead of recreating identity.');
check('semantic ownership and prior audit chain remain available',
  exists('scripts/audit/semantic-ownership-coverage.cjs') && exists('scripts/audits/audit-phase1372-runtime-semantic-contract-execution.cjs') && exists('scripts/audits/audit-phase1371-ast-stage-topology-authority.cjs'),
  'The focused contract audit supplements rather than replaces broad ownership and phase audits.');
check('Laravel example and frontend targets remain present',
  exists('examples/ecommerce-shop-source/routes') && exists('examples/ecommerce-shop-source/app/Models') && exists('examples/ecommerce-shop-source/frontend/src'),
  'The source-to-target example remains available for cross-layer trace.');
check('package script is registered without changing release/build contract',
  packageJson.scripts['audit:phase1373-reasoning-judgment-interface-composition'] === 'node scripts/audits/audit-phase1373-reasoning-judgment-interface-composition.cjs' && packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
  'Audit is reproducible and the package version/build command remain unchanged.');

const report = {
  phase: 1373,
  title: 'Reasoning Judgment Interface Composition',
  scope: [
    'upstream SemanticDataflowReasoningAuthorityInterface and generic SemanticReasoningJudgmentInterface',
    'runtime adapter/composition/boundary and AST ADT aliases',
    'operation identity algebra/authority/projection',
    'manifest/graph/IR and React/SDK/CLI consumer boundaries',
  ],
  checks: checks.length,
  passed: checks.filter(item => item.passed).length,
  failed: checks.filter(item => !item.passed).length,
  results: checks,
  decisions: [
    { area: 'Semantic dataflow reasoning contract', decision: 'Compose the domain authority interface from the shared SemanticReasoningJudgmentInterface.', reason: 'The domain contract should specialize the existing reasoning operation rather than redeclare the same judge signature.' },
    { area: 'Runtime execution', decision: 'Keep the concrete solver binding in semanticDataflowRuntimeComposition and make adapters depend on the contract.', reason: 'Runtime wiring selects the implementation; adapters execute the upstream contract without owning closure.' },
    { area: 'AST/ADT and downstream projection', decision: 'Preserve canonical SemanticDataflowInput/Judgment aliases and existing consumer projections.', reason: 'AST syntax, semantic dataflow, structural graph, and IR are related but not interchangeable models.' },
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1373-reasoning-judgment-interface-composition.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
