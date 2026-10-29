'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const interfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const interfaceSource = fs.readFileSync(interfacePath, 'utf8');
const checks = [
  ['manifest builder adapter delegates to continueWith', /fromManifestBuilderJudgment:\s*judgment\s*=>\s*judgment\.continueWith\(/.test(composition)],
  ['old manifest kind dispatch removed', !/fromManifestBuilderJudgment:\s*judgment\s*=>\s*judgment\.kind\s*===\s*['"]manifest_builder_complete['"]/.test(composition)],
  ['complete handler preserves upstream complete judgment', /onComplete:\s*completeJudgment\s*=>\s*controllerInvocationManifestTerminalOperationsFactory\.complete\(completeJudgment\)/.test(composition)],
  ['blocked handler preserves upstream blocked judgment', /onBlocked:\s*blockedJudgment\s*=>\s*controllerInvocationManifestTerminalOperationsFactory\.manifestBlocked\(blockedJudgment\)/.test(composition)],
  ['interface documents ADT continuation', /upstream executable ADT through its domain continuation/.test(interfaceSource)],
  ['no exported function in composition implementation', !/\bexport\s+function\s+/.test(composition)],
  ['no exported function in composition interface module', !/\bexport\s+function\s+/.test(interfaceSource)],
  ['upstream collections.ts remains empty', fs.existsSync(collectionsPath) && fs.statSync(collectionsPath).size === 0],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
process.stdout.write(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
