const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const checks = [
  ['executor contract version is explicit', /readonly contractVersion: 2;/.test(contract) && /contractVersion: 2 as const/.test(wiring)],
  ['result does not claim execution completed', /controller_action_judgment_forwarded/.test(contract) && /controller_action_judgment_forwarded/.test(wiring) && !/controller_action_execution_completed/.test(contract) && !/controller_action_execution_completed/.test(wiring)],
  ['forwarding status says target runtime was not executed', /target-runtime-operation-not-executed-by-this-boundary/.test(contract) && /target-runtime-operation-not-executed-by-this-boundary/.test(wiring)],
  ['executor preserves the exact judgment object', /semanticJudgment: input\.semanticJudgment/.test(wiring)],
  ['executor contract forbids coverage upgrades', /without upgrading its coverage status/.test(contract) || /never upgrades partial coverage/.test(contract)],
  ['no relation/foundation/subscanner layer added by this phase', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerActionExecutionFoundation.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/actionExecutionAuthority.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += Number(!passed);
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
