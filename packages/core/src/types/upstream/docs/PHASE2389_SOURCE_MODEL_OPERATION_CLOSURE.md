# RouteSync Phase 2389 — Source Model Operation Closure

## Tujuan

Melanjutkan jalur upstream manifest dari Phase2388. Fokusnya menutup pemanggilan langsung `buildCompleteLaravelSourceModel` dari manifest builder tanpa membuat keluarga interface duplikat atau memindahkan fungsi semata-mata demi lokasi berkas.

## Audit dan akar masalah

`CompleteLaravelSourceModel` dan `buildCompleteLaravelSourceModel` dimiliki `types/upstream/highLevelSourceModel.ts`. Namun, operasi build hanya berupa fungsi yang dipanggil langsung oleh `constructRouteSyncManifest`. Akibatnya, `ManifestBuilderInterface` menyatakan dependensi pipeline AST, dataflow manifest surface, dan resource capability algebra, tetapi tidak menyatakan operasi yang membentuk source model lengkap.

Pencarian pemakaian menunjukkan `buildCompleteLaravelSourceModel` hanya dipanggil oleh manifest builder. Karena tidak ditemukan kontrak operasi source-model builder yang sudah ada, operasi ini diekspos melalui kontrak bertipe pada pemilik semantiknya sendiri.

## Perubahan

- Menambahkan `CompleteLaravelSourceModelBuildInput` sebagai input tertutup yang membawa `CompleteSourceAst`, identitas source project, dan seed definisi semantik.
- Menambahkan `CompleteLaravelSourceModelBuilderInterface` di `highLevelSourceModel.ts`, pemilik `CompleteLaravelSourceModel` dan fungsi pembangunnya.
- Mengubah `buildCompleteLaravelSourceModel` menerima satu input kontrak bertipe.
- Mengembangkan `ManifestBuilderInterface` dari contract version 6 ke 7 dan menginjeksi `sourceModelBuilder`.
- Mengubah `constructRouteSyncManifest` agar hanya menjalankan `sourceModelBuilder.build(...)`, bukan memanggil fungsi pembangun secara langsung.
- Composition root mengikat implementasi kanonis `buildCompleteLaravelSourceModel` ke kontrak tersebut.
- Gate `LaravelSourceAstProjectionJudgment` tetap berjalan sebelum source-model construction; arm blocked diteruskan sebagai `ManifestBuilderBlockedJudgment` yang sudah ada.
- Tidak membuat ADT hasil kedua: hasil operasi source-model tetap `CompleteSourceModelBuildResult`, yang hanya bisa diproduksi dari arm `CompleteSourceAst`.
- Tidak menambahkan dependensi `semantic/foundation`.

## Trace jalur aktual

`CLI scan/sync → buildManifestWithInvocationPipeline → ControllerInvocationManifestCompositionAuthorityInterface.compose → ManifestBuilderInterface.build → LaravelSourceAstPipelineInterface.execute → LaravelSourceAstProjectionJudgment → [blocked: ManifestBuilderBlockedJudgment | complete: CompleteSourceAst] → CompleteLaravelSourceModelBuilderInterface.build → SemanticDataflowManifestSurfaceInterface → ResourceGroupCapabilityAlgebraInterface.compose → ManifestBuilderCompleteJudgment → CLI output gate`

CLI `scan` dan `sync` tetap membedakan blocker source-document acquisition, source discovery, inventory rejection, dan `manifest_builder_blocked`; jalur perubahan ini tidak meratakan blocker menjadi pesan generik.

## Bukti verifikasi

Audit yang dijalankan:

- Phase2380 route closure: 8/8
- Phase2381 evidence authority flow: 8/8
- Phase2382 canonical contract reuse: 14/14
- Phase2383 route boundary executor integration: 8/8
- Phase2384 boundary projection: 8/8
- Phase2385 legacy scanner retirement: 6/6
- Phase2385 route emission inventory: 6/6
- Phase2386 direct route boundary operation: 8/8
- Phase2387 manifest builder operation injection: 12/12
- Phase2388 manifest semantic operations: 11/11
- Phase2389 source-model operation and CLI closure: 11/11
- TypeScript parser for three modified TypeScript files: 3/3 syntax passed.

Total assertion checks across these audits: 100/100 passed.

## Batasan yang belum ditutup

- Full TypeScript typecheck belum dinyatakan lulus; riwayat pemeriksaan pada snapshot sebelumnya menemukan masalah konfigurasi/compiler dan error di modul lain.
- Package build, Vitest, dan CLI scan/sync end-to-end belum dijalankan di environment yang mendukung repository.
- `ManifestBuilderJudgment` dan CLI gates sudah ditrace secara statis, tetapi keberhasilan runtime belum terbukti.
- Dependensi route scanner terhadap `subscanners/route-scanner` dan `subscanners/routeProducerRelations`, serta dispatch `methodJudgment` di scanner, masih terbuka.
- Operasi sumber-model sekarang eksplisit, tetapi semantik internal `buildCompleteLaravelSourceModel` masih merupakan implementasi komposisi model; fase berikutnya perlu mengevaluasi apakah operasi turunannya sudah memiliki pemilik kontrak yang tepat, bukan membungkus fungsi lagi.
