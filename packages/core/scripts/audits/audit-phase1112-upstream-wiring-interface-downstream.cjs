const fs = require('node:fs');
const path = require('node:path');
const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const read = rel => fs.readFileSync(path.join(coreRoot, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(coreRoot, rel));
const walk = dir => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const tsFiles = dir => walk(dir).filter(file => /\.(ts|tsx|mts|cts)$/.test(file));
const upstreamFiles = tsFiles(path.join(coreRoot, 'src/types/upstream'));
const upstreamText = upstreamFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const productionDomain = tsFiles(path.join(coreRoot, 'src/types/domain')).filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));
const domainCompilerImports = productionDomain.filter(file => /from\s+['"][^'"]*compiler\//.test(fs.readFileSync(file, 'utf8'))).map(file => path.relative(repoRoot, file).replaceAll(path.sep, '/'));
const commandFiles = tsFiles(path.join(repoRoot, 'packages/cli/src/commands'));
const commandText = commandFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const allSourceText = [...tsFiles(path.join(coreRoot, 'src')), ...tsFiles(path.join(repoRoot, 'packages/cli/src'))].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const fixture = rel => fs.readFileSync(path.join(repoRoot, 'examples/ecommerce-shop-source', rel), 'utf8');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const runtimeAdapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeComposition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const graphInterface = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irInterface = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const checks = {
  upstreamNoCompilerOrDownstreamImports: !/from\s+['"][^'"]*(?:compiler|cli|sdk)\//.test(upstreamText),
  upstreamDoesNotOwnBoundary: !/InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(upstreamText),
  upstreamSemanticTargetsPresent: ['manifest.ts','route.ts','controller.ts','modelRelation.ts','resource.ts','schema.ts','typeVocabulary.ts','semanticDataflow.ts'].every(name => exists(`src/types/upstream/${name}`)),
  wiringManifestAndAdaptersPresent: ['upstreamManifestBuilder.ts','migrationInterfaceAdapter.ts','semanticDataflowInputAdapter.ts','routeManifestProjection.ts','routeManifestTypeLowering.ts'].every(name => exists(`src/compiler/scanner/wiring/${name}`)),
  noLegacyScannerImplementation: tsFiles(path.join(coreRoot, 'src/compiler/scanner/upstream')).length === 0,
  noStaticLaravelScanner: !allSourceText.includes('StaticLaravelScanner'),
  noLegacyScannerImports: !/compiler\/scanner\/upstream|\.\.\/upstream\/(upstreamManifestBuilder|migrationInterfaceAdapter|semanticDataflowInputAdapter|routeGroupSemanticResolver|routeMiddlewareFlowResolver|routeAstConstruction)/.test(allSourceText),
  dataFlowInterfaceGeneric: /DataFlowSourceInterface/.test(dataflow) && /DataFlowFixpointInterface/.test(dataflow) && /DataFlowQueryInterface/.test(dataflow) && !/Laravel|Eloquent|Controller|Resource|Model|Route|Schema|Graph/.test(dataflow),
  dependencyBoundaryGenericDirectional: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  runtimeAdapterImplementsGenericContract: /createSemanticDataflowDataFlowInterface/.test(runtimeAdapter) && /DataFlowInterface</.test(runtimeAdapter),
  runtimeCompositionUsesAdapter: /project:/.test(runtimeComposition) && /createSemanticDataflowDataFlowInterface/.test(runtimeComposition),
  cliUsesPackageSurface: !/(packages\/core\/src|core\/src)/.test(commandText),
  cliSuppliesRuntimeBoundary: /analyzeRouteSyncManifestDataflow\(dataflowSurface, cliSemanticDataflowRuntimeBoundary\)/.test(commandText),
  graphIsDownstreamProjection: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graphInterface),
  irConsumesDataflowState: /DataFlowProjectionInterface/.test(irInterface) && /DataFlowInterface/.test(ir) && /dataflow\.state\.closure/.test(ir),
  routeEvidence: /OrderController::class/.test(fixture('routes/api.php')),
  controllerEvidence: /Request/.test(fixture('app/Http/Controllers/OrderController.php')) && /OrderResource/.test(fixture('app/Http/Controllers/OrderController.php')),
  modelRelationEvidence: /belongsTo\(User::class\)/.test(fixture('app/Models/Order.php')) && /hasMany\(OrderDetail::class\)/.test(fixture('app/Models/Order.php')),
  resourceEvidence: /OrderDetailResource::collection/.test(fixture('app/Http/Resources/OrderResource.php')),
  schemaEvidence: /Schema::create\('orders'/.test(fixture('database/migrations/2026_02_09_084332_create_orders_table.php')) && /foreignId\('user_id'\)->constrained\(\)/.test(fixture('database/migrations/2026_02_09_084332_create_orders_table.php')),
  domainCompilerFrontierIsExplicit: domainCompilerImports.length > 0,
};
const result = { phase: 1112, checks, domainCompilerImports, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
