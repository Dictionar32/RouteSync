# Phase 1779 — PHP Invocation Semantic Judgment / Integrated Response Trace

## Scope

Trace `packages/core/src/types/upstream` first, then the Laravel scanner call path. This phase records the exact interface boundary defects before changing the public contract or deleting any scanner/subscanner that still has consumers.

## Findings

1. `phpFunctionNameResolutionInterface.ts` defines a rich source-evidence model and `PhpFunctionNameResolutionAuthorityInterface`, but the production tree has no implementation/export of that authority. The contract therefore describes a resolution capability that the scanner cannot currently invoke.
2. `phpFunctionInvocationSemanticAuthorityInterface.ts` already defines a closed invocation judgment over the completed resolution judgment. `phpFunctionInvocationSemanticAuthority.ts` correctly forwards that judgment without name lookup or AST construction.
3. `phpFunctionCallSemanticAuthorityInterface.ts` still accepts `FunctionName` alone. This contradicts the stronger resolution contract's `never-infer-function-target-from-short-name-alone` rule.
4. `phpFunctionCallSemanticAuthority.ts` classifies from `input.function.value.value` and imports `semantic/relations`. Its catalog also mixes PHP built-ins with Laravel helpers (`collect`, `config`, `response`, `redirect`, `abort`, `route`, `app`, `env`, path helpers, and others). This is not a canonical PHP function identity judgment.
5. `resourceUpstreamExpressionCanonical.ts::mapFunctionCall` is the production consumer that passes the short `functionName` directly to `phpFunctionCallSemanticAuthority`. The parser AST already carries `functionNameEvidence`, but this consumer currently ignores it.
6. `invocationSemanticIntegratedResponseComposition` integrates `SemanticKnowledgeDataFlow` through the generic invocation pipeline and publication authority. `controllerDataflowAnalyzer.ts` forwards that result. This response does not currently contain or validate `PhpFunctionInvocationSemanticJudgment`; treating it as integrated would overstate coverage.
7. The subscanner has consumers and must not be deleted in this phase. Retirement is valid only after its expression mapping consumers have been migrated and audited.

## Interface-first migration order

1. Evolve the existing PHP function-call boundary so it consumes canonical name-resolution judgment, not a raw `FunctionName`.
2. Implement the already-declared `PhpFunctionNameResolutionAuthorityInterface` in the upstream owner, driven by `PhpFunctionNameSyntaxEvidence` plus a complete/incomplete environment judgment. Do not invent an empty environment when the scanner lacks namespace/import/declaration inventory.
3. Preserve the existing `PhpFunctionInvocationSemanticJudgment` as the closed result. Make unresolved, ambiguous, and deferred resolution explicit rather than turning them into a guessed builtin or ordinary call.
4. Evolve the existing integrated-response composition contract so PHP invocation judgments can be carried and correlated as an explicitly typed domain component; do not create a second unrelated “integrated response” wrapper or claim generic knowledge-flow coverage proves PHP-call coverage.
5. Only then wire the Laravel scanner. Use `functionNameEvidence` to preserve callee syntax and supply actual source/environment facts. Runtime scanner code should forward the authority result.
6. Retire the subscanner only after all callers have moved and a consumer audit proves no imports remain.

## External semantic basis

PHP's official manual specifies that unqualified function names in namespaces are resolved against the current namespace before global fallback; fully-qualified names retain global/canonical identity. Thus a short-name catalog lookup is insufficient to establish builtin identity. The bundled PHP-Parser `NameResolver` documentation also notes that unqualified function names can remain unresolved because runtime fallback affects the final target.

## Verification boundary

This phase is a trace/report artifact, not a claim that the production semantic migration is complete. No full build or typecheck is claimed. The next implementation phase must make the interface contract change and then migrate all consumers in one coherent cutover.
