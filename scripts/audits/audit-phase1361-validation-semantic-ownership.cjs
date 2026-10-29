const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const builder = read('packages/cli/src/generators/constants/enumConstantsBuilder.ts');
const request = read('packages/core/src/types/upstream/request.ts');
const domainRules = read('packages/core/src/types/domain/validationRules.ts');
const canonicalEntry = read('packages/core/src/compiler/scanner/operations/form-request/canonicalValidationRuleEntry.ts');
const ruleCollector = read('packages/core/src/compiler/scanner/operations/form-request/ruleCollector.ts');
const ruleSet = read('packages/core/src/compiler/scanner/operations/domain-model/validation/validationRuleSet.ts');
const requestProducer = read('packages/core/src/compiler/scanner/operations/requestProducer.ts');
const formRequestScanner = read('packages/core/src/compiler/scanner/operations/FormRequestScanner.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const emitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const reactFiles = fs.readdirSync(path.join(root, 'packages/react/src'), { recursive: true }).filter(file => typeof file === 'string' && file.endsWith('.ts')).map(file => read(path.join('packages/react/src', file)));
const react = reactFiles.join('\n');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const dataflowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['ValidationRuleDefinition remains a source-level upstream declaration with source provenance', /export type ValidationRuleDefinition\s*=\s*\{[\s\S]*?kind: 'validation_rule_definition'[\s\S]*?source: SourceSpan/.test(request)],
  ['ValidationRuleDefinition is not silently substituted for the canonical domain rule ADT', !/ValidationRuleDefinition/.test(canonicalEntry + ruleCollector + ruleSet + requestProducer + formRequestScanner)],
  ['ValidationRuleParser owns parsing of rule strings at scanner origin', /ValidationRuleParser\.parseAll/.test(ruleCollector) && /ValidationRuleParser\.parseAll/.test(canonicalEntry)],
  ['Canonical route validation entries preserve source span', /readonly source: SourceSpan/.test(read('packages/core/src/types/domain/validationRules.ts')) && /source: params\.source/.test(canonicalEntry)],
  ['Canonical rule aggregation consumes RouteValidationRuleEntry', /create: \(entries: readonly RouteValidationRuleEntry\[\], interner: TypeInterner\)/.test(ruleSet)],
  ['FormRequest producer constructs request schema from canonical validation fields', /RouteSemanticFlowValidationRuleSet\.create\(validationEntries, input\.interner\)/.test(requestProducer)],
  ['FormRequest scanner enters the canonical request producer path', /requestProducer\.produceResult/.test(formRequestScanner)],
  ['Enum generator consumes RouteSchemaPayload contract', /type RouteSchemaPayload/.test(builder) && /projectValidationEnums\(schema: RouteSchemaPayload/.test(builder)],
  ['Enum generator reads canonical schema fields rather than an invented schema.rules field', /for \(const field of schema\.fields\)/.test(builder) && !/schema\.rules/.test(builder)],
  ['Enum generator reads typed ValidationRuleNode values', /field\.validation\.find\(rule => rule\.kind === ValidationRuleKind\.In\)/.test(builder)],
  ['Enum generator extracts enum values from typed validation parameters', /inRule\.values\.map\(value => value\.value\)/.test(builder)],
  ['Enum generator no longer reparses Laravel rule strings downstream', !/ValidationRuleParser|ruleStr\.split\('\|'\)|String\(ruleVal\)/.test(builder)],
  ['Enum generator no longer uses any or a legacy record cast for validation rules', !/:\s*any\b|as Record<string, unknown>/.test(builder)],
  ['Operation identity algebra carries upstream identity and reasoning without method classification', /route: input\.identity/.test(operationAlgebra) && /input\.reasoning/.test(operationAlgebra) && !/(?:httpMethod|method\s*:|crudRole\s*:)/.test(operationAlgebra)],
  ['Operation identity authority delegates to the canonical materializer', /materializer\.materialize\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority)],
  ['CLI emitter projects the existing operation identity capability', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(emitter)],
  ['SDK requires explicit operation identity and hook kind', /operationIdentity/.test(sdk) && /hookKind/.test(sdk) && /throw/.test(sdk)],
  ['React consumers do not classify HTTP method into semantic hook kind', !/method\s*===?\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/.test(react) && !/hookKind\s*=\s*.*method/i.test(react)],
  ['Manifest validates canonical AST before canonical source-model construction', /validateCompleteSourceAst/.test(manifestBuilder) && /buildCompleteLaravelSourceModel/.test(manifestBuilder)],
  ['DataFlowInterface remains the consumer boundary for semantic dataflow', /interface DataFlowInterface/.test(dataflowInterface)],
  ['IR projection consumes semantic dataflow authority and graph projection stays structural', /authority/.test(irProjection) && /GraphEdgeRelation/.test(graphProjection) && /StructuralSemanticRelation/.test(graphProjection)],
  ['Build script and declared TypeScript version remain unchanged', packageJson.scripts.build === 'tsdown' && packageJson.devDependencies.typescript === '7.0.2'],
];
const report = {
  phase: 1361,
  audit: 'validation-semantic-ownership',
  purpose: 'Eliminate downstream Laravel validation reclassification by projecting canonical validation ADTs; preserve the unused upstream ValidationRuleDefinition as a separately classified migration seam.',
  checks: checks.map(([name, ok]) => ({ name, ok })),
  passedChecks: checks.filter(([, ok]) => ok).length,
  totalChecks: checks.length,
  decision: {
    canonicalOwner: 'ValidationRuleParser + CanonicalRouteValidationRuleEntry + RouteSemanticFlowValidationRuleSet at scanner origin',
    downstreamProjection: 'CLI enum generator consumes RouteSchemaPayload.fields[].validation and never parses Laravel rule strings',
    preservedContract: 'ValidationRuleDefinition remains intact and unwired until a producer/consumer migration is proven',
    compatibility: 'Legacy noncanonical schema.rules string maps are not reinterpreted by the CLI generator; canonical RouteSchemaPayload is the supported path',
  },
  validationLimits: [
    'Static source-contract audit only; full build and runtime tests require installed project dependencies.',
    'The workspace does not contain node_modules/tsdown; TypeScript 7.0.2 full build remains unverified.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1361-validation-semantic-ownership.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const failures = report.checks.filter(check => !check.ok);
console.log(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(({ name }) => name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
