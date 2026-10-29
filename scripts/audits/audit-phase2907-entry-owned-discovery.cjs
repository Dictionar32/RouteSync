const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream defines a domain-specific discovery-entry ADT', /export type LaravelControllerSourceDiscoveryEntry\s*=/.test(upstream)],
  ['each entry variant carries a domain continuation operation', /interface LaravelControllerSourceDiscoveryEntryOperations\s*\{[\s\S]*continueDiscovery/.test(upstream)],
  ['entry handlers express directory, symbolic-link, PHP-source, and ignored outcomes', /onDirectory[\s\S]*onSymbolicLink[\s\S]*onPhpSource[\s\S]*onIgnored/.test(upstream)],
  ['entry construction is interface-first and immutable', /export const laravelControllerSourceDiscoveryEntryFactory:\s*LaravelControllerSourceDiscoveryEntryFactoryInterface\s*=\s*Object\.freeze/.test(upstream)],
  ['CLI imports and uses the upstream entry ADT factory', /laravelControllerSourceDiscoveryEntryFactory/.test(composition) && /classifiedEntry\.continueDiscovery\(/.test(composition)],
  ['consumer does not dispatch entry actions through a local string-keyed action table', !/entryActions\[entryKind\]/.test(composition)],
  ['source-entry domain operation owns the next action after classification', /onPhpSource: sourceFile => Promise\.resolve\(currentJudgment\.includeSource\(sourceFile\)\)/.test(composition)],
  ['no conditional-expression ternary in the traced composition source', !/\s\?\s[^?]/.test(composition.slice(composition.indexOf('interface FilesystemFailureOperationInterface'), composition.indexOf('interface ControllerDirectoryEntriesVisitorInterface')))],
  ['no Promise.then or reduce-based traversal', !/\.then\s*\(/.test(composition) && !/\.reduce\s*\(/.test(composition)],
  ['no exported function declarations in the traced runtime modules', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(upstream)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit command is registered', typeof packageJson.scripts['audit:phase2907-entry-owned-discovery'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
