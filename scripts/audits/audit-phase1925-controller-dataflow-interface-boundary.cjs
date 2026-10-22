const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const ast = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['upstream semantic model retains canonical invocation judgment', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model)],
  ['upstream semantic model retains integrated response as a distinct value', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult/.test(model)],
  ['upstream model does not claim scanner-local arrays prove semantic closure', !/ControllerDataflowSemanticClosureInterface|ControllerDataflowSemanticClosureContract/.test(model)],
  ['AST extends the existing upstream semantic model', /interface ControllerDataflowAst extends ControllerDataflowInvocationSemanticModelInterface<SemanticKnowledgeDataFlow>/.test(ast)],
  ['AST binds correspondence to the concrete binding judgment ADT', /readonly bindingPayloadCorrespondence: readonly ControllerDataflowBindingPayloadCorrespondenceJudgment</.test(ast)],
  ['AST binds identity results to the existing identity judgment ADT', /readonly variableIdentityJudgments: readonly ControllerDataflowVariableIdentityJudgment\[\]/.test(ast)],
  ['AST documents that collections do not establish closure by themselves', /Closure requires a source-coverage authority\/receipt/.test(ast)],
  ['analyzer preserves separate integrated response and canonical judgment', /invocationSemanticIntegratedResponse, invocationJudgment: judgment/.test(analyzer)],
  ['scanner contract remains the existing upstream boundary', /interface LaravelControllerScannerInterface/.test(scanner)],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
