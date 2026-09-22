# Phase 31 — Cross-Boundary Interface Trace

## Scope
Cross-boundary trace of upstream interfaces and their consumers. This phase intentionally does not repair downstream implementation.

## Trace rule
A consumer branch is an interface defect when it exists to reconstruct semantic meaning from multiple upstream facts, absence sentinels, raw AST, or string-keyed registries.

## Roots repaired in this flow
1. Response semantic correlation
2. Resource field meaning
3. Request field target
4. Model effective cast
5. Controller return semantic
6. Response result SSOT

## Consumer migration signals observed
- `RouteParameterType` and `RouteParameterLocation` consumers still treat the new closed ADTs as string registry keys. This is a consumer migration root, not a reason to weaken the upstream ADTs.
- Existing response/resource/request/model producers still construct legacy lower-level shapes. These are expected errors after the interface was raised.
- Legacy semantic consumers still use `Map.get()` / `find()` / `undefined` in domain/scanner layers. These remain trace targets; the next question is whether each lookup is a missing interface relationship or a legitimate runtime lookup.

## Upstream anti-pattern scan
`packages/core/src/types/upstream` currently contains no actual:
- `null`
- `undefined`
- `?.`
- `??`
- `if (`
- `any`
- `Record<`

Semantic vocabulary such as `nullable`, `nullsafe_property`, and `when_not_null` remains intentional source meaning.

## Important
Compile errors are accepted as interface migration pressure. Do not restore optional/null/fallback fields merely to make consumers compile.
