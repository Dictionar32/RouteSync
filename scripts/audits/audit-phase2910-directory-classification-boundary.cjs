const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const sourcePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const upstream = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts'), 'utf8');
const collectionsSize = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const docs = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2910_DIRECTORY_CLASSIFICATION_BOUNDARY.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['classifier has an explicit interface contract', /interface ControllerDirectoryEntryClassificationInterface/.test(source)],
  ['classifier runtime is interface-first and immutable', /const controllerDirectoryEntryClassification: ControllerDirectoryEntryClassificationInterface = Object\.freeze\(\{/.test(source)],
  ['classifier returns existing upstream entry ADT', /classify: \(entry, sourceFile, continuations\) =>/.test(source) && /LaravelControllerSourceDiscoveryEntry/.test(source)],
  ['Node Dirent predicates are confined to classifier declaration', (() => { const hits = [...source.matchAll(/entry\.(?:isDirectory|isSymbolicLink|isFile)\(\)/g)].map(m => m.index); const start = source.indexOf('const controllerDirectoryEntryClassification:'); const end = source.indexOf('interface ControllerDirectoryEntriesOperationInterface'); return hits.length === 3 && hits.every(index => index > start && index < end); })()],
  ['traversal delegates classification instead of rebuilding candidate table', /const classifiedEntry = controllerDirectoryEntryClassification\.classify\(entry, entrySourceFile, Object\.freeze\(/.test(source) && !/const classifiedEntry: LaravelControllerSourceDiscoveryEntry = \[/.test(source)],
  ['upstream ADT binds variant-specific continuation operations without a visitor', /continueDiscovery: \(\) => continuation\.discoverNestedDirectory\(\)/.test(upstream) && /continueDiscovery: \(\) => continuation\.blockUnresolvedSymbolicLink\(\)/.test(upstream) && !/LaravelControllerSourceDiscoveryEntryHandlers/.test(upstream)],
  ['discovery result keeps domain operations', /readonly includeSource:/.test(upstream) && /readonly block:/.test(upstream) && /readonly continueWith:/.test(upstream)],
  ['no exported function declarations in traced module', !/\bexport\s+function\s+/.test(source)],
  ['collections.ts remains an empty source module', collectionsSize <= 1 && fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8').trim() === ''],
  ['phase trace documents remaining filesystem error mapping finding', /Filesystem error normalization and error-code fallback mapping remain open findings/.test(docs)],
  ['audit is registered', Boolean(packageJson.scripts['audit:phase2910-directory-classification-boundary'])],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
if (failures.length) process.exitCode = 1;
