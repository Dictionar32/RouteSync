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
  ['interface defines declarative source-relation closure rather than procedural stage order', /reasoning: 'declarative_source_relation_closure'/.test(contract) && !/REQUEST_TYPE_DERIVATION_RULE_ORDER/.test(contract)],
  ['semantic laws are declarative and canonically exported', /REQUEST_TYPE_DERIVATION_LAWS/.test(contract) && /REQUEST_TYPE_DERIVATION_CONTRACT/.test(contract)],
  ['request identity resolution distinguishes exact, normalized, missing, and ambiguous', /resolved_exact/.test(contract) && /resolved_normalized/.test(contract) && /ambiguous_exact/.test(contract) && /ambiguous_normalized/.test(contract) && /kind: 'missing'/.test(contract)],
  ['route receipt records both resolution judgments and disposition', /requestResolution:/.test(contract) && /resourceResolution:/.test(contract) && /disposition: RequestTypeRouteDisposition/.test(contract)],
  ['source closure accounts routes, resources, and requests', /readonly routes: Readonly/.test(contract) && /readonly resources: Readonly/.test(contract) && /readonly requests: Readonly/.test(contract)],
  ['proof contains all source receipts, group membership, relations, and closure', /resourceReceipts:/.test(contract) && /requestReceipts:/.test(contract) && /groupReceipts:/.test(contract) && /relations: readonly RequestTypeDerivationRelation\[\]/.test(contract) && /closure: RequestTypeDerivationClosure/.test(contract)],
  ['judgment distinguishes derived, incomplete, conflict, and invalid input', /kind: 'derived'/.test(contract) && /kind: 'incomplete'/.test(contract) && /kind: 'conflict'/.test(contract) && /kind: 'invalid_input'/.test(contract)],
  ['authority interface returns judgment and exposes proof verification', /interface RequestTypeDerivationAuthorityInterface/.test(contract) && /readonly derive:/.test(contract) && /readonly verify:/.test(contract)],
  ['canonical interface is exported through upstream barrel', /requestTypeDerivationInterface/.test(barrel)],
  ['scanner runtime and aggregator remain unchanged in interface-first phase', !/RequestTypeDerivationAuthorityInterface/.test(scanner) && !/RequestTypeDerivationAuthorityInterface/.test(aggregator)],
];
const failed = checks.filter(([, passed]) => !passed);
const report = { phase: 1560, audit: 'request-type-semantic-relation-contract', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
fs.writeFileSync(path.join(root, 'PHASE1560_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
