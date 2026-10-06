const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const fixture = path.resolve(root, '../../examples/ecommerce-shop-source');
const fixtureRead = relative => fs.readFileSync(path.join(fixture, relative), 'utf8');

const upstreamDir = path.join(root, 'src/types/upstream');
const walkTs = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walkTs(full);
  return entry.name.endsWith('.ts') ? [full] : [];
});
const upstreamProduction = walkTs(upstreamDir)
  .filter(file => !file.includes(`${path.sep}__tests__${path.sep}`))
  .map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));

const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const projection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const adapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const composition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const runtimeBoundary = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const manifest = read('src/types/upstream/manifest.ts');
const manifestBuilder = read('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const graph = read('src/graph/ServiceGraphBuilder.ts');
const graphInterface = read('src/graph/ServiceGraphBuilderInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const index = read('src/index.ts');
const packageJson = JSON.parse(read('package.json'));

const routes = fixtureRead('routes/api.php');
const controller = fixtureRead('app/Http/Controllers/OrderController.php');
const resource = fixtureRead('app/Http/Resources/OrderResource.php');
const orderModel = fixtureRead('app/Models/Order.php');
const orderSchema = fixtureRead('database/migrations/2026_02_09_084332_create_orders_table.php');

const checks = {
  dataflowIsDomainNeutral: /DataFlowSourceInterface/.test(dataflow)
    && /DataFlowStepInterface/.test(dataflow)
    && /DataFlowFixpointInterface/.test(dataflow)
    && /DataFlowStateInterface/.test(dataflow)
    && /DataFlowQueryInterface/.test(dataflow)
    && !/Laravel|Route|Controller|Request|Model|Resource|Schema|Graph/.test(dataflow),
  dependencyBoundaryIsDownstreamOwned: /project:\s*\(upstream: Upstream\)\s*=>\s*Downstream/.test(boundary),
  projectionIsOnlyDataflowSpecialization: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection),
  authorityOwnsClosureNotWiring: /createSemanticDataflowJudgment/.test(authority)
    && /reachClosure/.test(authority)
    && !/DataFlowInterface|InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(authority),
  adapterOwnsRuntimeWiring: /createSemanticDataflowDataFlowInterface/.test(adapter)
    && /DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(adapter),
  compositionOwnsAdapterWiring: /project:\s*createSemanticDataflowDataFlowInterface/.test(composition),
  runtimeBoundaryIsInterfaceTyped: /export interface SemanticDataflowRuntimeBoundary/.test(runtimeBoundary),
  manifestIsSeedOnly: /ManifestDataflowSeedSurface/.test(manifest)
    && !/readonly reaches/.test(manifest)
    && !/kind:\s*['"]reaches['"]/.test(manifest),
  manifestBuilderIsInterfaceTyped: /export const manifestBuilder:\s*ManifestBuilderInterface/.test(manifestBuilder),
  graphConsumesStructuralManifestBoundary: /InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface)
    && !/DataFlowProjectionInterface/.test(graph),
  irConsumesCanonicalClosedState: /DataFlowProjectionInterface/.test(irInterface)
    && /SemanticDataflowInput/.test(irInterface)
    && /SemanticDataflowJudgment/.test(irInterface)
    && /SemanticDataflowIdentity/.test(irInterface)
    && /dataflow\.state\.closure/.test(ir)
    && !/dataflow\.judgment\.closure/.test(ir),
  upstreamDoesNotImportDownstreamBoundaries: upstreamProduction.every(({ text }) =>
    !/InterfaceDependencyBoundary|DataFlowProjectionInterface|SemanticDataflowRuntimeBoundary/.test(text)),
  graphConcreteBuilderNotRootExported: !/export\s*\{\s*ServiceGraphBuilder\s*\}/.test(index),
  graphFactoryReturnsInterface: /createServiceGraphBuilder\s*=\s*\(\)\s*:\s*ServiceGraphBuilderInterface/.test(graph),
  routeEvidenceExists: /Route::(get|post|put|patch|delete|match)/.test(routes) && /OrderController::class/.test(routes),
  controllerDataflowEvidenceExists: /Request/.test(controller) && /OrderResource/.test(controller) && /->load\(/.test(controller),
  resourceProjectsModelValues: /class OrderResource/.test(resource) && /\$this->(id|status|total_harga)/.test(resource) && /OrderDetailResource::collection/.test(resource),
  modelRelationsRemainStructural: /belongsTo\(User::class\)/.test(orderModel) && /hasMany\(OrderDetail::class\)/.test(orderModel),
  schemaEvidenceExists: /Schema::create\('orders'/.test(orderSchema) && /foreignId\('user_id'\)->constrained\(\)/.test(orderSchema),
  auditScriptsRegistered: Boolean(packageJson.scripts['audit:phase1057-upstream-wiring-interface-downstream'])
    && Boolean(packageJson.scripts['audit:phase1059-ecommerce-upstream-wiring-interface-downstream']),
};

const result = { phase: 1059, checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exit(1);
