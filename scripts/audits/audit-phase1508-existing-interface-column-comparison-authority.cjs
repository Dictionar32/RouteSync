const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1508_EXISTING_INTERFACE_COLUMN_COMPARISON_AUTHORITY.md');
const checks = [
  ['existing rule union owns column comparison identity', contract.includes("kind: 'query_column_comparison_condition_rule'")],
  ['upstream algebra owns column comparison catalog and resolver', algebra.includes('columnComparisonPredicateCatalog') && algebra.includes('resolveColumnComparisonCondition')],
  ['existing dispatcher emits rule-carrying column comparison decisions', algebra.includes("rule: 'query_column_comparison_condition_rule'")],
  ['scanner no longer owns column comparison handlers or pair classifier', !scanner.includes("relationRuleEntries(['whereColumn', 'orWhereColumn']") && !scanner.includes('queryColumnComparisonsFromSequence')],
  ['tests cover resolved and malformed column comparison evidence', tests.includes('resolves column comparisons through the existing upstream operation authority') && tests.includes('rejects malformed column comparison evidence upstream')],
  ['report documents existing interface authority and remaining boundary', report.includes('existing `QueryProducerSemanticInterface`') && report.includes('Remaining migration boundary')],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
