const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const valueObjects = read('packages/core/src/types/upstream/valueObjects.ts');
const provenance = read('packages/core/src/types/upstream/provenance.ts');
const payloadAdapter = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts');
const sourceIdentity = read('packages/core/src/types/upstream/names.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const runtimePathFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
];
const exportedFunctions = runtimePathFiles.flatMap(file =>
  [...read(file).matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)]
    .map(match => `${file}:${match[1]}`));
const checks = {
  cliManifestOperationIsInterfaceBackedObject: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliOperation),
  cliDelegatesToCompositionAuthority: /authority\.compose\(input\)/.test(cliOperation),
  compositionConsumesRequestDomainContinuation: /input\.continueToCanonicalization\(/.test(cliComposition),
  manifestTerminalOwnsContinuation: /continueForDriftAudit/.test(compositionContract) && /fromManifestBuilderJudgment:\s*judgment\s*=>\s*judgment\.continueWith\(/.test(cliComposition),
  routeScannerConsumesSourceObservationOperation: /sourceObservation\.continueToRouteScan\(/.test(scanner),
  readyAndBlockedSourceObservationsOwnContinuation: /interface LaravelRouteSourceObservationReadyOperations[\s\S]*?continueToRouteScan:/m.test(sourceSelection) && /interface LaravelRouteSourceObservationBlockedOperations[\s\S]*?continueToRouteScan:/m.test(sourceSelection),
  statementIndexHasDedicatedDomainModel: /export interface StatementIndex\s*\{[\s\S]*?kind: 'statement_index'[\s\S]*?ordinal: NumberValue/.test(valueObjects) && /export const statementIndexOperations:\s*StatementIndexOperationsInterface\s*=\s*Object\.freeze\(/.test(valueObjects),
  numberAndTruthFactoriesAreStillFunctionValues: /export const numberValue\s*=\s*\(/.test(valueObjects) && /export const truthValue\s*=\s*\(/.test(valueObjects),
  sourceSpanStillUsesGenericNumberValue: /start:\s*NumberValue;\s*readonly end:\s*NumberValue/.test(provenance),
  runtimeStatementCounterUsesDomainSuccessor: /let nextStatementIndex = statementIndexOperations\.first/.test(payloadAdapter) && /statementIndexOperations\.successor\(nextStatementIndex\)/.test(payloadAdapter) && !/nextStatementIndex\s*\+=\s*1/.test(payloadAdapter),
  sourceNameFactoriesStillAcceptRawStrings: /createModelName\s*=\s*\(value:\s*string\)/.test(sourceIdentity) && /createRouteName\s*=\s*\(value:\s*string\)/.test(sourceIdentity),
  noExportFunctionOnCheckedRuntimePath: exportedFunctions.length === 0,
  deletedRelationFoundationModulesRemainAbsent: relationFoundationPaths.every(file => !exists(file)),
  collectionsSentinelPreservedAsOneNewlineByte: fs.existsSync(collectionsPath) && fs.statSync(collectionsPath).size === 1 && fs.readFileSync(collectionsPath).equals(Buffer.from('\n')),
};
const report = {
  phase: 3024,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations — Upstream → CLI → Manifest Trace',
  scope: 'Static source audit; does not claim full TypeScript build or runtime integration.',
  checks,
  exportedFunctions,
  interpretation: {
    currentPositive: ['CLI manifest entry is interface-backed', 'composition continues through the request ADT', 'source observation variants own a route-scan continuation', 'no exported function declarations on the checked runtime path', 'deleted relation foundation modules remain absent', 'collections sentinel is preserved'],
    remainingModelDebt: ['StatementIndex now has a dedicated ADT and sequence operations; its ordinal remains numeric boundary evidence', 'numberValue/truthValue are exported function-valued constants', 'SourceSpan start/end are generic NumberValue', 'domain-name factories still accept raw string inputs'],
    nonGoals: ['Do not mechanically delete parser-boundary primitives', 'Do not mechanically delete AST-kind dispatch required to interpret syntax', 'Do not restore generic semantic relation foundation modules'],
  },
};
console.log(JSON.stringify(report, null, 2));
if (!checks.cliManifestOperationIsInterfaceBackedObject || !checks.cliDelegatesToCompositionAuthority || !checks.compositionConsumesRequestDomainContinuation || !checks.manifestTerminalOwnsContinuation || !checks.routeScannerConsumesSourceObservationOperation || !checks.readyAndBlockedSourceObservationsOwnContinuation || !checks.noExportFunctionOnCheckedRuntimePath || !checks.statementIndexHasDedicatedDomainModel || !checks.runtimeStatementCounterUsesDomainSuccessor || !checks.deletedRelationFoundationModulesRemainAbsent || !checks.collectionsSentinelPreservedAsOneNewlineByte) process.exitCode = 1;
