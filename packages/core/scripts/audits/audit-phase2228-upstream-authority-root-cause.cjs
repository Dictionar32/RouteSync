const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing invocation judgment interface owns closed outcomes', () => read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts').includes('LaravelControllerInvocationSemanticJudgmentInterface') && read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts').includes('LaravelControllerInvocationBlockedJudgment')],
  ['existing response pipeline owns integrated judgment', () => read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').includes('judgeIntegratedResponse') && read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts').includes('LaravelControllerIntegratedResponseJudgment<InvocationJudgment>')],
  ['integrated scanner passes invocation judgment to response authority', () => read('src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('responseSemanticPipeline.judgeIntegratedResponse')],
  ['AST projection receives integrated invocation/response pair', () => read('src/compiler/scanner/wiring/laravelControllerScanner.ts').includes("kind: 'integrated_invocation_response_judgment'")],
  ['response scanner consumes canonical method response products', () => read('src/compiler/scanner/subscanners/responseScanner.ts').includes('artifact.responseJudgment.product.firstMethod') && read('src/compiler/scanner/subscanners/responseScanner.ts').includes('methodResponseAstProjection.project')],
  ['legacy action response descriptor derivation is retired', () => !read('src/compiler/scanner/descriptors/request/controllerActionContract.ts').includes('resolveResponseAttributeAst') && !read('src/compiler/scanner/subscanners/controller/responseAttributeScanner.ts').includes('resolveResponseAttributeAst')],
  ['existing action interface closes response descriptor derivation debt', () => !read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts').includes('response_descriptor_resolution') && read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts').includes('response-descriptor-resolution-is-retired')],
  ['no relation/foundation dependency introduced in authority files', () => !/semantic\/(relations|foundation)/.test(read('src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts') + read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts') + read('src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['no new invocation-response wiring adapter introduced', () => !fs.existsSync(path.join(root, 'src/compiler/scanner/wiring/laravelControllerInvocationResponseWiring.ts'))],
];
let failed = 0;
for (const [label, run] of checks) {
  const passed = run();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed += Number(!passed);
}
process.stdout.write(`${checks.length - failed}/${checks.length} structural checks passed\n`);
process.exitCode = failed ? 1 : 0;
