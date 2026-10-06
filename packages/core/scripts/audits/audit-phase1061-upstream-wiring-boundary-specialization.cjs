const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const fixtureRoot = path.resolve(root, '../../examples/ecommerce-shop-source');
const fixtureRead = relative => fs.readFileSync(path.join(fixtureRoot, relative), 'utf8');

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return entry.name.endsWith('.ts') ? [full] : [];
});
const upstreamProduction = walk(path.join(root, 'src/types/upstream'))
  .filter(file => !file.includes(`${path.sep}__tests__${path.sep}`))
  .map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));

const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const runtimeBoundary = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const runtimeComposition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const adapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const pipeline = read('src/compiler/analysis/semanticDataflowPipeline.ts');
const routeAnalysis = read('src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const scannerCompatibility = read('src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const manifest = read('src/types/upstream/manifest.ts');

const routes = fixtureRead('routes/api.php');
const controller = fixtureRead('app/Http/Controllers/OrderController.php');
const resource = fixtureRead('app/Http/Resources/OrderResource.php');
const model = fixtureRead('app/Models/Order.php');
const schema = fixtureRead('database/migrations/2026_02_09_084332_create_orders_table.php');

const checks = {
  dataflowContractIsGeneric: /DataFlowSourceInterface/.test(dataflow) && /DataFlowStepInterface/.test(dataflow) && /DataFlowFixpointInterface/.test(dataflow) && /DataFlowStateInterface/.test(dataflow) && /DataFlowQueryInterface/.test(dataflow) && !/Laravel|Route|Controller|Request|Model|Resource|Schema|Graph/.test(dataflow),
  dependencyBoundaryDirectionIsUpstreamToDownstream: /project:\s*\(upstream: Upstream\)\s*=>\s*Downstream/.test(boundary),
  runtimeWiringSpecializesGenericBoundary: /extends InterfaceDependencyBoundary<\s*SemanticDataflowInput,\s*SemanticDataflowRuntimeDataFlow\s*>/.test(runtimeBoundary),
  runtimeWiringReturnsGenericDataflow: /SemanticDataflowRuntimeDataFlow\s*=\s*DataFlowInterface</.test(runtimeBoundary),
  runtimeCompositionImplementsProject: /project:\s*createSemanticDataflowDataFlowInterface/.test(runtimeComposition),
  adapterIsOnlyAuthorityToGenericWiring: /createSemanticDataflowJudgment/.test(adapter) && /DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(adapter),
  authorityDoesNotImportDownstreamWiring: !/DataFlowInterface|InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(authority),
  upstreamDoesNotImportDownstreamWiring: upstreamProduction.every(({ text }) => !/InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(text)),
  pipelineConsumesWiringInterface: /runtime:\s*SemanticDataflowRuntimeBoundary/.test(pipeline) && /runtime\.project\(input\)/.test(pipeline),
  routeAnalysisConsumesWiringInterface: /runtime:\s*SemanticDataflowRuntimeBoundary/.test(routeAnalysis),
  compatibilityFacadeUsesWiringNotAuthority: /semanticDataflowRuntimeBoundary\.project\(input\)\.state/.test(scannerCompatibility) && !/semanticDataflowAuthority/.test(scannerCompatibility),
  projectionRemainsNarrowSpecialization: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  irConsumesProjectionInterface: /DataFlowProjectionInterface/.test(irInterface) && /dataflow\.state\.closure/.test(ir),
  graphRemainsStructuralBoundary: /InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface) && !/DataFlowProjectionInterface/.test(graphInterface),
  manifestRemainsSeedOnly: /ManifestDataflowSeedSurface/.test(manifest) && !/readonly reaches/.test(manifest),
  routeEvidence: /OrderController::class/.test(routes),
  controllerEvidence: /Request/.test(controller) && /OrderResource/.test(controller),
  resourceValueProjectionEvidence: /\$this->(id|status|total_harga)/.test(resource) && /OrderDetailResource::collection/.test(resource),
  modelRelationEvidenceIsStructural: /belongsTo\(User::class\)/.test(model) && /hasMany\(OrderDetail::class\)/.test(model),
  schemaForeignKeyEvidence: /Schema::create\('orders'/.test(schema) && /foreignId\('user_id'\)->constrained\(\)/.test(schema),
};

const result = { phase: 1061, checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exit(1);
