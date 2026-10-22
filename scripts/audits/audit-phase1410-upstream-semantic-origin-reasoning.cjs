const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const producer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const authority = read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts');
const contract = read('packages/core/src/types/upstream/sourceAstSemanticOriginInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const queryProducer = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const routeProducer = read('packages/core/src/types/upstream/routeProducer.ts');
const routeGrouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const sdkApi = read('packages/sdk/src/defineApi.ts');
const reactHooks = read('packages/react/src/hooks/defineHooks.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const apiEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const typeMapping = read('packages/cli/src/generators/canonical/type-mapping/constants.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['semantic-origin input is a closed upstream evidence type', /SourceAstSemanticOriginEvidence/.test(contract) && /closed: true/.test(contract)],
  ['semantic-origin output is a closed judgment', /SourceAstSemanticOriginJudgment/.test(contract) && /origin: ExpressionOrigin/.test(contract)],
  ['origin resolver is declared as an upstream interface', /SourceAstSemanticOriginInterface/.test(contract) && /resolve\(evidence: SourceAstSemanticOriginEvidence\)/.test(contract)],
  ['origin authority uses a total declarative Record over the closed source-kind union', /satisfies Record<SourceAstEvidenceKind/.test(authority) && /originRules\[evidence\.sourceKind\]\(evidence\)/.test(authority) && !/relationGate/.test(authority)],
  ['authority resolves model/controller/service/resource origins', /model_accessor/.test(authority) && /controller_action/.test(authority) && /service_method/.test(authority) && /resource_field/.test(authority)],
  ['authority returns a frozen closed judgment with evidence provenance', /Object\.freeze\(\{[\s\S]*kind: 'source_ast_semantic_origin_judgment'[\s\S]*evidence: Object\.freeze\(\{ \.\.\.evidence \}\)[\s\S]*closed: true/.test(authority)],
  ['semantic producer delegates origin decisions to authority', /sourceAstSemanticOriginAuthority\.resolve/.test(producer)],
  ['semantic producer no longer owns source-family origin classification', !/const expressionOrigin\s*=\s*\([^)]*directoryKind[\s\S]*?relationEqual\(directoryKind/.test(producer)],
  ['origin contract exported from upstream barrel', upstreamIndex.includes("export * from './sourceAstSemanticOriginInterface';")],
  ['origin authority and contract exposed through public package surface', publicIndex.includes('SourceAstSemanticOriginEvidence') && publicIndex.includes('sourceAstSemanticOriginAuthority')],
  ['query dispatch helper exists before catalog initialization', queryProducer.indexOf('const relationRuleEntries =') >= 0 && queryProducer.indexOf('const relationRuleEntries =') < queryProducer.indexOf('const queryNamedMethodOperationCatalog')],
  ['query dispatch entries are immutable', /const relationRuleEntries[\s\S]*?Object\.freeze\([\s\S]*?relationProject\(names/.test(queryProducer)],
  ['Phase 1409 audit remains registered', Boolean(pkg.scripts['audit:phase1409-upstream-syntax-reasoning-dataflow-boundary'])],
  ['package identity and build command remain unchanged', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
  ['ecommerce Laravel fixture remains present', exists('examples/ecommerce-shop-source/app/Http/Controllers/ProdukController.php') && exists('examples/ecommerce-shop-source/app/Models/ProdukItem.php')],
  ['canonical route producer projects pre-resolved identity and does not infer it locally', /identity: input\.identity/.test(routeProducer) && !/operationIdentityCapabilityFromRoute|materializeOperationIdentityCapability/.test(routeProducer)],
  ['CLI action grouping consumes upstream identity authority without local suffix registry', /routeActionIdentityCapabilityAuthority\.resolve/.test(routeGrouper) && !/usedActions/.test(routeGrouper)],
  ['CLI SDK emitter projects the resolved operation identity capability', /operationIdentityReferenceFromCapability/.test(apiEmitter)],
  ['SDK refuses missing operation identity instead of inventing a fallback', /if \(!route\.operationIdentity\)/.test(sdkApi) && /throw/.test(sdkApi)],
  ['React hook runtime consumes explicit CRUD execution slots', /resolveGroupSlots\(groupConfig\.crudSlots\)/.test(reactHooks) && /crudSlots: CrudGroupExecutionContract/.test(read('packages/react/src/hooks/define/hookTypes.ts'))],
  ['manifest builder delegates semantic dataflow judgments to the injected upstream manifest surface', /dataflowManifestSurface\.judgmentsFromInputs\(dataflowInputs\)/.test(manifestBuilder) && /dataflowJudgments/.test(manifestBuilder)],
  ['IR projection consumes closed authority state rather than rebuilding closure', /dataflow\.state\.closure/.test(irProjection) && !/relationFixedPoint|createSemanticDataflowJudgment/.test(irProjection)],
  ['Zod output mapping remains a projection from canonical type mapping', /zod:/.test(typeMapping) && /tsType:/.test(typeMapping)],
];
const failed = checks.filter(([, pass]) => !pass);
const result = {
  phase: 1410,
  name: 'upstream-semantic-origin-reasoning',
  status: failed.length ? 'failed' : 'passed_with_residuals',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  residuals: [
    'Semantic-origin resolution now has an upstream interface and authority, but model accessor eligibility remains a separate producer-side rule and should become a closed capability judgment.',
    'Other Laravel source families beyond model/resource/controller/service still require migration onto the evidence -> syntax -> semantic judgment path.',
    'Full build and runtime integration tests must run with the repository dependency toolchain installed.'
  ],
  flow: 'Laravel evidence -> syntax contract -> upstream semantic-origin judgment -> AST/ADT + dataflow judgment -> wiring -> runtime executor -> manifest/graph/IR/CLI/SDK/React'
};
const output = path.join(root, 'scripts/audits/reports/phase1410-upstream-semantic-origin-reasoning.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${result.status} ${result.passed}/${result.total}\n`);
if (failed.length) process.exitCode = 1;
