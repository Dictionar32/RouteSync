const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const checks = [
  ['interface defines a closed execution result without not_applicable', /export type QueryOperationSemanticRuleExecution\s*=\s*\| Readonly<\{ readonly kind: 'resolved'/.test(contract) && /readonly kind: 'malformed'; readonly diagnostic: QuerySemanticDiagnostic/.test(contract) && !/export type QueryOperationSemanticRuleExecution[\s\S]{0,500}kind: 'not_applicable'/.test(contract)],
  ['owned-rule execution normalizes evaluator not_applicable to malformed', /executeClaimedQueryOperationRule[\s\S]*?if \(judgment\.kind === 'resolved'\)[\s\S]*?if \(judgment\.kind === 'malformed'\)[\s\S]*?claimed query operation/.test(reasoning)],
  ['rule binding exposes only the interface-owned closed execution result', /readonly execute: \(evidence: QueryOperationEvidence\) => QueryOperationSemanticRuleExecution/.test(reasoning)],
  ['dispatch cannot downgrade an owned method to unclaimed after execution', /const judgment = ruleBinding\.execute\(evidence\);[\s\S]*?judgment\.kind === 'malformed'[\s\S]*?judgment\.operation/.test(reasoning)],
  ['scanner fallback remains limited to the explicit unclaimed migration frontier', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner) && /if \(operationDecision\.kind === 'malformed'\) return relationNone\(\);[\s\S]*?relationLookup\(queryNamedMethodOperationCatalog, name\)/.test(scanner)],
  ['unknown methods retain an explicit unclaimed judgment', /keeps not_applicable exclusive to methods with no upstream rule owner/.test(tests) && /whereMystery/.test(tests)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
