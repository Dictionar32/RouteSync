#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const authority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const response = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['integration contract is defined in its interface-first module', contract.includes('interface PhpSourceInvocationSemanticPipelineIntegrationInterface') && contract.includes('readonly version: 10;')],
  ['integration result preserves all four typed outcomes', contract.includes("kind: 'php_source_invocation_integration_not_connected'") && contract.includes("kind: 'php_source_invocation_integration_source_binding_rejected'") && contract.includes("kind: 'php_source_invocation_integration_complete'") && contract.includes("kind: 'php_source_invocation_integration_blocked'")],
  ['complete outcome preserves exact source binding, pipeline, and validated batch', contract.includes('readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment') && contract.includes('readonly pipeline: PhpSourceInvocationSemanticPipelineComplete;') && contract.includes('readonly batch: Extract<')],
  ['blocked outcome preserves exact source binding, blocked pipeline, and stage', contract.includes('readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment') && contract.includes('readonly pipeline: PhpSourceInvocationSemanticPipelineBlocked;') && authority.includes('pipeline: evidence.sourceBinding.pipelineResult')],
  ['not-connected outcome preserves original evidence', contract.includes("readonly evidence: Extract<") && authority.includes('kind: \'php_source_invocation_integration_not_connected\'')],
  ['rejected source-binding outcome preserves the exact original pipeline result', contract.includes('rejectedEvidencePreservation') && read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts').includes('pipelineResult: PhpSourceInvocationSemanticPipelineResult')],
  ['projection contract forbids generic pending collapse', contract.includes('never-collapse-blocked-source-semantic-judgments-into-generic-pending-state')],
  ['authority returns exact blocked result without reconstruction', authority.includes("kind: 'php_source_invocation_integration_blocked'") && authority.includes('pipeline: evidence.sourceBinding.pipelineResult')],
  ['integrated response owns the lossless typed PHP outcome', response.slice(response.indexOf('export interface InvocationSemanticIntegratedResponse {'), response.indexOf('export interface InvocationSemanticIntegratedResponseCompositionContract')).includes('readonly phpFunctionInvocations: PhpSourceInvocationSemanticPipelineIntegrationResult;') && !response.slice(response.indexOf('export interface InvocationSemanticIntegratedResponse {'), response.indexOf('export interface InvocationSemanticIntegratedResponseCompositionContract')).includes('readonly phpSourceInvocationPipeline:')],
  ['integrated response contract advanced to v10', response.includes('readonly version: 10;') && response.includes('version: 10,')],
  ['composition contract advances to v17 closed-input boundary', response.includes('readonly version: 17;') && response.includes('version: 17,') && response.includes('scannerInputClosureBoundary')],
  ['composition forwards the already integrated response without reclassification', composition.includes('phpFunctionInvocations: input.phpSourceInvocationPipeline') && !composition.includes('phpInvocationIntegration') && !composition.includes('integratedPhpSourceResponse')],
  ['scanner analyzer accepts only closed integrated outcomes and does not project raw evidence', analyzer.includes('invocationSemanticIntegratedResponseComposition.integrate({ knowledge: semanticKnowledgeDataFlow, phpSourceInvocationPipeline: integratedResponse })') && !analyzer.includes('phpSourceInvocationSemanticPipelineIntegrationAuthority.project') && !analyzer.includes('phpSourceInvocationPipelineEvidenceFromSourceBinding')],
  ['upstream barrel exports the interface and authority separately', index.includes("export * from './phpSourceInvocationSemanticPipelineIntegrationInterface';") && index.includes("export { phpSourceInvocationSemanticPipelineIntegrationAuthority } from './phpSourceInvocationSemanticPipelineIntegration';")],
  ['no semantic foundation or relations dependencies introduced', !contract.includes('semantic/foundation') && !contract.includes('semantic/relations') && !authority.includes('semantic/foundation') && !authority.includes('semantic/relations')],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
