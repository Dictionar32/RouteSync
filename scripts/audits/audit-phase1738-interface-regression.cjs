const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const phases = [];
for (let phase = 1721; phase <= 1738; phase += 1) {
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
const latest = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1738_AUDIT.json'), 'utf8'));
const previous = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1737_AUDIT.json'), 'utf8'));
check('Phase 1721 through 1738 audit reports all exist', phases.length === 18 && phases.every(phase => !phase.missing));
check('all recorded direct-audit reports pass', phases.length === 18 && phases.every(phase => phase.failed === 0 && phase.passed === phase.total));
check('aggregate direct-audit report checks have no failures', passed === total && failed === 0);
check('Phase 1737 authority duplication is marked superseded', previous.name === 'superseded-integrated-response-authority-model' && previous.failed === 0);
check('Phase 1738 single publication receipt authority audit passes', latest.name === 'publication-receipt-single-authority' && latest.total === 18 && latest.passed === 18 && latest.failed === 0);
const failedChecks = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failedChecks.length}/${checks.length} Phase 1738 regression checks passed.\n`);
process.stdout.write(`Aggregate audit-report checks: ${passed}/${total}; failures=${failed}.\n`);
fs.writeFileSync(path.join(root, 'PHASE1738_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1738, name: 'interface-regression-phase1721-through-1738', totalChecks: total, passedChecks: passed, failedChecks: failed, phases, checks }, null, 2) + '\n');
if (failedChecks.length) process.exit(1);
