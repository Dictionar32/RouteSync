const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const reportPath = path.join(root, 'packages/core/src/types/upstream/docs/PHASE2299-UPSTREAM-LARAVEL-ATTRIBUTE-SCANNER-CONTRACT-AUDIT.md');
const contract = fs.readFileSync(contractPath, 'utf8');
const report = fs.readFileSync(reportPath, 'utf8');
const checks = [
  ['existing scanner contract remains v15', /interface LaravelAttributeScannerInterface[\s\S]*?contractVersion: 15/.test(contract)],
  ['complete and blocked outcomes remain a closed judgment', /type LaravelAttributeScanJudgment =\s*\| LaravelAttributeScanCompleteJudgment\s*\| LaravelAttributeScanBlockedJudgment/.test(contract)],
  ['complete result documents cross-field source/scope invariant', /Cross-field invariant:[\s\S]*?contextualAttributeInventory\.scope\.sourceProject/.test(contract)],
  ['missing directory is not a successful empty scan', /successful empty scan/.test(contract)],
  ['no duplicate scanner interface proposed', /does not introduce a second scanner interface/.test(report)],
  ['known v7 implementation gap is explicitly recorded', /advertises v7/.test(report)],
  ['legacy relation dependency is recorded as migration debt', /semantic\/relations/.test(report)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
