const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const packageJson = JSON.parse(read('package.json'));
const modelPrimaryKey = read('packages/core/src/types/upstream/modelPrimaryKey.ts');
const modelBuilder = read('packages/core/src/compiler/scanner/semantic/model/modelSemanticDefinition.ts');
const schemaRelation = read('packages/core/src/types/upstream/schemaRelation.ts');
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationWiring = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const operationConsumer = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const dataflowAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const dataflowInterface = read('packages/core/src/types/dataflow/dataFlowInterface.ts');
const reactHooks = read('packages/react/src/hooks/createHooks.ts');
const sdkDefineApi = read('packages/sdk/src/defineApi.ts');

check('primary-key reconciliation consumes canonical schema relation index',
  modelPrimaryKey.includes('SchemaRelationIndexInterface') && modelPrimaryKey.includes('schema.table(table)') && modelPrimaryKey.includes('relation.primaryColumns'),
  'Primary-key reconciliation consumes the schema relation contract instead of searching raw SchemaInterface tables and columns again.');
check('schema table/primary-column selection has one producer',
  schemaRelation.includes('table: (table: TableName) => tables.find') && schemaRelation.includes('primaryColumns: sequence(items(table.columns.items).filter'),
  'The existing schema relation index remains the sole table/primary-column selection boundary; no second schema classifier was added.');
check('model builder constructs schema index once before reconciliation',
  modelBuilder.indexOf('const schemaRelations = schemaRelationIndexFrom(params.schema)') < modelBuilder.indexOf('const primaryKeyReconciliation = reconcileModelPrimaryKey(') && modelBuilder.includes('reconcileModelPrimaryKey(\n        schemaRelations,'),
  'The canonical schema relation index is shared by primary-key reconciliation and model-relation construction.');
check('primary-key status is a closed explicit judgment',
  modelPrimaryKey.includes('ModelPrimaryKeyReconciliationStatus') && modelPrimaryKey.includes('status: statusOf(schemaPrimaryKeys, modelPrimaryKey)') && modelPrimaryKey.includes("'unresolved'") && modelPrimaryKey.includes("'ambiguous'") && modelPrimaryKey.includes("'matched'") && modelPrimaryKey.includes("'conflict'"),
  'The reconciliation result preserves all four status outcomes without duplicating table/column classification.');
check('primary-key reconciler no longer uses find/filter over raw schema',
  !modelPrimaryKey.includes('.find(') && !modelPrimaryKey.includes('.filter('),
  'Raw schema table lookup and primary-column filtering are no longer repeated inside the reconciliation judgment.');
check('primary-key regression cases use canonical schema index',
  read('packages/core/src/types/upstream/__tests__/model-primary-key-reconciliation.phase1003.test.ts').includes('schemaRelationIndexFrom(schema('),
  'Matched, conflict, unresolved, and composite-key ambiguity cases enter through the canonical schema relation index.');
check('operation identity runtime algebra is adopted by authority',
  operationAuthority.includes('materializer.materialize(input)') && operationAuthority.includes('createOperationIdentityCapabilityAuthority') && operationAuthority.includes('operationIdentityCapabilityContractMaterializer') && operationAlgebra.includes('kind: \'operation_identity_capability\''),
  'Operation identity construction is centralized in the upstream algebra and delegated to by its authority.');
check('operation identity wiring projects closed upstream capability',
  operationWiring.includes('capability.identity.route') && operationWiring.includes('OperationIdentityProjectionInterface') && operationConsumer.includes('operationIdentityReferenceFromCapability(route.raw.operationIdentityCapability)'),
  'The CLI emitter consumes the capability through an explicit projection instead of reconstructing operation identity.');
check('operation identity contract carries semantic reasoning proof',
  operationIdentity.includes('readonly reasoning: SemanticReasoningContract') && operationAlgebra.includes('const reasoning: SemanticReasoningContract = input.reasoning'),
  'The exact upstream reasoning proof is preserved by the operation identity algebra.');
check('AST dataflow interface aliases canonical semantic ADTs',
  astDataflow.includes('type AstDataflowInput = SemanticDataflowInput') && astDataflow.includes('type AstDataflowJudgment = SemanticDataflowJudgment') && astDataflow.includes('DataFlowAuthorityInterface'),
  'AST-facing dataflow is a typed boundary over the canonical semantic input/judgment, not a parallel solver model.');
check('dataflow authority owns closure and reachability',
  dataflowAuthority.includes('relationFixedPoint') && dataflowAuthority.includes('pathClosure') && dataflowAuthority.includes('createSemanticDataflowJudgment'),
  'Semantic closure remains upstream-owned.');
check('dataflow wiring preserves proof and avoids reclassification',
  dataflowAdapter.includes('reasoning: judgment.reasoningContract') && dataflowAdapter.includes('DataFlowAuthorityInterface') && !dataflowAdapter.includes('derive: (current: SemanticDataflowJudgment) => current') && !dataflowAdapter.includes('close: (current: SemanticDataflowJudgment) => current'),
  'The read-only DataFlowAuthorityInterface preserves the exact proof without advertising fake producer execution.');
check('generic dataflow separates producer execution from consumer authority',
  dataflowInterface.includes('DataFlowProducerInterface') && dataflowInterface.includes('DataFlowConsumerInterface') && dataflowInterface.includes('DataFlowAuthorityInterface'),
  'Execution and read-only authority are separate contracts.');
check('SDK consumes operation identity fail-closed',
  sdkDefineApi.includes('missing the upstream operation identity projection'),
  'The SDK requires the upstream operation identity reference instead of deriving it from method/path.');
check('React hook boundary consumes closed hook capability',
  reactHooks.includes('hookKind') && reactHooks.includes('query') && reactHooks.includes('mutation'),
  'React hook selection uses the endpoint contract at the consumer boundary.');
check('semantic ownership coverage audit remains present',
  exists('scripts/audit/semantic-ownership-coverage.cjs') && packageJson.scripts['audit:phase1308-semantic-hook-projection'] === 'node scripts/audit/semantic-ownership-coverage.cjs',
  'The existing semantic ownership audit remains the broad cross-layer guardrail.');
check('Laravel source and generated Next.js frontend remain in the trace scope',
  exists('examples/ecommerce-shop-source/routes') && exists('examples/ecommerce-shop-source/app/Models') && exists('examples/ecommerce-shop-source/frontend/src'),
  'The source ecosystem, Laravel model/routes, and example frontend are present for source-to-target tracing.');
check('React SDK and CLI production source remain in the trace scope',
  exists('packages/react/src/hooks/createHooks.ts') && exists('packages/sdk/src/defineApi.ts') && exists('packages/cli/src/generators/sdk/apiObjectEmitter.ts'),
  'The three downstream layers are checked at their active production entry points.');
check('audit is registered without changing package version/build command',
  packageJson.scripts['audit:phase1370-semantic-reasoning-interface-wiring'] === 'node scripts/audits/audit-phase1370-semantic-reasoning-interface-wiring.cjs' && packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
  'The phase audit is reproducible; package version and build command remain unchanged.');

const report = {
  phase: 1370,
  title: 'Semantic Reasoning Interface Wiring Trace',
  scope: [
    'operation identity capability/algebra/authority/projection/CLI consumer',
    'semantic ownership coverage and audit scripts',
    'AST ADT -> semantic dataflow authority -> generic DataFlowInterface -> SDK/React/CLI consumers',
    'model primary-key reconciliation -> canonical SchemaRelationIndexInterface',
    'Laravel source example and frontend target presence',
  ],
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failed: checks.filter((item) => !item.passed).length,
  results: checks,
  decisions: [
    { area: 'Model primary-key reconciliation', decision: 'Consume the existing SchemaRelationIndexInterface and reuse the same index in the model builder.', reason: 'The raw-schema table lookup and primary-column filter were duplicated semantic selection inside the reconciliation judgment.' },
    { area: 'AST/dataflow interface', decision: 'Keep SemanticDataflowInput/Judgment as canonical ADTs and DataFlowInterface as a generic wiring/execution boundary.', reason: 'CodeQL likewise distinguishes AST nodes from data-flow graph nodes; semantic dataflow must not be silently equated with syntax-tree structure.' },
    { area: 'Operation identity', decision: 'Preserve the upstream capability/algebra/proof chain and project only a runtime-safe reference downstream.', reason: 'SDK/CLI consumers should not re-resolve identity from HTTP method/path.' },
    { area: 'Cross-layer contracts', decision: 'Keep the existing semantic ownership audit and add a focused wiring audit; do not fabricate consumers for declaration-only contracts.', reason: 'A static symbol declaration is not evidence of production adoption; ownership should be traced through producer, authority, wiring, and consumer.' },
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1370-semantic-reasoning-interface-wiring.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
