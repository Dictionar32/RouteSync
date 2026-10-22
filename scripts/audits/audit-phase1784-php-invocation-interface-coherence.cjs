const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipelineRuntime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const callAuthority = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');

const checks = [
  ['batch-entry-is-declared-in-upstream-interface', invocation.includes('export interface PhpFunctionInvocationSemanticJudgmentBatchEntry') && invocation.includes("readonly kind: 'php_function_invocation_semantic_judgment_batch_entry'")],
  ['batch-entry-binds-source-evidence-to-judgment', /interface PhpFunctionInvocationSemanticJudgmentBatchEntry[\s\S]*?readonly evidence: PhpFunctionInvocationSourceEvidence;[\s\S]*?readonly judgment: PhpFunctionInvocationSemanticJudgment;/.test(invocation)],
  ['closure-receipt-owns-inventory-and-correspondences', /interface PhpFunctionInvocationSemanticJudgmentBatchClosureReceipt[\s\S]*?readonly inventory: PhpFunctionInvocationSourceInventory;[\s\S]*?readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry\[\];[\s\S]*?readonly correspondences: readonly/.test(invocation)],
  ['closure-result-preserves-validated-and-rejected-outcomes', invocation.includes("kind: 'php_function_invocation_semantic_judgment_batch_validated'") && invocation.includes("kind: 'php_function_invocation_semantic_judgment_batch_rejected'")],
  ['integrated-response-is-one-aggregate', /interface InvocationSemanticIntegratedResponse \{[\s\S]*?readonly publication: InvocationSemanticCoveragePublicationResult;[\s\S]*?readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatchClosureResult;/.test(pipelineInterface)],
  ['composition-input-preserves-rejected-closure-outcome', /interface InvocationSemanticIntegratedResponseCompositionInput \{[\s\S]*?readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatchClosureResult;/.test(pipelineInterface)],
  ['composition-runtime-constructs-the-aggregate', /const response: InvocationSemanticIntegratedResponse = Object\.freeze\(\{[\s\S]*?kind: 'invocation_semantic_integrated_response',[\s\S]*?publication,[\s\S]*?phpFunctionInvocations: input\.phpFunctionInvocations,[\s\S]*?\}\);/.test(pipelineRuntime)],
  ['composition-result-has-no-detached-php-sidecar', /return Object\.freeze\(\{[\s\S]*?kind: 'invocation_semantic_integrated_response_composition_result',[\s\S]*?knowledge: input\.knowledge,[\s\S]*?response,[\s\S]*?\}\);/.test(pipelineRuntime) && !/kind: 'invocation_semantic_integrated_response_composition_result',[\s\S]{0,180}phpFunctionInvocations:/.test(pipelineRuntime)],
  ['resolution-contract-prohibits-short-name-only-classification', resolution.includes('never-infer-function-target-from-short-name-alone')],
  ['call-authority-has-no-relations-or-foundation-dependency', !callAuthority.includes('semantic/relations') && !callAuthority.includes('semantic/foundation')],
  ['upstream-index-exports-invocation-contract', upstreamIndex.includes("export * from './phpFunctionInvocationSemanticAuthorityInterface';")],
  ['no-new-foundation-or-relations-import-in-interface-files', !invocation.includes('semantic/foundation') && !invocation.includes('semantic/relations') && !pipelineInterface.includes('semantic/foundation') && !pipelineInterface.includes('semantic/relations')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} interface-coherence checks passed\n`);

const blockers = [
  ['name-resolution-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts'))],
  ['batch-closure-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts'))],
  ['laravel-scanner-still-does-not-supply-php-batch', scanner.includes('integrate({ knowledge: semanticKnowledgeDataFlow })')],
  ['resource-scanner-still-uses-pre-resolution-call-evidence', resourceScanner.includes("kind: 'php_function_call_evidence'") && resourceScanner.includes('function: functionName(name)')],
];
for (const [name, pending] of blockers) process.stdout.write(`${pending ? 'PENDING' : 'REVIEW'} ${name}\n`);
process.exitCode = passed === checks.length ? 0 : 1;
