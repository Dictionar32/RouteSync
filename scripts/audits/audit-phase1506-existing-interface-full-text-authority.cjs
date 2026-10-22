const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1506_EXISTING_INTERFACE_FULL_TEXT_AUTHORITY.md');
const checks = [
  ['existing rule union owns full-text identity', contract.includes("kind: 'query_full_text_condition_rule'")],
  ['upstream descriptor catalog owns full-text method semantics', algebra.includes('fullTextPredicateCatalog') && algebra.includes('resolveFullTextCondition')],
  ['existing dispatcher emits rule-carrying full-text decisions', algebra.includes("rule: 'query_full_text_condition_rule'")],
  ['scanner no longer contains full-text family handler', !scanner.includes("relationRuleEntries(['whereFullText', 'orWhereFullText']")],
  ['test covers resolved and malformed full-text evidence', tests.includes('resolves full-text predicates through the existing upstream interface authority')],
  ['report records interface-first model and remaining migration boundary', report.includes('existing `QueryProducerSemanticInterface`') && report.includes('Remaining boundary')],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
