const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const routeScanner = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).toString();
const runtimeFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
  'packages/core/src/types/upstream/laravelRouteScannerInterface.ts',
];
const exportedFunctions = runtimeFiles.flatMap(file =>
  [...read(file).matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => `${file}:${match[1]}`),
);
const checks = {
  sourceReadyOwnsRouteScanOperation: /interface LaravelRouteSourceObservationReadyOperations[\s\S]*?readonly continueToRouteScan:/.test(sourceSelection),
  sourceBlockedOwnsRouteScanOperation: /interface LaravelRouteSourceObservationBlockedOperations[\s\S]*?readonly continueToRouteScan:/.test(sourceSelection),
  routeScanOutcomeOwnsAstProjection: /interface LaravelRouteScanOutcomeContinuationInterface[\s\S]*?continueToSourceAstProjection/.test(routeScanner),
  cliManifestOperationIsInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=/.test(cliOperation),
  manifestBuilderIsInterfaceFirst: /export interface ManifestBuilderInterface/.test(manifestBuilder) && /readonly build:/.test(manifestBuilder),
  sourceSelectionExplicitlyExportedFromUpstreamBarrel: /export \* from ['"]\.\/laravelRouteSourceSelection['"]/.test(upstreamBarrel),
  noExportFunctionOnCheckedRuntimePath: exportedFunctions.length === 0,
  collectionsRemainEmpty: collections === '\n',
};
console.log(JSON.stringify({ phase: 2935, title: 'Fully Explicit Typed Runtime Scanner Operations — Source Observation Continuation Closure', checks, exportedFunctions }, null, 2));
if (Object.values(checks).some(passed => !passed)) process.exitCode = 1;
