# Interface Trace Audit — Phase 56

## Target
Raise `ResourceFieldDescriptor.semanticType` from a compressed `PrimitiveKind` value to the existing first-class `SemanticType` ADT.

## Problem traced
The resource field domain interface previously declared:

```ts
semanticType: PrimitiveKind
```

That forced every resource field to look like a primitive even when the upstream semantic model already had richer forms such as `ReferenceType`, `NullableType`, collections, unions, or object types. Downstream code therefore had to reconstruct semantic meaning.

This was a model-height violation:

```text
PHP AST / bound expression
        ↓
ResourceFieldDescriptor
        ↓
PrimitiveKind              ← semantic compression
        ↓
resourceTypeDeriver        ← reconstruction
        ↓
SemanticType
```

## Phase 56 correction
The canonical interface now carries:

```text
ResourceFieldDescriptor.semanticType: SemanticType
```

The scanner descriptor is the origin-boundary adapter. Legacy `PrimitiveKind` callers are normalized exactly once:

```text
PrimitiveKind.NUMBER
        ↓ origin boundary
new PrimitiveType(PrimitiveKind.NUMBER)
        ↓
ResourceFieldDescriptor.semanticType
```

Rich values pass through unchanged:

```text
ReferenceType
NullableType
CollectionType
UnionType
ObjectType
        ↓
ResourceFieldDescriptor
        ↓
downstream
```

## Downstream correction
`resourceTypeDeriver` no longer converts `field.semanticType` back through `resolvePrimitiveKind()`.

It consumes the semantic type already carried by the descriptor:

```text
field.semanticType
      ↓
propType
      ↓
ObjectProperty
```

This removes one semantic reconstruction boundary.

## Important remaining issue
`resourceAstExpressionMapper.ts` still contains name-based heuristics such as `_id`, `_count`, `is_`, and `has_` to infer primitive types from property names. That is still lower-model behavior.

The correct future flow is:

```text
Laravel model/property declaration
        ↓
property symbol / declared type
        ↓
resolved SemanticType
        ↓
resource expression binder
        ↓
ResourceFieldDescriptor
```

The mapper should eventually receive resolved property semantics instead of guessing from identifier spelling.

## Verification
A regression test was added for:

1. Primitive input normalization at the origin boundary.
2. `ReferenceType` preservation.
3. `NullableType` preservation.

Full build/test execution was not performed because the supplied source snapshot does not contain `node_modules`.
