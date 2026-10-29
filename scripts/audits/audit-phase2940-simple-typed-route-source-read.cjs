const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceReader = read('packages/core/src/types/upstream/phpSourceDocumentReader.ts');
const sourceFrontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const astPipeline = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const routeScanner = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['shared source reader is interface-first', /export const phpSourceDocumentReader:\s*PhpSourceDocumentReaderInterface/.test(sourceReader)],
  ['reader uses existing source-read result ADT', /phpSourceDocumentReadResultFactory\.complete/.test(sourceReader) && /createSourceReadBlocker/.test(sourceReader)],
  ['source-read batch owns accumulation and terminal classification', /phpSourceDocumentReadBatchFactory:\s*PhpSourceDocumentReadBatchFactoryInterface/.test(sourceFrontend) && /contributeToBatch/.test(sourceFrontend)],
  ['route source selection consumes the source-read batch ADT', /phpSourceDocumentReadBatchFactory\.fromResults/.test(sourceSelection) && /continueToRouteScan/.test(sourceSelection)],
  ['route read blocker is a distinct route-scan judgment', /kind: 'laravel_route_scan_source_read_blocked'/.test(routeScanner)],
  ['route outcomes own AST continuation', /continueToSourceAstProjection/.test(routeScanner) && /onSourceReadBlocked/.test(routeScanner)],
  ['AST projection preserves route-read blocker', /laravel_source_ast_projection_route_source_read_blocked/.test(astPipeline)],
  ['route reader is exported from core public barrel', /export \{ phpSourceDocumentReader, nodeFilesystemFailureObservation \}/.test(coreIndex)],
  ['CLI composition reuses the shared reader instead of a duplicate implementation', /sourceDocumentReader: phpSourceDocumentReader/.test(composition) && !/const sourceDocumentReader:\s*PhpSourceDocumentReaderInterface/.test(composition)],
  ['upstream collection foundation remains absent', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).toString() === '\n'],
  ['runtime source reader has no exported function declaration', !/export\s+function\s+/.test(sourceReader)],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, pass]) => !pass);
console.log(`\n${checks.length - failed.length}/${checks.length} structural checks passed`);
process.exitCode = failed.length ? 1 : 0;
