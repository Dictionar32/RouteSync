const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['upstream evidence is a closed ADT', /type ControllerActionResponseReferenceSourceEvidence\s*=\s*\n\s*\| Readonly<\{ readonly kind: 'absent' \}>\s*\n\s*\| Readonly<\{ readonly kind: 'declared'; readonly className: ClassName \}>/.test(read('packages/core/src/types/upstream/controllerActionResponseReferenceJudgmentInterface.ts'))],
  ['upstream authority owns response-reference judgment', /controllerActionResponseReferenceJudgmentAuthority/.test(read('packages/core/src/types/upstream/controllerActionResponseReferenceJudgmentAuthority.ts')) && /SemanticValueFactory\.responseTypeName/.test(read('packages/core/src/types/upstream/controllerActionResponseReferenceJudgmentAuthority.ts'))],
  ['resolver consumes interface rather than local semantic classifier', /responseReferenceJudgmentAuthority: ControllerActionResponseReferenceJudgmentInterface/.test(read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts')) && /context\.responseReferenceJudgmentAuthority\.judge/.test(read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts'))],
  ['old resolver-local response classifier is retired', !/function controllerResponseReferenceJudgmentFromMethod/.test(read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts'))],
  ['composition root injects the existing authority', /responseReferenceJudgmentAuthority: controllerActionResponseReferenceJudgmentAuthority/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'))],
  ['action scanner supplies the upstream authority', /responseReferenceJudgmentAuthority: controllerActionResponseReferenceJudgmentAuthority/.test(read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts'))],
  ['resolver tests use explicit authority injection', (read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.phase10.test.ts').match(/responseReferenceJudgmentAuthority: controllerActionResponseReferenceJudgmentAuthority/g) ?? []).length === 4],
  ['edited resolver does not import semantic foundation or relations', !/semantic\/(?:foundation|relations)/.test(read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts'))],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
