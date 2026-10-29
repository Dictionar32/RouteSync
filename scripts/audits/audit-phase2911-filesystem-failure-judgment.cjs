const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts'), 'utf8');
const filesystemContract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/filesystemFailureInterface.ts'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2911_FILESYSTEM_FAILURE_JUDGMENT.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['filesystem error classification has named judgment variants', /filesystem_failure_code_missing/.test(filesystemContract) && /filesystem_failure_code_not_directory/.test(filesystemContract) && /filesystem_failure_code_access_denied/.test(filesystemContract)],
  ['classification factory is interface-first and immutable', /export const filesystemFailureCodeFactory: FilesystemFailureCodeFactoryInterface = Object\.freeze\(\{/.test(filesystemContract)],
  ['error and path-location judgments expose domain continuation', /export interface FilesystemFailureCodeOperations\s*\{\s*readonly continueWith:/.test(filesystemContract) && /interface FilesystemFailureLocationOperations/.test(filesystemContract) && /onRoot:/.test(filesystemContract) && /onDirectory:/.test(filesystemContract)],
  ['raw-code table and ternary are absent from the domain operation', !/filesystemFailureBlockerFactories/.test(source) && !/\$\{errorCode\}_\$\{String\(directory === root\)\}/.test(source) && !/\s\?\s[^?]/.test(source.slice(source.indexOf('interface FilesystemFailureOperationInterface'), source.indexOf('interface ControllerDirectoryEntriesVisitorInterface')))],
  ['existing upstream blocker contract is reused', /LaravelControllerSourceDiscoveryBlocker/.test(source) && /laravelControllerSourceDiscoveryJudgmentFactory\.blocked/.test(source) && /controller_source_discovery_root_missing/.test(upstream) && /controller_source_discovery_directory_missing/.test(upstream)],
  ['no exported function declaration in traced module', !/\bexport\s+function\s+/.test(source)],
  ['collections.ts remains empty', collectionsSize === 0],
  ['documentation records remaining primitive boundary honestly', /does not claim zero primitive reasoning/.test(docs)],
  ['audit is registered', Boolean(packageJson.scripts['audit:phase2911-filesystem-failure-judgment'])],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
