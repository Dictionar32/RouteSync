const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const walkTs = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTs(full));
    else if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const sourceRoots = [
  path.join(root, 'src'),
  path.resolve(root, '..', 'cli', 'src'),
  path.resolve(root, '..', 'sdk', 'tests'),
];
const legacyRefs = sourceRoots
  .flatMap(walkTs)
  .filter(file => fs.readFileSync(file, 'utf8').includes('StaticLaravelScanner'))
  .map(file => path.relative(root, file));

const rootIndex = read('src/index.ts');
const compilerIndex = read('src/compiler/index.ts');
const artifactMetadata = fs.readFileSync(path.resolve(root, '..', 'cli', 'src/generators/utils/ArtifactMetadataFactory.ts'), 'utf8');
const fixtureRoot = path.resolve(root, '..', '..', 'examples/ecommerce-shop-source');
const fixtureRead = (relative) => fs.readFileSync(path.join(fixtureRoot, relative), 'utf8');
const routeSource = fixtureRead('routes/api.php');
const controllerSource = fixtureRead('app/Http/Controllers/OrderController.php');
const resourceSource = fixtureRead('app/Http/Resources/OrderResource.php');
const orderModelSource = fixtureRead('app/Models/Order.php');
const orderSchema = fixtureRead('database/migrations/2026_02_09_084332_create_orders_table.php');
const orderDetailSchema = fixtureRead('database/migrations/2026_02_09_084356_create_order_details_table.php');

const checks = {
  legacyScannerFileRemoved: !exists('src/compiler/scanner/StaticLaravelScanner.ts'),
  rootPublicSurfaceHasNoLegacyScanner: !/StaticLaravelScanner/.test(rootIndex),
  compilerPublicSurfaceHasNoLegacyScanner: !/StaticLaravelScanner/.test(compilerIndex),
  artifactProducerHasNoLegacyScanner: !/StaticLaravelScanner/.test(artifactMetadata),
  noLegacyScannerRefsInTsSourcesOrTests: legacyRefs.length === 0,
  manifestProducerIsCanonical: /ManifestBuilderInterface/.test(read('src/types/upstream/manifestBuilderInterface.ts')) && /manifestBuilder/.test(read('src/compiler/scanner/wiring/upstreamManifestBuilder.ts')),
  dataFlowRemainsGeneric: !/Laravel|Route|Controller|Request|Model|Resource|Schema|StaticLaravelScanner/.test(read('src/types/dataflow/dataFlowInterface.ts')),
  boundaryRemainsDirectional: /InterfaceDependencyBoundary/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')) && /project: \(upstream: Upstream\) => Downstream/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')),
  graphConsumesUpstreamFlow: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(read('src/graph/ServiceGraphBuilderInterface.ts')),
  irIsOnlyDataflowProjectionBoundary: /DataFlowProjectionInterface</.test(read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts')) && !/DataFlowProjectionInterface</.test(read('src/graph/ServiceGraphBuilderInterface.ts')),
  fixtureRouteControllerEvidence: /OrderController::class/.test(routeSource) && /Route::get\('\/orders'/.test(routeSource) && /Route::post\('\/checkout'/.test(routeSource),
  fixtureControllerRequestModelResourceEvidence: /Request/.test(controllerSource) && /Order::where/.test(controllerSource) && /OrderResource/.test(controllerSource),
  fixtureModelRelationEvidence: /details/.test(orderModelSource) && /payment/.test(orderModelSource) && /shipping/.test(orderModelSource),
  fixtureSchemaForeignKeyEvidence: /foreignId\('user_id'\)/.test(orderSchema) && /foreignId\('produk_item_id'\)/.test(orderDetailSchema),
};

const failed = Object.entries(checks).filter(([, value]) => !value);
console.log(JSON.stringify({ phase: 1074, checks, legacyRefs }, null, 2));
if (failed.length) process.exit(1);
