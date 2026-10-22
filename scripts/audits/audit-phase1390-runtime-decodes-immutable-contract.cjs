const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policy = read('packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts');
const executor = read('packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts');
const index = read('packages/core/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['untrusted value enters runtime structural gate', /candidate: unknown/.test(policy) && /isContractShape\(candidate\)/.test(policy)],
  ['unsupported contract versions fail closed', /contractVersion === 1/.test(policy)],
  ['source/sink selection is exact closed union', /const expectedSelected = new Set\(\[\.\.\.sourceKeys, \.\.\.sinkKeys\]\)/.test(policy)],
  ['decoder snapshots and revalidates contract', /JSON\.parse\(JSON\.stringify\(candidate\)\)/.test(policy) && /validateSemanticDataflowQueryPolicyContract\(snapshot, judgment\)/.test(policy)],
  ['snapshot is recursively frozen', /deepFreezeRuntimeValue\(snapshot\)/.test(policy) && /Object\.freeze\(value\)/.test(policy)],
  ['executor uses decoded snapshot', /decodeSemanticDataflowQueryPolicyContract\(candidate, dataflow\.state\)/.test(executor) && /contract: validatedContract/.test(executor)],
  ['decoder is exported through package API', /decodeSemanticDataflowQueryPolicyContract/.test(index)],
  ['package version and build command unchanged', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const report = { phase: 1390, audit: 'runtime-decodes-immutable-contract', passed: failed.length === 0, passedChecks: checks.length - failed.length, totalChecks: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
const reportPath = path.join(root, 'scripts/audits/reports/phase1390-runtime-decodes-immutable-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`\nPhase 1390 audit: ${report.passedChecks}/${report.totalChecks} passed`);
if (failed.length) process.exitCode = 1;
