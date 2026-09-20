# Phase 168 — Trace AST/ADT Interface: Resolution Algebra & Consumer Declassification

## Fokus
Menaikkan interface operasi query setelah Phase 167 agar consumer/downstream tidak perlu lagi memeriksa `arguments.kind` dengan ternary atau `switch` untuk memahami valid/invalid.

## Trace
Sebelum perbaikan, `mutationHandlers` masih melakukan re-classification lokal:
- `input.arguments.kind === 'valid' ? ... : ...`
- `input.arguments.value.kind === 'value' ? ... : ...`
- `input.arguments.value.kind === 'condition_callback' ? ... : ...`
- `dispatchOperationInput()` memakai `switch(input.kind)`.
- `queryOperationInput()` memakai `switch(operation.kind)`.
- predicate resolution mengembalikan `undefined`, sehingga consumer harus menebak alasan invalid.

## Perbaikan
### 1. Resolution matcher dinaikkan ke domain interface
Ditambahkan algebra/matcher untuk:
- `ResourceQueryFilterArgumentsResolution`
- `ResourceRelationFilterArgumentsResolution`
- `ResourceWindowArguments`
- `ResourceGroupingArguments`
- `ResourceConditionalArguments`
- `ResourceQueryOperationInput`

Consumer sekarang menerima visitor semantik, bukan melakukan pengecekan `kind` sendiri.

### 2. Predicate tidak lagi kehilangan makna error
`predicateFromArguments()` sekarang menghasilkan `ResourceQueryFilterArgumentsResolution` dengan alasan:
- `missing_property`
- `invalid_operator`
- `missing_operand`

Tidak lagi `ResourceQueryPredicate | undefined`.

### 3. Query operation dispatch dinaikkan ke algebra
`queryOperationInput()` menggunakan `matchResourceQueryMutation()`.
`dispatchOperationInput()` menggunakan `matchResourceQueryOperationInput()`.

### 4. Resource method meaning tidak lagi diperiksa manual
`resolveResourceQueryOperation()` menggunakan `matchResourceModelMethodMeaning()` sehingga `meaning.kind !== 'query_mutation'` tidak lagi menjadi branch consumer.

### 5. Ordering resolution
`orderingArguments()` menggunakan matcher terhadap `ResourceQueryOrderingTargetResolution`, bukan ternary valid/invalid.

## Hasil arsitektur
```text
source
  -> AST
  -> semantic expression
  -> semantic operation input
  -> typed resolution ADT
  -> resolved operation
  -> downstream
```

Downstream tidak lagi menebak arti dari `undefined`, posisi argument, atau `kind` valid/invalid melalui ternary.

## Sisa branch yang disengaja
Branch yang tersisa di `resourceModelMethodResolverOperation.ts` berada pada **origin/query boundary**, contohnya:
- membaca literal dari AST expression,
- membaca argument yang mungkin tidak ada,
- membentuk invalid ADT,
- memetakan syntax collection menjadi semantic targets.

Branch tersebut belum dipindahkan ke consumer dan tidak digunakan untuk re-classification downstream.

## Validasi
Command:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Hasil:
- Tidak ada error baru dari perubahan Phase 168.
- Satu blocker lingkungan lama tetap ada:
  `packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## Next trace target
Masih ada satu lapisan yang dapat dinaikkan: `ResourceQueryOperationError` masih memakai pasangan `operation + reason`. Tahap berikutnya dapat mengubahnya menjadi error ADT per operasi sehingga bahkan pembaca error tidak perlu memakai `operation` string untuk menentukan vocabulary error.
