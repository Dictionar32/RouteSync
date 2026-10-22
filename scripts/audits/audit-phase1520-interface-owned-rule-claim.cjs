const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const checks = [
  ['existing semantic interface exposes a closed ownership judgment', /export type QueryOperationSemanticRuleClaim\s*=\s*[\s\S]*?kind: 'claimed'[\s\S]*?kind: 'unclaimed'/.test(contract) && /readonly resolveQueryOperationRule: \(methodName: MethodName\) => QueryOperationSemanticRuleClaim/.test(contract)],
  ['rule ownership and execution share one method-to-binding lookup', /const queryOperationRuleBindingFor = \(methodName: MethodName\)/.test(reasoning) && /resolveQueryOperationRule\s*=/.test(reasoning) && /queryOperationRuleBindingFor\(evidence\.methodName\)/.test(reasoning)],
  ['ownership judgment returns the same declaration that authorizes execution', /kind: 'claimed' as const, contract: ruleBinding\.declaration/.test(reasoning) && /readonly contract: QueryOperationSemanticRuleDeclaration/.test(contract)],
  ['regression tests cover claimed and unclaimed methods without invoking execution', /resolves method ownership through the existing semantic interface without executing a rule/.test(tests) && /resolveQueryOperationRule\(createMethodName\('whereJsonContains'\)\)/.test(tests) && /resolveQueryOperationRule\(createMethodName\('whereMystery'\)\)/.test(tests)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
