# Phase 3070 — Controller Invocation Input Domain Operations

## Tujuan

Meneruskan audit **Fully Explicit Typed Runtime Scanner Operations** pada jalur runtime upstream → CLI → manifest. Perubahan ini memindahkan kelanjutan input invocation controller dari callback generik ke operasi domain eksplisit yang dapat diperiksa lewat interface.

## Perubahan

- `LaravelControllerInvocationSemanticInputHandlers<Result>` dan `continueWith<Result>` dihapus dari kontrak input invocation.
- Kontrak upstream sekarang mendefinisikan `LaravelControllerInvocationSemanticInputDomainOperationsInterface` dengan dua operasi domain terpisah: `judgePipelineNotProvided` dan `judgePipelineProvided`.
- Kedua varian input memiliki operasi `toControllerInvocationSemanticJudgment(operations)` yang mendelegasikan ke operasi domain yang sesuai.
- Authority mengonsumsi operasi input secara langsung; tidak lagi menyusun handler generik untuk mendispatch dua keadaan input.
- Jalur tanpa pipeline tetap menghasilkan outcome `not_connected`.
- Jalur dengan pipeline tetap melakukan source binding, memproyeksikan evidence integrasi, dan mempertahankan outcome `source_binding_rejected`, `complete`, atau `blocked` dari upstream.
- Kontrak judgment dinaikkan ke versi 18 dan interface operasi input diekspor dari public core entry point.
- Public runtime authority diekspor sebagai `export const ...: LaravelControllerInvocationSemanticJudgmentAuthorityInterface = Object.freeze({...})`; class executor tetap internal pada composition path untuk kompatibilitas.

## Trace runtime

1. CLI/controller scanner memperoleh source controller dan hasil pipeline PHP bila tersedia.
2. `laravelControllerInvocationSemanticInputFactory` membentuk salah satu input tertutup: `controller_invocation_pipeline_not_provided` atau `controller_invocation_pipeline_provided`.
3. Input menyediakan `toControllerInvocationSemanticJudgment(...)`, bukan `continueWith<Result>(handlers)`.
4. `LaravelControllerInvocationSemanticJudgmentAuthority.judge` meneruskan input ke operasi domain yang dimilikinya.
5. Operasi tanpa pipeline menghasilkan integrasi `not_connected`; operasi dengan pipeline menjalankan source binding dan integrasi.
6. Outcome integrasi mengubah dirinya menjadi judgment controller dengan response spesifik dan relasi identitas sumber tetap dipertahankan.
7. Judgment tersebut diteruskan ke jalur scanner/AST dan manifest; fase ini tidak mengganti atau merekonstruksi outcome downstream.

## Hasil verifikasi

- Audit struktural Phase 3070: **14/14 PASS**.
- Regresi Phase 3069: **PASS**.
- Regresi Phase 3068: **PASS**.
- Regresi Phase 3067: **PASS**.
- TypeScript syntax transpilation pada dua file yang berubah: **PASS**.
- Strict whole-program TypeScript: **tidak diklaim**; syntax transpilation bukan type-check.
- Vitest: **tidak dijalankan**, instalasi workspace belum lengkap.
- Fixture end-to-end PHP → CLI → manifest/IR: **belum dijalankan**.
- Penghapusan semua generic callback, primitive, `if`, `===`, `??`, ternary, `map`, atau seluruh fungsi di seluruh repository: **tidak diklaim**. Perubahan ini hanya mencakup batas input invocation controller yang ditelusuri.

## Batasan yang dipertahankan

- `packages/core/src/types/upstream/collections.ts` tetap persis satu byte newline.
- File relation foundation yang dihapus tidak dibuat ulang: `relationMembership`, `relationalSequence`, dan `semanticRelations` tetap tidak tersedia.
- Tidak ada generic relation foundation baru yang diperkenalkan.
