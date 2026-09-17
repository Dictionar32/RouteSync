# Phase 87.58 — Resource Field Semantic Carrier

## Trace

```text
Laravel PHP / AST
  -> Verified ResourceFieldDescriptor
  -> semanticType (upstream SSOT)
  -> SemanticTypeResolver.resolve()
  -> ResolvedSemanticType
  -> TypeScript / Zod lowerers
  -> ResolvedField
  -> CompilerIR.fieldMappings
```

## Perbaikan

1. `ResourceFieldDescriptor.semanticType` menjadi sumber semantic tunggal untuk resource fields.
2. `SemanticTypeResolver.resolveField()` tidak lagi membangun ulang type dari `expression.kind`.
3. `resolveSingleResourceField()` menerima `ResourceFieldDescriptor`, bukan `Record<string, unknown>`.
4. Resolver resource tidak lagi melakukan shape probing terhadap setiap field dan tidak lagi memakai `stripSuffix()` atau nullable ternary heuristic.
5. `ResolvedField` sekarang membawa `semanticType: ResolvedSemanticType` sehingga model/reference/collection/object/nullable/union tetap tersedia downstream.
6. TypeScript dan Zod lowering menggunakan resolved semantic type yang sama.
7. Legacy projection (`type`, `nullable`, `sourceType`, `sourceValue`) dipertahankan sementara untuk kompatibilitas consumer lama. Projection ini bukan sumber semantic baru.

## Quality Gate

- No `Record<string, unknown>` pada resource-field resolver.
- No `stripSuffix()` pada resource-field resolver.
- No `isNullableTernaryGuard()` pada resource-field resolver.
- No `switch(field.expression.kind)` pada `SemanticTypeResolver.resolveField()`.
- `field.semanticType` mengalir langsung ke semantic resolver.

## Remaining Debt

`FieldTypeMapper`, `fieldMapBuilder`, dan normalizer lama masih memiliki vocabulary legacy (`unknown`, shape probing, string parsing, boolean flags). Tahap berikutnya harus memindahkan jalur tersebut ke ADT upstream, bukan menambah fallback baru.
