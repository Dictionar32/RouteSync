const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policy = read('packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['JSON data preflight occurs before contract validation', /if \(!isJsonDataValue\(candidate\) \|\| !validateSemanticDataflowQueryPolicyContract\(candidate, judgment\)\)/.test(policy)],
  ['accessors are rejected without invoking their getter', /!\('value' in descriptor\).*descriptor\.get !== undefined/.test(policy)],
  ['custom object prototypes are rejected', /prototype !== Object\.prototype && prototype !== null/.test(policy)],
  ['symbol properties are rejected', /Object\.getOwnPropertySymbols\(value\)\.length !== 0/.test(policy)],
  ['cyclic object graphs are rejected', /ancestors\.has\(value\)/.test(policy)],
  ['non-finite numeric payloads are rejected', /typeof value === 'number'\) return Number\.isFinite\(value\)/.test(policy)],
  ['JSON snapshot and post-snapshot validation remain in place', /JSON\.parse\(JSON\.stringify\(candidate\)\)/.test(policy) && /validateSemanticDataflowQueryPolicyContract\(snapshot, judgment\)/.test(policy)],
  ['package version and build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const report = { phase: 1393, audit: 'runtime-rejects-executable-payloads', passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const reportPath = path.join(root, 'scripts/audits/reports/phase1393-runtime-rejects-executable-payloads.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nPhase 1393 audit: ${report.passedChecks}/${report.totalChecks} passed`);
if (failed.length) process.exitCode = 1;
