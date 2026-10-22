const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const policy = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const checks = [
  ['preflight checks sparse arrays before JSON snapshotting', /ownKeys\.length !== value\.length \+ 1/.test(policy)],
  ['preflight checks every array index descriptor', /for \(let index = 0; index < value\.length; index \+= 1\)/.test(policy) && /getOwnPropertyDescriptor\(value, String\(index\)\)/.test(policy)],
  ['array extras cannot be silently discarded by JSON.stringify', policy.includes("if (Array.isArray(value) && key !== 'length' && !/^(0|[1-9]\\d*)$/.test(key)) return false;")],
  ['contract decoder still validates before and after snapshot', /isJsonDataValue\(candidate\) \|\| !validateSemanticDataflowQueryPolicyContract/.test(policy) && /validateSemanticDataflowQueryPolicyContract\(snapshot, judgment\)/.test(policy)],
  ['contract version remains explicit and fail-closed', /contractVersion === 1/.test(policy)],
  ['package version and build command are preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, pass]) => !pass);
const report = { phase: 1394, audit: 'runtime-rejects-lossy-array-payloads', passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const reportPath = path.join(root, 'scripts/audits/reports/phase1394-runtime-rejects-lossy-array-payloads.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nPhase 1394 audit: ${report.passedChecks}/${report.totalChecks} passed`);
if (failed.length) process.exitCode = 1;
