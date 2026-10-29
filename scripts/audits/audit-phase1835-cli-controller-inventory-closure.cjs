const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['CLI invokes invocation judgment authority', read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('laravelControllerInvocationSemanticJudgmentAuthority.judge(')],
  ['CLI closes source inventory through inventory authority', read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('laravelControllerInvocationSemanticJudgmentInventoryAuthority.close(')],
  ['CLI passes only closure receipt to manifest builder', read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('manifestBuilder.build(sourceProject, inventoryResult.receipt)')],
  ['CLI preserves rejected inventory as failure', read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes("case 'laravel_controller_invocation_semantic_judgment_inventory_rejected'")],
  ['Manifest builder boundary accepts closure receipt', read('packages/core/src/types/upstream/manifestBuilderInterface.ts').includes('invocationInventoryReceipt?: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt')],
  ['Source AST pipeline boundary accepts closure receipt', read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts').includes('invocationInventoryReceipt?: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt')],
  ['Controller scanner consumes correlated judgments from receipt', read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts').includes('invocationInventoryReceipt.correspondences.map(judgment =>')],
  ['Controller scanner forwards integrated response unchanged', read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts').includes('integratedResponse: judgment.response')],
  ['Controller scanner does not consume raw delivery batch', !read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts').includes('PhpSourceInvocationSemanticPipelineDeliveryBatch')],
  ['Core production pipeline has no raw delivery batch parameter', !read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('PhpSourceInvocationSemanticPipelineDeliveryBatch')],
  ['Integrated response composition accepts already-integrated response', read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts').includes('| PhpSourceInvocationSemanticPipelineIntegrationResult')],
  ['Integrated response composition forwards integrated response variant', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('case \'php_source_invocation_integration_complete\':\n    case \'php_source_invocation_integration_blocked\':\n      return input;')],
  ['No semantic foundation dependency in inventory authority', !read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts').includes('semantic/foundation')],
  ['No semantic relations dependency in inventory authority', !read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts').includes('semantic/relations')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} static checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
