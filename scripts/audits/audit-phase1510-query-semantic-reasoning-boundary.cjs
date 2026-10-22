const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const facade = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts');
const reasoning = read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['existing algebra import remains a compatibility facade', /export \{ queryProducerSemanticReasoning as queryProducerSemanticAlgebra \} from '\.\/queryProducerSemanticReasoning';/.test(facade)],
  ['reasoning implementation exports the existing interface shape', /export const queryProducerSemanticReasoning: QueryProducerSemanticInterface/.test(reasoning)],
  ['operation dispatch is keyed by explicit method vocabulary rather than sequential rule probing', /const queryOperationRuleCatalog: readonly QueryOperationRuleBinding\[\]/.test(reasoning) && /queryOperationMethodRuleCatalog/.test(reasoning) && /relationLookup\(queryOperationMethodRuleCatalog, evidence\.methodName\.value\.value\)/.test(reasoning) && !/resolveQueryOperationFromRules/.test(reasoning)],
  ['rule dispatch does not retain the former per-family if-chain', !/const join = resolveQueryJoinOperation\([\s\S]*?const basic = resolveQueryBasicOperation\([\s\S]*?const range = resolveRangeCondition\(/.test(reasoning)],
  ['the existing query semantic interface remains the contract', /readonly resolveQueryOperation: \(evidence: QueryOperationEvidence\) => QueryOperationSemanticDecision/.test(contract)],
  ['public upstream index exposes both compatibility and reasoning names', /export \{ queryProducerSemanticAlgebra \}/.test(index) && /export \{ queryProducerSemanticReasoning \}/.test(index)],
  ['test locks facade identity to reasoning authority', /queryProducerSemanticAlgebra\)\.toBe\(queryProducerSemanticReasoning\)/.test(tests)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
