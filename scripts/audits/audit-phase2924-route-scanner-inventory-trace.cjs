const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const checks = [
  ['source selection resolves a typed source inventory', /resolveSourceFiles: \(sourceProject: SourceProjectIdentity, intent: LaravelRouteSourceSelectionIntent\) => SourceFileInventory/.test(contract)],
  ['observation input retains selected and missing inventories', /readonly selectedFiles: SourceFileInventory/.test(contract) && /readonly missingFiles: SourceFileInventory/.test(contract)],
  ['source intent owns missing-source policy operation', /readonly observeFiles: \(selectedFiles: SourceFileInventory, missingFiles: SourceFileInventory\) => LaravelRouteSourceObservationJudgment/.test(selection)],
  ['default intent treats absence as optional', /defaultIntent:[\s\S]*?laravel_route_source_file_absent_optional_default/.test(selection)],
  ['explicit intent blocks missing explicit files', /explicitIntent:[\s\S]*?missingFiles\.kind === 'source_file_inventory_entry'[\s\S]*?laravel_route_scan_blocked/.test(selection)],
  ['blocked judgment preserves exact missing inventory with visit operation', /interface LaravelRouteScanBlockedJudgment[\s\S]*?missingFiles: SourceFileInventory[\s\S]*?preserveMissingSourceEvidence/.test(selection)],
  ['composition delegates without deciding source absence', /observeSourceFiles\(input: LaravelRouteSourceObservationInput\): LaravelRouteSourceObservationJudgment \{\s*return input\.intent\.observeFiles\(input\.selectedFiles, input\.missingFiles\);/.test(composition)],
  ['scanner still records missing files before classification', /selectedFiles\.filter\(file => !fs\.existsSync/.test(scanner)],
  ['source reads traverse the source-observation domain operation', /sourceObservation\.continueWithScannableSources\(\)\.visitSources\(\{/.test(scanner) && /visit: selectedFile => scheduledReads\.push/.test(scanner)],
  ['source-observation judgment is exported from scanner contract', /export type \{ LaravelRouteScanBlockedJudgment, LaravelRouteSourceFileObservation, LaravelRouteSourceObservationJudgment \}/.test(contract)],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['traced runtime modules contain no exported function declarations', !['packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts', 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts'].some(file => /export\s+function\s+/.test(read(file)))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2924 route scanner inventory trace audit: ${checks.length - failed.length}/${checks.length}`);
if (failed.length) process.exitCode = 1;
