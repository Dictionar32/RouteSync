const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const pipelineInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const responseInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');

const checks = [
  ['source-pipeline-input-is-a-closed-connected-or-not-connected-union', pipelineInterface.includes("kind: 'php_source_invocation_pipeline_not_connected'") && pipelineInterface.includes("kind: 'php_source_invocation_pipeline_connected'")],
  ['connected-evidence-retains-the-exact source-binding judgment that owns the pipeline result', pipelineInterface.includes('readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment')],
  ['integrated-response-retains-lossless-source-pipeline-outcome', responseInterface.includes('readonly phpFunctionInvocations: PhpSourceInvocationSemanticPipelineIntegrationResult;') && integrationInterface.includes('readonly pipeline: PhpSourceInvocationSemanticPipelineBlocked;')],
  ['integrated-response-contract-version-advanced', responseInterface.includes('readonly version: 17;') && responseInterface.includes('version: 17,')],
  ['composition-input-no-longer-accepts-detached-php-state', responseInterface.includes('interface InvocationSemanticIntegratedResponseCompositionInput') && !responseInterface.slice(responseInterface.indexOf('interface InvocationSemanticIntegratedResponseCompositionInput'), responseInterface.indexOf('interface InvocationSemanticIntegratedResponseCompositionDependencies')).includes('phpFunctionInvocations:')],
  ['composition-forwards-only-the-closed-php-outcome', composition.includes('phpFunctionInvocations: input.phpSourceInvocationPipeline') && !composition.includes('phpInvocationIntegration')],
  ['composition-preserves-explicit-pending-for-unconnected-source', integration.includes('case \'php_source_invocation_pipeline_not_connected\':')],
  ['scanner-forwards-only-integrated-source-pipeline-outcomes', analyzer.includes('phpSourceInvocationPipeline: integratedResponse })') && !analyzer.includes("kind: 'php_source_invocation_pipeline_connected'" ) && !analyzer.includes('phpSourceInvocationSemanticPipelineIntegration.project')],
  ['ordinary-scanner-path marks pipeline as an explicit integrated not-connected outcome', binding.includes("kind: 'php_source_invocation_integration_not_connected'")],
  ['integration-projection-remains-a-pure-result-projection', integration.includes('case \'php_source_invocation_semantic_pipeline_complete\':') && integration.includes('case \'php_source_invocation_semantic_pipeline_blocked\':')],
  ['no-semantic-foundation-dependency-added', !pipelineInterface.includes('semantic/foundation') && !responseInterface.includes('semantic/foundation') && !composition.includes('semantic/foundation')],
  ['no-semantic-relations-dependency-added-to-upstream-pipeline', !pipelineInterface.includes('semantic/relations') && !responseInterface.includes('semantic/relations') && !composition.includes('semantic/relations')],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} checks passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
