const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const read = p => fs.readFileSync(path.join(repo, p), 'utf8');
const exists = p => fs.existsSync(path.join(repo, p));
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const builder = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const ecommerceRoutes = fs.readFileSync(path.join(repo, 'examples/ecommerce-shop-source/routes/api.php'), 'utf8');
const checks = {
  manifestSurfaceExists: exists('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts'),
  manifestExtendsSeedSurface: manifest.includes('extends ManifestDataflowSeedSurface'),
  seedSurfaceUsesCanonicalInput: surface.includes('SemanticDataflowInput') && surface.includes('readonly dataflowInputs'),
  seedSurfaceNoSolver: !surface.includes('createSemanticDataflowJudgment') && !surface.includes("kind: 'reaches'"),
  seedSurfaceUsesRouteProjection: surface.includes('semanticDataflowRouteParameterFacts'),
  seedSurfaceUsesControllerProjection: surface.includes('semanticDataflowControllerFacts'),
  seedSurfaceUsesQueryProjection: surface.includes('semanticDataflowControllerQueryFacts'),
  builderMaterializesSurface: builder.includes('dataflowInputs: semanticDataflowInputsFromSourceModel'),
  scannerReusesMaterializedSurface: scanner.includes('dataflowInputs: manifest.dataflowInputs'),
  productionConsumesManifestSurface: analysis.includes('manifest.dataflowInputs'),
  authorityStillOwnsClosure: authority.includes('createSemanticDataflowJudgment') && authority.includes('relationFixedPoint'),
  upstreamExportsSurface: index.includes("export * from './semanticDataflowManifestSurface';"),
  ecommerceHasRouteScalars: /\{id\}|\{produkItemId\}|\{orderId\}/.test(ecommerceRoutes),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 968, checks, clean: failed.length === 0, failed }, null, 2));
process.exitCode = failed.length ? 1 : 0;
