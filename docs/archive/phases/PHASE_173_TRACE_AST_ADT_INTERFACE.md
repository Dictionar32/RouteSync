# Phase 173 — Trace AST/ADT Interface

## Flow
Trace → Saran → Perbaiki → Trace ulang

## Fokus
Menaikkan semantic resolution pada relation-load collection values dan grouping property values. Targetnya: downstream tidak memakai `undefined` sebagai pembawa makna.

## Temuan
1. `arrayLiteralValues()` masih menghasilkan `undefined` ketika elemen bukan string.
2. `groupingArguments()` masih mengubah `not_string` menjadi `undefined`, lalu memakai `property === undefined` untuk menentukan invalid.
3. Ini merupakan semantic information loss karena `not_string` sudah memiliki vocabulary ADT.

## Perbaikan
### `arrayLiteralValues`
Resolution sekarang eksplisit:
- `resolved { value }`
- `invalid`

Tidak lagi menggunakan `undefined` sebagai semantic failure.

### `groupingArguments`
Resolution property sekarang melalui `ResourcePropertyResolution` dan diteruskan sebagai:
- `resolved { property }`
- `missing`
- `invalid`

Tidak lagi membuat `PropertyName | undefined`.

Generic matcher diberi target union eksplisit agar seluruh ADT tetap dipertahankan oleh TypeScript.

## Trace ulang
Flow sekarang:

`raw expression → literal resolution → property resolution → semantic operation input`

Bukan:

`raw expression → undefined → if/ternary → tebakan makna`

## Validation
Command:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result:
- Tidak ada error baru dari Phase 173.
- Satu blocker existing tetap:
  `packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto' or its corresponding type declarations.`

## Residual target
Beberapa `if` masih berada di origin/parser boundary, misalnya pemeriksaan literal/array AST dan argument extraction. Ini bukan downstream re-classification. Trace berikutnya harus mengevaluasi apakah shape relation-load (`path` + `selection`) juga dapat dinaikkan menjadi ADT sebelum parser melakukan string splitting.
