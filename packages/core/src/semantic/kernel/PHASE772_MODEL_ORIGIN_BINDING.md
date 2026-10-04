# Phase 772 — Model Origin Binding as Upstream Semantic Boundary

## Diagnostic frontier

The build frontier moved from capability middleware to the model symbol layer:

- `Sequence<ModelSemanticProperty>` was incorrectly passed into array-oriented relation APIs.
- `Lookup<ModelSemanticProperty>` was incorrectly treated as `RelationOption<ModelSemanticProperty>`.
- `ModelSemanticProperty` variants were flattened through an unsafe cast.
- relation/accessor/column semantic types were not lowered explicitly from upstream `TypeExpression` to compiler `SemanticType`.
- the model symbol table accessed `ModelTable` and `Lookup` variants without closed-ADT elimination.

## Canonical model

`ModelSemanticProperty` is the upstream closed property algebra:

- `column`
- `accessor`
- `relation`

`OriginModelSymbol` consumes the upstream `Sequence<ModelSemanticProperty>` and exposes `Lookup` judgments. Variant resolution uses `relationVariantFold`; it does not create a parallel property descriptor algebra.

The only conversion at the compiler boundary is the semantic type lowering:

`TypeExpression -> SemanticType`

using `typeExpressionToSemanticType`.

## Model table

`ModelSymbolTable` now eliminates `ModelTable` and `Lookup` through closed relational visitors. It no longer reads `.value` from an unproven variant and does not use host `.map()`.

## Legacy cleanup

The phase-87 test constructed the former class-shaped `OriginModelSymbol` API and no longer represented the active interface. The obsolete test reservoir is empty rather than preserving a stale constructor/descriptor model.

## Architectural consequence

The model flow is now:

Laravel model evidence
→ `ModelAst`
→ upstream `ModelSemanticProperty` algebra
→ relation-backed `OriginModelSymbol`
→ closed `ResolvedPropertyBinding`
→ compiler semantic type lowering
→ resource binding / analysis

No `ParsedModelPropertyDescriptor`, `CanonicalModelPropertyDescriptor`, or duplicate model-property authority is introduced.
