#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['integration contract type/runtime version is 12', () => {
    const source = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
    return /readonly version: 12/.test(source) && /version: 12/.test(source);
  }],
  ['integration contract states operational terminal semantics', () => read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts').includes('all-four-integrated-outcomes-own-continueWith')],
  ['four integration ADT outcomes expose continueWith', () => {
    const source = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
    return ['NotConnected', 'SourceBindingRejected', 'Complete', 'Blocked'].every(name => new RegExp(`PhpSourceInvocationSemanticPipelineIntegration${name} = .*PhpSourceInvocationSemanticPipelineIntegrationTerminalOperations`).test(source));
  }],
  ['integration authority constructs all four operational outcomes', () => {
    const source = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
    return ['notConnectedResult', 'sourceBindingRejectedResult', 'completeResult', 'blockedResult'].every(name => source.includes(`const ${name} =`)) && !/switch\s*\(/.test(source);
  }],
  ['controller invocation response dispatch uses ADT continuation', () => {
    const source = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
    return /response\.continueWith<LaravelControllerInvocationSemanticJudgment>/.test(source) && !/switch\s*\(response\.kind\)/.test(source);
  }],
  ['changed runtime modules do not export function declarations', () => {
    const files = [
      'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts',
      'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts',
      'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts',
    ];
    return files.every(file => !/export\s+function\s/.test(read(file)));
  }],
  ['removed relation foundations remain absent and collections remains empty', () => {
    const forbidden = [
      'packages/core/src/semantic/relations/relationMembership.ts',
      'packages/core/src/semantic/relations/relationalSequence.ts',
      'packages/core/src/semantic/relations/semanticRelations.ts',
    ];
    return forbidden.every(file => !fs.existsSync(path.join(root, file))) && fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0;
  }],
];
const results = checks.map(([name, run]) => ({ name, passed: Boolean(run()) }));
for (const result of results) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${results.filter(item => item.passed).length}/${results.length}\n`);
if (results.some(item => !item.passed)) process.exitCode = 1;
