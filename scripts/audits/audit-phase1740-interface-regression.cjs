const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const phases = [];
for (let phase = 1721; phase <= 1740; phase += 1) {
  const reportPath = path.join(root, `PHASE${phase}_AUDIT.json`);
  if (!fs.existsSync(reportPath)) {
    phases.push({ phase, missing: true, total: 0, passed: 0, failed: 0 });
    continue;
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  phases.push({ phase, total: report.total, passed: report.passed, failed: report.failed, name: report.name });
}
const total = phases.reduce((sum, phase) => sum + phase.total, 0);
const passed = phases.reduce((sum, phase) => sum + phase.passed, 0);
const failed = phases.reduce((sum, phase) => sum + phase.failed, 0);
const latest = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1740_AUDIT.json'), 'utf8'));
check('Phase 1721 through 1740 audit reports all exist', phases.length === 20 && phases.every(phase => !phase.missing));
check('all recorded direct-audit reports pass', phases.length === 20 && phases.every(phase => phase.failed === 0 && phase.passed === phase.total));
check('aggregate recorded direct-audit reports contain no failures', passed === total && failed === 0);
check('Phase 1740 interface audit passes all checks', latest.name === 'integrated-response-composition-interface' && latest.total === 14 && latest.passed === 14 && latest.failed === 0);
const failedChecks = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failedChecks.length}/${checks.length} Phase 1740 regression checks passed.\n`);
process.stdout.write(`Aggregate recorded audit checks: ${passed}/${total}; failures=${failed}.\n`);
fs.writeFileSync(path.join(root, 'PHASE1740_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1740, name: 'interface-regression-phase1721-through-1740', totalChecks: total, passedChecks: passed, failedChecks: failed, phases, checks }, null, 2) + '\n');
if (failedChecks.length) process.exit(1);
