const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const factoryStart = upstream.indexOf('export const laravelControllerSourceDiscoveryJudgmentFactory:');
const factoryEnd = upstream.indexOf('\nexport interface LaravelControllerSourceDiscoveryInput', factoryStart);
const factory = upstream.slice(factoryStart, factoryEnd);
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['domain filesystem operation contains no conditional-expression ternary', !/\s\?\s[^?]/.test(composition.slice(composition.indexOf('interface FilesystemFailureOperationInterface'), composition.indexOf('interface ControllerDirectoryEntriesVisitorInterface')))],
  ['upstream discovery factory contains no conditional-expression ternary', !/\s\?\s[^?]/.test(factory)],
  ['filesystem failure translation consumes upstream ADT operations', /filesystemFailureCodeFactory/.test(composition) && /filesystemFailureLocationFactory/.test(composition) && /failureCode\.continueWith/.test(composition)],
  ['directory entries continue through the upstream entry-owned ADT', /classifiedEntry\.continueDiscovery\(/.test(composition) && /laravelControllerSourceDiscoveryEntryFactory/.test(composition)],
  ['cursor end-of-input is handled without a ternary', /controllerDirectoryEntryCursorFactory\.from\(entries\)\.continueWith/.test(composition)],
  ['directory read is a typed settlement with a domain continuation', /type ControllerDirectoryReadSettlement\s*=/.test(composition) && /directoryReadSettlement\.continueWith\(/.test(composition) && !/Array\.isArray\(directoryEntries\)/.test(composition)],
  ['source document read errors use an operation-owning judgment and upstream blocker factory', /nodeFilesystemFailureObservation\.observe\(error instanceof Error \? error : new Error\(\)\)\.continueWith\(/.test(composition) && /phpSourceDocumentReadBlockerFactory\.fileMissing/.test(composition) && /phpSourceDocumentReadBlockerFactory\.pathNotFile/.test(composition) && /phpSourceDocumentReadBlockerFactory\.fileUnreadable/.test(composition)],
  ['runtime composition has no Promise.then or reduce traversal', !/\.then\s*\(/.test(composition) && !/\.reduce\s*\(/.test(composition)],
  ['traced runtime modules have no exported function declarations', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(upstream)],
  ['audit command is registered', typeof packageJson.scripts['audit:phase2906-no-runtime-ternary'] === 'string'],
  ['upstream collections file remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
