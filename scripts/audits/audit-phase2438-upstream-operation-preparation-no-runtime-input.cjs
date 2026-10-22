const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const runtime = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const test = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.phase1625.test.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['upstream owns a concrete operation-preparation interface', contract.includes('interface RequestTypeDerivationOperationPreparationInterface') && !/interface RequestTypeDerivationOperationPreparationInterface\s*</.test(contract)],
  ['prepared operation is a closed concrete domain contract', contract.includes('interface RequestTypeDerivationPreparedOperation') && contract.includes("kind: 'prepared_request_type_derivation_operation'")],
  ['runtime interface has no generic parameters', /interface RequestTypeDerivationRuntimeExecutorInterface\s*\{/.test(contract)],
  ['runtime execute method accepts no parameters', /interface RequestTypeDerivationRuntimeExecutorInterface\s*\{[\s\S]*?execute:\s*\(\)\s*=> RequestTypeDerivationRuntimeExecutionResult/.test(contract)],
  ['runtime implementation has no pipeline or source input dependency', !runtime.includes('SemanticPipelineInterface') && !runtime.includes('RequestTypeDerivationInput') && runtime.includes('execute: () => operation.result')],
  ['semantic derivation and assessment validation run in upstream preparation', preparation.includes('pipeline.derive(input)') && preparation.includes('pipeline.validateAssessment(assessment)')],
  ['preparation returns a data-only operation after projection', contract.includes('readonly result: RequestTypeDerivationRuntimeExecutionResult') && preparation.includes('createRequestTypeDerivationOperationPreparation') && preparation.includes('projection: consumer.project(judgment)')],
  ['manifest lowering prepares the operation before runtime execution', /operationPreparation\.prepare\(input\)[\s\S]*?createRequestTypeDerivationRuntimeExecutor\(preparedOperation\)\.execute\(\)/.test(lowering)],
  ['runtime signature regression test asserts zero arguments', test.includes("toEqualTypeOf<[]>")],
  ['preparation operation is publicly exported', index.includes('createRequestTypeDerivationOperationPreparation') && index.includes('RequestTypeDerivationOperationPreparationInterface')],
  ['runtime path has no generic type parameters', !/RequestTypeDerivationRuntimeExecutorInterface\s*</.test(contract) && !/RequestTypeDerivationRuntimeExecutionResult\s*</.test(contract) && !/createRequestTypeDerivationRuntimeExecutor\s*<\s*/.test(runtime)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\nPhase2438 upstream operation preparation audit: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
