const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['ready observation returns the domain-owned scannable inventory, not a void visitor operation', /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection) && !/visitScannableSources:/.test(selection)],
  ['blocked observation preserves its missing-source inventory through a domain operation', /preserveMissingSourceEvidence: \(\) => SourceFileInventory/.test(selection) && !/visitMissingFiles:/.test(selection)],
  ['explicit selection exposes its inventory directly rather than a void visitor', /selectedSourceFiles: \(\) => SourceFileInventory/.test(selection) && !/visitFiles:/.test(selection)],
  ['ready and blocked judgments expose meaningful follow-up domain operations', /continueWithScannableSources: \(\) => SourceFileInventory/.test(selection) && /preserveMissingSourceEvidence: \(\) => SourceFileInventory/.test(selection)],
  ['source identity comparison delegates to the existing upstream identity authority', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(selection) && /readonly relateSourceFiles:/.test(identity)],
  ['source absence no longer uses raw path equality or numeric missing counts', !/file\.value\.value\s*===\s*missing\.value\.value/.test(selection) && !/countMatching/.test(selection)],
  ['scanner consumes the explicit scannable inventory', /continueWithScannableSources\(\)\.visitSources/.test(scanner)],
  ['tests use the explicit inventory operations', /selectedSourceFiles\(\)\.visitSources/.test(tests) && /preserveMissingSourceEvidence\(\)\.visitSources/.test(tests)],
  ['changed upstream module has no exported function declarations', !/export\s+function\s/.test(selection)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`Phase2931 explicit source-observation continuation audit: ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
