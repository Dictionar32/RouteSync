const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productionFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/(^|\/)(__tests__|__test__)(\/|$)/.test(full)) productionFiles.push(full);
  }
};
walk(path.join(root, 'packages'));

const text = (file) => fs.readFileSync(file, 'utf8');
const occurrences = (needle, predicate = () => true) => productionFiles
  .filter(predicate)
  .flatMap(file => text(file).includes(needle) ? [path.relative(root, file)] : []);

const scan = text(path.join(root, 'packages/cli/src/commands/scan.ts'));
const builder = text(path.join(root, 'packages/core/src/graph/ServiceGraphBuilder.ts'));
const compiler = text(path.join(root, 'packages/core/src/graph/service/manifestGraphCompiler.ts'));

const report = {
  phase: 837,
  canonicalGraphInput: 'CompleteLaravelSourceModel::contracts',
  sourceModelCompilerExported: compiler.includes('export function compileGraphFromSourceModel'),
  serviceGraphBuilderCanonicalSignature: builder.includes('buildFromRouteSyncManifest(manifest: RouteSyncManifest): ServiceGraph'),
  scanUsesCanonicalGraphBoundary: scan.includes('buildFromRouteSyncManifest(scannedManifest)'),
  scanLegacyRouteManifestGraphCastRemoved: !scan.includes('buildFromRouteSyncManifest(scannedManifest, resolvedManifest as unknown as RouteManifest)'),
  graphCompilerReadsCanonicalModels: compiler.includes('sourceModel.contracts.models'),
  graphCompilerReadsCanonicalResources: compiler.includes('sourceModel.contracts.resources'),
  graphCompilerReadsCanonicalRoutes: compiler.includes('sourceModel.contracts.routes'),
  graphCompilerRegistersCanonicalServices: compiler.includes('registerServicesFromSourceModel(sourceModel, builder)'),
  productionCanonicalGraphConsumers: occurrences('buildFromRouteSyncManifest'),
  legacyGraphMethodStillPresent: builder.includes('buildFromManifest(manifest: RouteManifest): ServiceGraph'),
};

const failed = Object.entries(report).filter(([k, v]) => Array.isArray(v) ? v.length === 0 : v === false);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exit(1);
