# Phase 1794 — Proof-Carrying PHP Name-Resolution Judgment

## Objective

Elevate PHP name resolution from a result-only union into a proof-carrying semantic judgment. The authority must publish not only whether a function name resolved, remained ambiguous, was deferred to PHP runtime fallback, or was blocked, but also a closed typed derivation explaining which source evidence and resolution path produced that result.

## Model changes

- Evolved `PHP_FUNCTION_NAME_RESOLUTION_CONTRACT` from version 7 to version 8.
- Added `PhpFunctionNameResolutionPath` to preserve the lexical route from source spelling to canonical identity.
- Added the closed `PhpFunctionNameResolutionDerivation` algebra for fully-qualified names, function aliases, namespace-prefix imports, current-namespace projection, global-scope names, selected declarations, conflicting imports/declarations, runtime fallback, and evidence blockers.
- Required every `PhpFunctionNameResolutionJudgment` variant to carry a derivation appropriate to its outcome.
- Preserved the path that produced a declared-function candidate, so an import or namespace projection is not erased merely because a declaration was found.
- Updated the existing name-resolution authority to publish derivations. The authority remains the sole owner of name lookup; invocation judgment consumes its result.

## Scanner and integrated response trace

The Laravel scanner still forwards the injected `PhpFunctionInvocationSemanticIntegrationState`. The existing integrated-response slot `phpFunctionInvocations` remains unchanged. The pending state is intentionally retained because whole-file parser inventory is not yet connected to the authority chain. No new response layer or `semantic/foundation` / `semantic/relations` dependency was introduced.

## Validation

`audit-phase1794-php-name-resolution-proof-carrying-judgment.cjs` checks the closed derivation algebra, outcome/derivation correspondence, path preservation, and unchanged scanner/integrated-response ownership. The Phase 1794 audit passes 23/23 checks. Combined current-state audits for Phases 1788–1794 pass 117/117 checks. Static audits do not substitute for TypeScript compilation or end-to-end parser integration; neither full build nor typecheck was run in this environment.

## External references

- PHP Manual, Namespace FAQ: https://www.php.net/manual/en/language.namespaces.faq.php
- PHP Language Specification, Namespaces: https://phplang.org/spec/18-namespaces.html
- TypeScript Handbook, Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
