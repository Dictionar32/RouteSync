const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const phases = [];
for (let phase = 1721; phase <= 1737; phase += 1) {
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
const latest = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1737_AUDIT.json'), 'utf8'));
check('Phase 1721 through 1737 audit reports all exist', phases.length === 17 && phases.every(phase => !phase.missing));
check('all 17 direct audit reports pass without failed checks', phases.length === 17 && phases.every(phase => phase.failed === 0 && phase.passed === phase.total));
check('aggregate direct audit checks are 241/241', total === 241 && passed === 241 && failed === 0);
check('Phase 1737 is integrated-response authority interface and keeps implementation/wiring pending', latest.name === 'integrated-response-authority-interface' && latest.total === 16 && latest.passed === 16 && latest.failed === 0 && latest.checks.some(item => item.name.includes('implementation and Laravel wiring are accurately marked pending') && item.passed));
const failedChecks = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failedChecks.length}/${checks.length} Phase 1737 regression checks passed.\n`);
process.stdout.write(`Aggregate direct-audit checks: ${passed}/${total}; failures=${failed}.\n`);
fs.writeFileSync(path.join(root, 'PHASE1737_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1737, name: 'interface-regression-phase1721-through-1737', totalChecks: total, passedChecks: passed, failedChecks: failed, phases, checks }, null, 2) + '\n');
if (failedChecks.length) process.exit(1);
