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

const checks = [
  ['batch-contract-version-2', invocation.includes('readonly version: 2;') && invocation.includes('version: 2,')],
  ['batch-closure-requires-total-bijection', invocation.includes('readonly totalCorrespondence:') && invocation.includes('inventory-and-judgments-form-a-total-bijection')],
  ['batch-closure-correlates-arguments', invocation.includes('readonly argumentCorrelation:') && invocation.includes('judgment-arguments-mismatch')],
  ['batch-closure-has-typed-rejected-outcome', invocation.includes("kind: 'php_function_invocation_semantic_judgment_batch_rejected'") && invocation.includes('readonly violations: readonly [')],
  ['validated-batch-is-authority-receipt', invocation.includes("kind: 'php_function_invocation_semantic_judgment_batch_validated'") && invocation.includes("['receipt']")],
  ['integrated-response-preserves-closure-result', pipelineInterface.includes('readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatchClosureResult')],
  ['composition-input-accepts-only-validated-receipt', pipelineInterface.includes('export interface InvocationSemanticIntegratedResponseCompositionInput') && pipelineInterface.includes('readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatch;')],
  ['resolution-contract-still-prohibits-short-name-classification', resolution.includes('never-infer-function-target-from-short-name-alone')],
  ['call-authority-does-not-reintroduce-relations-or-foundation', !callAuthority.includes('semantic/relations') && !callAuthority.includes('semantic/foundation')],
  ['interface-contracts-remain-exported-through-upstream-index', read('packages/core/src/types/upstream/index.ts').includes("export * from './phpFunctionInvocationSemanticAuthorityInterface';")],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} interface checks passed\n`);

const blockers = [
  ['name-resolution-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts'))],
  ['batch-closure-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts'))],
  ['runtime-does-not-return-integrated-aggregate', !pipelineRuntime.includes('const response: InvocationSemanticIntegratedResponse = Object.freeze({')],
  ['laravel-scanner-does-not-provide-php-batch', scanner.includes('integrate({ knowledge: semanticKnowledgeDataFlow })')],
  ['resource-scanner-still-uses-pre-resolution-evidence', resourceScanner.includes("kind: 'php_function_call_evidence'") && resourceScanner.includes('function: functionName(name)')],
];
for (const [name, pending] of blockers) process.stdout.write(`${pending ? 'PENDING' : 'REVIEW'} ${name}\n`);
process.exitCode = passed === checks.length ? 0 : 1;
