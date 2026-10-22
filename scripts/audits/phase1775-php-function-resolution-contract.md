# Phase 1775 — PHP Function Resolution Contract (Interface First)

## Trace result

The existing `PhpFunctionNameResolutionAuthorityInterface` already described a `resolve` operation, but it did not expose an authoritative rule contract. Its deferred judgment also recorded only a generic fallback reason, losing the two competing runtime lookup identities.

## Interface changes

- Evolved `PhpFunctionNameResolutionAuthorityInterface` in place; no parallel authority interface was introduced.
- Added `PhpFunctionNameResolutionContract` and `PHP_FUNCTION_NAME_RESOLUTION_CONTRACT` with explicit ordered rules for malformed evidence, environment completeness, fully-qualified identity, import aliases, qualified names, known declarations, runtime fallback, and global scope.
- Extended `function_name_deferred` to preserve both `namespaceCandidate` and `globalFallbackCandidate`. These are alternatives, not claims that either function exists.
- Declared the downstream ownership boundary: invocation judgment consumes resolution; AST projection must not repeat name resolution.

## Semantic basis

PHP's official namespace rules say fully-qualified names resolve to the literal name (without the leading separator), while unqualified function names inside a namespace first try the current namespace and then fall back to the global function. The PHP-Parser `NameResolver` documentation likewise explains that unqualified function names remain unresolved statically because they are resolved at runtime.

References:
- https://www.php.net/manual/en/language.namespaces.rules.php
- https://www.php.net/manual/en/language.namespaces.fallback.php
- https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown

## Boundary and remaining work

This phase deliberately changes the existing upstream contract only. It does not claim that a production resolver implementation or Laravel scanner wiring now exists: the trace found no `phpFunctionNameResolutionAuthority` implementation or consumer. Next phase should implement the authority against this contract, add behavior tests for aliases/qualified names/fallback, and only then wire the invocation judgment into the scanner's integrated response. Do not remove legacy subscanners until all consumers are migrated.

## Verification

Run `node scripts/audits/audit-phase1775-php-function-resolution-contract.cjs`. This is a static contract audit; it does not replace TypeScript typechecking or runtime tests.
