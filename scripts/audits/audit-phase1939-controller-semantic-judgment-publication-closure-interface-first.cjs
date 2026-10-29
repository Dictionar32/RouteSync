const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const flowInterface = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionInterface.ts');
const flowAuthority = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionAuthority.ts');
const dataflowInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['variable-flow composition interface advances to contract v2', /readonly contractVersion: 2/.test(flowInterface) && /readonly expressionJudgmentPublication/.test(flowInterface)],
  ['composition contract explicitly requires exact expression-to-judgment reference binding', /exact-sourceExpression-reference-retained-by-its-semanticResolution-judgment/.test(flowInterface)],
  ['upstream composer checks each definition before constructing variable flow', /relationAll\(input\.definitions\.map\(definition => relationEqual\(definition\.expression, definition\.semanticResolution\.sourceExpression\)\)\)/.test(flowAuthority) && /Controller variable-flow publication requires each definition expression/.test(flowAuthority)],
  ['composition only publishes flow after the closure relation succeeds', /const compose =[\s\S]*relationGate\([\s\S]*relationAll\([\s\S]*\(\) => \{[\s\S]*groupDefinitions\(input\.definitions\)[\s\S]*\},[\s\S]*\(\) => \{ throw Error/.test(flowAuthority)],
  ['empty and composed outcomes state their expression-judgment closure', /vacuously-closed-because-no-definition-is-published/.test(flowAuthority) && /every-definition-expression-is-the-exact-sourceExpression-reference/.test(flowAuthority)],
  ['dataflow authority contract advances and closes publication before integrated response', /readonly contractVersion: 13/.test(dataflowInterface) && /readonly version: 13/.test(dataflowInterface) && /semanticJudgmentPublicationClosure/.test(dataflowInterface) && /contractVersion: 13/.test(dataflowAuthority)],
  ['variable flow composition precedes integrated response publication', /const variableFlow = controllerSemanticVariableFlowCompositionAuthority\.compose/.test(dataflowAuthority) && /const integratedResponse = invocationSemanticIntegratedResponseComposition\.integrate/.test(dataflowAuthority) && dataflowAuthority.indexOf('const variableFlow =') < dataflowAuthority.indexOf('const integratedResponse =')],
  ['semantic model documents judgment publication ownership', /readonly version: 11/.test(model) && /semanticJudgmentPublication/.test(model)],
  ['Laravel scanner contract documents upstream closure without adding scanner-side validation', /readonly version: 101/.test(scanner) && /controllerDataflowSemanticJudgmentPublication/.test(scanner) && !/semanticResolution\.sourceExpression/.test(read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts'))],
  ['no alternate semantic authority or foundation dependency was introduced', !/semantic\/foundation/.test(flowInterface + flowAuthority + dataflowInterface + dataflowAuthority + model + scanner) && !/new ControllerVariableSemanticAuthority/.test(flowAuthority)],
  ['audit is registered in package scripts', Boolean(packageJson.scripts['audit:phase1939-controller-semantic-judgment-publication-closure-interface-first'])],
  ['Phase 1938 expression-evidence contract remains represented upstream', /semanticResolutionExpressionBinding/.test(dataflowInterface) && /sourceExpression: expression/.test(read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowDefinitionProjectionAuthority.ts'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
