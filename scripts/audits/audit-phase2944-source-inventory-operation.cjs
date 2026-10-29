const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const names = read('packages/core/src/types/upstream/names.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/index.ts');
const sourceInventoryTest = read('packages/core/src/types/upstream/__tests__/source-file-inventory-domain-visitor.phase2921.test.ts');
const routeSelectionTest = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');

check('SourceFileInventory exposes ordered toSourceFiles domain operation', /readonly toSourceFiles: \(\) => readonly SourceFile\[\]/.test(names));
check('SourceFileInventory has no effect-only visitor contract', !/SourceFileInventoryVisitorInterface|visitSources/.test(names));
check('empty inventory has no void/no-op traversal implementation', !/visitSources:.*undefined/.test(names));
check('manifest composition schedules reads from ordered source inventory', /sources\.toSourceFiles\(\)\.map\(\(requestedSourceFile\)/.test(cliComposition) && /\.then\(/.test(cliComposition));
check('manifest read settlement preserves concurrent Promise.all completion', /Promise\.all\(scheduledReads\)/.test(cliComposition));
check('public barrel no longer exports visitor abstraction', !/SourceFileInventoryVisitorInterface/.test(barrel));
check('inventory and route-selection tests consume domain projection', !/visitSources/.test(sourceInventoryTest + routeSelectionTest) && /toSourceFiles\(\)/.test(sourceInventoryTest + routeSelectionTest));
check('upstream collections.ts remains empty', collections.length === 0);

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`${checks.filter(result => result.passed).length}/${checks.length} structural checks passed`);
if (checks.some(result => !result.passed)) process.exitCode = 1;
