const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipelineRuntime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts');

const checks = [
  ['resolution-contract-version-4', resolution.includes('readonly version: 4') && resolution.includes('version: 4,')],
  ['resolution-binds-syntax-evidence-to-source-file', resolution.includes("'require-resolution-source-matches-name-syntax-evidence'") && resolution.includes('readonly syntaxEvidenceBinding:')],
  ['resolution-binds-completeness-span-to-environment-file', resolution.includes("'require-completeness-witness-span-matches-environment-source-file'") && resolution.includes('readonly completenessWitnessBinding:')],
  ['resolution-rule-union-and-ordered-contract-agree-on-import-precedence', resolution.indexOf("'resolve-unqualified-function-import-before-namespace-fallback'") < resolution.indexOf("'prefer-known-namespaced-declaration'") && resolution.indexOf("'prefer-known-namespaced-declaration'") < resolution.indexOf("'defer-unqualified-namespaced-name-to-php-runtime-fallback'")],
  ['batch-entry-has-named-upstream-contract', invocation.includes('export interface PhpFunctionInvocationSemanticJudgmentBatchEntry') && invocation.includes('readonly entries: readonly PhpFunctionInvocationSemanticJudgmentBatchEntry[]')],
  ['closed-invocation-batch-retained-in-integrated-response', pipelineInterface.includes('readonly phpFunctionInvocations: PhpFunctionInvocationSemanticJudgmentBatch')],
  ['no-new-semantic-foundation-or-relations-in-call-authority', !read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts').includes('semantic/foundation') && !read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts').includes('semantic/relations')],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} interface checks passed\n`);

const blockers = [
  ['production-name-resolution-authority-missing', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts'))],
  ['integrated-composition-runtime-not-constructing-aggregate', !pipelineRuntime.includes('publication: dependencies.publicationAuthority.publish({ inventory, analysis })')],
  ['laravel-scanner-does-not-supply-php-invocation-batch', scanner.includes('integrate({ knowledge: semanticKnowledgeDataFlow })')],
  ['resource-scanner-still-uses-legacy-call-input', resourceScanner.includes("kind: 'php_function_call_evidence'") && resourceScanner.includes('function: functionName(name)')],
];
for (const [name, pending] of blockers) process.stdout.write(`${pending ? 'PENDING' : 'REVIEW'} ${name}\n`);
process.exitCode = passed === checks.length ? 0 : 1;
