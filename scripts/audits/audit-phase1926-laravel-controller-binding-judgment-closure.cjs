const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const modelPath = path.join(root, 'packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const astPath = path.join(root, 'packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const analyzerPath = path.join(root, 'packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const scannerContractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const model = fs.readFileSync(modelPath, 'utf8');
const ast = fs.readFileSync(astPath, 'utf8');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts'), 'utf8');
const scannerContract = fs.readFileSync(scannerContractPath, 'utf8');
const checks = [
  ['upstream value contract correlates correspondence and identity', model.includes('ControllerDataflowBindingSemanticJudgmentInterface') && model.includes('readonly correspondence:') && model.includes('readonly identity:')],
  ['missing and ambiguous correspondence outcomes remain explicit', model.includes("'binding_payload_correspondence_missing' | 'binding_payload_correspondence_ambiguous'")],
  ['missing and ambiguous identity outcomes remain explicit', model.includes("'controller_dataflow_variable_identity_missing' | 'controller_dataflow_variable_identity_ambiguous'")],
  ['resolved definition is attached to the exact binding judgment', model.includes("kind: 'controller_dataflow_binding_semantics_resolved'") && model.includes('readonly definition: ControllerVariableDefinition')],
  ['AST carries correlated judgments rather than parallel result arrays', ast.includes('readonly bindingJudgments:') === false && ast.includes('ControllerDataflowBindingJudgment') && !ast.includes('bindingPayloadCorrespondence:') && !ast.includes('variableIdentityJudgments:')],
  ['upstream authority retains a judgment for every correspondence outcome', authority.includes('const bindingJudgments = relationProject(bindings') && authority.includes('controller_dataflow_binding_correspondence_unresolved')],
  ['integrated response and canonical invocation judgment remain separate fields', model.includes('readonly invocationSemanticIntegratedResponse:') && model.includes('readonly invocationJudgment:')],
  ['scanner ownership contract acknowledges correlated binding judgments', scannerContract.includes('correlated-per-binding-judgments') && scannerContract.includes('per-binding-output-must-retain-correspondence-and-identity-as-one-closed-judgment')],
  ['analyzer does not cast binding outcomes with as', !/kind:\s*'controller_dataflow_binding_[^']+'\s+as\s+const/.test(analyzer)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
