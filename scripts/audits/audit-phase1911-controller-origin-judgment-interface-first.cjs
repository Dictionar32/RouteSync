const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['correspondence interface version 3', () => /contractVersion: 3/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts')) && /version: 3/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts'))],
  ['matched judgment carries canonical origin', () => /definitionOrigin: ControllerVariableOrigin/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts'))],
  ['origin uses semantic binding code and typed statement index', () => /SemanticBindingOriginCode/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts')) && /statementIndex: StatementIndex/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts'))],
  ['authority closes origin with matched correspondence', () => /definitionOrigin: canonicalDefinitionOrigin\(input\.binding, first\.payload\.statementIndex\)/.test(read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceAuthority.ts'))],
  ['analyzer consumes origin judgment without local classifier', () => /origin: definitionOrigin/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts')) && !/function canonicalVariableOrigin/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'))],
  ['source payload carries typed StatementIndex', () => /statementIndex: import\('\.\.\/\.\.\/\.\.\/types\/upstream\/valueObjects'\)\.StatementIndex/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'))],
  ['upstream barrel exports contract and authority', () => /export \* from '\.\/controllerDataflowBindingPayloadCorrespondenceInterface'/.test(read('packages/core/src/types/upstream/index.ts')) && /controllerDataflowBindingPayloadCorrespondenceAuthority/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['canonical judgment and integrated response retained distinctly', () => /invocationSemanticIntegratedResponse, invocationJudgment: judgment/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'))],
  ['scanner boundary contract version 77 and remaining work disclosed', () => /readonly version: 77/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts')) && /PHP expression projection, semantic resolution, and variable grouping/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
];
let failed = 0;
for (const [name, test] of checks) {
  const passed = test();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
