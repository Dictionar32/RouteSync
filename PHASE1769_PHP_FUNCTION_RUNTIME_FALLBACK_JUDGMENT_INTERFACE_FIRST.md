# Phase 1769 — PHP Function Runtime-Fallback Judgment (Interface First)

## Trace

`PhpFunctionNameResolutionJudgment` previously had only resolved, ambiguous, and unresolved variants. Its `resolved_external_function` target allowed `global-function-fallback` as a basis, which treated a PHP namespace fallback as if the target had already been statically identified. The source AST function-call node currently carries only `functionName: AstIdentifier` and arguments; it does not carry complete namespace/import/declaration evidence. The active Laravel resource mapper still invokes `phpFunctionCallSemanticAuthority` with a raw `FunctionName`, and that authority classifies by a list of names.

## Interface change

- Add `function_name_deferred` with the closed reason `namespace-function-or-global-fallback`.
- Remove `global-function-fallback` from the bases permitted for a resolved external target.
- Include the deferred name-resolution judgment in the unresolved invocation judgment, so the invocation authority preserves uncertainty rather than converting it to a `call` expression.
- Do not wire the resolver into Laravel scanner until the parser/source model supplies the required evidence.

## Why

PHP's official namespace documentation and PHP-Parser's NameResolver documentation distinguish namespaced unqualified function calls from fully-qualified names. In particular, PHP-Parser documents that unqualified function names remain unresolved by its NameResolver because they may require runtime resolution. A closed semantic judgment should represent this distinction explicitly.

## Remaining blockers

- No implementation of `PhpFunctionNameResolutionAuthorityInterface` is currently connected to the source frontend.
- `PhpAstValue.function_call` carries only an `AstIdentifier`, not syntax qualification plus lexical scope/import evidence.
- `phpFunctionCallSemanticAuthority` still maps raw names to builtin constructors, and the resource subscanner remains referenced by 13 files.

These are not claimed as completed in this phase. The next interface-first step is to evolve the source AST evidence contract and its parser producers, then implement name resolution and migrate all consumers before retiring the subscanner.

## Validation

The phase audit checks the new judgment shape and explicitly confirms the remaining legacy classifier/wiring. This is a static structural audit only; no TypeScript typecheck, Vitest, or full build is claimed.
