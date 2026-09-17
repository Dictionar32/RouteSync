# Phase 90 — ecommerce_shop Resource Semantic Origin Trace

## Ground truth

The `ecommerce_shop` Laravel resources contain:
- direct model property access (`$this->id`, `$this->nama`)
- nullsafe relation access (`$this->category?->nama`, `$this->frontend?->gambar`)
- nested resource collections (`OrderDetailResource::collection(...)`)
- nested object fields
- ternary expressions
- null coalescing fallbacks
- computed arithmetic fields
- `whenLoaded(...)`
- dynamic array inspection in `PaymentResource`

## Finding

`resourceAstExpressionMapper.ts` was constructing `PrimitiveType(UNKNOWN)` for
property access and method calls before model/resource binding.

That made `UNKNOWN` look like an upstream semantic decision even though no symbol
had resolved the property yet.

## Fix

The mapper no longer invents semantic meaning for unresolved property/method syntax.
It returns a closed `MappedResourceExpression` state:
- `semantic`: semantic type is already established
- `syntax_only`: expression exists but semantic binding is still required

Inline response handling converts `syntax_only` to an explicit `ErrorType`, not a
fake primitive/string type.

## Required flow

Laravel AST
→ expression syntax
→ verified model/resource binding
→ SemanticType
→ ResourceFieldDescriptor
→ IR

No `UNKNOWN` semantic type is fabricated merely because the AST node was not yet bound.

## Important remaining boundary

`ecommerce_shop` has computed fields such as:
`$this->qty * $this->harga`,
`$path ? ... : null`, and `is_array(...)`.

These require explicit semantic expression ADTs and a bound expression resolver.
They must not be handled by name inference or primitive fallback.

## Next target

Trace computed expressions and null-coalescing expressions into the semantic
expression ADT, then make their result type a product of operand semantic types.
