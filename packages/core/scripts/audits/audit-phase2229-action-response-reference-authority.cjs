const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const actionContract = fs.readFileSync(path.join(root, 'src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts'), 'utf8');
const semanticInterface = fs.readFileSync(path.join(root, 'src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');
const wiring = fs.readFileSync(path.join(root, 'src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'), 'utf8');
const checks = [
  ['source-attribute-derived-reference-judgment', /controllerResponseReferenceJudgmentFromMethod\(method\)/.test(actionContract)],
  ['closed-declared-and-absent-ADT-cases', /case 'absent':[\s\S]*response_reference_not_declared[\s\S]*case 'declared':[\s\S]*response_reference_declared/.test(actionContract)],
  ['reference-judgment-not-read-from-legacy-descriptor', !/const responseReferenceJudgment: ControllerResponseReferenceJudgment = response\.responseReferenceJudgment/.test(actionContract)],
  ['legacy-action-descriptor-derivation-retired', !/resolveResponseAttributeAst|function resolveResponse\(/.test(actionContract) && !/readonly response: ResponseDescriptor/.test(actionContract)],
  ['upstream-contract-version-synchronized', /readonly version: 31;/.test(semanticInterface) && /version: 31 as const/.test(wiring)],
  ['upstream-ownership-documents-source-evidence', /exact-method-attribute-source-evidence/.test(semanticInterface) && /exact-method-attribute-source-evidence/.test(wiring)],
  ['no-new-relation-or-foundation-subscanner', !/semantic\/(relations|foundation)\//.test(actionContract)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
