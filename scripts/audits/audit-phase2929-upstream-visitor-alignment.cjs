const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['uses existing upstream SourceFileInventoryVisitorInterface', /interface SourceFileInventoryVisitorInterface[\s\S]*?readonly visit: \(sourceFile: SourceFile\) => void/.test(names) && /continueWithScannableSources/.test(selection)],
  ['source observations are explicit discriminated variants without per-variant no-op visitor methods', /readonly kind: 'laravel_route_source_file_scanned'; readonly file: SourceFile/.test(selection) && /readonly kind: 'laravel_route_source_file_absent_optional_default'; readonly file: SourceFile/.test(selection) && !/visitScannableSource:/.test(selection)],
  ['ready judgment exposes visitor operation using the canonical upstream contract', /readonly continueWithScannableSources: \(\) => SourceFileInventory/.test(selection)],
  ['ready judgment owns an explicit inventory read plan', /readonly scannableSources: SourceFileInventory/.test(selection) && /readonly scannableSources: SourceFileInventory/.test(selection) && /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection)],
  ['optional absent observations are excluded from the read plan without a no-op callback', /matchingMissingFiles = missingFiles\.filter/.test(selection) && !/visitScannableSource:/.test(selection) && !/=> undefined/.test(selection)],
  ['scanner dispatches reads through canonical visitor', /sourceObservation\.continueWithScannableSources\(\)\.visitSources\(\{\s*visit: selectedFile => scheduledReads\.push/.test(scanner)],
  ['source observation still retains both explicit domain variants', /sourceFiles\.map\(observation => observation\.kind\)\)\.toEqual\(\[\s*'laravel_route_source_file_scanned',\s*'laravel_route_source_file_absent_optional_default'/.test(test)],
  ['scanner no longer checks existence again inside scheduled reads', !/if \(!fs\.existsSync\(file\)\)/.test(scanner)],
  ['upstream collections file remains empty', fs.statSync(collections).size === 0],
  ['changed runtime modules contain no exported function declarations', !/export\s+function\s/.test(selection) && !/export\s+function\s/.test(scanner)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2929 upstream visitor alignment audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
