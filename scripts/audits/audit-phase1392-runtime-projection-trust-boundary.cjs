const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const projection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts');
const manifestSurface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const policy = read('packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const analysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const executor = read('packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['runtime-facing projection uses unknown payload boundary', /dataflowQueryPolicyContracts: readonly unknown\[\]/.test(projection)],
  ['upstream semantic manifest preserves precise contract type', /dataflowQueryPolicyContracts: readonly SemanticDataflowQueryPolicyContract\[\]/.test(manifestSurface)],
  ['upstream producer contract remains versioned and closed', /contractVersion: 1/.test(policy) && /closed: true/.test(policy)],
  ['orchestration accepts untrusted candidate payloads', /contracts: readonly unknown\[\]/.test(analysis)],
  ['executor decodes candidate against closed judgment before use', /decodeSemanticDataflowQueryPolicyContract\(candidate, dataflow\.state\)/.test(executor)],
  ['decoder rejects unknown contract version by exact version check', /value\.contractVersion === 1/.test(policy)],
  ['package version and build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const report = { phase: 1392, audit: 'runtime-projection-trust-boundary', passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const reportPath = path.join(root, 'scripts/audits/reports/phase1392-runtime-projection-trust-boundary.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nPhase 1392 audit: ${report.passedChecks}/${report.totalChecks} passed`);
if (failed.length) process.exitCode = 1;
