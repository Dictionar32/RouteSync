const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const pipeline = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const scannerBoundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const bodyParser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const runtimeBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const checks = [
  ['source-binding-contract-is-a-closed-judgment-adt', contract.includes('PhpSourceInvocationSemanticSourceBindingJudgment') && contract.includes('php_source_invocation_semantic_source_binding_closed') && contract.includes('php_source_invocation_semantic_source_binding_rejected')],
  ['authority-compares-controller-and-pipeline-source-identities', authority.includes('laravelSourceIdentitySemantics.relateSourceFiles(') && authority.includes('input.controllerSourceFile') && authority.includes('input.pipelineResult.document.sourceFile')],
  ['authority-does-not-classify-invocation-semantics', authority.includes('runtimeRule') && authority.includes('does-not-resolve-invocations-or-synthesize-semantic-judgments') && !authority.includes('semantic/foundation')],
  ['binding-rejection-is-distinct-in-pipeline-composition-evidence', pipeline.includes('php_source_invocation_pipeline_source_binding_rejected')],
  ['integrated-response-retains-binding-rejection', integrationInterface.includes('php_source_invocation_integration_source_binding_rejected') && integrationInterface.includes('preserve-source-binding-rejection-as-its-own-integrated-outcome') && integration.includes("case 'php_source_invocation_pipeline_source_binding_rejected'") && integration.includes('judgment: evidence.judgment')],
  ['binding-outcomes-map-exhaustively-without-casts', authority.includes("case 'php_source_invocation_semantic_source_binding_closed'") && authority.includes("case 'php_source_invocation_semantic_source_binding_rejected'") && !authority.includes(' as ')],
  ['laravel-boundary-assigns-source-binding-to-upstream-judgment', scannerBoundary.includes('sourceBindingJudgmentAuthority') && scannerBoundary.includes('closed-judgment')],
  ['active-controller-body-parser-consumes-injected-pipeline-evidence', bodyParser.includes('analyzeControllerDataflowWithIntegratedResponse(block, parameters, parameterSemantics, filePath, integratedResponse)') && runtimeBinding.includes('analyzeControllerDataflowWithIntegratedResponse')],
  ['contracts-exported-from-upstream-and-public-core', upstreamIndex.includes("./phpSourceInvocationSemanticSourceBindingInterface") && upstreamIndex.includes('phpSourceInvocationPipelineEvidenceFromSourceBinding') && publicIndex.includes('phpSourceInvocationPipelineEvidenceFromSourceBinding')],
  ['no-semantic-foundation-dependency-added', !contract.includes('semantic/foundation') && !authority.includes('semantic/foundation') && !integration.includes('semantic/foundation')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
