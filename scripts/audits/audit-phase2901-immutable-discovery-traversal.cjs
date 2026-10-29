const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const phase2900 = read('scripts/audits/audit-phase2900-upstream-discovery-judgment-factory.cjs');
const traversal = composition.slice(
  composition.indexOf('const discoverControllerPhpFiles = async ('),
  composition.indexOf('\nconst controllerSourceDiscovery:', composition.indexOf('const discoverControllerPhpFiles = async (')),
);
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['traversal remains behind the existing LaravelControllerSourceDiscoveryInterface', /const controllerSourceDiscovery: LaravelControllerSourceDiscoveryInterface/.test(composition)],
  ['each traversal step delegates result interpretation to the existing upstream continueWith operation', /evidence\.continueWith\(/.test(traversal)],
  ['recursive child outcomes are consumed through the same domain continuation', /nextJudgment\.continueWith\(/.test(traversal) && /discoverControllerPhpFiles\(/.test(traversal)],
  ['traversal accumulates immutable source snapshots', /currentJudgment\.includeSource\(sourceFile\)/.test(traversal) && /Object\.freeze\(\[\.\.\.discovered\]\)/.test(traversal)],
  ['traversal has no mutable let accumulators', !/^\s*let\s/m.test(traversal)],
  ['traversal does not redispatch by inspecting evidence discriminators', !/currentEvidence\.kind|nestedEvidence\.kind/.test(traversal)],
  ['traversal uses direct recursive async flow instead of Promise.then/reduce chaining', !/\.then\s*\(/.test(traversal) && !/\.reduce\s*</.test(traversal) && /visitEntries\(remainingEntries, nextComplete\)/.test(traversal)],
  ['traversal does not use undefined checks or non-null assertions as control-flow workarounds', !/\bundefined\b|!\s*[;,)\]]/.test(traversal)],
  ['upstream judgment factory remains interface-first and owns continueWith', /interface LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream) && /export const laravelControllerSourceDiscoveryJudgmentFactory:\s*LaravelControllerSourceDiscoveryJudgmentFactoryInterface/.test(upstream) && /continueWith: <Result>/.test(upstream)],
  ['no exported function declarations in traced discovery modules', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(upstream)],
  ['previous phase audit retained', fs.existsSync(path.join(root, 'scripts/audits/audit-phase2900-upstream-discovery-judgment-factory.cjs')) && phase2900.includes('upstream collections file remains empty')],
  ['upstream collections file remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
