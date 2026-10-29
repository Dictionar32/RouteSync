const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source observations use explicit variants and ready judgment reuses the canonical upstream visitor', /readonly kind: 'laravel_route_source_file_scanned'/.test(selection) && /readonly kind: 'laravel_route_source_file_absent_optional_default'/.test(selection) && /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection) && /from '\.\/names'/.test(selection)],
  ['ready judgment delegates through explicit scannable inventory', /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection) && /readonly scannableSources: SourceFileInventory/.test(selection)],
  ['scanner schedules reads through the existing upstream inventory visitor', /sourceObservation\.continueWithScannableSources\(\)\.visitSources\(\{\s*visit: selectedFile => scheduledReads\.push/.test(scanner)],
  ['optional absent default source is excluded from the read plan without a no-op callback', !/visitScannableSource:/.test(selection) && !/=> undefined/.test(selection) && /matchingMissingFiles = missingFiles\.filter/.test(selection)],
  ['scheduled read no longer rechecks existence and masks read failure as empty success', !/const file = selectedFile\.value\.value;\s*if \(!fs\.existsSync\(file\)\) return Object\.freeze\(\[\]\);/.test(scanner)],
  ['selected inventory is not independently traversed to schedule reads', !/selectedFiles\.visitSources\(\{\s*visit: selectedFile => scheduledReads/.test(scanner)],
  ['tests consume the canonical inventory visitor and omit optional absent sources', /continueWithScannableSources\(\)\.visitSources\(\{\s*visit: file => observed\.push/.test(test) && /laravel_route_source_file_scanned:\/project\/routes\/api\.php/.test(test) && !/visitAbsentOptionalDefault/.test(test)],
  ['changed runtime path has no exported function declarations', !/export\s+function\s/.test(selection) && !/export\s+function\s/.test(scanner)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2928 source-observation read-dispatch audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
