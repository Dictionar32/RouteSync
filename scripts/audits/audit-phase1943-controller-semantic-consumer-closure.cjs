const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const dataflowContract = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const integrated = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');

check('model contract version and explicit downstream-consumer closure are synchronized',
  model.includes('readonly version: 18;') && model.includes('  version: 18,') &&
  model.includes('readonly consumerClosure:') && model.includes('consumerClosure:'));
check('AST projection consumes payload judgments and does not inspect binding candidate arrays',
  scanner.includes('method.body.dataflow.payloadJudgments') &&
  scanner.includes('judgment.bindingJudgment.definition.semanticResolution') &&
  !scanner.includes('method.body.dataflow.bindingJudgments'));
check('resource binding uses the canonical variable flow through its existing domain authority',
  dataflowContract.includes('createControllerSemanticVariableIndex(sequenceToArray(semanticVariables.variables))') &&
  dataflowContract.includes('controllerResourceBindingAuthority.judge') &&
  !dataflowContract.includes('bindingJudgments') && !dataflowContract.includes('payloadJudgments'));
check('payload ambiguity is closed upstream and never resolved by a downstream consumer',
  authority.includes('controller_dataflow_payload_semantics_ambiguous') &&
  authority.includes('bindingJudgments: resolvedCandidates') &&
  scanner.includes("case 'controller_dataflow_payload_semantics_resolved'") && scanner.includes("case 'controller_dataflow_payload_semantics_ambiguous'"));
check('integrated response remains composed by the existing upstream composition authority',
  authority.includes('invocationSemanticIntegratedResponseComposition.integrate({') &&
  authority.includes('semanticKnowledgeProjection: sourceCorrelation.semanticKnowledgeProjection') &&
  authority.includes('phpSourceInvocationPipeline: sourceCorrelation.invocationJudgment.response'));
check('no new semantic authority or callable payload lookup was added',
  model.includes('noParallelAuthority') && !model.includes('readonly resolvePayload:') &&
  authorityInterface.includes('readonly derive:'));
check('Laravel scanner boundary contract version and consumer ownership are synchronized',
  scannerContract.includes('readonly version: 109;') && scannerContract.includes('  version: 109,') &&
  scannerContract.includes('readonly controllerDataflowConsumerClosure:') && scannerContract.includes('controllerDataflowConsumerClosure:'));
check('upstream payload judgment authority still owns binding correspondence and ambiguity',
  authorityInterface.includes('payloadSemanticJudgmentClosure') &&
  authorityInterface.includes('ControllerDataflowSemanticJudgmentAuthorityInterface'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
