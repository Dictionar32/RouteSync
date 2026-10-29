const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const sourcePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const upstreamEntry = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts'), 'utf8');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsSize = fs.statSync(collectionsPath).size;
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['cursor factory remains interface-first', /const controllerDirectoryEntryCursorFactory: ControllerDirectoryEntryCursorFactoryInterface = Object\.freeze\(\{/.test(source)],
  ['cursor factory uses iterable traversal', /for \(const entry of entries\)/.test(source)],
  ['explicit iterator done branch removed', !/if \(cursor\.done\)/.test(source)],
  ['manual iterator next removed from cursor factory', !/entries\[Symbol\.iterator\]\(\)\.next\(\)/.test(source)],
  ['exhaustion remains an explicit cursor ADT variant', /controller_directory_entry_cursor_exhausted/.test(source)],
  ['ready remains an explicit cursor ADT variant', /controller_directory_entry_cursor_ready/.test(source)],
  ['cursor variants expose continuation operation', /continueWith: <Result>/.test(source)],
  ['existing upstream discovery entry contract is reused', /LaravelControllerSourceDiscoveryEntry/.test(source) && /continueDiscovery/.test(upstreamEntry)],
  ['no exported function declarations in traced module', !/\bexport\s+function\s+/.test(source)],
  ['collections.ts remains empty', collectionsSize === 0],
  ['phase audit is registered', Boolean(packageJson.scripts['audit:phase2909-iterable-owned-directory-cursor'])],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
