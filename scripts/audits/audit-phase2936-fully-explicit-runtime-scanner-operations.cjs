const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const collectionPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const runtimeFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts',
  'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
];
const exportedFunctions = runtimeFiles.flatMap(file => [...read(file).matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => `${file}:${match[1]}`));
const checks = {
  manifestJudgmentOwnsDomainSpecificFlowContinuation: /readonly continueToFlow: \(projection: ManifestBuilderFlowProjectionInterface\) => ManifestBuilderFlowScanJudgment/.test(manifestContract),
  manifestBuilderHandlersGenericAbstractionRemoved: !/ManifestBuilderJudgmentHandlers|continueWith\s*<Result>/.test(manifestContract),
  completeManifestProjectsThroughProvidedProjection: /continueToFlow: \(projection\) => Object\.freeze\([\s\S]*?projection\.project\(completeJudgment\.manifest\)/.test(builder),
  blockedManifestPreservesOriginalBlocker: (builder.match(/continueToFlow: \(\) => blockedJudgment/g) || []).length === 2,
  manifestScannerDelegatesToJudgmentOperation: /judgment\.continueToFlow\(routeSyncManifestFlowProjection\)/.test(scanner),
  sourceObservationStillOwnsReadyBlockedContinuation: /sourceObservation\.continueWith\(/.test(routeScanner) && !/if\s*\(sourceObservation\.kind\s*===/.test(routeScanner),
  sourceObservationADTHasDomainOperation: /interface LaravelRouteSourceObservationReadyOperations[\s\S]*?readonly continueWith:/.test(sourceSelection),
  cliManifestRuntimeInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliOperation),
  sourceSelectionBarrelExported: /export \* from '\.\/laravelRouteSourceSelection'/.test(barrel),
  checkedRuntimePathHasNoExportedFunctionDeclarations: exportedFunctions.length === 0,
  collectionsRemainEmpty: fs.existsSync(collectionPath) && fs.statSync(collectionPath).size === 0,
  manifestBuilderContractVersionBumped: /readonly contractVersion: 9/.test(manifestContract) && /contractVersion: 9,/.test(builder),
};
const result = { phase: 2936, title: 'Fully Explicit Typed Runtime Scanner Operations — Manifest Judgment Domain Continuation', checks, exportedFunctions };
console.log(JSON.stringify(result, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
