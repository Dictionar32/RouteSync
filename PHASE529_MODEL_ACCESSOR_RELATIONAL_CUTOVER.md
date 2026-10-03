# Phase 529 — Model Accessor Relational Cutover

`modelAccessorExpressionMapper.ts` is now relation-driven at the semantic boundary.

## Changes

- Binary and unary operator meaning is selected from explicit relation catalogs.
- Literal classification uses semantic type relations and does not encode host-language null branching.
- Attribute getter discovery uses a candidate relation and `RelationOption` witness.
- Closure return discovery uses recursive relation lookup.
- AST argument/arm/condition traversal uses `relationProject` instead of collection callbacks with implicit iteration semantics.
- Existing `matchPhpAstValue` remains only as syntax-evidence dispatch; semantic meaning is selected by relation catalogs and recursive projection.

## Verification

- Phase 529 forbidden surface: all zero.
- `transpileModule` diagnostics: zero.
- Phase 525 inactive-file audit remains clean.
