const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const scannerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['source-selection ADT owns absence classification operation', /readonly observeFiles: \(selectedFiles: SourceFileInventory, missingFiles: SourceFileInventory\) => LaravelRouteSourceObservationJudgment/.test(selection)],
  ['default intent records absent conventional sources as optional', /defaultIntent:[\s\S]*?laravel_route_source_file_absent_optional_default/.test(selection)],
  ['explicit intent owns required-source blocking decision', /explicitIntent:[\s\S]*?missingFiles\.kind === 'source_file_inventory_entry'[\s\S]*?laravel_route_scan_blocked/.test(selection)],
  ['blocked ADT exposes operation to visit preserved missing evidence', /interface LaravelRouteScanBlockedJudgment[\s\S]*?preserveMissingSourceEvidence: \(\) => SourceFileInventory/.test(selection)],
  ['ready ADT exposes operation to visit source observations', /interface LaravelRouteSourceObservationReadyOperations[\s\S]*?continueWithScannableSources: \(\) => SourceFileInventory/.test(selection)],
  ['composition delegates classification to the intent without local branching', /observeSourceFiles\(input: LaravelRouteSourceObservationInput\): LaravelRouteSourceObservationJudgment \{\s*return input\.intent\.observeFiles\(input\.selectedFiles, input\.missingFiles\);/.test(composition)],
  ['scanner contract reuses the canonical upstream source-observation ADT', /from '\.\/laravelRouteSourceSelection'/.test(scannerContract) && /export type \{ LaravelRouteScanBlockedJudgment, LaravelRouteSourceFileObservation, LaravelRouteSourceObservationJudgment \}/.test(scannerContract)],
  ['scanner runtime consumes the domain judgment and preserves blocked outcome', /sourceObservation\.kind === 'laravel_route_scan_blocked'[\s\S]*?outcome = sourceObservation/.test(scannerRuntime)],
  ['tests cover default optional absence and explicit blocking semantics', /classifies absent default sources as optional observations/.test(test) && /preserves explicit missing-file evidence as a blocked domain judgment/.test(test)],
  ['modified runtime source has no exported function declarations', !/export\s+function\s/.test(selection) && !/export\s+function\s/.test(composition)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2927 source-observation ownership audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
