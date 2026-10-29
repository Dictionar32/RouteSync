const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
const bodyTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const semanticModel = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const composition = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionInterface.ts');

check('scanner consumes existing closed bindingJudgments instead of searching semanticVariables by source span',
  scanner.includes('method.body.dataflow.payloadJudgments') &&
  !scanner.includes('definition.semanticResolution.sourceExpression.source') &&
  !scanner.includes('canonical.start.value === currentExpression.source.start.value'));
check('matched judgment is correlated through the exact AST payload object retained by upstream correspondence',
  bodyTypes.includes('readonly value: PhpAstValue') &&
  scanner.includes('judgment.payload.payload.value, value') &&
  scanner.includes("'controller_dataflow_payload_semantics_resolved'"));
check('resolved projection reuses the canonical Expression owned by semantic judgment',
  scanner.includes('expression: judgment.bindingJudgment.definition.semanticResolution.sourceExpression') &&
  scanner.includes('expression: expression(value, file)') &&
  scanner.includes('projectPayloadJudgment(judgment, value, file)'));
check('unmatched syntax remains explicitly unresolved rather than being semantically reclassified',
  scanner.includes("reason: 'external'") && scanner.includes("reason: 'ambiguous'"));
check('integrated response and existing binding judgments remain the single model output',
  semanticModel.includes('readonly bindingJudgments: readonly TBindingJudgment[]') &&
  semanticModel.includes('readonly payloadJudgments: readonly TPayloadJudgment[]') &&
  semanticModel.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult') &&
  !semanticModel.includes('readonly expressionJudgmentIndex:'));
check('composition authority remains the existing upstream aggregate and no parallel authority is introduced',
  composition.includes('ControllerSemanticVariableFlowCompositionAuthorityInterface') &&
  !scanner.includes('ControllerSemanticVariableFlowCompositionAuthorityInterface'));
check('scanner boundary contract documents payload-identity consumption and version is synchronized',
  scannerContract.includes('readonly version: 109;') &&
  scannerContract.includes('  version: 109,') &&
  scannerContract.includes('scanner-consumes-the-authority-closed-per-payload-semantic-judgment-by-payload-identity'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
