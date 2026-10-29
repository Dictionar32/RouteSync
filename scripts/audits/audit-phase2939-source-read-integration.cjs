const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const astContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const sourceReadContract = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['existing upstream source reader contract is available', /interface PhpSourceDocumentReaderInterface/.test(sourceReadContract)],
  ['existing source-read result ADT owns a continuation operation', /interface PhpSourceDocumentReadResultOperations\s*\{\s*readonly continueWith/.test(sourceReadContract)],
  ['route scanner still reads source text directly from fs', /fs\.promises\.readFile\(file,\s*'utf-8'\)/.test(routeScanner)],
  ['route scanner has not injected PhpSourceDocumentReaderInterface', !/PhpSourceDocumentReaderInterface|sourceDocumentReader/.test(routeScanner)],
  ['route outcome lacks a route-source-read blocker variant', !/laravel_route_scan_read_blocked/.test(routeContract)],
  ['AST projection lacks a route-source-read blocker arm', !/laravel_source_ast_projection_route_read_blocked/.test(astContract)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) {
  const isGapFinding = name.includes('still reads source text directly') || name.includes('has not injected') || name.includes('lacks a route-source-read blocker') || name.includes('lacks a route-source-read blocker arm');
  console.log(`${passed ? (isGapFinding ? 'GAP' : 'PASS') : 'FAIL'} ${name}`);
}
if (!checks[0][1] || !checks[1][1] || !checks[2][1] || !checks[3][1] || !checks[4][1] || !checks[5][1] || !checks[6][1]) process.exitCode = 1;
