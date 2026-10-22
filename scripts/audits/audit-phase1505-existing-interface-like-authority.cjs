const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1505_EXISTING_INTERFACE_LIKE_AUTHORITY.md');

const checks = [
  ['existing rule union owns LIKE identity', contract.includes("kind: 'query_like_condition_rule'")],
  ['upstream descriptor catalog owns LIKE method semantics', algebra.includes('likePredicateCatalog') && algebra.includes('resolveLikeCondition')],
  ['existing dispatcher emits rule-carrying LIKE decisions', algebra.includes("rule: 'query_like_condition_rule'")],
  ['scanner no longer contains LIKE family handler', !scanner.includes("relationRuleEntries(['whereLike', 'orWhereLike', 'whereNotLike', 'orWhereNotLike']")],
  ['test covers resolved and malformed LIKE evidence', tests.includes("resolves LIKE predicate junction and polarity through the existing semantic authority")],
  ['report states existing interface authority and boundary', report.includes('existing `QueryProducerSemanticInterface`') && report.includes('Remaining boundary')],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;
