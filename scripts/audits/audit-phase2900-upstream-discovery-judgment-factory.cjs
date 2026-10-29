const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['reuse existing source-discovery evidence/result ADT', /type LaravelControllerSourceDiscoveryEvidence\s*=/.test(upstream) && /type LaravelControllerSourceDiscoveryResult\s*=/.test(upstream)],
  ['upstream factory has an explicit interface-first variant-owned runtime contract', /interface LaravelControllerSourceDiscoveryJudgmentFactoryInterface\s*\{[\s\S]*readonly complete: \([\s\S]*readonly blocked: \(/.test(upstream) && /export const laravelControllerSourceDiscoveryJudgmentFactory:\s*LaravelControllerSourceDiscoveryJudgmentFactoryInterface\s*=\s*Object\.freeze/.test(upstream)],
  ['domain continuation is attached to each upstream variant without union dispatch', /continueWith: <Result>\(handlers: LaravelControllerSourceDiscoveryCompleteHandlers<Result>\): Result => handlers\.onComplete\(evidence\)/.test(upstream) && /continueWith: <Result>\(handlers: LaravelControllerSourceDiscoveryCompleteHandlers<Result>\): Result => handlers\.onBlocked\(evidence\)/.test(upstream)],
  ['CLI discovery uses upstream variant-owned discovery operations', /laravelControllerSourceDiscoveryJudgmentFactory\.complete\(/.test(composition) && /laravelControllerSourceDiscoveryJudgmentFactory\.blocked\(/.test(composition) && !/laravelControllerSourceDiscoveryJudgmentFactory\.create\(/.test(composition)],
  ['CLI composition uses the exported upstream factory', /laravelControllerSourceDiscoveryJudgmentFactory/.test(composition) && /laravelControllerSourceDiscoveryJudgmentFactory/.test(coreIndex)],
  ['core public barrel exports factory and named contracts', /LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(coreIndex) && /LaravelControllerSourceDiscoveryEvidence/.test(coreIndex)],
  ['upstream barrel exports the canonical discovery contract module', upstreamBarrel.includes("export * from './laravelControllerInvocationSemanticJudgmentInventoryInterface'")],
  ['no exported function declarations in the traced discovery runtime modules', !/^\s*export\s+function\s/m.test(upstream) && !/^\s*export\s+function\s/m.test(composition)],
  ['upstream collections file remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
