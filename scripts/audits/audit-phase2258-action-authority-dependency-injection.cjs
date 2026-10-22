const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const checks = [
  ['request authority is declared as an upstream interface dependency', /readonly requestSemanticBindingAuthority:\s*LaravelControllerRequestSemanticBindingAuthorityInterface/.test(wiring)],
  ['resource authority is declared as an upstream interface dependency', /readonly resourceBindingAuthority:\s*ControllerResourceBindingAuthorityInterface/.test(wiring)],
  ['parameter class-name authority is declared as an upstream interface dependency', /readonly parameterClassNameJudgmentAuthority:\s*ControllerParameterClassNameJudgmentInterface/.test(wiring)],
  ['request judgment uses injected authority', /requestSemanticBindingAuthority\.judge\(requestBindingEvidence\)/.test(wiring)],
  ['resource candidate judgment uses injected authority in resolver context', /resourceBindingAuthority,\s*resourceReturnSourceEvidenceProjection/.test(wiring)],
  ['resource publication uses injected authority', /resourceBindingAuthority\.publishResolved\(/.test(wiring)],
  ['parameter class-name judgment uses injected authority in resolver context', /parameterClassNameJudgment:\s*parameterClassNameJudgmentAuthority/.test(wiring)],
  ['composition root binds existing upstream implementations', /requestSemanticBindingAuthority:\s*laravelControllerRequestSemanticBindingAuthority/.test(wiring) && /resourceBindingAuthority:\s*controllerResourceBindingAuthority/.test(wiring) && /parameterClassNameJudgmentAuthority:\s*controllerParameterClassNameJudgmentAuthority/.test(wiring)],
  ['action resolver is still explicitly tracked as migration debt, not claimed retired', /legacy-contract-resolver-still-contains-semantic-derivation/.test(wiring)],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} assertions passed\n`);
process.exitCode = failed ? 1 : 0;
