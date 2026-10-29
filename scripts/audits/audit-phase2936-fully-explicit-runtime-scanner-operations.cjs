const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const routeScanner = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
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
  routeSourceObservationOwnsReadBatch: /phpSourceDocumentReadBatchFactory\.fromResults/.test(sourceSelection),
  routeScanOutcomeOwnsSourceAstContinuation: /continueToSourceAstProjection/.test(routeScanner),
  compositionUsesSharedSourceReader: /sourceDocumentReader: phpSourceDocumentReader/.test(composition),
  compositionUsesManifestPreparationBoundary: /manifestBuilderPreparation: manifestBuilderOperationPreparation/.test(composition),
  cliManifestRuntimeInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=/.test(cliOperation),
  manifestBuilderContractHasTypedFlowOperation: /readonly continueToFlow:/.test(manifestBuilder),
  checkedRuntimePathHasNoExportedFunctionDeclarations: exportedFunctions.length === 0,
  collectionsRemainEmpty: fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).toString() === '\n',
};
const result = { phase: 2936, title: 'Fully Explicit Typed Runtime Scanner Operations — Manifest Judgment Domain Continuation', checks, exportedFunctions };
console.log(JSON.stringify(result, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
