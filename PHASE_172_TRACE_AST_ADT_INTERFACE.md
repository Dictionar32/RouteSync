# Phase 172 — Trace AST/ADT Interface

## Fokus
Menaikkan bentuk argument predicate dari array + positional index menjadi semantic ADT.

## Trace
Sebelumnya consumer predicate masih menentukan operand dengan `predicateOperandIndex(args)` dan kemudian membaca `args[index]`. Ini berarti makna bentuk predicate masih berada di posisi array.

## Perbaikan
Ditambahkan `ResourcePredicateArgumentShape`:

- `property_operand`
- `property_operator_operand`
- `invalid` dengan alasan `missing_property | missing_operand | unsupported_arity`

Ditambahkan `matchResourcePredicateArgumentShape` sebagai algebra untuk consumer.

`predicateFromArguments` diganti menjadi:

`predicateArgumentShape → predicateFromShape → ResourceQueryFilterArgumentsResolution`

Bentuk 2 argumen sekarang secara eksplisit berarti `property + operand` dengan operator default. Bentuk 3 argumen berarti `property + operator + operand`.

## Dampak
Consumer tidak lagi menghitung posisi operand berdasarkan `args.length` dan tidak lagi menerima `undefined` untuk menentukan bentuk predicate. Positional interpretation tetap berada di origin/query boundary yang menghasilkan ADT.

Error `unsupported_arity` juga dinaikkan ke `ResourceFilterOperationError`, sehingga kegagalan shape tetap membawa makna.

## Trace ulang
- `predicateFromArguments`: tidak ada.
- `predicateOperandIndex`: tidak ada.
- `predicateOperand`: tidak ada.
- `propertyArgument`: tidak ada.
- `comparisonOperator(args)`: tidak ada.
- Narrow TypeScript validation: hanya blocker lingkungan lama `packages/core/src/compiler/utils/Hash.ts` → `Cannot find module 'crypto'`.
- Tidak ada error TypeScript baru dari Phase 172.

## Prinsip
`raw arguments → positional inference → downstream`

berubah menjadi:

`raw arguments → semantic predicate shape ADT → downstream`

Switch/ternary yang tersisa di boundary/algebra tidak menjadi mekanisme downstream untuk menemukan ulang makna.
