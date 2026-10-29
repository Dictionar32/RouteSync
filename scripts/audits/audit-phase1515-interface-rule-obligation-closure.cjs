const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const checks = [
  ['existing upstream interface owns a rule-family obligation matrix', /queryOperationSemanticRuleRequirements\s*=\s*Object\.freeze\(\{/.test(contract) && /queryOperationRuleRequirement[\s\S]*?premises: freezeSemanticTuple\(premises\)[\s\S]*?constraints: freezeSemanticTuple\(constraints\)/.test(contract) && /satisfies Readonly<Record<Exclude<QueryOperationSemanticRule/.test(contract)],
  ['catalog validation rejects missing family-specific premises and constraints', /missing_rule_obligation/.test(contract) && /requirements\.premises/.test(contract) && /requirements\.constraints/.test(contract)],
  ['catalog validation checks evidence and outcome contracts, not only non-empty arrays', /invalid_evidence_contract/.test(contract) && /invalid_outcome_contract/.test(contract) && /declaration\.evidence\.fields/.test(contract) && /declaration\.outcomes/.test(contract)],
  ['exists-family declaration includes nested-query evidence obligation', /query_exists_condition_rule'[\s\S]{0,240}nested_query_evidence_validated/.test(reasoning)],
  ['scanner continues to delegate claimed families and retains only explicit legacy frontier', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner) && /relationLookup\(queryNamedMethodOperationCatalog, name\)/.test(scanner)],
  ['regression test rejects incomplete family-specific semantic declarations', /rejects a rule declaration that omits family-specific semantic obligations/.test(tests) && /missing_rule_obligation/.test(tests)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
