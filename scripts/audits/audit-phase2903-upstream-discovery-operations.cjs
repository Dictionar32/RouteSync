const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const barrel = read('packages/core/src/index.ts');
const traversal = composition.slice(composition.indexOf('const discoverControllerPhpFiles = async ('), composition.indexOf('\nconst controllerSourceDiscovery:', composition.indexOf('const discoverControllerPhpFiles = async (')));
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['upstream discovery judgment exposes domain includeSource operation', /readonly includeSource: \(sourceFile: SourceFile\) => LaravelControllerSourceDiscoveryResult/.test(upstream)],
  ['upstream discovery judgment exposes domain block operation', /readonly block: \(blocker: LaravelControllerSourceDiscoveryBlocker\) => LaravelControllerSourceDiscoveryResult/.test(upstream)],
  ['includeSource preserves immutable source inventory', /sources: Object\.freeze\(\[\.\.\.evidence\.sources, sourceFile\]\)/.test(upstream)],
  ['block preserves prior partial inventory and blocker', /partialSources: Object\.freeze\(\[\.\.\.evidence\.sources\]\)/.test(upstream)],
  ['CLI traversal delegates source inclusion through the upstream entry ADT continuation', /onPhpSource: sourceFile => Promise\.resolve\(currentJudgment\.includeSource\(sourceFile\)\)/.test(traversal) && /classifiedEntry\.continueDiscovery\(/.test(traversal)],
  ['CLI traversal delegates symbolic-link blocking through the upstream entry ADT continuation', /onSymbolicLink: sourceFile => Promise\.resolve\(currentJudgment\.block\(Object\.freeze\(/.test(traversal) && /classifiedEntry\.continueDiscovery\(/.test(traversal)],
  ['traversal contains no Promise.then chaining or reduce sequencing', !/\.then\s*\(/.test(traversal) && !/\.reduce\s*(?:<|\()/.test(traversal)],
  ['manifest composition runtime contains no Promise.then chaining', !/\.then\s*\(/.test(composition)],
  ['continuation dispatch remains upstream-owned', /nextJudgment\.continueWith\(/.test(traversal)],
  ['runtime exports remain interface-first with no exported function declarations in traced modules', /export const laravelControllerSourceDiscoveryJudgmentFactory:\s*LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream) && !/^\s*export\s+function\s/m.test(upstream) && !/^\s*export\s+function\s/m.test(composition)],
  ['upstream runtime factory is explicitly exported from the core barrel', /laravelControllerSourceDiscoveryJudgmentFactory.*from '\.\/types\/upstream\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(barrel)],
  ['collections.ts remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
