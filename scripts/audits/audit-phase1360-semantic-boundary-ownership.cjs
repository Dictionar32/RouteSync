const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const filesUnder = directory => {
  const output = [];
  const walk = current => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.ts') && !full.includes(`${path.sep}__tests__${path.sep}`)) output.push(full);
    }
  };
  walk(path.join(root, directory));
  return output;
};
const coreTsFiles = filesUnder('packages/core/src');
const countIdentifier = name => coreTsFiles.reduce((total, file) => total + (read(path.relative(root, file)).match(new RegExp(`\\b${name}\\b`, 'g')) || []).length, 0);
const declarationOnly = (name, file) => countIdentifier(name) === 1 && read(file).includes(name);
const routeDataflow = read('packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts');
const validationParser = read('packages/core/src/types/domain/validationRules.ts');
const validationExtractor = read('packages/core/src/compiler/scanner/operations/form-request/canonicalValidationRuleEntry.ts');
const ruleCollector = read('packages/core/src/compiler/scanner/operations/form-request/ruleCollector.ts');
const schemaRelation = read('packages/core/src/types/upstream/schemaRelation.ts');
const modelBuilder = read('packages/core/src/compiler/scanner/semantic/model/modelSemanticDefinition.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const dataflowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const apiEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const sdkDefineApi = read('packages/sdk/src/defineApi.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['ControllerExpressionFact is currently a declaration-only contract, not a discovered producer-consumer path', declarationOnly('ControllerExpressionFact', 'packages/core/src/types/upstream/controller.ts')],
  ['ExpressionDefinition is currently a declaration-only expression-plus-source contract', declarationOnly('ExpressionDefinition', 'packages/core/src/types/upstream/expression.ts')],
  ['ValidationRuleDefinition is distinct from the active domain ValidationRuleNode pipeline', declarationOnly('ValidationRuleDefinition', 'packages/core/src/types/upstream/request.ts') && /ValidationRuleParser/.test(validationParser) && /ValidationRuleParser/.test(validationExtractor) && /ValidationRuleParser/.test(ruleCollector)],
  ['The active validation path uses explicit domain rule contracts rather than silently consuming ValidationRuleDefinition', /ValidationRuleNode/.test(validationParser) && /ValidationRuleNode/.test(ruleCollector) && !/ValidationRuleDefinition/.test(validationExtractor)],
  ['SchemaRelationTarget is not consumed as the active schema relation authority', declarationOnly('SchemaRelationTarget', 'packages/core/src/types/upstream/schemaRelation.ts')],
  ['Schema relation authority is represented by SchemaRelationInterface and SchemaRelationIndexInterface', /interface SchemaRelationInterface/.test(schemaRelation) && /interface SchemaRelationIndexInterface/.test(schemaRelation) && /schemaRelationIndexFrom/.test(schemaRelation)],
  ['Canonical model semantic construction consumes schemaRelationIndexFrom rather than reconstructing SchemaRelationTarget', /schemaRelationIndexFrom\(params\.schema\)/.test(modelBuilder) && !/SchemaRelationTarget/.test(modelBuilder)],
  ['RouteConstraintFlow has no active producer/consumer while routeDataFlow owns active constraint facts', declarationOnly('RouteConstraintFlow', 'packages/core/src/types/upstream/routeConstraints.ts') && /interface RouteConstraintFact/.test(routeDataflow) && /routeDeclarationDataFlowGraph/.test(routeDataflow)],
  ['ApiResourceAction is a declaration-only alias and resource action plan remains the semantic output', declarationOnly('ApiResourceAction', 'packages/core/src/types/upstream/routeResourceFlow.ts') && /interface RouteResourceActionPlan/.test(read('packages/core/src/types/upstream/routeResourceFlow.ts'))],
  ['Phase 1359 source-boundary algebra remains representation-only', exists('packages/core/src/types/upstream/sourceBoundaryAlgebra.ts') && /const exhaustive: never/.test(read('packages/core/src/types/upstream/sourceBoundaryAlgebra.ts')) && !/sourceBoundaryInputFromCanonicalNode|sourceBoundaryNodeOf/.test(manifestBuilder)],
  ['Manifest wiring validates complete AST before building the canonical Laravel source model', /validateCompleteSourceAst/.test(manifestBuilder) && /buildCompleteLaravelSourceModel/.test(manifestBuilder)],
  ['DataFlowInterface separates producer and consumer authority contracts', /DataFlowProducerInterface/.test(dataflowInterface) && /DataFlowConsumerAlgebraInterface/.test(dataflowInterface)],
  ['IR consumes semantic dataflow authority while structural graph uses GraphEdgeRelation projection', /SemanticDataflow/.test(irProjection) && /GraphEdgeRelation/.test(graphProjection)],
  ['CLI and SDK consume explicit operation identity instead of classifying HTTP methods/actions', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(apiEmitter) && /if \(!route\.operationIdentity\)/.test(sdkDefineApi)],
  ['No artificial references or new semantic bridge were added to silence declaration-only findings', declarationOnly('ControllerExpressionFact', 'packages/core/src/types/upstream/controller.ts') && declarationOnly('ExpressionDefinition', 'packages/core/src/types/upstream/expression.ts') && declarationOnly('SchemaRelationTarget', 'packages/core/src/types/upstream/schemaRelation.ts')],
  ['Package build script remains unchanged as tsdown and declared TypeScript target remains 7.0.2', packageJson.scripts.build === 'tsdown' && packageJson.devDependencies.typescript === '7.0.2'],
];
const findings = [
  { contract: 'ControllerExpressionFact', status: 'declaration_only', decision: 'Preserve the public contract; do not add a producer until the canonical controller-expression producer and missing consumer are demonstrated.', next: 'Trace ControllerSemanticDataflow variables/resources and controller AST canonicalization before deciding whether this fact is redundant.' },
  { contract: 'ExpressionDefinition', status: 'declaration_only', decision: 'Keep as a type-only provenance pair unless a consumer needs a named expression boundary; avoid wrapping every Expression in a duplicate contract.', next: 'Compare against existing Expression.source and source-backed AST/ADT traversal.' },
  { contract: 'ValidationRuleDefinition', status: 'parallel_vocabulary', decision: 'Do not adapt it into the active validation path yet; the active path uses ValidationRuleNode, ValidationRuleParser and form-request descriptors.', next: 'Design a single owner/migration plan before any Laravel-rule-to-Zod projection change.' },
  { contract: 'SchemaRelationTarget', status: 'redundant_candidate', decision: 'Do not wire a second table/model tuple while SchemaRelationInterface and SchemaRelationIndexInterface own schema evidence and indexing.', next: 'Only revive if a consumer requires a distinct target identity not expressible through existing relation evidence.' },
  { contract: 'RouteConstraintFlow', status: 'disconnected_contract', decision: 'Preserve file in place; active route constraint evidence is carried by routeDataFlow and RouteDeclarationAst.', next: 'Compare source provenance and effective constraint merge semantics before any consolidation.' },
  { contract: 'ApiResourceAction', status: 'narrow_alias_unconsumed', decision: 'Preserve alias and file; do not make the resource action table depend on it merely to create a reference.', next: 'Review only if a public API needs the narrower API-resource action set.' },
];
const report = {
  phase: 1360,
  audit: 'semantic-boundary-ownership',
  purpose: 'Trace real ownership and consumers for remaining semantic-boundary candidates without fabricating consumers, duplicating semantic authorities, or reclassifying in downstream layers.',
  checks: checks.map(([name, ok]) => ({ name, ok })),
  passedChecks: checks.filter(([, ok]) => ok).length,
  totalChecks: checks.length,
  findings,
  architecture: {
    sourceToManifest: 'Laravel source -> CompleteSourceAst validation -> CompleteLaravelSourceModel -> manifest/dataflow seeds',
    validation: 'Laravel validation evidence -> current domain ValidationRuleNode/ValidationRuleParser path -> existing schema/IR target projection; ValidationRuleDefinition is not wired in this phase',
    schema: 'SchemaInterface -> schemaRelationIndexFrom -> SchemaRelationIndexInterface -> model semantic relation construction',
    dataflow: 'SemanticDataflowInput -> DataFlow authority/consumer interface -> IR projection; structural relations -> GraphEdgeRelation -> graph projection',
    downstream: 'Capability/identity projection -> CLI -> SDK -> React hooks; transport, validation, mapping and cache concerns remain target-runtime responsibilities',
  },
  validationLimits: [
    'Static source-contract audit only; not a full build or runtime test.',
    'Environment has TypeScript 5.8.3 globally and package.json declares 7.0.2; no local node_modules or tsdown executable is available.',
    'Official TypeScript 7.0 announcement states TypeScript 7.0 does not ship a programmatic API; API-dependent audits should use the compatibility package/API version appropriate to their needs rather than assuming the 7.0 compiler exposes the TypeScript 5.x Compiler API.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1360-semantic-boundary-ownership.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const failures = report.checks.filter(check => !check.ok);
console.log(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(({ name }) => name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
