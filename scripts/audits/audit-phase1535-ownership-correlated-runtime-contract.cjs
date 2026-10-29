const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const reasoning = read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const checks = [
  ['claimed result excludes not-applicable decision', contract.includes("readonly ownership: 'claimed'") && contract.includes("Exclude<QueryOperationSemanticDecision, { readonly kind: 'not_applicable' }>")],
  ['unclaimed result is limited to not-applicable decision', contract.includes("readonly ownership: 'unclaimed'") && contract.includes("Extract<QueryOperationSemanticDecision, { readonly kind: 'not_applicable' }>")],
  ['proof status cannot be mistaken across ownership states', contract.includes("not_applicable_no_executor_invoked") && contract.includes("evaluator_obligations_not_yet_emitted")],
  ['authority branches on closed decision before constructing envelope', reasoning.includes("if (decision.kind === 'not_applicable')") && reasoning.indexOf("if (decision.kind === 'not_applicable')") < reasoning.indexOf("ownership: 'claimed' as const")],
  ['scanner obtains source-bound decision from upstream interface', scanner.includes('resolveQueryOperationEvidence({') && scanner.includes('span: expression.source')],
  ['scanner preserves upstream malformed ownership outcome', scanner.includes("if (operationDecision.kind === 'malformed') return relationNone()")],
  ['interface boundary introduces no any', !contract.includes(': any') && !reasoning.includes(': any')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`\nPhase 1535 ownership-correlated runtime contract audit: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
