const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const coreIndex = read('packages/core/src/index.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['directory cursor has exhausted and ready variants', /controller_directory_entry_cursor_exhausted/.test(composition) && /controller_directory_entry_cursor_ready/.test(composition)],
  ['cursor ADT exposes a continuation operation', /interface ControllerDirectoryEntryCursorOperations\s*\{[\s\S]*continueDirectoryTraversal/.test(composition)],
  ['cursor factory is interface-first and immutable', /const controllerDirectoryEntryCursorFactory:\s*ControllerDirectoryEntryCursorFactoryInterface\s*=\s*Object\.freeze/.test(composition)],
  ['visit traversal delegates empty/non-empty continuation to cursor ADT', /controllerDirectoryEntryCursorFactory\.from\(entries\)\.continueDirectoryTraversal/.test(composition)],
  ['cursor entry value has no Dirent type assertion', !/entryCursor\.value\s+as\s+Dirent/.test(composition)],
  ['cursor continuation does not stringify iterator done state', !/String\(entryCursor\.done\)/.test(composition)],
  ['upstream entry operations are exported through core type barrel', /LaravelControllerSourceDiscoveryDirectoryContinuationInterface[\s\S]*LaravelControllerSourceDiscoveryEntryFactoryInterface/.test(coreIndex)],
  ['upstream entry runtime factory is exported through core runtime barrel', /laravelControllerSourceDiscoveryEntryFactory/.test(coreIndex)],
  ['upstream entry ADT keeps domain continuation operation', /interface LaravelControllerSourceDiscoveryEntryOperations\s*\{[\s\S]*continueDiscovery/.test(upstream)],
  ['traced composition contains no ternary conditional expression', !/\s\?\s[^?]/.test(composition.slice(composition.indexOf('interface FilesystemFailureOperationInterface'), composition.indexOf('interface ControllerDirectoryEntriesVisitorInterface')))],
  ['directory traversal slice contains no Promise.then or reduce', (() => { const start = composition.indexOf('interface ControllerDirectoryEntriesOperationInterface'); const end = composition.indexOf('interface ControllerPhpSourceDiscoveryOperationInterface'); const traversal = composition.slice(start, end); return start >= 0 && end > start && !/\.then\s*\(/.test(traversal) && !/\.reduce\s*\(/.test(traversal); })()],
  ['traced runtime modules contain no exported function declaration', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(upstream)],
  ['upstream collections remains empty', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8').trim() === ''],
  ['audit command is registered', typeof packageJson.scripts['audit:phase2908-typed-directory-cursor'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
