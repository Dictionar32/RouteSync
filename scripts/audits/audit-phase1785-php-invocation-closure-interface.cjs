const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipelineRuntime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const callAuthority = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');

const checks = [
  ['batch-contract-version-3', invocation.includes('readonly version: 3;') && invocation.includes('version: 3,')],
  ['closure-rule-order-is-explicit', invocation.includes('readonly closureRuleOrder: readonly [') && invocation.includes("'reject-closure-when-any-obligation-fails'")],
  ['completeness-witness-file-mismatch-is-typed', invocation.includes("kind: 'inventory-completeness-file-mismatch'")],
  ['resolution-environment-file-mismatch-is-typed', invocation.includes("kind: 'resolution-environment-file-mismatch'")],
  ['resolution-source-file-mismatch-is-typed', invocation.includes("kind: 'resolution-source-file-mismatch'")],
  ['name-syntax-source-file-mismatch-is-typed', invocation.includes("kind: 'name-syntax-source-file-mismatch'")],
  ['judgment-resolution-mismatch-is-typed', invocation.includes("kind: 'judgment-resolution-mismatch'")],
  ['total-correspondence-and-argument-binding-remain-required', invocation.includes('readonly totalCorrespondence:') && invocation.includes("kind: 'judgment-arguments-mismatch'")],
  ['validated-receipt-remains-authority-issued', invocation.includes("kind: 'php_function_invocation_semantic_judgment_batch_validated'") && invocation.includes("['receipt']")],
  ['integrated-response-preserves-closure-outcome', pipelineInterface.includes('readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatchClosureResult')],
  ['composition-runtime-retains-single-integrated-response', pipelineRuntime.includes('const response: InvocationSemanticIntegratedResponse = Object.freeze({')],
  ['resolution-contract-prohibits-short-name-classification', resolution.includes('never-infer-function-target-from-short-name-alone')],
  ['call-authority-has-no-relations-or-foundation-dependency', !callAuthority.includes('semantic/relations') && !callAuthority.includes('semantic/foundation')],
  ['upstream-index-exports-invocation-interface', upstreamIndex.includes("export * from './phpFunctionInvocationSemanticAuthorityInterface';")],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} interface checks passed\n`);

const blockers = [
  ['name-resolution-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts'))],
  ['batch-closure-authority-implementation-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts'))],
  ['laravel-scanner-does-not-provide-php-batch', scanner.includes('integrate({ knowledge: semanticKnowledgeDataFlow })')],
  ['resource-scanner-still-uses-pre-resolution-call-evidence', resourceScanner.includes("kind: 'php_function_call_evidence'") && resourceScanner.includes('function: functionName(name)')],
];
for (const [name, pending] of blockers) process.stdout.write(`${pending ? 'PENDING' : 'REVIEW'} ${name}\n`);
process.exitCode = passed === checks.length ? 0 : 1;
