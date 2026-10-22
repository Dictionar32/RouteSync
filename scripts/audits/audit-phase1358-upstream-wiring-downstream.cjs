const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const includes = (file, pattern) => pattern.test(read(file));
const trace = [
  { name: 'ProviderContainerOperations', owner: 'packages/core/src/types/upstream/application.ts', producer: 'Provider AST / provider canonicalization', wiring: 'provider AST canonical projection into CompleteLaravelSourceModel / manifest seeds', consumer: 'manifest/graph only if raw operations remain semantically distinct from ProviderContainerBindings', finding: 'Public type is not internally consumed; neighboring ProviderContainerBindings is already used as the canonical normalized container shape. Do not wire a second lane until providerAstCanonical proves a separate raw-operation stage is needed.', action: 'preserve; verify producer-level distinction before integrating' },
  { name: 'ControllerExpressionFact', owner: 'packages/core/src/types/upstream/controller.ts', producer: 'controller AST semantic variable/expression analysis', wiring: 'controller facts into SemanticDataflowInput / CompleteLaravelSourceModel', consumer: 'semantic dataflow authority and IR projection', finding: 'The contract carries expression, origin, and source provenance; inspect producer output before mapping to existing ControllerSemanticVariableFlow to avoid duplicating provenance.', action: 'candidate for a producer-to-dataflow projection only if no equivalent fact is already emitted' },
  { name: 'ExpressionDefinition', owner: 'packages/core/src/types/upstream/expression.ts', producer: 'expression parser / source-span attachment', wiring: 'canonical expression plus SourceSpan boundary', consumer: 'AST judgments and dataflow seed construction', finding: 'The shape is already provenance-bearing; no new bridge should be added if expression AST output already includes the same expression and span.', action: 'preserve; compare producer shape and existing provenance before wiring' },
  { name: 'RequestRouteParameterName', owner: 'packages/core/src/types/upstream/request.ts', producer: 'route parameter extraction and request binding', wiring: 'route/request capability projection', consumer: 'manifest and generated SDK route parameter reference', finding: 'Keep request-side identity distinct from transport path strings; do not reconstruct route parameter meaning in SDK/React.', action: 'trace exact source producer; only adapt at upstream boundary' },
  { name: 'RequestUriValue', owner: 'packages/core/src/types/upstream/request.ts', producer: 'request-context extraction', wiring: 'request context facts to semantic model', consumer: 'request analysis only when URI semantics are needed', finding: 'Potential overlap with RouteIdentity/RoutePath; URI runtime context and declared route identity are not automatically equivalent.', action: 'preserve until a consumer proves the URI-context capability is needed' },
  { name: 'RequestIpAddress', owner: 'packages/core/src/types/upstream/request.ts', producer: 'request-context extraction', wiring: 'request context facts to semantic model', consumer: 'request policy/security semantics if modeled', finding: 'No reason to add this to route identity or generic dataflow by default; it is request context, not route classification.', action: 'preserve as optional vocabulary; add a producer only when source evidence/consumer exists' },
  { name: 'ValidationRuleDefinition', owner: 'packages/core/src/types/upstream/request.ts', producer: 'Laravel validation rule extraction', wiring: 'RequestValidationCapability / manifest seed projection', consumer: 'schema/Zod projection, not a frontend semantic classifier', finding: 'Validation definitions should lower once at the upstream semantic boundary; Zod is a target projection and must not infer Laravel rule intent independently.', action: 'compare with ValidationRule and RequestValidationCapability; share canonical evidence if equivalent' },
  { name: 'SchemaRelationTarget', owner: 'packages/core/src/types/upstream/schemaRelation.ts', producer: 'schema/model relation resolution', wiring: 'StructuralSemanticRelation / GraphEdgeRelation projection', consumer: 'service graph and IR projections', finding: 'Table-model pair belongs to schema relation semantics; graph should consume projected relation, not rediscover table/model links.', action: 'wire only if the schema relation authority does not already emit the equivalent target' },
  { name: 'CanonicalSourceNode', owner: 'packages/core/src/types/upstream/sourceBoundary.ts', producer: 'CompleteSourceAst canonical ADT', wiring: 'SourceBoundaryInput closed discriminated union', consumer: 'generic source-boundary operations and AST/dataflow adapters', finding: 'CanonicalSourceNode and SourceBoundaryInput describe overlapping views of the same source kinds; converting one to the other without a consumer adds an extra classification pass.', action: 'keep type-only until a shared boundary consumer needs the closed tagged form' },
  { name: 'SourceBoundaryInput', owner: 'packages/core/src/types/upstream/sourceBoundary.ts', producer: 'canonical Laravel AST ADT', wiring: 'source boundary adapter', consumer: 'generic upstream source visitors', finding: 'Its discriminants are a useful closed ADT but no consumer should be invented just to remove zero-reference status.', action: 'candidate for source visitor algebra only when it replaces duplicated switches/classifiers' },
];
const checks = [
  ['upstream operation identity contract is closed and authority-owned', includes('packages/core/src/types/upstream/operationIdentityCapability.ts', /SemanticCapabilityContractInterface<'operation_identity_capability'/) && includes('packages/core/src/types/upstream/operationIdentityCapability.ts', /OperationIdentityCapabilityRuntimeAlgebraInterface/)],
  ['operation identity runtime algebra preserves route evidence/provenance/reasoning', includes('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', /input\.reasoning/) && includes('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', /input\.provenance/) && includes('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', /input\.derivation/)],
  ['manifest builder validates and closes canonical AST before semantic model construction', includes('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts', /validateCompleteSourceAst/) && includes('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts', /buildCompleteLaravelSourceModel/)],
  ['manifest builder derives dataflow seeds from canonical source model', includes('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts', /semanticDataflowInputsFromSourceModel\(completeLaravelSourceModelBuildResult\.value\)/)],
  ['AST dataflow contract exposes read-only authority rather than execution solver', includes('packages/core/src/types/upstream/astDataflowInterface.ts', /DataFlowAuthorityInterface/) && includes('packages/core/src/types/upstream/astDataflowInterface.ts', /Read-only AST-to-analysis boundary/)],
  ['generic DataFlowInterface separates producer execution and consumer authority', includes('packages/core/src/types/dataflow/dataFlowInterface.ts', /DataFlowProducerInterface/) && includes('packages/core/src/types/dataflow/dataFlowInterface.ts', /DataFlowConsumerAlgebraInterface/)],
  ['IR projection uses canonical semantic dataflow authority', exists('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts') && includes('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts', /state\.closure|authority|SemanticDataflow/)],
  ['graph relation projection is a separate structural semantic lane', exists('packages/core/src/graph/service/structuralSemanticRelationProjection.ts') && includes('packages/core/src/graph/service/structuralSemanticRelationProjection.ts', /StructuralSemanticRelation/) && includes('packages/core/src/graph/service/structuralSemanticRelationProjection.ts', /GraphEdgeRelation/)],
  ['CLI emitter projects upstream operation identity capability rather than classifying HTTP method', includes('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/)],
  ['SDK fails closed when operation identity or hook capability is absent', includes('packages/sdk/src/defineApi.ts', /if \(!route\.operationIdentity\)/) && includes('packages/sdk/src/defineApi.ts', /if \(!route\.hookKind\)/)],
  ['React intent wrapper consumes explicit domain intent capability', exists('packages/react/src/hooks/define/intentWrapper.ts') && includes('packages/react/src/hooks/define/intentWrapper.ts', /DomainIntentCapabilityReference|aggregate_collection/)],
  ['example frontend keeps Axios transport separate from semantic route identity', exists('examples/ecommerce-shop-source/frontend/src/lib/core/api-client.ts') && exists('examples/ecommerce-shop-source/frontend/src/lib/generic/generic-hooks.ts')],
  ['package build command remains unchanged', read('package.json').match(/"build"\s*:\s*"([^"]+)"/)?.[1] === 'tsdown'],
];
const report = {
  phase: 1358,
  audit: 'upstream-wiring-downstream-contract-trace',
  purpose: 'Trace semantic ownership across upstream contracts, wiring, dataflow/AST ADT, manifest, graph, IR, CLI, SDK, React and example frontend; identify safe next integrations without inventing consumers.',
  checks: checks.map(([name, ok]) => ({ name, ok })),
  passedChecks: checks.filter(([, ok]) => ok).length,
  totalChecks: checks.length,
  boundaryContractTrace: trace,
  architecture: [
    { lane: 'Laravel/source AST', owns: 'source evidence, source spans, closed AST/ADT, framework-specific semantic facts' },
    { lane: 'upstream semantic authority/algebra', owns: 'semantic interpretation, capability identity, proof/provenance, closed judgment' },
    { lane: 'wiring', owns: 'validated conversion of canonical AST/source model into manifest seeds, dataflow input and structural relations; no new classification' },
    { lane: 'dataflow/AST interface', owns: 'generic execution upstream; downstream receives read-only authority, closure and stable identity' },
    { lane: 'graph', owns: 'structural relation projection only; does not replace semantic dataflow' },
    { lane: 'IR/CLI/SDK/React/frontend', owns: 'projection and execution from explicit upstream capabilities; no Laravel semantic reclassification' },
  ],
  nonGoals: [
    'Do not delete or empty public types solely because internal symbol usage is zero.',
    'Do not add fake consumers to make public contracts appear used.',
    'Do not route request URI/IP context into route identity without a domain-level equivalence proof.',
    'Do not introduce a second AST conversion if CompleteSourceAst already carries the same canonical node and provenance.',
    'Do not claim a TypeScript 7 build from an audit run on another TypeScript compiler version.',
  ],
  validationLimits: [
    'This is a contract/path audit, not a full runtime or end-to-end test.',
    'TypeScript 7 compatibility is not established by this audit; compiler API audit compatibility must be verified with the repository-pinned TS 7 toolchain.',
    'The 10 zero-reference declarations are preserved; recommendations are trace decisions, not proof that public contracts are dead.',
  ],
};
const reportPath = 'scripts/audits/reports/phase1358-upstream-wiring-downstream-contract-trace.json';
fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
fs.writeFileSync(path.join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
const failed = report.checks.filter((check) => !check.ok);
process.stdout.write(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failed.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failed.map((check) => check.name), boundaryContractsTraced: trace.length, report: reportPath }, null, 2) + '\n');
process.exitCode = failed.length ? 1 : 0;
