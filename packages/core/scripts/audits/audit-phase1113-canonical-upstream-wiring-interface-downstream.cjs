const fs = require('node:fs');
const path = require('node:path');

const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const src = path.join(coreRoot, 'src');
const cliSrc = path.join(repoRoot, 'packages/cli/src');

const walk = dir => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const tsFiles = dir => walk(dir).filter(file => /\.(ts|tsx|mts|cts)$/.test(file));
const read = file => fs.readFileSync(file, 'utf8');
const rel = file => path.relative(repoRoot, file).replaceAll(path.sep, '/');
const productionTs = [...tsFiles(src), ...tsFiles(cliSrc)];
const upstreamTs = tsFiles(path.join(src, 'types/upstream'));
const upstreamText = upstreamTs.map(read).join('\n');
const cliCommands = tsFiles(path.join(cliSrc, 'commands'));
const cliCommandText = cliCommands.map(read).join('\n');
const domainProduction = tsFiles(path.join(src, 'types/domain')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const domainCompilerImports = domainProduction
  .filter(f => /from\s+['"][^'"]*compiler\//.test(read(f)))
  .map(rel);

const wiring = path.join(src, 'compiler/scanner/wiring');
const legacyScanner = path.join(src, 'compiler/scanner/upstream');
const fixtureRoot = path.join(repoRoot, 'examples/ecommerce-shop-source');
const fixture = p => read(path.join(fixtureRoot, p));

const dataflow = read(path.join(src, 'types/dataflow/dataFlowInterface.ts'));
const boundary = read(path.join(src, 'types/interfaces/interfaceDependencyBoundary.ts'));
const runtimeBoundary = read(path.join(src, 'compiler/analysis/semanticDataflowRuntimeBoundary.ts'));
const runtimeComposition = read(path.join(src, 'compiler/analysis/semanticDataflowRuntimeComposition.ts'));
const runtimeAdapter = read(path.join(src, 'compiler/analysis/semanticDataflowDataFlowAdapter.ts'));
const graphInterface = read(path.join(src, 'graph/RouteSyncManifestGraphProjectionInterface.ts'));
const irInterface = read(path.join(src, 'compiler/ir/SemanticDataflowIRProjectionInterface.ts'));
const irProjection = read(path.join(src, 'compiler/ir/SemanticDataflowIRProjection.ts'));

const expectedWiring = [
  'upstreamManifestBuilder.ts',
  'migrationInterfaceAdapter.ts',
  'semanticDataflowInputAdapter.ts',
  'routeManifestProjection.ts',
  'routeManifestTypeLowering.ts',
  'route/routeGroupSemanticResolver.ts',
  'route/controllerMiddlewareProjection.ts',
  'route/resourceMiddlewareProjection.ts',
];
const expectedUpstream = [
  'manifest.ts', 'route.ts', 'controller.ts', 'modelRelation.ts',
  'resource.ts', 'schema.ts', 'typeVocabulary.ts', 'semanticDataflow.ts',
];

const productionLegacyImports = productionTs
  .filter(f => /compiler[\\/]scanner[\\/]upstream|scanner[\\/]upstream/.test(read(f)))
  .map(rel);
const staticScannerRefs = productionTs
  .filter(f => /StaticLaravelScanner/.test(read(f)))
  .map(rel);

const checks = {
  upstreamHasCanonicalSemanticVocabulary: expectedUpstream.every(name => fs.existsSync(path.join(src, 'types/upstream', name))),
  upstreamDoesNotImportCompilerOrCli: !/from\s+['"][^'"]*(?:compiler|cli|sdk)\//.test(upstreamText),
  upstreamDoesNotImportProjectionBoundary: !/InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(upstreamText),
  wiringOwnsLaravelAdapters: expectedWiring.every(name => fs.existsSync(path.join(wiring, name))),
  legacyScannerDirectoryAbsent: !fs.existsSync(legacyScanner),
  noProductionLegacyScannerImports: productionLegacyImports.length === 0,
  noProductionStaticLaravelScanner: staticScannerRefs.length === 0,
  dataFlowInterfaceIsGeneric: /DataFlowSourceInterface/.test(dataflow)
    && /DataFlowFixpointInterface/.test(dataflow)
    && /DataFlowQueryInterface/.test(dataflow)
    && !/Laravel|Eloquent|Controller|Resource|Model|Route|Schema|Graph|IR/.test(dataflow),
  dependencyBoundaryIsDownstreamOwned: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary)
    && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  runtimeBoundaryConsumesUpstream: /InterfaceDependencyBoundary<\s*\n?\s*SemanticDataflowInput,/.test(runtimeBoundary),
  runtimeCompositionUsesGenericAdapter: /createSemanticDataflowDataFlowInterface\(input\)/.test(runtimeComposition)
    && /DataFlowInterface</.test(runtimeAdapter),
  graphIsProjectionOnly: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graphInterface),
  irIsDataflowProjection: /DataFlowProjectionInterface</.test(irInterface)
    && /dataflow\.state\.closure/.test(irProjection),
  cliUsesPackageSurfaceOnly: !/(packages[\\/]core[\\/]src|core[\\/]src)/.test(cliCommandText),
  ecommerceRouteControllerEvidence: /OrderController::class/.test(fixture('routes/api.php'))
    && /OrderResource/.test(fixture('app/Http/Controllers/OrderController.php')),
  ecommerceModelRelationEvidence: /belongsTo\(User::class\)/.test(fixture('app/Models/Order.php'))
    && /hasMany\(OrderDetail::class\)/.test(fixture('app/Models/Order.php')),
  ecommerceResourceSchemaEvidence: /OrderDetailResource::collection/.test(fixture('app/Http/Resources/OrderResource.php'))
    && /foreignId\('user_id'\)->constrained\(\)/.test(fixture('database/migrations/2026_02_09_084332_create_orders_table.php')),
  domainCompilerFrontierRecorded: domainCompilerImports.length === 28,
};

const result = {
  phase: 1113,
  direction: 'upstream => wiring => interface => downstream',
  checks,
  productionLegacyImports,
  staticScannerRefs,
  domainCompilerImports,
  passed: Object.values(checks).every(Boolean),
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
