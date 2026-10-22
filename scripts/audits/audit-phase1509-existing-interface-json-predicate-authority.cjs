const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1509_EXISTING_INTERFACE_JSON_PREDICATE_AUTHORITY.md');
const checks = [
  ['existing rule union owns JSON predicate identity', contract.includes("kind: 'query_json_condition_rule'")],
  ['upstream algebra owns JSON predicate catalog and resolver', algebra.includes('jsonPredicateCatalog') && algebra.includes('resolveJsonCondition')],
  ['existing dispatcher emits rule-carrying JSON decisions', algebra.includes("rule: 'query_json_condition_rule'")],
  ['scanner no longer owns JSON predicate handler', !scanner.includes("relationRuleEntries(['whereJsonContains'")],
  ['tests cover resolved and malformed JSON evidence', tests.includes('query producer semantic algebra JSON authority') && tests.includes('preserves malformed JSON evidence')],
  ['report states remaining migration boundary honestly', report.includes('Remaining migration boundary') && report.includes('does not claim that all runtime paths are executor-only')],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
