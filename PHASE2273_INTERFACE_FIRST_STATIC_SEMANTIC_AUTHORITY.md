# Phase 2273 — Interface-First Static Semantic Authority

## Scope

This phase evolves the existing `ResourceSemanticMappingAuthorityInterface`; it does not add a V2 contract or a generic wrapper.

## Changes

- `resolveStaticReceiver` now accepts the upstream `ClassName` value object rather than a raw `string`.
- `resolveStaticAction` now accepts `ClassName` and `MethodName` value objects rather than raw strings.
- The existing upstream algebra preserves and returns the existing closed `StaticReceiver` and `StaticMethodAction` ADTs.
- The scanner's static-call path now adapts lexical names to existing upstream value objects at the boundary and delegates to the existing authority.
- The authority test now exercises the typed contract.

## Why

The contract previously accepted primitive strings even though its result was semantic AST. That weakened the boundary and allowed callers to bypass the upstream name vocabulary. The revised contract uses the existing semantic value objects and existing result ADTs.

## Known remaining work

This is a bounded interface correction, not a claim that all expression projection is now a pure executor. The structural mapping API still accepts `string` prefixes/kinds, the structural and operator projections still use lookup tables, and `phpAstExpressionSemanticAuthority.ts` still decides the special `Attribute::make` action locally. Those must be traced and migrated by evolving their existing upstream owners before removing the remaining `semantic/relations` dependency. Do not introduce `semantic/foundation`, a V2 interface, or a generic wrapper.

## Verification status

- Static call sites and test call sites were updated in the source tree.
- Full build/type-check was not run in this environment; no build success is claimed.
