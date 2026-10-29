const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['CLI scan command uses manifest scan operation', /manifestScanOperation\.scan\(/.test(read('packages/cli/src/commands/scan.ts'))],
  ['CLI sync command uses manifest scan operation', /manifestScanOperation\.scan\(/.test(read('packages/cli/src/commands/sync.ts'))],
  ['CLI composition reuses shared source reader', /sourceDocumentReader:\s*phpSourceDocumentReader/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['route scanner has no direct readFile call', !/fs\.promises\.readFile/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route AST pipeline delegates all route terminal dispatch to the route-scan ADT', !/routeScan\.kind ===/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['route-scan ADT exposes domain continuation for every terminal', /continueToSourceAstProjection/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts')) && ['onComplete', 'onSourceSelectionBlocked', 'onSourceReadBlocked', 'onResponseBlocked', 'onPolicyBlocked'].every(name => read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes(name))],
  ['each route-scan terminal is decorated at its producing boundary without central switch dispatch', /laravelRouteScanOutcomeOperations\.sourceSelectionBlocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /laravelRouteScanOutcomeOperations\.sourceReadBlocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts')) && /laravelRouteScanOutcomeOperations\.complete/.test(read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts')) && /laravelRouteScanOutcomeOperations\.responseBlocked/.test(read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts')) && /laravelRouteScanOutcomeOperations\.policyBlocked/.test(read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts')) && !/switch \(outcomeData\.kind\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['route scanner contract version advanced', /contractVersion: 39/.test(read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'))],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed++;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
