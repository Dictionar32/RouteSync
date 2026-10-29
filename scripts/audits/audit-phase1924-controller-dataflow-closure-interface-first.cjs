// Superseded by Phase 1925: scanner-local judgment collections do not constitute a closed semantic receipt.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['unsubstantiated generic closure interface removed', !/ControllerDataflowSemanticClosureInterface/.test(model)],
  ['unsubstantiated closure contract removed', !/ControllerDataflowSemanticClosureContract|CONTROLLER_DATAFLOW_SEMANTIC_CLOSURE_CONTRACT/.test(model)],
  ['existing upstream model remains canonical', /extends ControllerDataflowInvocationSemanticModelInterface<SemanticKnowledgeDataFlow>/.test(ast)],
  ['scanner-specific correspondence uses concrete judgment ADT', /ControllerDataflowBindingPayloadCorrespondenceJudgment</.test(ast)],
  ['scanner-specific identity uses existing judgment ADT', /ControllerDataflowVariableIdentityJudgment/.test(ast)],
  ['canonical invocation judgment remains separate from integrated response', /invocationSemanticIntegratedResponse, invocationJudgment: judgment/.test(analyzer)],
  ['AST explicitly disclaims collection-as-closure inference', /collections represent multiple source facts, not proof/.test(ast)],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
