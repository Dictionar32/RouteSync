const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const phases = [];
for (let phase = 1721; phase <= 1743; phase += 1) {
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
const checks = [];
const check = (name, ok) => checks.push({ name, passed: Boolean(ok) });
const latest = JSON.parse(fs.readFileSync(path.join(root, 'PHASE1743_AUDIT.json'), 'utf8'));
check('Phase 1721 through 1743 audit reports all exist', phases.length === 23 && phases.every(phase => !phase.missing));
check('all recorded phase audit reports contain no failed checks', phases.every(phase => phase.failed === 0 && phase.passed === phase.total));
check('aggregate recorded audit reports contain no failures', passed === total && failed === 0);
check('Phase 1743 interface audit passes all 19 checks', latest.name === 'composition-migration-gate-interface' && latest.total === 19 && latest.passed === 19 && latest.failed === 0);
check('Laravel scanner runtime remains unwired to composition until the gate is met', !fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'), 'utf8').includes('InvocationSemanticIntegratedResponseCompositionInterface'));
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.filter(item => item.passed).length}/${checks.length} Phase 1743 regression checks passed.\n`);
process.stdout.write(`Recorded audit checks: ${passed}/${total}; failures=${failed}.\n`);
const failedChecks = checks.filter(item => !item.passed);
fs.writeFileSync(path.join(root, 'PHASE1743_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1743, name: 'interface-regression-phase1721-through-1743', totalChecks: total, passedChecks: passed, failedChecks: failed, phases, checks }, null, 2) + '\n');
if (failedChecks.length) process.exit(1);
