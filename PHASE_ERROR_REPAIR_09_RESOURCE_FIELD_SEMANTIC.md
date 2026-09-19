# Phase Error Repair 09 — ResourceField Semantic Boundary

## Status
Completed and targeted-verified.

## Root cause
`ResourceFieldDescriptor` canonical contract stores semantic information under one boundary:

```text
ResourceFieldDescriptor
  └── semantic: ResourceFieldSemantic
        ├── verified → type + bound
        └── rejected → bound_unsupported
```

Several consumers still treated the descriptor as the previous flat model and accessed:

- `field.semanticType`
- `field.boundAst`

This was a consumer/interface-generation mismatch, not a reason to add duplicate fields back to `ResourceFieldDescriptor`.

## Repair
Updated the active compiler consumers to use the canonical boundary:

```text
field.semantic.type
field.semantic.bound
```

Affected flow includes:

- `SemanticTypeResolver`
- resource composite binders
- response-property processing
- resource type derivation
- response derivation
- domain response descriptor emission

Rejected semantic fields are handled explicitly as the `rejected` ADT variant rather than by optional chaining or fallback values.

`responseDescriptors.ts` now obtains the semantic type through `requireResourceFieldType(f.semantic)` instead of expecting a legacy `semanticType` property.

## Verification
Targeted command:

```text
npx tsc -p tsconfig.phase87.33.narrow.json --noEmit
```

No diagnostics remain for the Root 09 boundary:

- `ResourceField*`
- `SemanticTypeResolver`
- response property processor
- resource type deriver
- response deriver
- `responseDescriptors.ts`

## Trace result
Remaining occurrences of `.semanticType` found under `packages/core/src` belong to other semantic models such as `ManifestField`, bound semantic nodes, or traversal-resolution models. They are not accesses on the canonical `ResourceFieldDescriptor` and therefore are not changed by this root repair.

## Architectural decision
Do **not** add `semanticType` or `boundAst` back to the public `ResourceFieldDescriptor` interface. The semantic boundary remains the SSOT.

Next roots exposed by the wider compile are separate:

1. `TypeExpression` export boundary
2. `RouteEntityDescriptor`
3. `RouteHandlers`
4. exhaustive PHP AST matcher
5. `semanticTypes`
6. `TraceNode`
7. environment `crypto` type declaration
