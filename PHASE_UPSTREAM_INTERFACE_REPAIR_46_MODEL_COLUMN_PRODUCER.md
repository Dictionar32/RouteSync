# Phase Upstream Interface Repair 46 — Model Column Producer

## Scope
Seluruh `packages/core/src` aktif, dengan `packages/core/src/compiler.ts` legacy tetap dikecualikan.

## Trace
Root 45 menemukan `modelCanonical.ts` masih melakukan korelasi semantic di consumer-like canonicalization:
- `model.columns` dan `model.casts` dipisah.
- `castsByProperty` dibuat.
- setiap column mencari cast berdasarkan property.
- hasil kemudian diklasifikasikan menjadi `native` atau `casted`.

Padahal canonical upstream sudah memiliki `ModelColumnFact` dengan correlated `ModelColumnType`.

## Perbaikan
`modelCanonical.ts` sekarang membentuk `modelColumnFacts` satu kali pada origin boundary.

Canonical fact:
- `ModelColumnFact`
- `ModelColumnType = native | casted`

`ModelSchema.columns` sekarang menggunakan `ModelColumnFacts` canonical yang sama.
`ModelFacts.surface.members` juga menggunakan `modelColumnFacts` yang sama.

Dengan demikian tidak ada lagi dua konstruksi column semantic yang berbeda antara schema dan surface.

Legacy source evidence tetap dipertahankan pada `ModelDefinition.casts` dan AST-related data; tidak dihapus.

## Trace ulang
Tidak ditemukan lagi `castsByProperty` atau korelasi column/cast kedua di `modelCanonical.ts`.

Pola parser seperti `if/switch/===` pada migration/member token parsing tetap merupakan syntax parsing, bukan downstream semantic re-classification. Ini tidak dianggap sebagai alasan untuk menghapus parser state logic.

## Verifikasi
Targeted TypeScript check masih mempunyai error migration dari root lain (`ModelSemanticPropertyIndex`, `RouteParameter`, `ZodAST`, Node `crypto`). Tidak ada error model-column baru yang muncul pada output targeted check.

## Keputusan berikutnya
Root berikutnya adalah menaikkan `ParsedModel` producer agar `modelCanonical.ts` tidak perlu lagi melakukan join `model.columns + model.casts` sama sekali. Join yang sekarang sudah dipusatkan di origin boundary, tetapi vocabulary scanner/domain lama masih terpisah. Ini harus dinaikkan tanpa membuang source evidence.
