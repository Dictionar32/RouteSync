# Phase Error Repair 11 — Field Type Semantic Boundary

## Root
`FieldTypeResolver`, `SemanticTypeResolvers`, `resolvedSemanticTypes`, `resolvedSemanticFactory`, and legacy field conversion were mixing the canonical `TypeExpression` ADT with older string/null/boolean semantic models.

## Trace

```text
ManifestField
  ├─ semanticType: ResolvedSemanticType
  ├─ format: TypeExpression
  ├─ validationRules: TypeExpression[]
  └─ description: DescriptionText
        ↓
FieldTypeResolver
        ↓
OptimizedResourceFieldIR
        ↓
TypeIR lowering / legacy projection
```

The old implementation expected fields that no longer exist (`nullable`, `optional`, `validation`, `resolved`) and downgraded semantic values to free strings.

`ResolvedSemanticType` also had drift between its canonical ADT and the factory/algebra: `collection` vs `cardinality`, `ResolvedSemanticMeta`, nullable `format`, and missing `nullable` visitor coverage.

## Repairs

1. `ResolvedSemanticType` is now the canonical closed ADT with:
   - `SemanticBinding`
   - `SemanticFormat = none | type_expression`
   - explicit `cardinality`
   - explicit `nullable` variant
   - explicit `ObjectSemanticTypeIR` export
2. `ResolvedSemanticTypeFactory` now constructs the canonical ADT and contains no `null` semantic format or legacy metadata object.
3. `SemanticTypeResolvers` consumes `SemanticFormat` and `cardinality` instead of legacy `format: string | null` / `collection: boolean`.
4. `semanticTypeConverter` handles the complete visitor, including `nullable`.
5. `FieldTypeResolver` now consumes the actual `ManifestField` contract rather than stale `nullable/optional/resolved/validation` fields.
6. `OptimizedResourceFieldIR` now carries typed `PropertyName`, `DescriptionText`, `TypeExpression[]`, and a closed `OptimizedFieldSource` ADT.
7. `FieldSource` was made closed: computed fields do not fabricate a model; model-backed fields carry their model explicitly.
8. `legacyConverter` now preserves those typed values instead of reconstructing strings or fake empty metadata.

## Verification

Targeted TypeScript compilation of the repaired semantic/type boundary reports no diagnostics from:

- `FieldTypeResolver.ts`
- `SemanticTypeResolvers.ts`
- `semanticTypeConverter.ts`
- `legacyConverter.ts`
- `resolvedSemanticTypes.ts`
- `resolvedSemanticFactory.ts`
- `resolvedSemanticAlgebra.ts`

Remaining diagnostics are outside this root:
- Node `crypto` type environment
- `routeEntityDefinition` / route entity boundary
- PHP AST exhaustive matcher
- route handlers
- `TraceNode` export
- `semanticTypes` PropertyName/string boundary

## Result

```text
TypeExpression ADT
      ↓
ResolvedSemanticType ADT
      ↓
FieldTypeResolver
      ↓
Typed OptimizedResourceFieldIR
      ↓
TypeIR
```

No legacy `format: string | null`, `collection: boolean`, or `ResolvedSemanticMeta` remains in the repaired semantic boundary.
