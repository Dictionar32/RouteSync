const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) });
};

const semanticInterface = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const judgmentContract = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const controllerScanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const controllerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');

check('upstream interface declares exact subject identity and unordered state equivalence',
  semanticInterface.includes('ResourceModelBindingBatchStateSemanticsInterface') &&
  semanticInterface.includes('batchStateIdentity: typeof RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY') &&
  semanticInterface.includes('same-exact-subject-object-set') &&
  semanticInterface.includes('order: \'irrelevant-to-equivalence\''));
check('authority contract exposes batch-state semantics and canonical subject lookup',
  judgmentContract.includes('readonly batchState: ResourceModelBindingBatchStateSemanticsInterface') &&
  judgmentContract.includes('readonly bindingForSubject:'));
check('runtime no longer owns a standalone judgmentForSubject helper',
  !/const\s+judgmentForSubject\s*=/.test(authority) &&
  authority.includes('resourceModelBindingBatchStateSemantics.judgmentForSubject'));
check('fixed-point and cycle comparison delegate to the upstream semantic contract',
  authority.includes('resourceModelBindingBatchStateSemantics.sameState(current, next)') &&
  authority.includes('resourceModelBindingBatchStateSemantics.sameState(previous, next)'));
check('resource scanner delegates subject correspondence instead of searching batch bindings',
  scanner.includes('bindingAuthority.bindingForSubject(bindingBatch, subjectEntry.subject)') &&
  !scanner.includes('bindingBatch.bindings.find('));
check('controller scanner preserves the source-correlated invocation judgment',
  controllerScanner.includes('invocationJudgment: sourceInput.invocationJudgment') &&
  controllerScanner.includes('invocationJudgment,') &&
  controllerContract.includes('integratedResponseCompositionMigrationGate'));
check('no semantic foundation dependency introduced',
  !semanticInterface.includes('semantic/foundation') &&
  !judgmentContract.includes('semantic/foundation') &&
  !authority.includes('semantic/foundation') &&
  !scanner.includes('semantic/foundation'));

for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
}
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
