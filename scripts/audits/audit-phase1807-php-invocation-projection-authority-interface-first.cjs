#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const responseInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['projection interface consumes the complete discriminated composition evidence', /project: \(\s*evidence: PhpSourceInvocationSemanticPipelineCompositionEvidence/.test(integrationInterface)],
  ['projection contract remains at its current v10 evidence-preserving version', /readonly version: 10/.test(integrationInterface) && /version: 10/.test(integrationInterface)],
  ['not-connected state is preserved as an explicit outcome', /kind: 'php_source_invocation_integration_not_connected'/.test(integration) && /evidence,/.test(integration)],
  ['connected complete result preserves the exact source-bound pipeline result', /kind: 'php_source_invocation_integration_complete'/.test(integration) && /pipeline: evidence\.sourceBinding\.pipelineResult/.test(integration)],
  ['complete pipeline result yields the exact validated invocation batch', /case 'php_source_invocation_semantic_pipeline_complete':[\s\S]*?batch: evidence\.sourceBinding\.pipelineResult\.batch/.test(integration)],
  ['blocked pipeline result preserves exact blocked stage', /kind: 'php_source_invocation_integration_blocked'[\s\S]*?pipeline: evidence\.sourceBinding\.pipelineResult/.test(integration)],
  ['composition contract rejects raw composition evidence at the scanner-facing input', /type InvocationPhpSourceIntegratedResponse = PhpSourceInvocationSemanticPipelineIntegrationResult/.test(responseInterface) && /scannerInputClosureBoundary/.test(responseInterface)],
  ['composition forwards the integrated outcome without reclassification', /phpFunctionInvocations: input\.phpSourceInvocationPipeline/.test(composition) && !/phpInvocationIntegration|integratedPhpSourceResponse/.test(composition)],
  ['composition no longer owns the legacy pending-state constant', !/PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING/.test(composition)],
  ['integrated response owns lossless integration result', /readonly phpFunctionInvocations: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(responseInterface)],
  ['scanner only forwards integrated outcomes and does not project raw evidence', /invocationSemanticIntegratedResponseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow, phpSourceInvocationPipeline: integratedResponse \}\)/.test(analyzer) && !/phpSourceInvocationSemanticPipelineIntegrationAuthority\.project|phpSourceInvocationPipelineEvidenceFromSourceBinding/.test(analyzer)],
  ['no semantic foundation or semantic relations dependency introduced upstream', !/semantic\/(foundation|relations)/.test(integration) && !/semantic\/(foundation|relations)/.test(integrationInterface) && !/semantic\/(foundation|relations)/.test(responseInterface) && !/semantic\/(foundation|relations)/.test(composition)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
