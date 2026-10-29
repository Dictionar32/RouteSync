const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestScanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const sourceAstPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const runtimePath = [cliComposition, manifestScanner, manifestBuilder, sourceAstPipeline, scanner, sourceSelection].join('\n');
const checks = [
  ['source-observation ADT owns the reader capability and read-batch contract', /PhpSourceDocumentReaderInterface/.test(sourceSelection) && /PhpSourceDocumentReadBatchJudgment/.test(sourceSelection)],
  ['ready source variant reads its own scannable inventory', /continueToRouteScan: async \(reader: PhpSourceDocumentReaderInterface/.test(sourceSelection) && /reader\.read\(\{ kind: 'php_source_document_read_input', sourceFile \}\)/.test(sourceSelection)],
  ['ready source variant creates the typed read-batch judgment', /phpSourceDocumentReadBatchFactory\.fromResults\(readResults\)/.test(sourceSelection)],
  ['scanner delegates read orchestration to the source-observation ADT', /sourceObservation\.continueToRouteScan\(authorities\.sourceDocumentReader/.test(scanner) && !/authorities\.sourceDocumentReader\.read\(/.test(scanner) && !/phpSourceDocumentReadBatchFactory\.fromResults/.test(scanner)],
  ['blocked explicit source selection preserves its blocker outcome', /laravelRouteScanOutcomeOperations\.sourceSelectionBlocked\(blocked\)/.test(sourceSelection) && /_continuation: LaravelRouteSourceObservationContinuationInterface/.test(sourceSelection)],
  ['CLI composition runtime export is explicitly interface typed', /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface/.test(cliComposition)],
  ['manifest scanner runtime facade is explicitly interface typed', /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface/.test(manifestScanner)],
  ['manifest preparation runtime export is explicitly interface typed', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(manifestBuilder)],
  ['source AST pipeline factory is explicitly interface typed', /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface/.test(sourceAstPipeline)],
  ['route scanner factory is explicitly interface typed', /export const laravelRouteScannerFactory:\s*LaravelRouteScannerFactoryInterface/.test(scanner)],
  ['runtime trace files do not import deleted relation-foundation paths', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(runtimePath)],
  ['runtime entrypoint files do not use exported function or inferred exported arrow factories', !/^export function\s+/m.test(runtimePath) && !/^export const\s+\w+\s*=\s*\(/m.test(runtimePath)],
  ['upstream collections abstraction remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
