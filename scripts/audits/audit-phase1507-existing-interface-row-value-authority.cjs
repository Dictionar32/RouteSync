const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1507_EXISTING_INTERFACE_ROW_VALUE_AUTHORITY.md');
const checks = [
  ['existing rule union owns row-value identity', contract.includes("kind: 'query_row_value_condition_rule'")],
  ['upstream algebra owns row-value catalog and resolver', algebra.includes('rowValuePredicateCatalog') && algebra.includes('resolveRowValueCondition')],
  ['existing dispatcher emits rule-carrying row-value decisions', algebra.includes("rule: 'query_row_value_condition_rule'")],
  ['scanner no longer contains row-value family handler', !scanner.includes("relationRuleEntries(['whereRowValues', 'orWhereRowValues']")],
  ['tests cover resolved and malformed row-value evidence', tests.includes('resolves row-value predicates through the existing upstream interface authority') && tests.includes('rejects malformed row-value evidence at the upstream semantic boundary')],
  ['report documents authority and remaining migration boundary', report.includes('existing `QueryProducerSemanticInterface`') && report.includes('Remaining migration boundary')],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
