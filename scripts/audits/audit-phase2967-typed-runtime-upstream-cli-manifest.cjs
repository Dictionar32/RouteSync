const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['CLI composition factory is explicitly interface typed', /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface/.test(read('packages/cli/src/upstreamCompositionFactory.ts'))],
  ['CLI composition consumes assembly through domain continuation', /assembly\.continueWith\(/.test(read('packages/cli/src/upstreamCompositionFactory.ts'))],
  ['manifest operation factory is explicitly interface typed', /export const routeSyncManifestScanOperationFactory:\s*RouteSyncManifestScanOperationFactoryInterface/.test(read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts'))],
  ['manifest scanner facade is explicitly interface typed', /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface/.test(read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts'))],
  ['manifest preparation runtime export is explicitly interface typed', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['source AST pipeline factory is explicitly interface typed', /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['route scanner factory is explicitly interface typed', /export const laravelRouteScannerFactory:\s*LaravelRouteScannerFactoryInterface/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route scan outcomes own AST projection continuation', /continueToSourceAstProjection/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['source observation owns the typed reader-to-scan transition', /readonly continueToRouteScan: \(\s*reader: PhpSourceDocumentReaderInterface,\s*continuation: LaravelRouteSourceObservationContinuationInterface/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts')) && /sourceObservation\.continueToRouteScan\(authorities\.sourceDocumentReader/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['source-selection blocker preserves itself as a domain outcome without consumer branch callback', /continueToRouteScan: \(_reader: PhpSourceDocumentReaderInterface, _continuation: LaravelRouteSourceObservationContinuationInterface\): Promise<LaravelRouteScanOutcome> => Promise\.resolve\(laravelRouteScanOutcomeOperations\.sourceSelectionBlocked\(blocked\)\)/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts')) && !/onBlocked: async blockedObservation/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['ready source observation owns reading and delegates the typed read batch to scanning', /readonly scanReadyObservation: \([\s\S]*?readBatch: PhpSourceDocumentReadBatchJudgment/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts')) && /scanReadyObservation: async \(sourceObservation, readBatch: PhpSourceDocumentReadBatchJudgment\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /reader\.read\(\{ kind: 'php_source_document_read_input', sourceFile \}\)/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['upstream collections abstraction remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
