const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const policy = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts'), 'utf8');
const orchestration = fs.readFileSync(path.join(root, 'packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts'), 'utf8');
const checks = [
  ['matcher accepts untrusted candidates', /semanticDataflowQueryPolicyMatches = \(\s*candidate: unknown/.test(policy)],
  ['matcher rejects non-JSON/executable payloads before inspection', /semanticDataflowQueryPolicyMatches = \([\s\S]*?\): boolean => isJsonDataValue\(candidate\)/.test(policy)],
  ['matcher checks full contract invariants against judgment', /semanticDataflowQueryPolicyMatches = \([\s\S]*?validateSemanticDataflowQueryPolicyContract\(candidate, judgment\)/.test(policy)],
  ['validator checks contract version and closed marker', /contractVersion === 1/.test(policy) && /value\.closed === true/.test(policy)],
  ['validator checks selected facts equal source/sink union', /expectedSelected = new Set\(\[\.\.\.sourceKeys, \.\.\.sinkKeys\]\)/.test(policy)],
  ['validator checks fact membership against judgment', /judgmentFacts\.has\(semanticDataflowFactContractKey\(fact\)\)/.test(policy)],
  ['orchestration uses guarded matcher before execution', /contracts\.filter\(candidate => semanticDataflowQueryPolicyMatches\(candidate, result\.analysis\.input\)\)/.test(orchestration)],
  ['executor still decodes immutable snapshot', /decodeSemanticDataflowQueryPolicyContract\(candidate, dataflow\.state\)/.test(fs.readFileSync(path.join(root, 'packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts'), 'utf8'))],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
const report = { phase: 1395, audit: 'runtime-matcher-validates-full-contract', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, pass]) => ({ name, pass })) };
fs.mkdirSync(path.join(root, 'scripts/audits/reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/audits/reports/phase1395-runtime-matcher-validates-full-contract.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.passed}/${report.total} passed`);
if (failed.length) process.exitCode = 1;
