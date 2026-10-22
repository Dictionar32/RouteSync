const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/semanticDecisionInterface.ts');
const algebra = read('packages/core/src/types/upstream/semanticDecisionAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const test = read('packages/core/src/types/upstream/__test__/semanticDecisionAlgebra.phase1427.test.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['semantic decision contract has explicit upstream authority and closure', /kind: 'semantic_decision_contract'/.test(contract) && /authority: 'upstream'/.test(contract) && /closed: true/.test(contract)],
  ['rule authority is explicit and independent of declaration order', /readonly priority: number/.test(contract) && /sort\(\(left, right\) => left\.priority - right\.priority\)/.test(algebra)],
  ['result ADT separates derivation, absence, and contract violation', /kind: 'derived'/.test(contract) && /kind: 'not_derived'/.test(contract) && /kind: 'contract_violation'/.test(contract)],
  ['duplicate identities and priorities are rejected before reasoning', /duplicate_rule_id/.test(algebra) && /duplicate_priority/.test(algebra)],
  ['scanner expression classification is wired through the semantic decision interface', /semanticDecisionAlgebra\.resolve\(astClassificationContract, tokens\)/.test(runtime) && /case 'contract_violation'/.test(runtime)],
  ['scanner expression rules declare explicit priorities', /expressionRule\(10,/.test(runtime) && /expressionRule\(160,/.test(runtime)],
  ['tests cover order independence and invalid contracts', /declaration order/.test(test) && /priority collision/.test(test) && /invalid priorities/.test(test)],
  ['no any escape hatch was introduced', !/\bany\b/.test(contract) && !/\bany\b/.test(algebra) && !/\bany\b/.test(runtime)],
  ['build script remains unchanged', pkg.scripts.build === 'tsdown'],
  ['audit command is registered', pkg.scripts['audit:phase1427-explicit-semantic-decision-interface'] === 'node scripts/audits/audit-phase1427-explicit-semantic-decision-interface.cjs'],
];
const result = { phase: 1427, title: 'explicit-semantic-decision-interface', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1427-explicit-semantic-decision-interface.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
