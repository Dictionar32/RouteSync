# Phase 87.59 — ResolvedField Semantic Carrier Closure

## Trace

```text
Laravel AST
  ↓
Verified ResourceFieldDescriptor
  ├─ expression
  └─ semanticType  ← SSOT
       ↓
SemanticTypeResolver
       ↓
ResolvedSemanticType
       ↓
ResolvedField
       ↓
TypeScript / Zod lowerings
```

Model-column path:

```text
ParsedModel.columns
  ├─ semanticType  ← upstream semantic SSOT
  └─ nullability   ← closed Nullability ADT
       ↓
NullableType when required
       ↓
SemanticTypeResolver
       ↓
ResolvedField
```

## Changes

- `ResolvedField` no longer contains duplicated semantic flags `type` or `nullable`.
- `ResolvedField.semanticType` is the sole semantic carrier.
- Field source information is a closed `FieldOrigin` ADT.
- Deleted `FieldTypeMapper` from the active semantic flow.
- Deleted `fieldMapBuilder` arbitrary `unknown` metadata path.
- Resource fields consume `ResourceFieldDescriptor.semanticType` directly.
- Model fields consume `ParsedModel.columns[].semanticType` directly.
- Nullable model columns are represented with `NullableType`, not a boolean flag.
- Response resolution consumes the closed `ParsedRoute.binding.response` descriptor.
- Response identity uses exhaustive `matchResponse`, not shape probing.
- Semantic context now receives typed `ParsedRoute`, `ParsedModel`, and `ParsedResource` collections.
- Group resolution uses `route.identity.groupName` directly.
- Canonical HTTP action mapping uses an explicit closed switch.

## Removed porous path

```text
unknown metadata
  ↓
Record<string, unknown>
  ↓
as any
  ↓
FieldTypeMapper
  ↓
SQL/string parsing
  ↓
primitive/object/array flattening
```

This path is no longer active in the CLI semantic field flow.

## Validation

- Legacy symbols `FieldResolutionMeta`, `toFieldResolutionMeta`, `FieldTypeMapper`, `buildFieldMap`, `projectLegacyFieldType`, and `inferTypeFromName`: absent from the active semantic generator.
- `any` / `as any` checks for the active semantic generator: none found.
- Targeted strict TypeScript check: changed files produced no TypeScript diagnostics.
- Full repository check still has unrelated baseline diagnostics outside the changed semantic files.

## Packaging

The final archive is rooted at `RouteSync/` and contains the full available project tree, with the 87.58 changes plus this 87.59 correction applied.
