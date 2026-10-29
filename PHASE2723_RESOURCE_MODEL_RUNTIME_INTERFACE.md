# Phase 2723 — Fully Typed AST/ADT Runtime Scanner Operations

## Tujuan

Melanjutkan migrasi interface-first pada runtime resource/model resolver yang digunakan scanner. Perubahan harus terjadi pada jalur yang dipanggil konsumen, bukan hanya contoh; implementasi internal boleh berupa fungsi, tetapi entry point yang diekspor harus berupa object dengan interface eksplisit. Tidak ada `relationFoundation` atau pengganti/alias foundation baru yang dibuat.

## Source yang diubah

### `packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts`

- Mengubah `resolveResourceModelPort` menjadi implementasi internal `resolveResourceModelPortImplementation`.
- Menghapus exported arrow alias `resolveResourceModelInterface`, yang hanya meneruskan argumen ke fungsi lain dan tidak memiliki pemilik kontrak sendiri.
- Menambahkan `ResourceModelResolverInterface` dengan operasi `resolve` dan `resolvePort`.
- Entry point publik sekarang berupa object immutable bertipe:

```ts
export interface ResourceModelResolverInterface {
    readonly resolve: (input: ResourceModelResolutionInput) => ResourceModelBinding;
    readonly resolvePort: (input: ResourceModelResolutionInput) => AstSemanticStagePort;
}

export const ResourceModelResolver: ResourceModelResolverInterface = Object.freeze({
    resolve: resolveResourceModel,
    resolvePort: resolveResourceModelPortImplementation,
});
```

Konsumen yang ada (`resourceBinder`, ekspor core, dan regression tests SDK) tetap memakai `ResourceModelResolver.resolve(...)`. Semantik model tetap didelegasikan ke `reasonResourceModel` upstream; fase ini tidak membuat semantic authority baru.

### `packages/core/src/compiler/scanner/resolvers/resource/structuralFieldMatcher.ts`

- Mengubah `matchStructuralFields` menjadi implementasi internal `matchStructuralFieldsImplementation`.
- Menambahkan `StructuralFieldMatcherInterface` dengan operasi `match`.
- Mengekspor `structuralFieldMatcher: StructuralFieldMatcherInterface = Object.freeze({ match: ... })`.
- Resolver memakai `structuralFieldMatcher.match(...)`, bukan exported free function.

## Trace CLI → upstream manifest

```text
packages/cli/src/commands/scan.ts | sync.ts
  -> manifestScanOperation.scan(input)
  -> CLI upstream composition
  -> controller-invocation manifest composition authority
  -> source-project identity + source discovery + source-document identity
  -> invocation semantic judgment + inventory authority
  -> manifestBuilderOperationPreparation.prepare(input).build()
  -> Laravel source AST pipeline
  -> completeLaravelSourceModelBuilder.build(...)
  -> semantic dataflow + resource-group capability composition
  -> manifest_builder_complete | manifest_builder_blocked
```

Resource model resolver adalah operasi domain pada sisi scanner yang dipanggil resource binder. Perubahan fase ini mengunci kontrak publik resolver dan structural matcher, tetapi tidak mengklaim memindahkan seluruh resolver keluar dari `compiler/scanner`.

## Audit

Perintah:

```bash
npm run audit:phase2723-resource-model-runtime-interface
npm run audit:phase2722-typed-resource-runtime-semantic-ownership
```

Hasil:

- Phase 2723 static audit: **13/13 checks passed**.
- Phase 2722 audit diulang: **16/16 checks passed**.
- Relative imports pada dua file runtime yang diubah: tidak ada unresolved import.
- Existing SDK tests masih memanggil `ResourceModelResolver.resolve(...)`.
- Jalur CLI scan/sync dan ADT `manifest_builder_complete` / `manifest_builder_blocked` dipertahankan.
- Implementasi `relationFoundation` tetap tidak ada; tidak dibuat pengganti.

## Batas validasi dan masalah yang belum selesai

- Dependency `node_modules` tidak tersedia dalam workspace ini, sehingga unit tests, project typecheck, build, dan CLI end-to-end belum dijalankan.
- `relationFoundation` masih dirujuk oleh **37 import declarations di 28 file TypeScript**. Ini adalah masalah migrasi yang nyata dan belum diselesaikan oleh fase ini; jangan menutupnya dengan membuat foundation pengganti.
- Scanner masih belum wiring-only. Masih ada implementasi di `binders`, `descriptors`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, dan `upstream`.

Static audit mengonfirmasi struktur source yang diperiksa; itu bukan bukti bahwa seluruh repo typechecks atau seluruh runtime berhasil.
