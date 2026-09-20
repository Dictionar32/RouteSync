# Phase Upstream Interface Repair 45 — Model Surface Correlation

## Scope
Seluruh `packages/core/src` aktif. `packages/core/src/compiler.ts` legacy dikecualikan.

## Trace
Ditemukan bahwa `ModelFacts.surface` sudah memiliki target vocabulary `ModelSurfaceMemberFact`, tetapi producer `modelCanonical.ts` masih menghasilkan lima collection terpisah: columns, casts, accessors, relations, methods.

Ini memaksa consumer menggabungkan column + cast untuk menentukan effective type.

## Perbaikan
`modelCanonical.ts` sekarang membentuk satu `surface.members` collection.

`ModelColumnFact.type` dikorelasikan langsung:
- `native` membawa TypeExpression native.
- `casted` membawa TypeExpression hasil cast + CastType + SourceSpan.

Accessors, relations, methods, dan constants juga menjadi member dalam collection yang sama.

## SSOT
Canonical types tetap di:
- `types/upstream/modelSourceFacts.ts`
- `ModelColumnType`
- `ModelColumnFact`
- `ModelSurfaceMemberFact`
- `ModelSurfaceFacts`
- `ModelFacts`

Tidak membuat duplicate ModelColumnFact/ModelSurfaceFacts.

## Migration signals
Consumer legacy masih membaca `ModelSymbol.cast()` dan model surface lama. Consumer tersebut belum dipaksa compile karena fase ini interface-first. Error consumer dianggap migration signal.

## Catatan kualitas
Producer masih memiliki conditional expression untuk membedakan native/casted karena sumber ParsedModel lama memang masih memisahkan `columns` dan `casts`. Ini menunjukkan producer source boundary berikutnya masih perlu dinaikkan; conditional tersebut belum boleh dianggap sebagai final high-level interface.

## Verifikasi
Targeted TypeScript compile tidak menghasilkan error yang menunjuk langsung ke `modelCanonical.ts` atau `modelSourceFacts.ts`; workspace masih memiliki banyak error migration yang sudah ada di area lain.

## Next root
Naikkan producer scanner dari `ParsedModel.columns + ParsedModel.casts` menjadi sumber semantic `ModelColumnFact` yang sudah berkorelasi, sehingga `modelCanonical.ts` tidak perlu melakukan pencocokan column/cast sendiri.
