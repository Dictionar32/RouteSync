const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['name-resolution contract interface and value advance together to version 8', contract.includes('readonly version: 8;') && contract.includes('version: 8,')],
  ['proof-carrying derivation is a closed tagged union', contract.includes('export type PhpFunctionNameResolutionDerivation =') && contract.includes("kind: 'resolution_blocked_by_evidence'") && contract.includes("kind: 'runtime_fallback_candidates_preserved'")],
  ['derivation preserves fully-qualified source identity', contract.includes("kind: 'fully_qualified_name_preserved'") && contract.includes('canonicalName: PhpQualifiedFunctionName')],
  ['derivation preserves function-import alias evidence', contract.includes("kind: 'function_import_alias_applied'") && contract.includes('binding: PhpFunctionImportBinding')],
  ['derivation preserves namespace-prefix import evidence', contract.includes("kind: 'namespace_prefix_import_applied'") && contract.includes('binding: PhpNamespaceImportBinding')],
  ['declaration selection retains the derivation path that produced its candidate', contract.includes("kind: 'declared_function_selected';\n      readonly declaration: PhpDeclaredFunctionSymbol;\n      readonly path: PhpFunctionNameResolutionPath")],
  ['conflicting declarations retain their source-resolution path', contract.includes("kind: 'conflicting_declarations_preserved';\n      readonly candidates:") && contract.includes('readonly path: PhpFunctionNameResolutionPath')],
  ['resolved judgments require a derivation', contract.includes("kind: 'function_name_resolved';\n      readonly source: PhpFunctionNameResolutionInput;\n      readonly target: PhpFunctionResolutionTarget;\n      readonly derivation:")],
  ['ambiguous judgments require a candidate-preserving derivation', contract.includes("kind: 'function_name_ambiguous';\n      readonly source: PhpFunctionNameResolutionInput;") && contract.includes('readonly derivation: Extract<PhpFunctionNameResolutionDerivation, { readonly kind: \'conflicting_imports_preserved\' | \'conflicting_declarations_preserved\' }>')],
  ['unresolved judgments require a typed evidence blocker', contract.includes("kind: 'function_name_unresolved';\n      readonly source: PhpFunctionNameResolutionInput;") && contract.includes("kind: 'resolution_blocked_by_evidence'")],
  ['deferred judgments preserve both runtime fallback candidates in their derivation', contract.includes("kind: 'function_name_deferred';") && contract.includes("kind: 'runtime_fallback_candidates_preserved'")],
  ['contract makes proof publication an ordered semantic obligation', contract.includes("'publish-proof-carrying-resolution-derivation'") && contract.includes('derivationClosure:')],
  ['authority maps canonicalization routes into a typed resolution path', authority.includes('const resolutionPath =') && authority.includes('PhpFunctionNameResolutionPath')],
  ['authority attaches derivation to resolved judgments', authority.includes('source: input, target, derivation')],
  ['authority attaches derivation to unresolved judgments', authority.includes("derivation: Object.freeze({ kind: 'resolution_blocked_by_evidence', reason })")],
  ['authority preserves function-import conflict evidence', authority.includes("importKind: 'function-import', candidates")],
  ['authority preserves namespace-prefix conflict evidence', authority.includes("importKind: 'namespace-prefix-import', candidates")],
  ['authority retains both namespaced and global fallback candidates', authority.includes("kind: 'runtime_fallback_candidates_preserved'")],
  ['invocation judgment consumes the proof-carrying resolution without repeating lookup', invocation.includes('readonly resolution: PhpFunctionNameResolutionJudgment') && invocation.includes('readonly derive:') && invocation.includes('separately constructible Expression')],
  ['integrated response keeps the existing PHP invocation state slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['Laravel scanner forwards the injected integration state without selecting fallback', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['composition root keeps integration pending until real source inventory is connected', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['name-resolution authority adds no semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(authority)],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length > 0) process.exitCode = 1;
