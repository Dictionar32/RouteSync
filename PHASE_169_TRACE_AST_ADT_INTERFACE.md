# Phase 169 — Trace AST/ADT Interface

## Focus
Menaikkan `ResourceQueryOperationError` agar tidak lagi membawa dua dimensi semantik bebas:
`operation + reason`.

## Before
Error masih berbentuk:

```ts
{ operation: 'filter', reason: 'missing_property' }
```

Consumer berpotensi harus membaca `operation` lalu menafsirkan `reason`.

## Trace
Origin/query boundary sudah menghasilkan reason spesifik dari setiap argument resolution.
Masalah berikutnya berada pada kontrak error hasil resolusi: operasi masih disimpan sebagai field bebas.

## Fix
Error dinaikkan menjadi ADT operation-specific:

```text
ResourceQueryOperationError
├── filter
│   └── ResourceFilterOperationError
├── relation_filter
│   └── ResourceRelationFilterOperationError
├── relation_load
│   └── ResourceRelationLoadOperationError
├── ordering
│   └── ResourceOrderingOperationError
├── window
│   └── ResourceWindowOperationError
├── grouping
│   └── ResourceGroupingOperationError
├── having
│   └── ResourceFilterOperationError
└── conditional
    └── ResourceConditionalOperationError
```

Ditambahkan `matchResourceQueryOperationError()` sebagai catamorphism resmi.

Resolver sekarang membentuk:

```ts
{ kind: 'filter', error: { kind: 'missing_property' } }
```

bukan:

```ts
{ operation: 'filter', reason: 'missing_property' }
```

## Result
- Error operation tidak lagi berupa string field bebas.
- Reason tetap typed dan operation-specific.
- Consumer dapat memakai matcher ADT, tanpa re-classification.
- Tidak ada perubahan pada source `ecommerce_shop`.
- Tidak membuat interface paralel untuk menggantikan model lama; error contract yang sama dinaikkan.

## Validation
Command:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result:
Existing environment blocker only:

```text
packages/core/src/compiler/utils/Hash.ts(4,28):
TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```

Tidak ditemukan error TypeScript baru dari Phase 169.

## Remaining Trace Target
Sisa ternary/if berada terutama di origin/query boundary ketika syntax mentah dipetakan menjadi semantic ADT, misalnya argument presence dan literal extraction.
Itu bukan downstream re-classification. Tahap berikutnya dapat menaikkan argument presence menjadi ADT/arity contract agar boundary juga tidak perlu memakai `undefined` sebagai makna.
