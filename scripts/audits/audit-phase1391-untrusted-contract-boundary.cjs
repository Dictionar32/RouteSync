const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policy = read('packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const executor = read('packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts');
const orchestration = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['policy matcher accepts untrusted unknown input', /semanticDataflowQueryPolicyMatches = \(\s*candidate: unknown/.test(policy)],
  ['policy matcher checks JSON safety and full contract invariants before accepting candidate', /semanticDataflowQueryPolicyMatches = \([\s\S]*?\): boolean => isJsonDataValue\(candidate\)[\s\S]*?validateSemanticDataflowQueryPolicyContract\(candidate, judgment\)/.test(policy)],
  ['runtime executor accepts unknown candidate', /createSemanticDataflowAnalysisPolicy = \([\s\S]*?candidate: unknown/.test(executor)],
  ['runtime executor decodes before exposing contract', /decodeSemanticDataflowQueryPolicyContract\(candidate, dataflow\.state\)/.test(executor) && /contract: validatedContract/.test(executor)],
  ['manifest orchestration treats supplied contracts as untrusted', /contracts: readonly unknown\[\]/.test(orchestration)],
  ['orchestration filters through guarded matcher', /contracts\.filter\(candidate => semanticDataflowQueryPolicyMatches\(candidate, result\.analysis\.input\)\)/.test(orchestration)],
  ['package version and build script preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const report = { phase: 1391, audit: 'untrusted-contract-boundary', passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const reportPath = path.join(root, 'scripts/audits/reports/phase1391-untrusted-contract-boundary.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nPhase 1391 audit: ${report.passedChecks}/${report.totalChecks} passed`);
if (failed.length) process.exitCode = 1;
