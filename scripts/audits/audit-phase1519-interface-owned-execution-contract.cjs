const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const checks = [
  ['resolved and malformed decisions carry the authoritative rule contract', /readonly contract: QueryOperationSemanticRuleDeclaration/.test(contract) && /kind: 'malformed' as const, rule: \{ kind: rule \}, contract: ruleBinding\.declaration/.test(reasoning) && /kind: 'resolved' as const, rule: \{ kind: rule \}, contract: ruleBinding\.declaration/.test(reasoning)],
  ['contract contains family obligations, evidence shape, conclusion and closed outcomes', /readonly premises: readonly \[[\s\S]*?QueryOperationSemanticRequiredPremises/.test(contract) && /readonly constraints: readonly \[[\s\S]*?QueryOperationSemanticRequiredConstraints/.test(contract) && /readonly evidence: Readonly/.test(contract) && /readonly conclusion: Readonly/.test(contract) && /readonly outcomes: readonly \['resolved', 'malformed', 'undetermined'\]/.test(contract)],
  ['regression coverage asserts the contract survives resolved and malformed judgments', /contract: \{[\s\S]*?rule: 'query_json_condition_rule'[\s\S]*?outcomes: \['resolved', 'malformed', 'undetermined'\]/.test(tests)],
  ['scanner consumes the existing interface authority and only falls back on unclaimed operations', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner) && /if \(upstreamDecision\.kind === 'malformed'\)/.test(scanner) && /operationFromExpression\(expression\)/.test(scanner)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
