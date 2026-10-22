const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const phases = [1721, 1722, 1723, 1724, 1725];
const reports = [];
for (const phase of phases) {
  const auditPath = fs.readdirSync(path.join(process.cwd(), 'scripts/audits')).find(file => file.startsWith(`audit-phase${phase}-`) && file.endsWith('.cjs') && !file.includes('regression'));
  if (!auditPath) {
    reports.push({ phase, passed: false, reason: 'audit-script-missing' });
    continue;
  }
  const result = spawnSync(process.execPath, [path.join('scripts/audits', auditPath)], { encoding: 'utf8' });
  const jsonPath = path.join(process.cwd(), `PHASE${phase}_AUDIT.json`);
  let audit = null;
  if (fs.existsSync(jsonPath)) audit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  reports.push({ phase, exitCode: result.status, passed: result.status === 0 && Boolean(audit) && audit.failed === 0, total: audit?.total ?? 0, checksPassed: audit?.passed ?? 0, failed: audit?.failed ?? 0 });
  if (result.status !== 0) process.stdout.write(result.stdout + result.stderr);
}
const total = reports.reduce((sum, report) => sum + (report.total ?? 0), 0);
const passed = reports.reduce((sum, report) => sum + (report.checksPassed ?? 0), 0);
const failed = reports.reduce((sum, report) => sum + (report.failed ?? 0), 0);
const ok = reports.every(report => report.passed) && failed === 0;
process.stdout.write(`${ok ? 'PASS' : 'FAIL'} Phase 1721-1725 regression: ${passed}/${total}; failures=${failed}\n`);
fs.writeFileSync(path.join(process.cwd(), 'PHASE1725_REGRESSION_AUDIT.json'), JSON.stringify({ phase: 1725, name: 'invocation-coverage-interface-regression', phases: reports, total, passed, failed, status: ok ? 'passed' : 'failed' }, null, 2) + '\n');
if (!ok) process.exit(1);
