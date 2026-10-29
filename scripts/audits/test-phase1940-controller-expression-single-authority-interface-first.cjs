const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const model = read('packages/core/src/types/upstream/controller.ts');
const projection = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts');
const compositionInterface = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionInterface.ts');
const compositionAuthority = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts');
const requestProjection = read('packages/core/src/types/upstream/semanticDataflowRequestProjection.ts');
const integratedModel = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const authorityContract = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');

check('ControllerVariableDefinition no longer duplicates Expression beside semanticResolution',
  model.includes('readonly semanticResolution: ControllerVariableSemanticJudgment;') &&
  !model.slice(model.indexOf('export interface ControllerVariableDefinition'), model.indexOf('export interface ControllerVariableBinding')).includes('readonly expression: Expression;'));
check('definition projection computes one canonical expression and passes it to semantic judgment',
  projection.includes('sourceExpression: expression,') &&
  !projection.includes('      expression,\n      semanticResolution,'));
check('composition authority is pure aggregation and contains no relation predicate gate or rejection throw',
  compositionInterface.includes('readonly expressionOwnership:') &&
  compositionAuthority.includes('const flow: ControllerSemanticVariableFlow') &&
  !compositionAuthority.includes('relationGate') &&
  !compositionAuthority.includes('relationEqual') &&
  !compositionAuthority.includes('throw Error'));
check('scanner consumes the closed binding judgment by exact PHP AST payload identity and reuses its canonical expression',
  scanner.includes('method.body.dataflow.payloadJudgments') &&
  scanner.includes('judgment.payload.payload.value, value') &&
  scanner.includes('judgment.bindingJudgment.definition.semanticResolution.sourceExpression') &&
  !scanner.includes('canonical.start.value === currentExpression.source.start.value') &&
  !scanner.includes('definition.expression'));
check('request dataflow reads the expression owned by semantic judgment',
  requestProjection.includes('requestAccessFields(definition.semanticResolution.sourceExpression, boundName)') &&
  !requestProjection.includes('requestAccessFields(definition.expression, boundName)'));
check('integrated response model contract version and publication rule are synchronized',
  integratedModel.includes('readonly version: 18;') &&
  integratedModel.includes('  version: 18,') &&
  integratedModel.includes('single-canonical-expression-is-owned-by-the-closed-semanticResolution-judgment'));
check('semantic judgment authority contract version and publication closure are synchronized',
  authorityContract.includes('readonly version: 15;') &&
  authorityContract.includes('  version: 15,') &&
  authorityContract.includes('definition-expression-is-not-duplicated-outside-the-closed-semanticResolution-judgment'));
check('scanner interface version and semantic ownership declaration are synchronized',
  scannerContract.includes('readonly version: 109;') &&
  scannerContract.includes('  version: 109,') &&
  scannerContract.includes('definition-expression-is-owned-only-by-the-closed-semanticResolution-judgment'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
