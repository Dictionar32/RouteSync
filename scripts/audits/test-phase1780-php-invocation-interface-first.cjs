const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const callInterface = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts');
const callAuthority = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts');
const invocationInterface = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const invocationAuthority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthority.ts');
const resolutionInterface = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts');

const checks = [
  ['call-interface-consumes-closed-invocation-input', callInterface.includes('export type PhpFunctionCallSemanticInput = PhpFunctionInvocationSemanticInput')],
  ['call-judgment-is-canonical-invocation-judgment', callInterface.includes('export type PhpFunctionCallSemanticJudgment = PhpFunctionInvocationSemanticJudgment')],
  ['call-authority-delegates-existing-invocation-authority', callAuthority.includes('phpFunctionInvocationSemanticAuthority.derive(input)')],
  ['call-authority-has-no-short-name-catalog-or-relations', !callAuthority.includes('bindings') && !callAuthority.includes('semantic/relations')],
  ['invocation-judgment-retains-resolution-evidence', invocationInterface.includes('readonly resolution: ResolvedPhpFunctionNameJudgment') && invocationInterface.includes('readonly resolution: UnresolvedPhpFunctionNameJudgment')],
  ['name-resolution-contract-requires-canonical-identity', resolutionInterface.includes('never-infer-function-target-from-short-name-alone')],
  ['integrated-response-contract-requires-php-judgment-batch', pipeline.includes('readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatch')],
  ['integrated-response-composition-preserves-exact-batch', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('phpFunctionInvocations: input.phpFunctionInvocations')],
  ['scanner-consumer-migration-gap-is-traced', scanner.includes("kind: 'php_function_call_evidence'") && scanner.includes('function: functionName(name)')],
  ['laravel-integrated-response-callsite-needs-judgment-batch', read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts').includes('invocationSemanticIntegratedResponseComposition.integrate({ knowledge: semanticKnowledgeDataFlow })')],
  ['no-foundation-or-relations-added-to-call-authority', !callAuthority.includes('semantic/foundation') && !callAuthority.includes('semantic/relations')],
];

for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'PENDING'} ${name}\n`);
}
const passed = checks.filter(([, result]) => result).length;
const pending = checks.length - passed;
process.stdout.write(`SUMMARY ${passed}/${checks.length} checks satisfied; ${pending} pending\n`);
process.exitCode = pending === 0 ? 0 : 2;
