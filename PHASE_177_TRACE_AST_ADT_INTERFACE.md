# Phase 177 — Trace → Suggest → Fix → Retrace

## Fokus
Projection → ordering → pagination setelah Phase 176.

## Temuan
`ResourceQueryOrderingTargetResolution` masih memakai invalid tanpa alasan. Origin boundary membedakan argument hilang dari target yang tidak didukung, tetapi interface menghapus perbedaan tersebut dan `orderingArguments()` selalu menghasilkan `unsupported_target`.

## Perbaikan
`ResourceQueryOrderingTargetResolution` sekarang membawa:
- `resolved { target }`
- `invalid { reason: missing_target | unsupported_target }`

`orderingTargetFromArguments()` menghasilkan `missing_target` ketika argument tidak ada.
`orderingArguments()` meneruskan reason dari ADT, sehingga tidak melakukan re-classification.

## Trace ulang
Projection tetap menggunakan `ResourceQueryProjection { property | raw }` sebagai semantic contract. Pagination sudah menggunakan `framework_default | explicit(value)`, sehingga tidak perlu menebak presence downstream.

Central ADT matchers tetap menjadi catamorphism boundary; switch di sana tidak tersebar ke consumer. Percobaan mengganti matcher dengan registry generic menghasilkan intersection-to-never TypeScript, sehingga tidak dipaksakan dengan cast. Switch pusat dipertahankan karena ia bukan semantic re-classification consumer.

## Validasi
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Satu error tersisa, sama dengan blocker sebelumnya:
`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto' or its corresponding type declarations.`

Tidak ada error baru dari Phase 177.
