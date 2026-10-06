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
const production = [...tsFiles(src), ...tsFiles(cliSrc)].filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const domain = tsFiles(path.join(src, 'types/domain')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const upstream = tsFiles(path.join(src, 'types/upstream'));
const cliCommands = tsFiles(path.join(cliSrc, 'commands'));
const textOf = files => files.map(read).join('\n');
const hasImport = (file, needle) => new RegExp(`from\\s+['"][^'"]*${needle}`).test(read(file));
const domainCompilerImports = domain.filter(f => /from\s+['"][^'"]*compiler\//.test(read(f))).map(rel);
const upstreamCompilerImports = upstream.filter(f => /from\s+['"][^'"]*(?:compiler|cli|sdk)\//.test(read(f))).map(rel);
const productionLegacy = production.filter(f => /compiler[\\/]scanner[\\/]upstream|scanner[\\/]upstream/.test(read(f))).map(rel);
const staticScanner = production.filter(f => /StaticLaravelScanner/.test(read(f))).map(rel);
const dataflow = read(path.join(src, 'types/dataflow/dataFlowInterface.ts'));
const boundary = read(path.join(src, 'types/interfaces/interfaceDependencyBoundary.ts'));
const runtimeBoundary = read(path.join(src, 'compiler/analysis/semanticDataflowRuntimeBoundary.ts'));
const runtimeComposition = read(path.join(src, 'compiler/analysis/semanticDataflowRuntimeComposition.ts'));
const adapter = read(path.join(src, 'compiler/analysis/semanticDataflowDataFlowAdapter.ts'));
const graphInterface = read(path.join(src, 'graph/RouteSyncManifestGraphProjectionInterface.ts'));
const irInterface = read(path.join(src, 'compiler/ir/SemanticDataflowIRProjectionInterface.ts'));
const irProjection = read(path.join(src, 'compiler/ir/SemanticDataflowIRProjection.ts'));
const fixture = p => read(path.join(repoRoot, 'examples/ecommerce-shop-source', p));
const wiring = path.join(src, 'compiler/scanner/wiring');

const checks = {
  canonicalSemanticTypeOwnedByDomain: fs.existsSync(path.join(src, 'types/domain/semanticType.ts'))
    && /Canonical domain semantic type algebra/.test(read(path.join(src, 'types/domain/semanticType.ts'))),
  domainHasNoCompilerImports: domainCompilerImports.length === 0,
  upstreamHasNoCompilerImports: upstreamCompilerImports.length === 0,
  compilerSemanticTypeIsDownstreamFacade: /types\/domain\/semanticType/.test(read(path.join(src, 'compiler/types/SemanticType.ts')))
    && !/TypeScriptSyntax/.test(read(path.join(src, 'compiler/types/SemanticType.ts'))),
  targetFormattingIsDownstream: !/formatProperty\s*:/.test(read(path.join(src, 'types/domain/semanticType.ts')))
    && /lowerTypeExpression\(prop\.type\)/.test(read(path.join(src, 'compiler/domain/common/ts-lowerer/builder/typeExpressionLowerer.ts'))),
  canonicalResponseBodyOwnedByDomain: fs.existsSync(path.join(src, 'types/domain/responseBody.ts'))
    && /Canonical semantic response-body vocabulary/.test(read(path.join(src, 'types/domain/responseBody.ts'))),
  responseBodyFacadeIsDownstream: /types\/domain\/responseBody/.test(read(path.join(src, 'compiler/ir/response/responseBodies.ts'))),
  routeControllerUpstreamPresent: ['route.ts','controller.ts'].every(n => fs.existsSync(path.join(src, 'types/upstream', n))),
  relationResourceSchemaUpstreamPresent: ['modelRelation.ts','resource.ts','schema.ts'].every(n => fs.existsSync(path.join(src, 'types/upstream', n))),
  manifestUpstreamPresent: fs.existsSync(path.join(src, 'types/upstream/manifest.ts')),
  wiringOwnsLaravelAdapters: ['upstreamManifestBuilder.ts','migrationInterfaceAdapter.ts','semanticDataflowInputAdapter.ts','routeManifestProjection.ts','routeManifestTypeLowering.ts'].every(n => fs.existsSync(path.join(wiring,n))),
  noLegacyScannerDirectory: !fs.existsSync(path.join(src, 'compiler/scanner/upstream')),
  noProductionLegacyScanner: productionLegacy.length === 0,
  noProductionStaticLaravelScanner: staticScanner.length === 0,
  dataFlowInterfaceGeneric: /DataFlowSourceInterface/.test(dataflow) && /DataFlowFixpointInterface/.test(dataflow)
    && /DataFlowQueryInterface/.test(dataflow) && !/Laravel|Eloquent|Controller|Resource|Model|Route|Schema|Graph|IR/.test(dataflow),
  dependencyBoundaryGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary)
    && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  runtimeBoundaryUpstreamToInterface: /InterfaceDependencyBoundary<\s*\n?\s*SemanticDataflowInput,/.test(runtimeBoundary)
    && /DataFlowInterface/.test(adapter),
  runtimeCompositionGenericAdapter: /createSemanticDataflowDataFlowInterface\(input\)/.test(runtimeComposition),
  graphProjectionOnly: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graphInterface),
  irProjectionOnly: /DataFlowProjectionInterface</.test(irInterface) && /dataflow\.state\.closure/.test(irProjection),
  cliUsesPackageSurface: !/(packages[\\/]core[\\/]src|core[\\/]src)/.test(textOf(cliCommands)),
  ecommerceRouteController: /OrderController::class/.test(fixture('routes/api.php')) && /OrderResource/.test(fixture('app/Http/Controllers/OrderController.php')),
  ecommerceModelRelation: /belongsTo\(User::class\)/.test(fixture('app/Models/Order.php')) && /hasMany\(OrderDetail::class\)/.test(fixture('app/Models/Order.php')),
  ecommerceResourceSchema: /OrderDetailResource::collection/.test(fixture('app/Http/Resources/OrderResource.php')) && /foreignId\('user_id'\)->constrained\(\)/.test(fixture('database/migrations/2026_02_09_084332_create_orders_table.php')),
};

const result = {
  phase: 1114,
  direction: 'upstream => wiring => interface => downstream',
  checks,
  domainCompilerImports,
  upstreamCompilerImports,
  productionLegacy,
  staticScanner,
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
