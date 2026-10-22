const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['pipeline authority implementation exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts'))],
  ['pipeline authority consumes the existing frontend interface', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('frontend: PhpSourceFrontendInterface')],
  ['pipeline authority delegates extraction validation', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('extractionValidation.validate')],
  ['pipeline authority delegates source inventory', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('sourceInventory.inspect')],
  ['pipeline authority delegates environment projection', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('environmentProjection.project')],
  ['pipeline authority delegates name resolution', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('nameResolution.resolve')],
  ['pipeline authority delegates batch derivation and closure', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes('invocationBatch.derive')],
  ['incomplete frontend coverage remains blocked', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes("stage: 'frontend_coverage'")],
  ['incomplete source inventory remains blocked', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes("stage: 'source_inventory'")],
  ['environment projection failure remains blocked', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts').includes("stage: 'environment_projection'")],
  ['batch closure rejection remains blocked', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes("stage: 'invocation_batch_closure'")],
  ['only validated batch produces complete result', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes("case 'php_function_invocation_semantic_judgment_batch_validated'")],
  ['pipeline integration accepts complete result only', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts').includes('batch: result.batch')],
  ['blocked result remains a typed integrated outcome', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts').includes("kind: 'php_source_invocation_integration_blocked'")],
  ['Laravel scanner exposes pipeline-based analyzer entry', read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts').includes('analyzeControllerDataflowFromPhpSourcePipeline')],
  ['upstream index exports pipeline authority and integration', read('packages/core/src/types/upstream/index.ts').includes("export { createPhpSourceInvocationSemanticPipelineAuthority }") && read('packages/core/src/types/upstream/index.ts').includes("export { phpSourceInvocationSemanticPipelineIntegrationAuthority }")],
  ['new authority and integration files do not depend on semantic foundation or relations', ![
    'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts',
    'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts',
  ].some(file => /semantic\/foundation|semantic\/relations/.test(read(file)))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
