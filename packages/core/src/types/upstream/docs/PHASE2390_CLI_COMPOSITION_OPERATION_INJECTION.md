# RouteSync Phase2390 — CLI Composition Operation Injection

## Tujuan

Melanjutkan penutupan upstream manifest setelah Phase2389. Fokus fase ini bukan menambah authority semantik, melainkan memastikan `ControllerInvocationManifestCompositionAuthorityInterface.compose` benar-benar menjalankan operasi melalui dependensi kontrak yang dinyatakan.

## Audit dan akar masalah

Sebelum perubahan, `controllerInvocationManifestComposition.ts` memiliki composition authority yang memanggil `controllerSourceDiscovery`, `sourceDocumentReader`, `analyzePhpSourceInvocationSemanticPipelineBatch`, `laravelControllerInvocationSemanticJudgmentAuthority`, `laravelControllerInvocationSemanticJudgmentInventoryAuthority`, dan `manifestBuilder` melalui referensi modul yang tertutup di dalam implementasi. Operasi-operasi itu sudah memiliki kontrak yang dapat digunakan, tetapi kontrak composition authority tidak memperlihatkan keseluruhan rantai sebagai dependensi aktual.

Masalahnya adalah celah wiring, bukan ketiadaan operasi semantik. Karena itu, fase ini mengevolusi interface composition yang sudah ada dan menggunakan kontrak discovery, reader, PHP source invocation pipeline, invocation judgment authority, inventory closure authority, dan manifest builder yang sudah tersedia.

## Perubahan

- `ControllerInvocationManifestCompositionReasoningContract` maju dari versi 4 ke versi 5.
- `ControllerInvocationManifestCompositionAuthorityInterface` kini mengekspos `dependencies: ControllerInvocationManifestCompositionDependencies`.
- `ControllerInvocationManifestCompositionDependencies` merujuk enam operasi yang sudah ada; tidak membuat keluarga interface semantik duplikat.
- `createControllerInvocationManifestCompositionAuthority(dependencies)` menjalankan discovery, document reading, whole-file analysis, judgment, inventory closure, dan manifest build lewat dependensi yang disuntikkan.
- `sourceInvocationPipeline.analyze(document)` menjadi jalur eksekusi pipeline yang dinyatakan; hasilnya tetap dibungkus oleh helper delivery batch kanonis untuk mempertahankan identitas source pada tiap hasil.
- Inventory rejection dan semua blocker discovery/document tetap menjadi terminal ADT. Hanya receipt hasil validasi inventory yang diteruskan ke `ManifestBuilderInterface.build`.
- `controllerInvocationManifestCompositionAuthority` tetap menjadi entry point kanonis yang digunakan CLI; composition root mengikat implementasi konkret ke enam slot kontrak.
- Audit Phase2387 diperbarui karena CLI kini menggunakan `dependencies.manifestBuilder` melalui parameter operasi, bukan akses `manifestBuilder.build` langsung di body composition.

## Trace setelah perubahan

`scan/sync → buildManifestWithInvocationPipeline → ControllerInvocationManifestCompositionAuthorityInterface.compose(input) → sourceDiscovery.discover → sourceDocumentReader.read → sourceInvocationPipeline.analyze → delivery batch → invocationJudgmentAuthority.judge → inventoryAuthority.close → [rejected: composition terminal ADT | validated receipt] → manifestBuilder.build(ManifestBuilderInput) → ManifestBuilderJudgment → CLI presentation/output gate`.

`LaravelControllerInvocationSemanticJudgmentAuthority` tetap menjadi pemilik judgment per file. `LaravelControllerInvocationSemanticJudgmentInventoryAuthority` tetap menjadi pemilik penutupan korespondensi source/judgment. `ManifestBuilderInterface` tetap menjadi pemilik hasil manifest complete/blocked. Tidak ada semantic reclassification ditambahkan pada CLI.

## Bukti verifikasi

- Audit Phase2380 route closure: 8/8.
- Audit Phase2381 evidence authority flow: 8/8.
- Audit Phase2382 canonical route contract reuse: 14/14.
- Audit Phase2383 route boundary executor integration: 8/8.
- Audit Phase2384 boundary projection: 8/8.
- Audit Phase2385 legacy route scanner retirement: 6/6.
- Audit Phase2385 route emission inventory: 6/6.
- Audit Phase2386 direct route boundary operation: 8/8.
- Audit Phase2387 manifest operation injection: 12/12.
- Audit Phase2388 manifest semantic operations: 11/11.
- Audit Phase2389 source-model operation/CLI closure: 11/11.
- Audit Phase2390 CLI composition operation injection: 13/13.
- TypeScript parser syntax checks for four relevant TypeScript files: 4/4.

Total static audit assertions across Phase2380–Phase2390: 113/113. This count excludes parser checks.

## Batas verifikasi

- Package build, Vitest, full TypeScript typecheck, and real CLI scan/sync execution were not run. No claim of end-to-end runtime success is made.
- Discovery and source-document reader implementations remain concrete CLI composition-root adapters. Their use is now explicit through existing operation contracts; their internal filesystem mechanics are not moved into upstream semantic owners.
- The route scanner still has known active dependencies on `subscanners/route-scanner` and `subscanners/routeProducerRelations`, and method judgment dispatch still occurs inside scanner orchestration. This phase does not claim to retire those subscanners.
- Integrated invocation response composition and `InvocationSemanticRuntimeExecutorInterface` remain existing upstream-owned operations; this phase closes the CLI wiring path to them through source-correlated invocation judgments rather than duplicating their contracts.
