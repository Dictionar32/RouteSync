const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const selectionPath = path.join(root, 'packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const compositionPath = path.join(root, 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const packagePath = path.join(root, 'package.json');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const selection = fs.readFileSync(selectionPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const checks = [
  ['domain visitor interface declared', /interface ExplicitRouteSourceSelectionOperations/.test(selection)],
  ['selection operations interface declared', /interface ExplicitRouteSourceSelectionOperations/.test(selection)],
  ['explicit selection exposes visitFiles', /readonly selectedSourceFiles: \(\) => SourceFileInventory/.test(selection)],
  ['runtime authority interface-first', /export const laravelRouteSourceSelectionAuthority: LaravelRouteSourceSelectionInterface = Object\.freeze/.test(selection)],
  ['selection keeps explicit source-file inventory evidence', /readonly inventory: SourceFileInventory/.test(selection)],
  ['selection authority returns the explicit inventory without rebuilding it', /resolveFilesFor: \([\s\S]*?_sourceProject: SourceProjectIdentity,[\s\S]*?_defaultSourceResolution: LaravelDefaultRouteSourceResolutionInterface,[\s\S]*?\): SourceFileInventory => selection\.inventory/.test(fs.readFileSync(selectionPath, 'utf8'))],
  ['composition no longer reads selection.files directly', !/intent\.selection\.files/.test(composition)],
  ['visitor preserves selected order in test', /visits explicit source files in their selected order/.test(test)],
  ['empty selection behavior covered', /visits no files for an empty explicit selection/.test(test)],
  ['package audit command registered', typeof pkg.scripts['audit:phase2922-route-source-selection-domain-operations'] === 'string'],
  ['collections.ts remains empty', fs.statSync(collectionsPath).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2922 route-source selection audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
