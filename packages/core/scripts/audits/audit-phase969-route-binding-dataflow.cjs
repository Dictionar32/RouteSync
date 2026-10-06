const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const exists = p => fs.existsSync(path.join(repo, p));
const route = read('packages/core/src/types/upstream/route.ts');
const projection = read('packages/core/src/types/upstream/semanticDataflowRouteProjection.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const ecommerce = fs.readdirSync(path.join(repo, 'examples/ecommerce-shop-source/app/Http/Controllers')).filter(x => x.endsWith('.php')).length;
const api = read('examples/ecommerce-shop-source/routes/api.php');
const emptyLegacy = [
  'packages/core/src/types/upstream/routeBinding.ts',
  'packages/core/src/types/upstream/routeBindingResolution.ts',
  'packages/core/src/types/upstream/routeSemanticFlow.ts',
].map(p => ({ path: p, empty: exists(p) && fs.statSync(path.join(repo,p)).size === 0 }));
const checks = {
  routeContractOwnsBindingKinds: route.includes("kind: 'implicit_model'") && route.includes("kind: 'explicit'") && route.includes("kind: 'custom'") && route.includes("kind: 'implicit_enum'"),
  projectionUsesExistingBindingContract: projection.includes("RouteParameter['binding']") && projection.includes("binding.kind === 'implicit_model'") && projection.includes("binding.kind === 'explicit'") && projection.includes("binding.kind === 'custom'"),
  projectionTargetsControllerModel: projection.includes("parameter.kind.kind === 'model'") && projection.includes('parameter.kind.model.value.value === model'),
  projectionSeedOnly: projection.includes('SemanticDataflowInputFact') && !projection.includes('createSemanticDataflowJudgment') && !projection.includes("kind: 'reaches'"),
  manifestConsumesRouteProjection: surface.includes('semanticDataflowRouteParameterFacts'),
  productionConsumesManifestSurface: analysis.includes('manifest.dataflowInputs'),
  authorityOwnsClosure: authority.includes('createSemanticDataflowJudgment') && authority.includes('relationFixedPoint'),
  ecommerceHasScalarRoutes: /\{id\}|\{produkItemId\}|\{orderId\}/.test(api),
  ecommerceHasNoBindingDslEvidence: !/Route::model\(|Route::bind\(|scopeBindings\(|withTrashed\(/.test(api),
  routeBindingInterfaceActive: exists('packages/core/src/types/upstream/routeBinding.ts') && read('packages/core/src/types/upstream/routeBinding.ts').includes('interface RouteBindingInterface'),
  legacyFilesNotActive: emptyLegacy.slice(1).every(x => !exists(x.path) || x.empty),
  controllerFixtureExists: ecommerce > 0,
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k])=>k);
console.log(JSON.stringify({phase:969, checks, emptyLegacy, clean: failed.length===0, failed}, null, 2));
process.exitCode = failed.length ? 1 : 0;
