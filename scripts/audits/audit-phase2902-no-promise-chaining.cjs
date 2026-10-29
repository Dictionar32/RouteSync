const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const traversal = composition.slice(
  composition.indexOf('const discoverControllerPhpFiles = async ('),
  composition.indexOf('\nconst controllerSourceDiscovery:', composition.indexOf('const discoverControllerPhpFiles = async (')),
);
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['traversal contains no Promise.then chaining', !/\.then\s*\(/.test(traversal)],
  ['traversal contains no reduce-based sequencing', !/\.reduce\s*</.test(traversal) && !/\.reduce\s*\(/.test(traversal)],
  ['traversal uses direct async recursion over the remaining directory entries', /visitEntries\(remainingEntries, nextComplete\)/.test(traversal)],
  ['entry-list exhaustion is modeled through the typed cursor continuation, not value assertions', /controllerDirectoryEntryCursorFactory\.from\(entries\)\.continueWith/.test(traversal) && !/entryCursor\.value\s+as\s+Dirent/.test(traversal)],
  ['discovery results continue through the existing upstream domain operation', /evidence\.continueWith\(/.test(traversal) && /nextJudgment\.continueWith\(/.test(traversal)],
  ['source snapshots remain immutable', /currentJudgment\.includeSource\(sourceFile\)/.test(traversal) && /Object\.freeze\(\[\.\.\.discovered\]\)/.test(traversal)],
  ['traversal has no mutable let declarations', !/^\s*let\s/m.test(traversal)],
  ['no exported function declarations in traced runtime modules', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(upstream)],
  ['upstream factory remains interface-first', /interface LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream) && /export const laravelControllerSourceDiscoveryJudgmentFactory:\s*LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream)],
  ['upstream collections file remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
