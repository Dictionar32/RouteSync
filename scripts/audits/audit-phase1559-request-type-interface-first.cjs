const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/RequestTypeDeriver.ts');
const aggregatorPath = path.join(root, 'packages/core/src/compiler/scanner/operations/request-deriver/groupAggregator.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const aggregator = fs.readFileSync(aggregatorPath, 'utf8');
const checks = [
  ['upstream authority contract declared', /interface RequestTypeDerivationAuthorityInterface/.test(contract)],
  ['closed judgment covers derived/incomplete/conflict/invalid_input', /kind: 'derived'/.test(contract) && /kind: 'incomplete'/.test(contract) && /kind: 'conflict'/.test(contract) && /kind: 'invalid_input'/.test(contract)],
  ['typed source evidence spans route/resource/request', /kind: 'route'/.test(contract) && /kind: 'resource'/.test(contract) && /kind: 'request'/.test(contract)],
  ['explicit request ambiguity policy', /ambiguous: 'conflict'/.test(contract)],
  ['explicit missing evidence closure policy', /missing: 'incomplete_judgment'/.test(contract)],
  ['action and response reconciliation policies explicit', /actionContribution:/.test(contract) && /responseContribution:/.test(contract)],
  ['source inventory and route coverage proof declared', /sourceEvidence:/.test(contract) && /sourceCoverage:/.test(contract) && /accountedRoutes: number/.test(contract)],
  ['proof verification contract declared', /RequestTypeDerivationVerification/.test(contract) && /readonly verify:/.test(contract)],
  ['canonical contract exported from upstream barrel', /requestTypeDerivationInterface/.test(barrel)],
  ['runtime executor not modified in this interface-first phase', !/RequestTypeDerivationAuthorityInterface/.test(scanner) && !/RequestTypeDerivationAuthorityInterface/.test(aggregator)],
];
const failed = checks.filter(([, passed]) => !passed);
const report = { phase: 1559, audit: 'request-type-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
fs.writeFileSync(path.join(root, 'PHASE1559_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
