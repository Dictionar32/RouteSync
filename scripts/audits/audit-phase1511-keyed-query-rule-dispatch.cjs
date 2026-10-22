const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const checks = [
  ['query rules declare exact method vocabulary', /readonly methods: readonly string\[\]/.test(contract) && /declareQueryOperationRule\('query_range_condition_rule', rangeConditionCatalog\.map/.test(reasoning) && /declareQueryOperationRule\('query_json_condition_rule', jsonPredicateCatalog\.map/.test(reasoning)],
  ['method vocabulary is indexed once into a keyed relation', /queryOperationRuleCatalog\.flatMap\(binding => binding\.declaration\.methods\.map\(method => \[method, binding\] as const\)\)/.test(reasoning)],
  ['dispatch performs one direct method lookup', /relationLookup\(queryOperationMethodRuleCatalog, evidence\.methodName\.value\.value\)/.test(reasoning)],
  ['ordered generic resolver probing is absent', !/resolveQueryOperationFromRules/.test(reasoning) && !/index\s*\+\s*1/.test(reasoning.slice(reasoning.indexOf('const queryOperationRuleCatalog'), reasoning.indexOf('const resolveQueryJoinOperation')))],
  ['existing semantic interface remains the contract', /export const queryProducerSemanticReasoning: QueryProducerSemanticInterface/.test(reasoning)],
  ['dispatch executes only the selected declaration executor', /ruleBinding\.execute\(evidence\)/.test(reasoning) && /ruleBinding\.declaration\.rule/.test(reasoning)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
