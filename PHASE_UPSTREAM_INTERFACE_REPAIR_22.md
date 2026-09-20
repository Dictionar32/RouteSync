# Phase — Upstream Interface Repair 22

## Scope
Audit dan perbaikan **interface upstream saja**. Tidak memperbaiki downstream/implementasi pada phase ini.

## Source
Laravel source `ecommerce_shop` digunakan sebagai semantic reference. Upstream tetap menjadi model canonical untuk data hasil scan.

## Trace result
Tidak ditemukan `if` statement, `undefined`, `any`, atau `Record<...>` di `packages/core/src/types/upstream`.
Kemunculan `nullable`, `nullsafe_*`, dan `when_not_null` adalah vocabulary semantic yang sah, bukan JavaScript `null`/`undefined` value.

## Repairs
### RouteParameter
- `RouteParameterLocation` dinaikkan dari string literal union menjadi closed ADT.
- `RouteParameterType` dinaikkan dari string literal union menjadi closed ADT.
- `RouteParameter` sekarang membawa semantic location sebagai ADT.

### RequestField
- `RequestField` sebelumnya hanya membawa path + validation rules + default.
- Ditambahkan semantic `type: TypeExpression`.
- Ditambahkan semantic `presence: Presence`.
- Tidak memakai `null`/`undefined` fallback.

## Principle
Canonical upstream interface tidak boleh mengencode meaning dengan primitive string/boolean/null ketika meaning sudah diketahui. Absence tetap direpresentasikan dengan explicit ADT (`none`, `empty`, `absent`, dll.), sedangkan nullable type tetap direpresentasikan oleh `Nullability`/`nullable` ADT.

## Deliberately not changed
Downstream producers/consumers belum diubah. Compile failures yang muncul akibat kontrak baru harus menjadi daftar migration roots berikutnya, bukan alasan menurunkan kembali interface upstream.
