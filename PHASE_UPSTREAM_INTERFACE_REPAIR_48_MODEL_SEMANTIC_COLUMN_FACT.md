# PHASE UPSTREAM INTERFACE REPAIR 48 — MODEL SEMANTIC COLUMN FACT

## Scope
Seluruh `packages/core/src` aktif. `packages/core/src/compiler.ts` adalah legacy dan dikecualikan.

## Root
`ScannedModelDescriptor` masih mempunyai vocabulary `ModelCastOrigin` terpisah dari canonical `ModelColumnFact`.

## Trace
Sebelumnya semantic column dibentuk dari:

`ParsedColumn + ParsedCast -> cast origin -> ModelSemanticColumn`

dan column/property semantic dibangun ulang dua kali.

Canonical upstream sudah memiliki:

`ModelColumnFact.type = native | casted`

sehingga cast harus tetap berkorelasi di satu fact.

## Perbaikan
1. `ModelSemanticColumn` sekarang membawa canonical `ModelColumnFact` melalui `fact`.
2. `ModelCastOrigin` dihapus dari `types/domain/models.ts`.
3. `ModelSemanticColumn.origin` dihapus; semantic cast/native tidak lagi direkonstruksi menjadi vocabulary kedua.
4. `buildModelColumn()` menjadi satu helper untuk column surface dan property surface.
5. Descriptor tidak lagi membangun `castKind/targetType/valueType` dari `ParsedCast`.
6. `PrimitiveType` di-import langsung; tidak memakai `require()`.

## Trace ulang
`ScannedModelDescriptor` tidak lagi melakukan `casts.find()` atau membentuk `ModelCastOrigin`.

Masih ada satu producer-level correlation di:

`compiler/scanner/subscanners/model/modelColumnFactsCanonical.ts`

yang menerima `ParsedColumn[] + ParsedCast[]` dan menggabungkannya. Ini adalah boundary berikutnya yang perlu dinaikkan jika standar ketat kita mengharuskan origin producer tidak lagi melakukan lookup/correlation berbasis property.

## Verifikasi
Narrow TypeScript compile masih memiliki error migrasi yang sudah ada di area lain, termasuk consumer yang masih memanggil API lookup lama (`ModelSemanticPropertyIndex.get`). Error tersebut tidak diselesaikan dengan fallback/cast.

## Prinsip
Jangan memperbaiki error migration dengan `as`, `any`, `null`, `undefined`, `??`, atau fallback. Naikkan interface producer terlebih dahulu.
