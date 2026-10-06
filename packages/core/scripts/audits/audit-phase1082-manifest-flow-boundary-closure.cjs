const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const repo = path.resolve(root, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readRepo = rel => fs.readFileSync(path.join(repo, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

const manifest = read('src/types/upstream/manifest.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const flowProjection = read('src/compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface.ts');
const projection = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const graph = read('src/graph/ServiceGraphBuilderInterface.ts');
const dataflow = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const dataflowGeneric = read('src/types/dataflow/dataFlowInterface.ts');
const dataflowProjection = read('src/types/dataflow/dataFlowProjectionInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const routeLowerer = read('src/compiler/scanner/upstream/routeManifestLowerer.ts');
const cliScan = readRepo('packages/cli/src/commands/scan.ts');
const cliSync = readRepo('packages/cli/src/commands/sync.ts');
const fixtureController = readRepo('examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php');
const fixtureModel = readRepo('examples/ecommerce-shop-source/app/Models/Order.php');
const fixtureResource = readRepo('examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php');
const fixtureSchema = readRepo('examples/ecommerce-shop-source/database/migrations/2026_02_09_084332_create_orders_table.php');
const fixtureRoutes = readRepo('examples/ecommerce-shop-source/routes/api.php');
const legacyAuditNames = [
  'audit-phase1065-upstream-producer-wiring-boundary.cjs',
  'audit-phase1067-legacy-scanner-upstream-ownership.cjs',
  'audit-phase1068-upstream-wiring-legacy-closure.cjs',
  'audit-phase1069-legacy-scanner-producer-interface.cjs',
  'audit-phase1072-force-legacy-scanner-cutover.cjs',
  'audit-phase1073-public-scanner-cutover.cjs',
];

const downstream = [graph, dataflow, ir].join('\n');
const checks = {
  manifestFlowKindClosed: /interface RouteSyncManifestFlow[\s\S]*readonly kind: 'route_sync_manifest_flow'/.test(manifest),
  manifestConstructionKindClosed: /interface RouteSyncManifest \{[\s\S]*readonly kind: 'route_sync_manifest'/.test(manifest),
  constructionIsNotFlowSubtype: !/interface RouteSyncManifest extends RouteSyncManifestFlow/.test(manifest),
  flowProjectionIsDirectional: /InterfaceDependencyBoundary<RouteSyncManifest, RouteSyncManifestFlow>/.test(flowProjection),
  projectionReturnsAstFreeFlow: /kind: 'route_sync_manifest_flow'[\s\S]*contracts: manifest\.sourceModel\.contracts[\s\S]*relations: manifest\.sourceModel\.relations/.test(projection) && !/sourceModel:\s*manifest\.sourceModel/.test(projection) && !/ast:\s*manifest\.ast/.test(projection),
  boundaryIsUpstreamToDownstream: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  graphConsumesGraphSurface: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graph),
  dataflowRuntimeConsumesCanonicalInput: /InterfaceDependencyBoundary<\s*SemanticDataflowInput,\s*SemanticDataflowRuntimeDataFlow/.test(dataflow),
  genericDataflowHasNoLaravelVocabulary: !/Laravel|Route|Controller|Request|Model|Resource|Schema|Graph|IR|StaticLaravelScanner/.test(dataflowGeneric),
  irUsesCanonicalProjection: /extends DataFlowProjectionInterface</.test(ir),
  dataflowProjectionUsesGenericBoundary: /extends InterfaceDependencyBoundary<\s*DataFlowInterface<Input, State, Node>,\s*Output/.test(dataflowProjection),
  downstreamHasNoConcreteManifestImport: !/RouteSyncManifest(?![A-Za-z])/.test(downstream),
  routeLowererExplicitlyOwnsConstructionArtifact: /manifest: RouteSyncManifest/.test(routeLowerer) && /manifest\.ast\.ast/.test(routeLowerer),
  cliBuildsOnceThenProjectsFlow: /manifestBuilder\.build\(sourceProject\)/.test(cliScan) && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(cliScan) && /manifestBuilder\.build\(sourceProject\)/.test(cliSync) && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(cliSync),
  cliProjectsFlowToDataflowSurface: /routeSyncManifestDataflowSurfaceFromFlow\(manifestFlow\)/.test(cliScan + cliSync),
  staleBrokenPhase1070AuditRemoved: !exists('scripts/audits/audit-phase1070-dataflow-upstream-wiring-closure.cjs'),
  obsoleteLegacyAuditScriptsRemoved: legacyAuditNames.every(name => !exists(`scripts/audits/${name}`)),
  fixtureRouteController: /OrderController::class/.test(fixtureRoutes) && /Route::post\('\/checkout'/.test(fixtureRoutes),
  fixtureControllerValueFlow: /\$request->user\(\)->id/.test(fixtureController) && /Order::where\('user_id'/.test(fixtureController),
  fixtureModelRelations: /hasMany\(/.test(fixtureModel) && /belongsTo\(/.test(fixtureModel) && /hasOne\(/.test(fixtureModel),
  fixtureResourceProjection: /OrderDetailResource::collection\(\$this->details\)/.test(fixtureResource),
  fixtureSchemaForeignKey: /foreign\('user_id'\)/.test(fixtureSchema) || /foreignId\('user_id'\)/.test(fixtureSchema),
};
console.log(JSON.stringify({ phase: 1082, checks }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
