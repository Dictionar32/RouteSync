const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthority.ts');
const batch = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['invocation judgment has only resolution-owned provenance', !contract.slice(contract.indexOf('export type PhpFunctionInvocationSemanticJudgment ='), contract.indexOf('/**\n * Invocation judgment contract')).includes('readonly source: SourceSpan;')],
  ['invocation semantic contract is version 2', contract.includes('readonly version: 2;') && contract.includes('version: 2,')],
  ['contract requires provenance only through resolution judgment', contract.includes("'retain-source-provenance-only-through-resolution-judgment'")],
  ['contract explicitly declares provenance normalization', contract.includes("provenanceNormalization: 'resolution-judgment-is-the-single-source-of-truth-for-invocation-source-provenance'")],
  ['source ownership declaration matches runtime contract value', contract.includes("readonly sourceOwnership: 'invocation-source-is-reachable-only-through-the-embedded-name-resolution-judgment-without-a-copied-span'") && contract.includes("sourceOwnership: 'invocation-source-is-reachable-only-through-the-embedded-name-resolution-judgment-without-a-copied-span'")],
  ['invocation authority does not copy source span into judgment', !authority.includes('source: input.resolution.source.source')],
  ['authority still preserves resolved versus unresolved judgment variants', authority.includes("case 'function_name_resolved':") && authority.includes("case 'function_name_deferred':")],
  ['batch contract advanced to version 5 for source-resolution totality', contract.includes('readonly version: 5;') && contract.includes('version: 5,') && contract.includes('resolutionTotality:')],
  ['batch contract closes source provenance through resolution input', contract.includes("'require-resolution-provenance-to-match-source-evidence-without-duplicated-judgment-span'")],
  ['batch closure no longer compares a duplicated judgment source span', !batch.includes('judgment.source') && !batch.includes('sameJudgmentSource')],
  ['batch closure binds judgment to the exact resolution input object', batch.includes('entry.judgment.resolution.source === entry.evidence.resolutionInput')],
  ['batch closure preserves exact argument evidence correlation', batch.includes('entry.judgment.arguments !== entry.evidence.arguments')],
  ['validated batch still requires a total correspondence receipt', contract.includes('inventory-and-judgments-form-a-total-bijection-with-identical-source-and-argument-evidence')],
  ['integrated response keeps existing phpFunctionInvocations slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['Laravel scanner forwards injected state without semantic reclassification', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['composition root keeps explicit pending while parser inventory is unavailable', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['upstream contract introduces no semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(contract + authority + batch)],
  ['source inventory and name-resolution interfaces remain the existing owners', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionResolutionSourceInventoryAuthority.ts')) && fs.existsSync(path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts'))],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length > 0) process.exitCode = 1;
