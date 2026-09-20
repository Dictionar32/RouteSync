# Phase 165 — Trace / Saran / Perbaiki / Trace Ulang

## Fokus

Menaikkan query-operation arguments menjadi semantic input sebelum mutation handler, sehingga consumer tidak lagi membaca `args[]`, `argumentAt()`, atau menentukan makna dari posisi argument.

## Temuan

Sebelumnya mutation handlers menerima:

`ResourceExpressionModel[]`

dan setiap handler mengetahui sendiri arti `args[0]`, `args[1]`, atau `args[2]`.

## Perbaikan

`ResourceQueryOperationInput` sekarang menjadi closed semantic ADT untuk seluruh query mutation:

- filter
- relation_filter
- relation_load
- ordering
- projection
- pagination
- window
- grouping
- having
- locking
- distinct
- conditional

Operation-specific meaning seperti direction, branch, window operation, callback, predicate, target, projection, dan pagination size dibawa oleh input tersebut.

`resolveResourceQueryOperation()` sekarang hanya:

1. menerima source arguments di boundary;
2. membentuk `ResourceQueryOperationInput` sekali;
3. dispatch input melalui closed ADT;
4. menghasilkan `ResourceResolvedQueryOperation`.

Mutation handlers tidak lagi menerima raw `ResourceExpressionModel[]`.

## Prinsip

```text
source arguments
    ↓
origin/query boundary
    ↓
ResourceQueryOperationInput
    ↓
semantic mutation handler
    ↓
ResourceResolvedQueryOperation
    ↓
downstream
```

Makna argument tidak lagi ditemukan ulang oleh consumer.

## Ternary / if / switch

`switch` yang tersisa berada pada dua boundary algebra:

- `queryOperationInput()` — decoding operation meaning dari source boundary.
- `dispatchOperationInput()` — catamorphism closed semantic ADT.

Tidak ada `switch` consumer yang membaca raw arguments untuk mengklasifikasikan ulang makna.

`argumentAt()` hanya tersisa di origin adapter yang membentuk semantic input.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Hasil: hanya blocker environment yang sudah ada:

`packages/core/src/compiler/utils/Hash.ts(4,28): Cannot find module 'crypto' or its corresponding type declarations.`

Tidak ada TypeScript error baru dari Phase 165.
