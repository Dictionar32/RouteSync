const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source observations are a discriminated union of explicit domain outcomes', /readonly kind: 'laravel_route_source_file_scanned'/.test(selection) && /readonly kind: 'laravel_route_source_file_absent_optional_default'/.test(selection)],
  ['ready and blocked judgments are explicit alternatives', /kind: 'laravel_route_source_observation_ready'/.test(selection) && /LaravelRouteScanBlockedJudgment & LaravelRouteSourceObservationBlockedOperations/.test(selection) && /kind: 'laravel_route_scan_blocked'/.test(selection)],
  ['ready ADT owns the scannable source inventory and its domain operation', /readonly scannableSources: SourceFileInventory/.test(selection) && /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection)],
  ['blocked ADT owns the operation for its missing-source evidence', /preserveMissingSourceEvidence: \(\) => SourceFileInventory/.test(selection)],
  ['read dispatch uses canonical upstream inventory visitor contract', /interface SourceFileInventoryVisitorInterface/.test(names) && /continueWithScannableSources\(\)\.visitSources/.test(scanner)],
  ['no per-observation no-op callback or undefined sentinel remains', !/visitScannableSource:/.test(selection) && !/=> undefined/.test(selection)],
  ['optional absence is excluded from the read plan while retained as explicit evidence', /laravel_route_source_file_absent_optional_default/.test(selection) && /matchingMissingFiles = missingFiles\.filter/.test(selection)],
  ['scanner no longer rechecks existence within scheduled reads', !/if \(!fs\.existsSync\(file\)\)/.test(scanner)],
  ['changed upstream module has no exported function declarations', !/export\s+function\s/.test(selection)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2930 explicit source-observation ADT audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
