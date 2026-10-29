const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const reasoning = read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['source-bound execution envelope exists', contract.includes('QueryOperationSemanticEvidenceBoundExecution') && contract.includes('readonly evidence: QueryOperationSemanticSourceEvidence')],
  ['claimed and unclaimed execution states are separate', contract.includes("readonly ownership: 'claimed'") && contract.includes("readonly ownership: 'unclaimed'")],
  ['proof status is correlated with ownership', contract.includes("not_applicable_no_executor_invoked") && contract.includes("evaluator_obligations_not_yet_emitted")],
  ['proof gap is explicit rather than fabricated', contract.includes("evaluator_obligations_not_yet_emitted")],
  ['semantic interface owns source-bound entry point', contract.includes('readonly resolveQueryOperationEvidence:')],
  ['upstream reasoning implements source-bound entry point', reasoning.includes('const resolveQueryOperationEvidence =') && reasoning.includes('const decision = resolveQueryOperation(evidence.operation)')],
  ['upstream authority emits ownership-discriminated outcomes', reasoning.includes("ownership: 'unclaimed' as const") && reasoning.includes("ownership: 'claimed' as const")],
  ['scanner passes original source span to upstream authority', scanner.includes('resolveQueryOperationEvidence({') && scanner.includes('span: expression.source')],
  ['scanner does not reclassify claimed operations after the interface decision', scanner.includes('const operationDecision = operationExecution.decision')],
  ['public type is exported', index.includes('QueryOperationSemanticEvidenceBoundExecution')],
  ['no any introduced in interface boundary', !contract.includes(': any') && !reasoning.includes(': any')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`\nPhase 1534 source-bound query interface audit: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
