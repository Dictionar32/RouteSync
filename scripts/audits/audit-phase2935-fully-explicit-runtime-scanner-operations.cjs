const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const productionFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
];
const exportedFunctions = productionFiles.flatMap((file) =>
  [...read(file).matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)]
    .map((match) => `${file}:${match[1]}`));
const checks = {
  scannerDelegatesSourceObservationContinuation: /sourceObservation\.continueWith\(/.test(scanner),
  scannerHasNoSourceObservationKindBranch: !/if\s*\(sourceObservation\.kind\s*===/.test(scanner),
  sourceReadyOwnsContinuationOperation: /interface LaravelRouteSourceObservationReadyOperations[\s\S]*?readonly continueWith:/.test(sourceSelection),
  sourceBlockedOwnsContinuationOperation: /interface LaravelRouteScanBlockedJudgment[\s\S]*?readonly continueWith:/.test(sourceSelection),
  continuationIsDomainSpecificNotGeneric: /interface LaravelRouteSourceObservationContinuationInterface/.test(sourceSelection) && !/interface LaravelRouteSourceObservationContinuationInterface\s*<|continueWith\s*<Result>/.test(sourceSelection),
  cliManifestOperationIsInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliOperation),
  existingManifestBuilderJudgmentHasContinuation: /interface ManifestBuilderCompleteJudgment[\s\S]*?continueToFlow:[\s\S]*?interface ManifestBuilderSourceAstBlockedJudgment[\s\S]*?continueToFlow:/.test(manifestBuilder),
  sourceSelectionExplicitlyExportedFromUpstreamBarrel: /export \* from '\.\/laravelRouteSourceSelection'/.test(upstreamBarrel),
  noExportFunctionOnCheckedRuntimePath: exportedFunctions.length === 0,
  collectionsRemainEmpty: fs.existsSync(collections) && fs.statSync(collections).size === 0,
};
console.log(JSON.stringify({ phase: 2935, title: 'Fully Explicit Typed Runtime Scanner Operations — Source Observation Continuation Closure', checks, exportedFunctions }, null, 2));
if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
