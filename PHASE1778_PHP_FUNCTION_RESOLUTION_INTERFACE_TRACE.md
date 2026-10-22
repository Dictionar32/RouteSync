# Phase 1778 — PHP Function Resolution Interface Closure

## Scope

Interface-first only. This phase evolves the existing `PhpFunctionNameResolutionAuthorityInterface` contract in place. It does not add a parallel authority, does not wire scanner runtime, and does not claim end-to-end invocation integration.

## Trace findings

1. `phpFunctionNameResolutionInterface.ts` defines syntax evidence, environment completeness, target variants, deferred namespace/global fallback, and an ordered resolution contract.
2. The contract's rule order previously put namespace fallback deferral before the explicit unqualified function-import lookup rule. That ordering contradicted the contract's own alias precedence.
3. The contract did not explicitly encode PHP's case-insensitive function identity comparison while retaining source spelling as evidence.
4. `PhpFunctionNameResolutionAuthorityInterface` still has no production implementation in the traced upstream path. The interface contract alone therefore does not prove behavior.
5. `InvocationSemanticIntegratedResponseCompositionResult` is produced by `invocationSemanticIntegratedResponseComposition` from `SemanticKnowledgeDataFlow`. The PHP-AST-specific `PhpFunctionInvocationSemanticJudgment` is not currently an input to that composition. These are distinct invocation models and are not yet joined end-to-end.
6. The older `phpFunctionCallSemanticAuthority.ts` still classifies raw function names and imports `semantic/relations`. The wider Laravel scanner still contains many relation imports. Neither `semantic/relations` nor `semantic/foundation` can be deleted safely from this phase's evidence.

## Interface changes

- Evolved `PhpFunctionNameResolutionContract` from version 1 to version 2.
- Moved the explicit unqualified function-import rule before namespace declaration matching and runtime fallback deferral.
- Added an explicit case-insensitive function identity rule while preserving original source spelling as evidence.
- Added contract invariants for unqualified import precedence and closed resolution judgment outcomes.
- Kept the interface free of imports from `semantic/relations` and `semantic/foundation`.
- Did not add another authority interface or move runtime code to another file.

## Semantics references

- PHP namespace FAQ documents fully-qualified names, qualified alias-prefix handling, and unqualified function lookup in current namespace before global fallback.
- PHP-Parser documents that unqualified function names remain unresolved by its `NameResolver` because runtime determines the target.

References:
- https://www.php.net/manual/en/language.namespaces.faq.php
- https://www.php.net/manual/en/language.namespaces.fallback.php
- https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown

## Next required work

1. Implement a production resolution authority against this contract, with behavior tests for fully-qualified names, function imports, qualified alias prefixes, case variants, declared namespace functions, and deferred runtime fallback.
2. Change the old function-call authority to consume canonical resolution judgments rather than raw short names; remove its `semantic/relations` dependency as part of that migration, not by moving it.
3. Integrate PHP-AST invocation judgments into the existing integrated-response contract, preserving source identity and explicit unavailable/rejected outcomes rather than pretending the current `SemanticKnowledgeDataFlow` response already contains them.
4. Migrate every scanner consumer, then remove legacy subscanners and finally delete `semantic/relations` / `semantic/foundation` only after zero-reference audits.

## Verification

- `node scripts/audits/audit-phase1778-php-resolution-interface-closure.cjs`: 12/12 static checks passed.
- Full TypeScript typecheck, runtime tests, and build were not run.
