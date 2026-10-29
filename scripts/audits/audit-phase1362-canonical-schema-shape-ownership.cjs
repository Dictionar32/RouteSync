const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const authority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const coreIndex = read('packages/core/src/index.ts');
const singleton = read('packages/cli/src/generators/classifier/builders/singletonGroupBuilder.ts');
const resolver = read('packages/cli/src/generators/classifier/typeResolver.ts');
const emitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const validation = read('packages/core/src/types/domain/validationRules.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const sourceAstPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const dataflowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['Canonical schema shape is derived from RouteSchemaPayload.fields only', (() => { const body = authority.match(/export const hasCanonicalRequestFields = \(schema: RouteSchemaPayload\)[\s\S]*?;\n/); return Boolean(body && /schema\.fields\.length/.test(body[0]) && !/schema\.rules/.test(body[0])); })()],
  ['Route capability semantic authority reuses the canonical schema-shape predicate', /const hasRules = hasCanonicalRequestFields/.test(authority)],
  ['Canonical schema-shape predicate is exported from the core public entry point', /export \{ routeCapabilitySemanticAuthority, routeCapabilitySemanticAuthorityAlgebra, routeCapabilitySemanticAuthorityFactory, hasCanonicalRequestFields \}/.test(coreIndex)],
  ['Singleton/custom resource classifier consumes canonical schema shape', /hasCanonicalRequestFields\(route\.contract\.request\.body\.schema\)/.test(singleton) && !/schema\.rules/.test(singleton)],
  ['Form type resolver consumes canonical schema shape', /hasCanonicalRequestFields\(route\.contract\.request\.body\.schema\)/.test(resolver) && !/schema\.rules/.test(resolver)],
  ['SDK API emitter consumes canonical schema shape for body mappers', /hasCanonicalRequestFields\(route\.contract\.request\.body\.schema\)/.test(emitter) && !/schema\.rules/.test(emitter)],
  ['No CLI generator reparses a legacy schema.rules map', !/schema\.rules/.test(singleton + resolver + emitter)],
  ['Canonical RouteSchemaPayload declares fields/messages/attributes rather than rules map', /interface RouteSchemaPayload[\s\S]*?readonly fields: readonly RequestField\[\][\s\S]*?readonly messages:[\s\S]*?readonly attributes:/.test(validation) && !/interface RouteSchemaPayload[\s\S]*?readonly rules:/.test(validation)],
  ['Operation identity algebra preserves upstream route identity and reasoning', /route: input\.identity/.test(operationAlgebra) && /input\.reasoning/.test(operationAlgebra)],
  ['Operation identity authority delegates to runtime algebra', /materializer\.materialize\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority) && /operationIdentityCapabilityContractMaterializer/.test(operationAuthority)],
  ['Scanner pipeline validates AST and manifest builder blocks incomplete projections before source-model building', /validateCompleteSourceAst/.test(sourceAstPipeline) && /projection\.kind !== 'laravel_source_ast_projection_complete'/.test(manifestBuilder) && /sourceModelBuilder\.build/.test(manifestBuilder)],
  ['DataFlowInterface remains an explicit downstream consumer boundary', /interface DataFlowInterface/.test(dataflowInterface)],
  ['IR and graph projections retain separate semantic and structural authorities', /authority/.test(irProjection) && /GraphEdgeRelation/.test(graphProjection) && /StructuralSemanticRelation/.test(graphProjection)],
  ['Phase 1361 validation enum projection remains canonical ADT based', exists('packages/cli/src/generators/constants/enumConstantsBuilder.ts') && /field\.validation\.find\(rule => rule\.kind === ValidationRuleKind\.In\)/.test(read('packages/cli/src/generators/constants/enumConstantsBuilder.ts'))],
  ['Build script and TypeScript 7 declaration remain unchanged', packageJson.scripts.build === 'tsdown' && packageJson.devDependencies.typescript === '7.0.2'],
];
const report = {
  phase: 1362,
  audit: 'canonical-schema-shape-ownership',
  purpose: 'Remove legacy schema.rules checks from CLI consumers and route schema-shape decisions through the upstream canonical RouteSchemaPayload.fields contract.',
  checks: checks.map(([name, ok]) => ({ name, ok })),
  passedChecks: checks.filter(([, ok]) => ok).length,
  totalChecks: checks.length,
  decision: {
    canonicalOwner: 'hasCanonicalRequestFields in routeCapabilitySemanticAuthority, defined solely from RouteSchemaPayload.fields',
    consumers: ['singleton/custom resource classification', 'form payload type resolution', 'SDK API body-mapper emission'],
    compatibility: 'Legacy test fixtures containing schema.rules are not treated as canonical runtime contracts; no fallback parser or shape reclassification was added.',
  },
  validationLimits: [
    'Static source-contract audit only; full build/runtime tests require installed project dependencies.',
    'Workspace does not contain node_modules/tsdown; TypeScript 7.0.2 full build remains unverified.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1362-canonical-schema-shape-ownership.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const failures = report.checks.filter(check => !check.ok);
console.log(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(({ name }) => name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
