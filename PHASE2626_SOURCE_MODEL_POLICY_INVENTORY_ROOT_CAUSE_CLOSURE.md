# Phase 2626 — Source-Model Policy Inventory Root-Cause Closure

## Ringkasan

Phase 2625 menutup pemilihan kandidat pertama, tetapi jalur manifest masih mempunyai celah: `sourceModelReferenceIndexFromCatalog` dapat dipanggil tanpa inventory kebijakan karena parameter kedua memiliki default `[]`; ketika binding tidak ditemukan, source model memproyeksikan bukti kebijakan mentah sebagai fallback. Pada jalur route, binding yang tidak ditemukan juga dapat kembali ke `routeActionPolicyRelations(...)`, yang menerbitkan middleware route sebagai hasil tanpa policy binding kanonis. Selain itu, `buildCompleteLaravelSourceModel` selalu mengembalikan `complete_source_model` walaupun graph berisi `controller_action_policy_blocked` atau `route_action_policy_blocked`.

Itulah akar masalah yang lebih tinggi: blocker semantik dibuat, tetapi source-model builder dan manifest builder belum mewajibkan blocker tersebut menghentikan publikasi manifest.

## Perbaikan implementasi

1. `SourceModelReferenceIndexBuilderInterface` sekarang menjadi kontrak builder index. Nilai kanonis `sourceModelReferenceIndexBuilder` memakai pola `export const name: Interface`.
2. `sourceModelReferenceIndexFromCatalog` tidak lagi menerima inventory implisit melalui default `[]`; pemanggil harus memberikan inventory secara eksplisit.
3. Route policy projection hanya menerima hasil dari inventory kebijakan kanonis. `catalogControllers` tidak lagi dipakai sebagai jalur alternatif untuk membangun ulang semantic policy di proyeksi route.
4. Binding `unbound` menghasilkan `controller_action_policy_binding_unbound` sebagai blocker eksplisit. Source model tidak lagi mengganti kegagalan binding dengan proyeksi bukti mentah.
5. `CompleteSourceModelBuildResult` berevolusi menjadi ADT `complete_source_model | source_model_build_blocked`. Builder memeriksa relation graph dan mengembalikan blocker jika graph memuat controller-action atau route-action policy blocker.
6. `ManifestBuilderJudgment` mempertahankan `manifest_builder_blocked` dengan `stage: 'source_ast' | 'source_model'`. Manifest builder berhenti sebelum dataflow/manifest diproduksi ketika source-model authority menghasilkan blocker.
7. CLI `scan`, `sync`, dan drift audit sekarang melaporkan keseluruhan blocker judgment, bukan mengasumsikan semua blocker mempunyai properti `projection`.

## Jalur sesudah perbaikan

`CLI scan/sync → ManifestBuilderOperationPreparationInterface → ManifestBuilderInterface.build() → LaravelSourceAstPipelineInterface → CompleteLaravelSourceModelBuilderInterface.build() → SourceModelReferenceIndexBuilderInterface → policy judgment ADT → CompleteSourceModelBuildResult → ManifestBuilderJudgment → CLI output gate`.

Hasil `source_model_build_blocked` tidak dapat diperlakukan sebagai `complete_source_model`; manifest builder mengembalikan `manifest_builder_blocked` pada stage `source_model` sebelum `inputsFromSourceModel`, dataflow, atau publikasi manifest.

## Referensi domain Laravel

Dokumentasi resmi Laravel menyatakan route dapat menunjuk ke pasangan controller/action, dan resource controller menghasilkan sejumlah action yang eksplisit. Ini mendukung kebutuhan untuk mempertahankan identitas controller/action dan tidak menyamakan route middleware dengan policy controller yang belum berhasil diikat.

- Laravel Routing: https://laravel.com/framework/docs/13.x/routing
- Laravel Controllers: https://laravel.com/framework/docs/13.x/controllers

## Verifikasi yang dijalankan

- Audit Phase 2626: 23/23 assertion struktural.
- Audit regresi Phase 2625: 11/11 assertion.
- Audit regresi Phase 2624: 14/14 assertion.
- Audit regresi Phase 2622: 10/10 assertion.
- Audit regresi Phase 2621: 14/14 assertion.
- Audit regresi Phase 2620: 6/6 assertion.
- `node --check` pada skrip audit Phase 2626.
- JSON parse pada `packages/cli/package.json`.

Typecheck penuh, Vitest penuh, package build, dan CLI end-to-end belum dinyatakan lulus karena workspace ini tidak memiliki `node_modules` lokal yang diperlukan. Hasil audit struktural bukan pengganti pemeriksaan tersebut.

## Regresi tambahan

- Phase 2623 relation authority audit: 4/4.
- Phase 2314 manifest blocked ADT audit (diperbarui untuk stage source-AST dan source-model): 13/13.
- Phase 2387 manifest operation injection audit (diperbarui agar memeriksa pola interface-first yang aktif): 12/12.
- Syntax transpilation delapan file TypeScript yang berubah atau terkait: 8/8.

Percobaan `tsc --noEmit` berhenti pada konfigurasi/toolchain sebelum pemeriksaan proyek: TypeScript global yang tersedia tidak mendukung nilai `target`/`lib` di konfigurasi saat ini dan deklarasi `node` serta `vitest/globals` tidak tersedia. Karena itu, typecheck semantik belum terverifikasi.
