# Phase 91 — ecommerce_shop Semantic Boundary Trace

## Trace

Laravel model/resource source
→ scanner descriptors
→ `ParsedColumn.semanticType` + `ParsedColumn.nullability`
→ `ParsedCast.semanticType`
→ `SemanticTypeDeriver`
→ `ObjectType`
→ RouteSync IR

## Finding

`semantic/fieldExtractors.ts` was a legacy porous boundary:
- accepted `unknown`
- cast values to `Record<string, unknown>`
- inspected `resolved.type`
- inferred nullability from strings
- reconstructed expressions from `type`
- returned empty strings as failure states

This bypassed the verified scanner ADT.

## Fix

The legacy extractor API was removed. The only resource-field operation remaining is:
`normalizeResourceFields(ParsedResource) → readonly ResourceFieldDescriptor[]`.

The model derivation path was also carrying a second nullability channel:
`col.nullable`. The canonical source is now `ParsedColumn.nullability`.

A nullable column is transformed once:

`SemanticType → NullableType(SemanticType)`

and `ObjectProperty.nullable` is derived from that semantic value rather than from
the raw column flag.

Accessor nullability is likewise derived from `acc.semanticType`.

## ecommerce_shop examples

- `OrderResource` relation/resource fields keep their collection/reference semantic type.
- nullsafe resource access remains `NullableType(...)`.
- model columns use `ParsedColumn.semanticType` plus `ParsedColumn.nullability`.
- casts use the verified `ParsedCast.semanticType`.

## Next bottleneck

`modelContracts.ts` still permits `ModelBinding.kind = 'unbound'`.
That is legitimate scanner state, but it must never cross into RouteSync IR.
The next trace should verify that unbound models become an explicit scanner error
before semantic lowering, rather than being represented as an incomplete model.
