const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const repo = path.resolve(root, '..', '..');
const readCore = p => fs.readFileSync(path.join(root, p), 'utf8');
const readRepo = p => fs.readFileSync(path.join(repo, p), 'utf8');
const upstreamDir = path.join(root, 'src', 'types', 'upstream');
const upstream = fs.readdirSync(upstreamDir)
  .filter(name => name.endsWith('.ts'))
  .map(name => readCore(`src/types/upstream/${name}`));

const cliScan = readRepo('packages/cli/src/commands/scan.ts');
const cliModelGraph = readRepo('packages/cli/src/generators/normalizer/modelGraphBuilder.ts');
const graphInterface = readCore('src/graph/ServiceGraphBuilderInterface.ts');
const graphBuilder = readCore('src/graph/ServiceGraphBuilder.ts');
const irInterface = readCore('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const irProjection = readCore('src/compiler/ir/SemanticDataflowIRProjection.ts');
const manifestInterface = readCore('src/types/upstream/manifestBuilderInterface.ts');
const runtimeBoundary = readCore('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const adapter = readCore('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const dataflow = readCore('src/types/dataflow/dataFlowInterface.ts');
const dependencyBoundary = readCore('src/types/interfaces/interfaceDependencyBoundary.ts');

const fixture = {
  routes: readRepo('examples/ecommerce-shop-source/routes/api.php'),
  orderController: readRepo('examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php'),
  orderModel: readRepo('examples/ecommerce-shop-source/app/Models/Order.php'),
  orderResource: readRepo('examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php'),
  orderMigration: readRepo('examples/ecommerce-shop-source/database/migrations/2026_02_09_084332_create_orders_table.php'),
};

const checks = {
  genericDataFlowIsDomainNeutral: !/(Laravel|Route|Controller|Request|Model|Resource|Schema|Graph)/.test(dataflow),
  dependencyBoundaryIsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(dependencyBoundary),
  upstreamDoesNotImportDownstreamWiring: upstream.every(text => !/from ['\"].*(dataFlowInterface|interfaceDependencyBoundary|dataFlowProjectionInterface|semanticDataflowRuntimeBoundary|ServiceGraphBuilder|SemanticDataflowIRProjection)/.test(text)),
  runtimeBoundarySpecializesUpstreamToWiring: /InterfaceDependencyBoundary<\s*\n?\s*SemanticDataflowInput,/.test(runtimeBoundary) && /SemanticDataflowRuntimeDataFlow/.test(runtimeBoundary),
  adapterIsOnlySemanticDataflowRuntimeAdapter: /createSemanticDataflowJudgment\(input\)/.test(adapter) && /: DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(adapter),
  manifestIsSeedConstructionOnly: /interface ManifestBuilderInterface/.test(manifestInterface) && /build: \(sourceProject: SourceProjectIdentity\) => Promise<RouteSyncManifest>/.test(manifestInterface) && !/DataFlow/.test(manifestInterface),
  graphUsesGenericDirectionalBoundary: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface),
  graphHasCanonicalProject: /project\(manifest: RouteSyncManifestFlow\): ServiceGraph/.test(graphBuilder),
  irUsesDataFlowProjectionBoundary: /extends DataFlowProjectionInterface</.test(irInterface),
  irOnlyProjectsClosedState: /dataflow\.state\.closure/.test(irProjection) && !/relationFixedPoint|pathClosure/.test(irProjection),
  cliUsesGraphFactoryBoundary: /createServiceGraphBuilder/.test(cliScan) && /graphBuilder\.project\(manifestFlow\)/.test(cliScan) && !/new ServiceGraphBuilder|buildFromRouteSyncManifestFlow\(manifestFlow\)/.test(cliScan),
  cliModelGraphUsesAssemblyFactory: /createServiceGraphAssembly/.test(cliModelGraph) && !/new ServiceGraphBuilder/.test(cliModelGraph),
  graphPublicBoundaryIsProjectOnly: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphInterface) && !/buildFromRouteSyncManifestFlow/.test(graphInterface),
  fixtureHasRouteEvidence: /Route::/.test(fixture.routes),
  fixtureHasControllerResourceFlow: /OrderResource/.test(fixture.orderController) && /->load\(/.test(fixture.orderController),
  fixtureHasModelRelations: /belongsTo\(/.test(fixture.orderModel) && /hasMany\(/.test(fixture.orderModel),
  fixtureHasResourceProjection: /return \[/.test(fixture.orderResource) && /\$this->/.test(fixture.orderResource),
  fixtureHasSchemaForeignKey: /foreignId\('user_id'\)/.test(fixture.orderMigration),
};

const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 1063, checks, passed }, null, 2));
process.exitCode = passed ? 0 : 1;
