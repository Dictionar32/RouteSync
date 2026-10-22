const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const residuals = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const residual = (id, severity, owner, detail, nextMove) => residuals.push({ id, severity, owner, detail, nextMove });

const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const identityType = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const identityAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const identityProjection = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const groupCapability = read('packages/core/src/types/upstream/resourceGroupCapability.ts');
const groupAlgebra = read('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts');
const hookLowerer = read('packages/cli/src/generators/hooks/hookConfigLowerer.ts');
const hookResolver = read('packages/react/src/hooks/define/groupSlotResolver.ts');
const hookTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const defineHooks = read('packages/react/src/hooks/defineHooks.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const pkg = JSON.parse(read('package.json'));

check('CLI scan enters the canonical manifest producer interface', /manifestBuilder\.build\(sourceProject\)/.test(scanCommand), 'scan consumes manifestBuilder rather than constructing semantic routes locally');
check('CLI sync enters the same canonical manifest producer interface', /manifestBuilder\.build\(sourceProject\)/.test(syncCommand), 'sync shares the same upstream manifest construction boundary');
check('source-AST executor publishes complete/blocked projection ADT before manifest construction', /laravelSourceAstScanner\.scan\(invocationInventoryReceipt\)/.test(builder) && /laravel_source_ast_projection_complete/.test(builder) && /validateCompleteSourceAst\(ast, sourceProject\.source\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')), 'completeness is judged by the source-AST executor and the manifest builder consumes its complete arm');
check('upstream builder creates complete Laravel source model', /buildCompleteLaravelSourceModel/.test(builder) && /completeAst/.test(builder), 'source model is built from a validated complete AST');
check('semantic dataflow is derived upstream of manifest consumers', /semanticDataflowInputsFromSourceModel/.test(builder) && /semanticDataflowJudgmentsFromInputs/.test(builder), 'dataflow input and judgments are materialized before manifest publication');
check('manifest retains AST, source model, dataflow, and group capability surfaces', ['ast: completeAst', 'sourceModel: completeLaravelSourceModelBuildResult.value', 'dataflowInputs', 'dataflowJudgments', 'resourceGroupCapabilities'].every((token) => manifest.includes(token) || builder.includes(token)), 'manifest exposes distinct semantic products instead of collapsing them to route-only data');
check('operation identity is a closed upstream capability contract', /OperationIdentityCapabilityContract/.test(identityType) && /authority: 'upstream'/.test(identityAlgebra) && /input\.reasoning/.test(identityAlgebra), 'identity materialization preserves reasoning, derivation, and provenance');
check('operation identity projection consumes upstream capability', /capability\.identity\.route/.test(identityProjection), 'projection reads resolved identity rather than reclassifying method/path');
check('resource-group shape is computed by upstream algebra', /resourceGroupCapabilitiesFromRoutes\(completeAst\.ast\.routeFlows\)/.test(builder) && /shapeFromState/.test(groupAlgebra), 'group-shape reasoning occurs before CLI projection');
check('React receives an explicit CRUD slot contract on generated config', /crudSlots: \{/.test(hookLowerer) && /CrudGroupExecutionContract/.test(hookTypes) && /groupConfig\.crudSlots/.test(defineHooks), 'generated contract carries direct endpoint slots into React wiring');
check('React contract path does not need role inference', /if \(contract\)/.test(hookResolver) && /contract\.indexService/.test(hookResolver), 'contract-present branch directly consumes endpoint references');
check('package identity/build script are preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);
check('existing semantic ownership and data-loss audits remain available', exists('scripts/audits/audit-phase953-upstream-downstream-ownership.cjs') && exists('scripts/audits/audit-phase1401-operation-identity-dataflow-loss-boundary.cjs'), 'prior audits are retained and not replaced by a shallow aggregate check');

if (/statementExpressionRules/.test(scanner) && /statementAssignmentRules/.test(scanner)) {
  residual('R1', 'high', 'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts', 'The source scanner still contains semantic traversal/selection rules alongside file and AST extraction.', 'Split source parsing/evidence extraction from AST-to-semantic relation construction; preserve scanner as evidence producer only.');
}
if (/const findRoute =/.test(hookLowerer) && /route\.raw\.capability\.crudRole/.test(hookLowerer)) {
  residual('R2', 'high', 'packages/cli/src/generators/hooks/hookConfigLowerer.ts', 'Generator lowering still selects CRUD slots by scanning route roles and target scope instead of consuming a closed group-slot capability.', 'Extend upstream ResourceGroupCapability with action/parameter slot references; make the generator render those references only.');
}
if (/firstByRole/.test(hookResolver) && /Legacy compatibility/.test(hookResolver)) {
  residual('R3', 'high', 'packages/react/src/hooks/define/groupSlotResolver.ts', 'Runtime still has a legacy role-scanning branch when hand-authored HookConfig omits crudSlots.', 'Migrate handwritten/generated fixture configs, then make crudSlots required and remove role scanning.');
}
if (!/slots:/.test(groupCapability) && !/indexService|showService|createService|updateService|deleteService/.test(groupCapability)) {
  residual('R4', 'high', 'packages/core/src/types/upstream/resourceGroupCapability.ts', 'The closed resource-group contract carries only group shape/evidence, not the executable CRUD slot assignment needed by generators.', 'Represent slot selection as a closed ADT of route references plus explicit absence; preserve provenance and ambiguity diagnostics.');
}
if (/new Map<string, Set<string>>/.test(read('packages/cli/src/generators/classifier/routeGrouper.ts')) && /if \(used\.has\(actionName\)\)/.test(read('packages/cli/src/generators/classifier/routeGrouper.ts'))) {
  residual('R5', 'medium', 'packages/cli/src/generators/classifier/routeGrouper.ts', 'Downstream projection repairs duplicate action names by appending numeric suffixes, which can alter semantic identity at projection time.', 'Resolve action identity/uniqueness upstream and carry the final generated symbol in the closed route projection contract.');
}
if (/crudRole/.test(read('packages/core/src/types/domain/resourceGroupDescriptors.ts'))) {
  residual('R6', 'medium', 'packages/core/src/types/domain/resourceGroupDescriptors.ts', 'Legacy descriptor APIs still expose role-based route selection/classification helpers.', 'Trace callers and move remaining selection to upstream resource-group capability algebra before retiring compatibility APIs.');
}

const failed = checks.filter((item) => !item.pass);
const report = {
  phase: 1403,
  audit: 'semantic-reasoning-interface-boundary',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  residualCount: residuals.length,
  principle: 'Source evidence -> upstream semantic reasoning -> closed AST/ADT capability contract -> wiring/projection -> runtime execution; runtime must not infer business meaning.',
  checks,
  residuals,
  externalDesignReferences: [
    { topic: 'MLIR interfaces', url: 'https://mlir.llvm.org/docs/Interfaces/', relevance: 'Consumers should operate through semantic interfaces rather than hard-code per-operation special cases.' },
    { topic: 'CodeQL AST and dataflow', url: 'https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/', relevance: 'AST nodes and dataflow nodes are related but distinct models; preserve both rather than flattening them.' },
    { topic: 'TanStack Query keys', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/query-keys', relevance: 'Query keys must uniquely identify returned data and include variables affecting the query.' },
    { topic: 'TypeScript 7', url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/', relevance: 'Compiler/toolchain version must be verified separately from architecture audits.' }
  ]
};
const output = path.join(root, 'scripts/audits/reports/phase1403-semantic-reasoning-interface-boundary.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
