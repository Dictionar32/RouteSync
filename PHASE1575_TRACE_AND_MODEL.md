# Phase 1575 — Interface-First Law Counterexample Totality

## Tujuan

Memperkuat kontrak upstream sebelum scanner wiring dan runtime executor diubah. Targetnya bukan sekadar menambah daftar law: setiap law derivasi yang dideklarasikan harus dapat direpresentasikan sebagai typed verifier-failure witness dengan bukti yang relevan.

## Trace

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - `RequestTypeDerivationLawId` mendeklarasikan 32 semantic laws.
  - `RequestTypeDerivationVerificationFailure` memodelkan counterexample kegagalan verifikasi.
  - `RequestTypeDerivationAuthorityOutcome` mengikat judgment dengan hasil verifikasi.
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`
  - Masih mengembalikan `readonly RequestType[]`; belum memakai `RequestTypeDerivationAuthorityInterface`.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`
  - Masih melakukan lookup request/resource dan folding action/response group. Keputusan semantik ini semestinya berasal dari authority, bukan klasifikasi lokal scanner.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`
  - Tidak diubah. Ini merupakan batas authority derivasi tipe semantik yang berbeda; runtime tetap langkah terakhir.

## Perubahan model

Delapan law sebelumnya tidak memiliki varian `law` eksplisit pada `RequestTypeDerivationVerificationFailure`:

1. `route_has_explicit_request_binding`
2. `request_identity_exact_match`
3. `request_identity_normalized_unique_match`
4. `ambiguous_identity_is_conflict`
5. `resource_identity_is_canonical`
6. `route_contributes_action`
7. `route_contributes_response`
8. `invalid_input_requires_typed_counterexample`

Phase 1575 menambahkan satu varian kegagalan bertipe untuk masing-masing law. Setiap varian memuat law ID, reason spesifik, dan witness dengan evidence route/request/resource/group yang relevan. Dengan demikian, model dapat menyatakan counterexample bertipe untuk seluruh law yang dideklarasikan.

Batas bukti: ini menutup celah representasi kontrak, bukan membuktikan verifier benar-benar mendeteksi setiap pelanggaran. Authority dan executable tests masih harus menguji seluruh law terhadap source evidence aktual.

## Verifikasi

- Audit Phase 1575: 9/9 pemeriksaan struktural.
- Regression Phase 1574: 10/10.
- Regression Phase 1573: 12/12.
- TypeScript targeted check berakhir dengan kode 2; 35 diagnostik berasal dari dependency yang diimpor, tanpa diagnostik langsung pada `requestTypeDerivationInterface.ts`.
- Build penuh dan Vitest belum dijalankan karena `node_modules` tidak tersedia.
- Scanner dan runtime executor tidak diubah.

## Referensi desain eksternal

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
  - Compiler analyses/transforms dapat bergantung pada interface stabil alih-alih implementasi spesifik.
- TypeScript Handbook — Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - Discriminated unions dan `never` membantu exhaustiveness statis.

Referensi ini menjadi panduan desain; bukan bukti bahwa implementasi RouteSync sudah benar.

## Urutan lanjutan

1. Implementasikan `RequestTypeDerivationAuthorityInterface` dan verifier terhadap source evidence aktual.
2. Buat executable tests untuk seluruh 32 law dan verifikasi varian counterexample yang tepat.
3. Wiring `RequestTypeDeriver` agar mengonsumsi verified authority outcome.
4. Pindahkan reasoning request/resource/action/response keluar dari `groupAggregator`.
5. Sederhanakan runtime executor setelah authority verified benar-benar terhubung dan teruji.
