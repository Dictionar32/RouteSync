const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route scanner no longer calls fs.promises.readFile directly', !/fs\.promises\.readFile\s*\(/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['shared source reader is interface-first', /export const phpSourceDocumentReader:\s*PhpSourceDocumentReaderInterface/.test(read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts'))],
  ['reader uses existing source-read result ADT', /phpSourceDocumentReadResultFactory\.blocked/.test(read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts')) && /phpSourceDocumentReadResultFactory\.complete/.test(read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts'))],
  ['route scanner consumes existing source-read batch ADT', /phpSourceDocumentReadBatchFactory\.fromResults/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /readBatch\.continueWith/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route read blocker is a distinct route-scan judgment', /kind: 'laravel_route_scan_source_read_blocked'/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['route read blocker owns AST continuation', /continueToSourceAstProjection/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts')) && /laravelRouteScanOutcomeOperations\.sourceReadBlocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['AST projection preserves route-read blocker', /laravel_source_ast_projection_route_source_read_blocked/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts')) && /onSourceReadBlocked: async scan/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['route reader is exported from core public barrel', /export \{ phpSourceDocumentReader, nodeFilesystemFailureObservation \}/.test(read('packages/core/src/index.ts'))],
  ['CLI composition reuses the shared reader instead of a duplicate implementation', /sourceDocumentReader: phpSourceDocumentReader/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && !/const sourceDocumentReader:\s*PhpSourceDocumentReaderInterface/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['upstream collections file remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['new runtime source reader has no exported function declaration', !/export\s+function\s+/.test(read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts'))],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, pass]) => !pass);
console.log(`\n${checks.length - failed.length}/${checks.length} structural checks passed`);
process.exitCode = failed.length ? 1 : 0;
