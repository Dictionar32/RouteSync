const fs = require('node:fs');
const path = require('node:path');
const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const src = path.join(coreRoot, 'src');
const cliSrc = path.join(repoRoot, 'packages/cli/src');
const walk = dir => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => { const f = path.join(dir,e.name); return e.isDirectory()?walk(f):[f]; });
const tsFiles = dir => walk(dir).filter(f => /\.(ts|tsx|mts|cts)$/.test(f));
const read = f => fs.readFileSync(f,'utf8');
const rel = f => path.relative(repoRoot,f).replaceAll(path.sep,'/');
const production = [...tsFiles(src), ...tsFiles(cliSrc)].filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const domain = tsFiles(path.join(src,'types/domain')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const upstream = tsFiles(path.join(src,'types/upstream'));
const typeIr = tsFiles(path.join(src,'types/ir')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const semantic = tsFiles(path.join(src,'types/semantic')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const commands = tsFiles(path.join(cliSrc,'commands'));
const imports = (files, pattern) => files.filter(f => pattern.test(read(f))).map(rel);
const domainCompiler = imports(domain,/from\s+['"][^'"]*compiler\//);
const upstreamCompiler = imports(upstream,/from\s+['"][^'"]*(?:compiler|cli|sdk)\//);
const irSemanticFacade = imports(typeIr,/compiler[\\/]types[\\/]SemanticType/);
const semanticFacade = imports(semantic,/compiler[\\/]types[\\/]SemanticType/);
const routeFacade = imports([path.join(src,'types/route.ts')],/compiler[\\/]scanner[\\/]wiring[\\/]routeManifestInterface/);
const legacy = imports(production,/StaticLaravelScanner|scanner[\\/]upstream/);
const typeVocabulary = read(path.join(src,'types/upstream/typeVocabulary.ts'));
const semanticType = read(path.join(src,'types/domain/semanticType.ts'));
const dataflow = read(path.join(src,'types/dataflow/dataFlowInterface.ts'));
const boundary = read(path.join(src,'types/interfaces/interfaceDependencyBoundary.ts'));
const graph = read(path.join(src,'graph/RouteSyncManifestGraphProjectionInterface.ts'));
const irProjection = read(path.join(src,'compiler/ir/SemanticDataflowIRProjection.ts'));
const fixtureRoute = read(path.join(repoRoot,'examples/ecommerce-shop-source/routes/api.php'));
const fixtureOrder = read(path.join(repoRoot,'examples/ecommerce-shop-source/app/Models/Order.php'));
const fixtureResource = read(path.join(repoRoot,'examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php'));
const fixtureSchema = read(path.join(repoRoot,'examples/ecommerce-shop-source/database/migrations/2026_02_09_084332_create_orders_table.php'));
const checks = {
  typeVocabularyCanonicalUpstream: /export type TypeExpression/.test(typeVocabulary) && /export type DeclaredType/.test(typeVocabulary),
  semanticTypeCanonicalDomain: /Canonical domain semantic type algebra/.test(semanticType) && !/compiler\//.test(semanticType),
  domainNoCompilerImports: domainCompiler.length === 0,
  upstreamNoCompilerImports: upstreamCompiler.length === 0,
  irNoSemanticTypeFacade: irSemanticFacade.length === 0,
  semanticNoSemanticTypeFacade: semanticFacade.length === 0,
  routeBarrelNoCompilerFacade: routeFacade.length === 0,
  dataFlowGeneric: /DataFlowSourceInterface/.test(dataflow) && !/Laravel|Eloquent|Controller|Resource|Model|Route|Schema|Graph|IR/.test(dataflow),
  dependencyBoundaryGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  graphDownstreamProjection: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(graph),
  irDownstreamProjection: /dataflow\.state\.closure/.test(irProjection),
  cliPackageSurface: commands.every(f => !/(packages[\\/]core[\\/]src|core[\\/]src)/.test(read(f))),
  legacyProductionEmpty: legacy.length === 0,
  ecommerceRouteController: /OrderController::class/.test(fixtureRoute),
  ecommerceModelRelation: /belongsTo\(User::class\)/.test(fixtureOrder) && /hasMany\(OrderDetail::class\)/.test(fixtureOrder),
  ecommerceResource: /OrderDetailResource::collection/.test(fixtureResource),
  ecommerceSchema: /foreignId\('user_id'\)->constrained\(\)/.test(fixtureSchema),
};
const result = { phase:1115, direction:'upstream => wiring => interface => downstream', checks, domainCompiler, upstreamCompiler, irSemanticFacade, semanticFacade, routeFacade, legacy, passed:Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result,null,2));
process.exit(result.passed?0:1);
