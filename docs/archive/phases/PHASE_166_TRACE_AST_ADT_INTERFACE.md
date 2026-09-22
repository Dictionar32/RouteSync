# Phase 166 — Trace → Saran → Perbaiki → Trace Ulang

## Fokus
ResourceQueryOperationInput masih memiliki error/invalid yang terlalu generik. Target: interface membawa alasan semantic kegagalan, bukan downstream menebak dari `invalid`.

## Temuan
Sebelumnya beberapa ADT hanya memiliki `kind: 'invalid'`, sehingga consumer tidak mengetahui apakah maknanya missing argument, empty target, unsupported target, invalid property, atau missing callback.

## Perbaikan
Dinaikkan pada interface domain yang sudah ada:

- `ResourceRelationLoadArguments.invalid.reason`: `missing_target | empty_target_list | invalid_target`
- `ResourceOrderingArguments.invalid.reason`: `missing_target | unsupported_target`
- `ResourceWindowArguments.invalid.reason`: `missing_value`
- `ResourceGroupingArguments.invalid.reason`: `invalid_property`
- `ResourceConditionalArguments.invalid.reason`: `missing_condition | missing_callback`
- `ResourceQueryOperationError`: `missing_required_argument | invalid_argument_shape | unsupported_argument_value`

Resolver sekarang membentuk alasan tersebut di origin/query boundary.

## Prinsip
`invalid` bukan lagi tempat sampah semantic. Interface membedakan *mengapa* operasi tidak dapat dibentuk. Downstream dapat melakukan pattern matching terhadap makna yang sudah dibawa interface, tanpa memeriksa jumlah argument atau menginterpretasikan raw expression.

## Trace ulang
`tsc -p tsconfig.phase87.33.narrow.json --noEmit` hanya menghasilkan blocker environment lama:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

Tidak ada error TypeScript baru dari Phase 166.

## Next semantic target
`ResourceQueryOperationError` masih berada satu level lebih umum daripada error domain spesifik per operation. Trace berikutnya sebaiknya menguji apakah `ResourceResolvedQueryOperation.invalid.error` dapat membawa operation-specific error ADT sehingga consumer tidak perlu memeriksa `argument` string.
