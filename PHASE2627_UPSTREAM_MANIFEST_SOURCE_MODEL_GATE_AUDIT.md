# Phase 2627 — CLI → Manifest → Upstream Source-Model Gate Audit

## Tujuan
Memvalidasi jalur nyata yang menghubungkan source-model policy judgment ke publikasi manifest dan output CLI. Audit ini menambah guard yang dapat dijalankan ulang; bukan klaim bahwa typecheck/build penuh telah lulus.

## Trace jalur
`CLI scan/sync/drift audit`
→ `scanRouteSyncManifest` / manifest orchestration
→ `prepareManifestBuilderOperation(...).build()`
→ `LaravelSourceAstPipelineInterface.execute()`
→ `CompleteLaravelSourceModelBuilderInterface.build()`
→ `SourceModelReferenceIndexBuilderInterface.build(catalog, effectivePolicies)`
→ `CompleteSourceModelBuildResult`
→ `ManifestBuilderJudgment`
→ CLI output gate.

## Temuan akar masalah dan status kontrak
- `sourceModelReferenceIndexFromCatalog` sekarang memerlukan inventory kebijakan secara eksplisit; tidak ada default `[]`.
- `unbound` dan ambiguous policy binding menjadi relasi blocker, bukan fallback ke policy evidence mentah.
- `CompleteSourceModelBuildResult` adalah ADT `complete_source_model | source_model_build_blocked`.
- Source-model builder menolak graph yang mengandung `controller_action_policy_blocked` atau `route_action_policy_blocked`.
- Manifest builder memeriksa hasil tersebut sebelum `inputsFromSourceModel`, dataflow judgment, dan konstruksi manifest. Blocker dipertahankan sebagai `manifest_builder_blocked` dengan `stage: source_model`.
- `scan`, `sync`, dan drift audit menghentikan jalur serta melaporkan judgment penuh.
- Jalur ini tidak menambahkan import `semantic/foundation`.

## Verifikasi yang dijalankan
- `audit-phase2627-upstream-manifest-source-model-gate.cjs`: **12/12** assertion.
- `audit-phase2626-source-model-policy-inventory-closure.cjs`: **23/23** assertion.
- `audit-phase2625-controller-action-identity-ambiguity.cjs`: **11/11** assertion.
- `audit-phase2387-manifest-builder-operation-injection.cjs`: **12/12** assertion.
- Node syntax check untuk audit baru: lulus.

## Batas bukti
Audit ini memeriksa kontrak dan wiring source, bukan runtime end-to-end. Typecheck penuh, Vitest penuh, build paket, dan uji CLI terhadap fixture Laravel nyata belum dijalankan. Karena itu, tidak diklaim sebagai lulus. Langkah berikutnya adalah menambahkan/menjalankan regression fixture yang memaksa controller-action policy unbound dan route-action policy blocked lalu memastikan CLI keluar non-zero tanpa menulis manifest lengkap.
