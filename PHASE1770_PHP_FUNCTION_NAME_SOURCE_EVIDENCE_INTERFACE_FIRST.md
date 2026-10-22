# Phase 1770 — PHP Function Name Source Evidence (Interface First)

## Trace

Phase 1769 identified that the active scanner AST still represents a function-call name as one `AstIdentifier`, while upstream name resolution expects a classified syntax kind and a canonical qualified-name wrapper. This loses the original segment boundaries and leading namespace separator before name-resolution rules can consume source evidence.

The legacy `phpFunctionCallSemanticAuthority` still classifies raw names against the builtin catalog. That remains a migration blocker and is not represented as fixed here.

## Interface-first correction

`packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts` now models lexical function-name evidence as a closed ADT:

- `unqualified_function_name_evidence` contains one typed identifier segment;
- `qualified_function_name_evidence` contains a non-empty sequence of segments;
- `fully_qualified_function_name_evidence` preserves the leading-global qualification distinction;
- `malformed_function_name_evidence` preserves invalid syntax as an explicit source judgment.

`PhpFunctionNameResolutionInput` now requires `syntaxEvidence: PhpFunctionNameSyntaxEvidence`. The resolver contract no longer pretends that a canonical `PhpQualifiedFunctionName` is source syntax. Canonical qualified identity belongs to a resolution result, after namespace/import rules have been applied.

## Why this model

PHP's official namespace rules distinguish unqualified, qualified, and fully-qualified names. Unqualified function names in a namespace may first resolve within that namespace and then fall back to the global function. PHP-Parser's NameResolver documentation likewise notes that unqualified function names remain unresolved by static name resolution because runtime rules can determine the target.

References:
- PHP Manual, name resolution rules: https://www.php.net/manual/en/language.namespaces.rules.php
- PHP Manual, fallback to global space: https://www.php.net/manual/en/language.namespaces.fallback.php
- PHP-Parser, NameResolver: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown

## Remaining blockers

- `packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts` still represents `function_call.functionName` as one `AstIdentifier`.
- `phpExpressionStructureProjector.ts` still projects only `structure.callee[0]` into that identifier.
- `resourceUpstreamExpressionCanonical.ts` still invokes `phpFunctionCallSemanticAuthority` with the raw short name.
- No implementation of `PhpFunctionNameResolutionAuthorityInterface` is connected to the frontend.
- Invocation integrated response remains on its existing canonical publication-result path and was not modified by this phase.

## Next step

Evolve the scanner AST producer contract to preserve name segments and qualification evidence, then connect the producer to the upstream resolution interface. Only after the source model supplies namespace/import/declaration evidence should name-resolution authority implementation and Laravel scanner wiring be migrated. The resource subscanner must be retired only after all consumers have moved.

## Validation

The phase audit checks the interface shape and explicitly records the legacy scanner classifier as still active. This is static structural validation only; no typecheck, Vitest, or full build is claimed.
