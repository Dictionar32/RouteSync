const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const phases = [];
for (let phase = 1721; phase <= 1736; phase += 1) {
  const reportPath = path.join(root, `PHASE${phase}_AUDIT.json`);
  if (!fs.existsSync(reportPath)) {
    phases.push({ phase, missing: true, total: 0, passed: 0, failed: 0 });
    continue;
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  phases.push({ phase, total: report.total, passed: report.passed, failed: report.failed });
}
const total = phases.reduce((sum, phase) => sum + phase.total, 0);
const passed = phases.reduce((sum, phase) => sum + phase.passed, 0);
const failed = phases.reduce((sum, phase) => sum + phase.failed, 0);
const latest = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1736_AUDIT.json'), 'utf8'));
check('Phase 1721 through 1736 audit reports all exist', phases.every(phase => !phase.missing));
check('all 16 phase audits report zero failed checks', phases.length === 16 && phases.every(phase => phase.failed === 0 && phase.passed === phase.total));
check('aggregate direct-audit checks are 225/225', total === 225 && passed === 225 && failed === 0);
check('latest phase is integrated semantic response and authority/wiring remain pending', latest.name === 'integrated-semantic-response' && latest.checks.some(item => item.name.includes('implementation and Laravel wiring remain accurately marked pending') && item.passed));
const failedChecks = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failedChecks.length}/${checks.length} Phase 1736 regression checks passed.\n`);
process.stdout.write(`Aggregate direct-audit checks: ${passed}/${total}; failures=${failed}.\n`);
fs.writeFileSync(path.join(root, 'PHASE1736_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1736, name: 'interface-regression-phase1721-through-1736', totalChecks: total, passedChecks: passed, failedChecks: failed, phases, checks }, null, 2) + '\n');
if (failedChecks.length) process.exit(1);
