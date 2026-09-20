# Phase 167 — Trace → Saran → Perbaiki → Trace Ulang

## Fokus
Operation error contract: menghilangkan `ResourceQueryOperationError` generik agar makna kegagalan dibawa oleh interface operation-specific.

## Temuan
Sebelumnya `ResourceQueryOperationError` memakai tiga error generik (`missing_required_argument`, `invalid_argument_shape`, `unsupported_argument_value`) dengan field `argument: string`. Ini memaksa consumer mengetahui operation dan menafsirkan ulang string error.

## Perbaikan
`ResourceQueryOperationError` sekarang merupakan closed ADT per operation:
- filter: `missing_property | invalid_operator | missing_operand`
- relation_filter: `missing_target | empty_target_list | invalid_target | missing_callback`
- relation_load: `missing_target | empty_target_list | invalid_target`
- ordering: `missing_target | unsupported_target`
- window: `missing_value`
- grouping: `invalid_property`
- having: `missing_property | invalid_operator | missing_operand`
- conditional: `missing_condition | missing_callback`

`ResourceQueryFilterArgumentsResolution` dan `ResourceRelationFilterArgumentsResolution` juga membawa reason secara eksplisit.

Mutation handlers sekarang meneruskan reason dari semantic input ke resolved operation; tidak lagi membuat error generik `invalid_argument_shape / argument: operation`.

## Prinsip interface

```text
raw arguments
  ↓
operation boundary
  ↓
operation-specific semantic ADT + reason
  ↓
resolved operation
  ↓
downstream
```

Downstream tidak perlu bertanya lagi "invalid ini karena apa?" dengan `if/switch` terhadap string argument.

## Trace ulang
- Tidak ditemukan lagi construction `ResourceQueryOperationError` dengan `argument: string`.
- Tidak ditemukan lagi `invalid_argument_shape` pada mutation handlers.
- `matchRelationLoadArguments` sekarang meneruskan invalid reason.
- TypeScript narrow build menghasilkan hanya blocker lama:
  `packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`
- Tidak ada error TypeScript baru dari Phase 167.

## Catatan arsitektur
Switch/catamorphism di AST/domain boundary tetap diperbolehkan. Target Phase 167 adalah menghilangkan semantic re-classification di consumer, bukan menghapus seluruh bentuk dispatch dari compiler.
