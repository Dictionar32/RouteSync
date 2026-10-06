const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const repo = path.resolve(root, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readRepo = rel => fs.readFileSync(path.join(repo, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) out.push(full);
  }
  return out;
};
const tsRoots = [root, path.join(repo, 'packages/cli'), path.join(repo, 'packages/sdk')];
const legacyRefs = tsRoots.flatMap(walk)
  .filter(file => fs.readFileSync(file, 'utf8').includes('StaticLaravelScanner'))
  .map(file => path.relative(repo, file));
const upstream = walk(path.join(root, 'src/types/upstream')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const graph = read('src/graph/ServiceGraphBuilderInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const manifest = read('src/types/upstream/manifestBuilderInterface.ts');
const builder = read('src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const scannerExports = read('src/compiler/scanner/scannerExports.ts');
const coreIndex = read('src/index.ts');
const compilerIndex = read('src/compiler/index.ts');
const cli = [
  readRepo('packages/cli/src/commands/scan.ts'),
  readRepo('packages/cli/src/commands/sync.ts'),
  readRepo('packages/cli/src/commands/audit/driftAuditor.ts'),
].join('\n');
const fixture = {
  route: readRepo('examples/ecommerce-shop-source/routes/api.php'),
  controller: readRepo('examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php'),
  model: readRepo('examples/ecommerce-shop-source/app/Models/Order.php'),
  resource: readRepo('examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php'),
  schema: readRepo('examples/ecommerce-shop-source/database/migrations/2026_02_09_084332_create_orders_table.php'),
  detailSchema: readRepo('examples/ecommerce-shop-source/database/migrations/2026_02_09_084356_create_order_details_table.php'),
};
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const checks = {
  staticScannerRemoved: !exists('src/compiler/scanner/StaticLaravelScanner.ts'),
  noLegacyTsRefs: legacyRefs.length === 0,
  upstreamHasNoDownstreamBoundary: !/InterfaceDependencyBoundary|DataFlowProjectionInterface|from .*compiler\//.test(upstream),
  dataFlowIsDomainNeutral: /DataFlowInterface/.test(dataflow) && !/Laravel|Route|Controller|Request|Model|Resource|Schema|Graph|IR|StaticLaravelScanner/.test(dataflow),
  boundaryIsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  manifestIsProducerOnly: /build: \(sourceProject: SourceProjectIdentity\) => Promise<RouteSyncManifest>/.test(manifest) && !/DataFlowInterface|InterfaceDependencyBoundary/.test(manifest),
  canonicalBuilderImplementsProducer: /manifestBuilder: ManifestBuilderInterface/.test(builder),
  graphUsesGenericUpstreamBoundary: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graph),
  irUsesOnlyValidDataFlowProjection: /extends DataFlowProjectionInterface</.test(ir) && !/DataFlowProjectionInterface</.test(graph),
  scannerPublicSurfaceHasNoConcreteImplementations: !/RouteScanner|ControllerScanner|ModelScanner|ResourceScanner|TypeDeriver|SemanticTypeDeriver|RequestTypeDeriver|InvalidationResolver/.test(scannerExports + coreIndex + compilerIndex),
  cliUsesCanonicalProducer: /manifestBuilder\.build\(sourceProject\)/.test(cli) && !/StaticLaravelScanner/.test(cli),
  staleLegacyAuditCommandsRemoved: !Object.keys(scripts).some(k => /phase(?:1065|1067|1068|1069|1070|1072|1073)/.test(k)),
  currentClosureAuditRegistered: scripts['audit:phase1075-interface-closure'] === 'node scripts/audits/audit-phase1075-interface-closure.cjs',
  fixtureRouteController: /OrderController::class/.test(fixture.route) && /Route::post\('\/checkout'/.test(fixture.route),
  fixtureControllerFlow: /Request/.test(fixture.controller) && /Order::where/.test(fixture.controller) && /OrderResource/.test(fixture.controller),
  fixtureRelations: /hasMany\(/.test(fixture.model) && /belongsTo\(/.test(fixture.model),
  fixtureResourceProjection: /return \[/.test(fixture.resource) && /\$this->/.test(fixture.resource),
  fixtureSchemaRelations: /foreignId\('user_id'\)/.test(fixture.schema) && /foreignId\('produk_item_id'\)/.test(fixture.detailSchema),
};
const result = { phase: 1075, checks, legacyRefs };
console.log(JSON.stringify(result, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
