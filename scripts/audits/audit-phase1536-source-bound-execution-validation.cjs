const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const checks = [
  ['source-bound execution has explicit runtime validation result', contract.includes('QueryOperationSemanticEvidenceBoundExecutionValidation')],
  ['validator checks ownership against closed decision', contract.includes('ownership_decision_mismatch') && contract.includes('validateQueryOperationSemanticDecision(execution.evidence.operation, execution.decision)')],
  ['validator keeps claimed proof status honest', contract.includes("evaluator_obligations_not_yet_emitted") && contract.includes("not_applicable_no_executor_invoked")],
  ['first scanner path validates authority envelope before projection', scanner.indexOf('validateQueryOperationSemanticEvidenceBoundExecution(operationExecution)') < scanner.indexOf('const operationDecision = operationExecution.decision')],
  ['second scanner path validates authority envelope before projection', scanner.includes('const validation = validateQueryOperationSemanticEvidenceBoundExecution(execution)')],
  ['invalid authority envelope fails closed instead of entering legacy resolver', scanner.includes("if (executionValidation.kind === 'invalid') return relationNone()") && scanner.includes("validation.kind === 'valid' ? execution.decision : { kind: 'malformed' as const")],
  ['no any added to the interface or scanner boundary', !contract.includes(': any') && !scanner.includes(': any')],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`\nPhase 1536 source-bound execution validation audit: ${checks.length - failures.length}/${checks.length} passed`);
if (failures.length) process.exitCode = 1;
