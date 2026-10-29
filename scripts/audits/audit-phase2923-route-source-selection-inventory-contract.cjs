const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const pkg = JSON.parse(read('package.json'));
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['selection imports SourceFileInventory', /SourceFileInventory/.test(selection) && /from '\.\/names'/.test(selection)],
  ['explicit selection stores inventory, not raw SourceFile array', /readonly inventory: SourceFileInventory/.test(selection) && !/readonly files: readonly SourceFile\[\]/.test(selection)],
  ['authority accepts SourceFileInventory', /explicitFiles: \(inventory: SourceFileInventory\)/.test(selection)],
  ['visitor delegates to inventory domain operation', /selectedSourceFiles: \(\): SourceFileInventory => inventory/.test(selection)],
  ['runtime authority remains interface-first', /export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object\.freeze/.test(selection)],
  ['scan builds explicit inventory through domain operation', /explicitFiles\(sourceFileInventoryFactory\.empty\(\)\.include\(createSourceFile\(selectedRouteFile\)\)\)/.test(scan)],
  ['sync builds explicit inventory through domain operation', /explicitFiles\(sourceFileInventoryFactory\.empty\(\)\.include\(createSourceFile\(selectedRouteFile\)\)\)/.test(sync)],
  ['CLI scan imports inventory factory', /sourceFileInventoryFactory/.test(scan)],
  ['CLI sync imports inventory factory', /sourceFileInventoryFactory/.test(sync)],
  ['route composition delegates to source-selection domain resolution', /intent\.resolveFilesFor\(sourceProject, laravelDefaultRouteSourceResolution\)/.test(composition) && !/intent\.selection\.files/.test(composition)],
  ['order and empty inventory behavior covered', /visits explicit source files in their selected order/.test(test) && /visits no files for an empty explicit selection/.test(test)],
  ['audit command registered', typeof pkg.scripts['audit:phase2923-route-source-selection-inventory-contract'] === 'string'],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2923 route-source selection inventory audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
