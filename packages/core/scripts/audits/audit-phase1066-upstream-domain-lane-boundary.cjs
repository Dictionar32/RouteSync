const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const repo = path.resolve(root, '..', '..');
const readCore = p => fs.readFileSync(path.join(root, p), 'utf8');
const readRepo = p => fs.readFileSync(path.join(repo, p), 'utf8');

const upstreamFiles = [
  'route.ts',
  'controller.ts',
  'modelRelation.ts',
  'resource.ts',
  'schema.ts',
  'manifest.ts',
  'semanticDataflow.ts',
].map(file => ({ file, text: readCore(`src/types/upstream/${file}`) }));

const dataflow = readCore('src/types/dataflow/dataFlowInterface.ts');
const dependencyBoundary = readCore('src/types/interfaces/interfaceDependencyBoundary.ts');
const projection = readCore('src/types/dataflow/dataFlowProjectionInterface.ts');
const runtimeBoundary = readCore('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const runtimeComposition = readCore('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const irBoundary = readCore('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const graphBoundary = readCore('src/graph/ServiceGraphBuilderInterface.ts');
const manifestBuilder = readCore('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');

const fixture = {
  routes: readRepo('examples/ecommerce-shop-source/routes/api.php'),
  controller: readRepo('examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php'),
  resource: readRepo('examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php'),
  model: readRepo('examples/ecommerce-shop-source/app/Models/Order.php'),
  schema: readRepo('examples/ecommerce-shop-source/database/migrations/2026_02_09_084332_create_orders_table.php'),
};

const downstreamImportPattern = /from ['\"][^'\"]*(?:compiler|graph|ir|analysis|cli)[^'\"]*['\"]/;
const forbiddenBoundaryImports = /from ['\"][^'\"]*(?:dataFlowInterface|interfaceDependencyBoundary|dataFlowProjectionInterface|semanticDataflowRuntimeBoundary|ServiceGraphBuilder|SemanticDataflowIRProjection)[^'\"]*['\"]/;

const checks = {
  upstreamDomainFilesPresent: upstreamFiles.every(({ text }) => text.length > 0),
  upstreamDomainLaneHasNoDownstreamCompilerImports: upstreamFiles.every(({ text }) => !downstreamImportPattern.test(text)),
  upstreamDomainLaneHasNoWiringBoundaryImports: upstreamFiles.every(({ text }) => !forbiddenBoundaryImports.test(text)),
  dataFlowInterfaceRemainsDomainNeutral: !/(Laravel|Route|Controller|Request|Model|Resource|Schema|Graph)/.test(dataflow),
  dependencyBoundaryIsDownstreamOwned: /project: \(upstream: Upstream\) => Downstream/.test(dependencyBoundary),
  projectionSpecializesOnlyDataFlow: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output\s*>/.test(projection.replace(/\n/g, ' ')),
  runtimeBoundaryConsumesUpstreamInput: /InterfaceDependencyBoundary<\s*\n?\s*SemanticDataflowInput,/.test(runtimeBoundary),
  runtimeCompositionIsWiringImplementation: /SemanticDataflowRuntimeBoundary/.test(runtimeComposition) && /createSemanticDataflowDataFlowInterface/.test(runtimeComposition),
  irConsumesThroughProjectionBoundary: /extends DataFlowProjectionInterface</.test(irBoundary),
  graphConsumesManifestThroughDirectionalBoundary: /extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>/.test(graphBoundary),
  manifestBuilderIsUpstreamProducer: /const manifestBuilder: ManifestBuilderInterface/.test(manifestBuilder),
  fixtureRouteIsSourceEvidence: /Route::get\('\/orders'/.test(fixture.routes),
  fixtureControllerCarriesRequestToModelAndResource: /Request/.test(fixture.controller) && /Order::where/.test(fixture.controller) && /OrderResource/.test(fixture.controller),
  fixtureResourceProjectsModelValues: /\$this->id/.test(fixture.resource) && /\$this->status/.test(fixture.resource),
  fixtureModelRelationsRemainStructural: /belongsTo\(User::class\)/.test(fixture.model) && /hasMany\(OrderDetail::class\)/.test(fixture.model),
  fixtureSchemaCarriesForeignKeyProvenance: /foreignId\('user_id'\)/.test(fixture.schema),
};

const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 1066, checks, passed }, null, 2));
process.exitCode = passed ? 0 : 1;
