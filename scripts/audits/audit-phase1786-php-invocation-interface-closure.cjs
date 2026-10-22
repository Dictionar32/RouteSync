const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const resolutionInterface = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const resolutionAuthority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const invocationInterface = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const callInterface = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts');
const closureAuthority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scannerBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const mapper = read('packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');

check('resolution contract has explicit PHP namespace and fallback rules', resolutionInterface.includes('defer-unqualified-namespaced-name-to-php-runtime-fallback') && resolutionInterface.includes('never-infer-function-target-from-short-name-alone'));
check('production name-resolution authority implements the declared interface', resolutionAuthority.includes('PhpFunctionNameResolutionAuthorityInterface') && resolutionAuthority.includes('PHP_FUNCTION_NAME_RESOLUTION_CONTRACT'));
check('resolver execution covers conflicting declarations and aliases', resolutionAuthority.includes('conflicting-declarations') && resolutionAuthority.includes('conflicting-imports'));
check('function-call interface consumes the closed invocation input, not raw FunctionName', callInterface.includes('PhpFunctionInvocationSemanticInput') && !callInterface.includes('readonly function: FunctionName'));
check('name-resolution authority does not depend on semantic relations/foundation', !/semantic\/(relations|foundation)/.test(resolutionAuthority) && !/\bnew (Map|Set)\b|\bas\b/.test(resolutionAuthority));
check('PHP builtin target type excludes Laravel helper classifications', resolutionInterface.includes("'collect' | 'config' | 'now' | 'response' | 'redirect' | 'abort' | 'asset' | 'app' | 'env' | 'route'"));
check('batch closure authority implements all source/entry checks', closureAuthority.includes('missing-invocation-judgment') && closureAuthority.includes('orphan-invocation-judgment') && closureAuthority.includes('judgment-arguments-mismatch'));
check('batch closure authority does not depend on semantic relations/foundation', !/semantic\/(relations|foundation)/.test(closureAuthority));
check('integration pending state is explicit and non-empty', invocationInterface.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING') && invocationInterface.includes('php-namespace-import-environment-not-inventoried-by-scanner'));
check('integrated response carries a typed integration state', pipelineInterface.includes('PhpFunctionInvocationSemanticIntegrationState') && pipeline.includes('phpFunctionInvocations: input.phpFunctionInvocations'));
const resolutionContractValue = resolutionInterface.slice(resolutionInterface.indexOf('export const PHP_FUNCTION_NAME_RESOLUTION_CONTRACT'));
check('resolution contract order matches authority branch precedence', resolutionContractValue.indexOf('resolve-unqualified-function-import-before-namespace-fallback') < resolutionContractValue.indexOf('resolve-qualified-name-through-import-prefix-or-current-namespace'));
check('Laravel controller scanner receives a typed integration state instead of choosing its own fallback', scanner.includes('PhpFunctionInvocationSemanticIntegrationState') && scanner.includes('phpFunctionInvocations });'));
check('production composition root explicitly supplies the pending integration state until inventory is wired', scannerBinding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING') && scannerBinding.includes('createControllerDataflowAnalyzer('));
check('resource mapper preserves full lexical callee spelling without short-name classification', mapper.includes('nameEvidence.tokens.map(token => token.value).join(\'\')') && !mapper.includes('phpFunctionCallSemanticAuthority.derive'));
check('upstream index exports both production authorities', upstreamIndex.includes("phpFunctionNameResolutionAuthority") && upstreamIndex.includes("phpFunctionInvocationSemanticJudgmentBatchClosureAuthority"));

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`RESULT ${checks.filter(item => item.passed).length}/${checks.length}\n`);
if (checks.some(item => !item.passed)) process.exitCode = 1;
