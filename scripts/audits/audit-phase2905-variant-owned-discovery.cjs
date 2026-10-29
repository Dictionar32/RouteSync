const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/index.ts');
const factoryStart = upstream.indexOf('export const laravelControllerSourceDiscoveryJudgmentFactory:');
const factoryEnd = upstream.indexOf('\nexport interface LaravelControllerSourceDiscoveryInput', factoryStart);
const factory = upstream.slice(factoryStart, factoryEnd);
const checks = [
  ['factory exposes complete constructor for complete evidence', /readonly complete:\s*\(/.test(upstream) && /complete: \(evidence\): LaravelControllerSourceDiscoveryResult/.test(factory)],
  ['factory exposes blocked constructor for blocked evidence', /readonly blocked:\s*\(/.test(upstream) && /blocked: \(evidence\): LaravelControllerSourceDiscoveryResult/.test(factory)],
  ['upstream factory contains no ternary dispatch', !/\?/.test(factory)],
  ['upstream factory contains no generic create-union dispatch', !/\bcreate\s*:/.test(factory) && !/laravelControllerSourceDiscoveryJudgmentFactory\.create/.test(upstream)],
  ['complete variant owns complete continuation directly', /continueWith: <Result>\(handlers: LaravelControllerSourceDiscoveryCompleteHandlers<Result>\): Result => handlers\.onComplete\(evidence\)/.test(factory)],
  ['blocked variant owns blocked continuation directly', /continueWith: <Result>\(handlers: LaravelControllerSourceDiscoveryCompleteHandlers<Result>\): Result => handlers\.onBlocked\(evidence\)/.test(factory)],
  ['complete variant owns immutable source inclusion', /sources: Object\.freeze\(\[\.\.\.evidence\.sources, sourceFile\]\)/.test(factory)],
  ['complete variant owns blocked transition and preserves partial sources', /partialSources: Object\.freeze\(\[\.\.\.evidence\.sources\]\)/.test(factory)],
  ['blocked variant cannot reopen or mutate its partial inventory', /includeSource: \(_sourceFile: SourceFile\): LaravelControllerSourceDiscoveryResult =>\s*laravelControllerSourceDiscoveryJudgmentFactory\.blocked\(evidence\)/.test(factory) && /block: \(_blocker: LaravelControllerSourceDiscoveryBlocker\): LaravelControllerSourceDiscoveryResult =>\s*laravelControllerSourceDiscoveryJudgmentFactory\.blocked\(evidence\)/.test(factory)],
  ['CLI traversal continues through the existing discovery result operation', /evidence\.continueWith\(/.test(composition) && /controllerDirectoryEntryCursorFactory\.from\(entries\)\.continueWith/.test(composition)],
  ['CLI discovery returns the already modeled result', /return evidence;/.test(composition)],
  ['runtime exports remain interface-first and no exported function declaration in traced modules', /export const laravelControllerSourceDiscoveryJudgmentFactory:\s*LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream) && !/^\s*export\s+function\s/m.test(upstream) && !/^\s*export\s+function\s/m.test(composition)],
  ['upstream factory remains explicitly exported from core barrel', /laravelControllerSourceDiscoveryJudgmentFactory.*from '\.\/types\/upstream\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(barrel)],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
