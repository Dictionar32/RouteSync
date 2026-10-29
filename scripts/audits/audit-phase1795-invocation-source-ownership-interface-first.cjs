const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthority.ts');
const callFacade = read('packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts');
const batch = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['invocation semantic contract has a closed versioned identity', contract.includes("kind: 'php_function_invocation_semantic_contract'") && contract.includes('readonly version: 2;') && contract.includes('version: 2,')],
  ['contract publishes ordered semantic obligations', contract.includes("'consume-completed-name-resolution-judgment'") && contract.includes("'retain-source-provenance-only-through-resolution-judgment'") && contract.includes("'never-repeat-name-resolution-or-construct-downstream-expression'")],
  ['invocation input no longer accepts a duplicate source span', contract.includes('export interface PhpFunctionInvocationSemanticInput') && !contract.slice(contract.indexOf('export interface PhpFunctionInvocationSemanticInput'), contract.indexOf('export interface PhpFunctionInvocationSemanticAuthorityInterface')).includes('readonly source: SourceSpan;')],
  ['invocation authority interface exposes its contract', contract.includes('readonly contract: PhpFunctionInvocationSemanticContract;')],
  ['authority imports the declared invocation contract', authority.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT')],
  ['resolved invocation judgment does not duplicate source provenance', !authority.includes('source: input.resolution.source.source')],
  ['unresolved invocation judgment does not duplicate source provenance', (authority.match(/source: input\.resolution\.source\.source/g) || []).length === 0],
  ['authority publishes the same contract declared upstream', authority.includes('contract: PHP_FUNCTION_INVOCATION_SEMANTIC_CONTRACT')],
  ['invocation authority still maps only the resolution discriminant', authority.includes('switch (resolution.kind)') && authority.includes("case 'function_name_resolved':")],
  ['invocation authority does not perform name lookup', !authority.includes('builtinNames') && !authority.includes('normalized(') && !authority.includes('scopeImports(')],
  ['compatibility facade delegates to canonical invocation authority', callFacade.includes('phpFunctionInvocationSemanticAuthority.derive(input)')],
  ['batch closure continues validating source correspondence', !batch.includes('judgment-source-mismatch') && !batch.includes('judgment.source') && contract.includes('require-resolution-provenance-to-match-source-evidence-without-duplicated-judgment-span')],
  ['integrated response keeps the existing PHP invocation state slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['Laravel scanner forwards injected integration state without choosing pending state', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['composition root retains pending until actual inventory is connected', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['contract change adds no semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(contract + authority)],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length > 0) process.exitCode = 1;
