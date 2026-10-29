const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const barrel = read('packages/core/src/index.ts');
const checks = [
  ['composition authority returns operation-bearing LaravelRouteScanOutcome', /outcomeFromScan:\s*\(scan: LaravelRouteScanJudgment\)\s*=>\s*LaravelRouteScanOutcome;/.test(routeContract)],
  ['outcome data-only alias removed from upstream contract', !/export type LaravelRouteScanOutcomeData\b/.test(routeContract)],
  ['public barrel does not expose obsolete data-only outcome alias', !/LaravelRouteScanOutcomeData/.test(barrel)],
  ['outcome factory returns ADT terminals with operations attached', /laravelRouteScanOutcomeOperations\.responseBlocked/.test(routeComposition) && /laravelRouteScanOutcomeOperations\.complete/.test(routeComposition) && /laravelRouteScanOutcomeOperations\.policyBlocked/.test(routeComposition)],
  ['scanner returns the authority-produced outcome without reclassifying it', /return authorities\.declarationCompositionAuthority\.outcomeFromScan\(scan\)/.test(routeScanner) && !/switch\s*\(outcomeData\.kind\)/.test(routeScanner)],
  ['each ADT terminal owns source-AST continuation', ['onComplete', 'onSourceSelectionBlocked', 'onSourceReadBlocked', 'onResponseBlocked', 'onPolicyBlocked'].every(name => routeContract.includes(name)) && /continueToSourceAstProjection/.test(routeContract)],
  ['runtime operation export is interface-first and frozen', /export const laravelRouteScanOutcomeOperations:\s*LaravelRouteScanOutcomeOperationsInterface\s*=\s*Object\.freeze\(/.test(routeContract)],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed++;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
